package org.lowcoder.api.contract.support;

import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.reactive.ClientHttpConnector;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.http.client.reactive.ClientHttpResponse;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.function.Function;

/**
 * Sends the requests of production code that builds its client inline through {@link WebClientBuildHelper#builder()}
 * to a local test server, without changing anything else of the client. {@link #redirectTo} makes
 * {@code WebClientBuildHelper.builder()} return the real helper, spied, whose {@code toWebClientBuilder()} (which
 * {@code build()} calls too) answers the real client builder, codecs and exchange strategies included, with only its
 * connector replaced by a {@link RedirectingConnector}: same method, path and query, the test server's scheme, host and
 * port. Used for fixed {@code https} endpoints: the GitHub and Google OAuth requests, the npm registry of
 * {@code JsLibraryController#fetch} and the flow endpoint of {@code ApiFlowController}.
 *
 * <p>Limits: the redirection is a Mockito static mock, which applies on the thread that opened it only, so the
 * production method must build its client on that thread: called directly by the test, not through a scheduler, or
 * by a test subclass that opens the redirection itself around the production method (the controller of
 * {@code ApiFlowEndpointsContractTest}, on the request's thread); and it replaces the transport (proxy, timeouts), not
 * the codecs.
 */
public final class WebClientRedirect {

    private WebClientRedirect() {
    }

    /** Redirects every client built through {@code WebClientBuildHelper.builder()} on this thread to {@code baseUrl}; close it to stop. */
    public static MockedStatic<WebClientBuildHelper> redirectTo(String baseUrl) {
        URI target = URI.create(baseUrl);
        MockedStatic<WebClientBuildHelper> helper = Mockito.mockStatic(WebClientBuildHelper.class, Mockito.CALLS_REAL_METHODS);
        helper.when(WebClientBuildHelper::builder).thenAnswer(invocation -> {
            WebClientBuildHelper redirected = Mockito.spy((WebClientBuildHelper) invocation.callRealMethod());
            Mockito.doAnswer(builder -> ((WebClient.Builder) builder.callRealMethod()).clientConnector(new RedirectingConnector(target)))
                    .when(redirected).toWebClientBuilder();
            return redirected;
        });
        return helper;
    }

    /** A connector that sends each request to {@code target}'s scheme, host and port, keeping its method, path and query. */
    public static final class RedirectingConnector implements ClientHttpConnector {

        private final URI target;
        private final ClientHttpConnector delegate = new ReactorClientHttpConnector();

        public RedirectingConnector(URI target) {
            this.target = target;
        }

        @Override
        public Mono<ClientHttpResponse> connect(HttpMethod method, URI uri, Function<? super ClientHttpRequest, Mono<Void>> requestCallback) {
            URI redirected = UriComponentsBuilder.fromUri(uri).scheme(target.getScheme()).host(target.getHost()).port(target.getPort())
                    .build(true).toUri();
            System.out.println("[WebClientRedirect] " + method + " " + uri + " -> " + redirected);
            return delegate.connect(method, redirected, requestCallback);
        }
    }
}
