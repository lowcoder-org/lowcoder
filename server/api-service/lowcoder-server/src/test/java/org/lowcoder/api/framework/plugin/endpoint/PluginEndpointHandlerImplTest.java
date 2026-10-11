package org.lowcoder.api.framework.plugin.endpoint;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.framework.plugin.security.PluginAuthorizationManager;
import org.lowcoder.plugin.api.EndpointExtension;
import org.lowcoder.plugin.api.PluginEndpoint;
import org.lowcoder.plugin.api.data.EndpointRequest;
import org.lowcoder.plugin.api.data.EndpointResponse;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.reactive.function.server.HandlerStrategies;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Guards the dispatch contract of {@link PluginEndpointHandlerImpl#runPluginEndpointMethod}.
 *
 * <p>Plugin endpoint methods must return a plain {@link EndpointResponse}, so every implementation blocks
 * internally. Before the offload, they were invoked inline on whatever thread the upstream reactive chain
 * completed on — in production that was observed to be a driver I/O event loop, which the endpoint then
 * parked for the entire call while the plugin's own HTTP callbacks into this same process queued behind it.
 *
 * <p>The tripwire is {@link #invokesHandlerOnDedicatedSchedulerNotTheSubscribingThread()} together with
 * {@link #blockingHandlerDoesNotParkTheSubscribingThread()}: drop the {@code subscribeOn(...)} and the
 * callable runs inline at subscription time, so the handler thread becomes the subscribing thread and
 * {@code subscribe()} no longer returns while the handler is still blocked.
 *
 * <p>The remaining cases pin behaviour that the {@code handle()} -> {@code flatMap}/{@code fromCallable}
 * rewrite does NOT preserve for free — most importantly a {@code null} handler result, which under
 * {@code Mono.fromCallable} would complete the response EMPTY (no response ever written) rather than error.
 */
class PluginEndpointHandlerImplTest {

	private static final String OK_BODY = "ok";
	private static final int OK_STATUS = 200;
	private static final String BODY_ECHO_PAYLOAD = "payload-from-request-body";
	private static final long LATCH_TIMEOUT_SECONDS = 5;

	// Real bean factory: it is a concrete class Mockito cannot proxy, and neither collaborator is touched
	// by runPluginEndpointMethod — both are only used when registering routes.
	private final PluginEndpointHandlerImpl handler = new PluginEndpointHandlerImpl(
			mock(ApplicationContext.class),
			new DefaultListableBeanFactory(),
			new PluginAuthorizationManager());

	// ---------- helpers ----------

	/** Minimal {@link EndpointResponse} — {@code createServerResponse} reads only these four accessors. */
	private static EndpointResponse response(byte[] body) {
		return new EndpointResponse() {
			@Override public int statusCode() { return OK_STATUS; }
			@Override public Map<String, List<String>> headers() { return Map.of(); }
			@Override public Map<String, List<Map.Entry<String, String>>> cookies() { return Map.of(); }
			@Override public byte[] body() { return body; }
		};
	}

	private static ServerRequest requestWithBody(String body) {
		MockServerWebExchange exchange = MockServerWebExchange.from(
				MockServerHttpRequest.post("/api/plugins/test/endpoint").body(body));
		return ServerRequest.create(exchange, HandlerStrategies.withDefaults().messageReaders());
	}

	private static Method handlerMethod(Class<?> endpointType, String name) throws NoSuchMethodException {
		return endpointType.getMethod(name, EndpointRequest.class);
	}

	/**
	 * Runs a handler method through the dispatcher with an authenticated security context in place —
	 * {@code runPluginEndpointMethod} reads {@link ReactiveSecurityContextHolder}, so without one the
	 * chain completes empty and every assertion below would vacuously pass.
	 */
	private Mono<ServerResponse> dispatch(PluginEndpoint endpoint, String methodName) throws NoSuchMethodException {
		Method method = handlerMethod(endpoint.getClass(), methodName);
		Authentication authentication = new UsernamePasswordAuthenticationToken("tester", "n/a", List.of());
		return handler.runPluginEndpointMethod(
						endpoint, method.getAnnotation(EndpointExtension.class), method, requestWithBody(OK_BODY))
				.contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication));
	}

	// ---------- the offload ----------

	@Test
	void invokesHandlerOnDedicatedSchedulerNotTheSubscribingThread() throws Exception {
		ThreadRecordingEndpoint endpoint = new ThreadRecordingEndpoint();

		StepVerifier.create(dispatch(endpoint, "record"))
				.expectNextCount(1)
				.verifyComplete();

		assertThat(endpoint.handlerThread.get())
				.as("handler must run on the dedicated plugin-endpoint pool")
				.startsWith(PluginEndpointHandlerImpl.PLUGIN_ENDPOINT_THREAD_NAME_PREFIX);
		assertThat(endpoint.handlerThread.get())
				.as("handler must not run inline on the subscribing thread")
				.isNotEqualTo(Thread.currentThread().getName());
	}

	@Test
	void blockingHandlerDoesNotParkTheSubscribingThread() throws Exception {
		BlockingEndpoint endpoint = new BlockingEndpoint();

		dispatch(endpoint, "blockUntilReleased").subscribe();

		// If the handler were invoked inline, subscribe() above would not have returned yet.
		assertThat(endpoint.entered.await(LATCH_TIMEOUT_SECONDS, TimeUnit.SECONDS))
				.as("handler should have started on another thread while this one continued")
				.isTrue();
		assertThat(endpoint.completed.getCount())
				.as("handler must still be blocked at this point, proving the subscriber was never parked")
				.isEqualTo(1);

		endpoint.release.countDown();
		assertThat(endpoint.completed.await(LATCH_TIMEOUT_SECONDS, TimeUnit.SECONDS)).isTrue();
	}

	@Test
	void handlerBlockingOnRequestBodyCompletes() throws Exception {
		// The AppEndpoint shape: the handler joins the request-body future from inside the invocation.
		// On the caller's event loop that join can wait on the very loop that must deliver the body.
		BodyJoiningEndpoint endpoint = new BodyJoiningEndpoint();
		Method method = handlerMethod(BodyJoiningEndpoint.class, "joinBody");
		Authentication authentication = new UsernamePasswordAuthenticationToken("tester", "n/a", List.of());

		StepVerifier.create(handler.runPluginEndpointMethod(
						endpoint, method.getAnnotation(EndpointExtension.class), method,
						requestWithBody(BODY_ECHO_PAYLOAD))
				.contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication)))
				.expectNextCount(1)
				.verifyComplete();

		assertThat(endpoint.observedBody.get()).isEqualTo(BODY_ECHO_PAYLOAD);
	}

	// ---------- preserved semantics ----------

	@Test
	void deniedAuthorizationYieldsNotAuthorized() throws Exception {
		StepVerifier.create(dispatch(new DeniedEndpoint(), "denied"))
				.expectErrorSatisfies(error -> assertThat(error)
						.isInstanceOfSatisfying(BizException.class,
								biz -> assertThat(biz.getError()).isEqualTo(BizError.NOT_AUTHORIZED)))
				.verify();
	}

	@Test
	void handlerFailureSurfacesAsRuntimeExceptionCarryingTheCause() throws Exception {
		StepVerifier.create(dispatch(new ThrowingEndpoint(), "explode"))
				.expectErrorSatisfies(error -> {
					assertThat(error).isInstanceOf(RuntimeException.class);
					// invoke() wraps the plugin's exception in an InvocationTargetException, which the
					// dispatcher wraps in a RuntimeException — the original must remain reachable.
					assertThat(error.getCause()).hasCauseInstanceOf(IllegalArgumentException.class);
				})
				.verify();
	}

	@Test
	void nullHandlerResultIsAnErrorNotAnEmptyResponse() throws Exception {
		// Regression guard for the fromCallable rewrite: a null return completes a Mono EMPTY, which would
		// skip createServerResponse and leave the request hanging with no response at all.
		StepVerifier.create(dispatch(new NullReturningEndpoint(), "returnsNull"))
				.expectError(IllegalStateException.class)
				.verify();
	}

	// ---------- test endpoints ----------

	public static class ThreadRecordingEndpoint implements PluginEndpoint {
		final AtomicReference<String> handlerThread = new AtomicReference<>();

		@EndpointExtension(uri = "/record", method = Method.POST)
		public EndpointResponse record(EndpointRequest request) {
			handlerThread.set(Thread.currentThread().getName());
			return response(OK_BODY.getBytes(StandardCharsets.UTF_8));
		}
	}

	public static class BlockingEndpoint implements PluginEndpoint {
		final CountDownLatch entered = new CountDownLatch(1);
		final CountDownLatch release = new CountDownLatch(1);
		final CountDownLatch completed = new CountDownLatch(1);

		@EndpointExtension(uri = "/block", method = Method.POST)
		public EndpointResponse blockUntilReleased(EndpointRequest request) {
			entered.countDown();
			try {
				release.await(LATCH_TIMEOUT_SECONDS, TimeUnit.SECONDS);
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
			}
			completed.countDown();
			return response(OK_BODY.getBytes(StandardCharsets.UTF_8));
		}
	}

	public static class BodyJoiningEndpoint implements PluginEndpoint {
		final AtomicReference<String> observedBody = new AtomicReference<>();

		@EndpointExtension(uri = "/join", method = Method.POST)
		public EndpointResponse joinBody(EndpointRequest request) {
			byte[] body = request.body().join();
			observedBody.set(new String(body, StandardCharsets.UTF_8));
			return response(body);
		}
	}

	public static class DeniedEndpoint implements PluginEndpoint {
		@EndpointExtension(uri = "/denied", method = Method.POST, authorize = "false")
		public EndpointResponse denied(EndpointRequest request) {
			return response(OK_BODY.getBytes(StandardCharsets.UTF_8));
		}
	}

	public static class ThrowingEndpoint implements PluginEndpoint {
		@EndpointExtension(uri = "/explode", method = Method.POST)
		public EndpointResponse explode(EndpointRequest request) {
			throw new IllegalArgumentException("plugin blew up");
		}
	}

	public static class NullReturningEndpoint implements PluginEndpoint {
		@EndpointExtension(uri = "/null", method = Method.POST)
		public EndpointResponse returnsNull(EndpointRequest request) {
			return null;
		}
	}
}
