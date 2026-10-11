package org.lowcoder.api.framework.plugin.endpoint;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.framework.plugin.security.PluginAuthorizationManager;
import org.lowcoder.plugin.api.EndpointExtension;
import org.lowcoder.plugin.api.PluginEndpoint;
import org.lowcoder.plugin.api.data.EndpointRequest;
import org.lowcoder.plugin.api.data.EndpointResponse;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.http.HttpMethod;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.reactive.function.server.HandlerStrategies;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;

import reactor.test.StepVerifier;

/**
 * Tests of the registration side of {@link PluginEndpointHandlerImpl#registerEndpoints}: which methods of a plugin
 * endpoint become routes, under which URL, with which bean name, and the router reload afterwards. Running a
 * registered endpoint is covered by {@code PluginEndpointHandlerImplTest}.
 *
 * <p>Pinned (ruling a, no section 9 row): {@code checkHandlerMethod} is lax. It asks whether the declared return type
 * is a supertype of {@code EndpointResponse} and the parameter a supertype of {@code EndpointRequest}, so
 * {@code Object handle(Object)} is registered; a result that is not an {@code EndpointResponse} fails later with a
 * {@code ClassCastException} when invoked ({@link #looseSignature_isRegistered_andFailsWithClassCastWhenInvoked}).
 */
class PluginEndpointRegistrationTest {

    private static final String PREFIX = "demo";
    private static final String BASE = PluginEndpointHandler.PLUGINS_BASE_URL + PREFIX;
    private static final Duration WAIT = Duration.ofSeconds(10);

    // ---------------------------------------------------------------- fixtures

    public static class MixedEndpoint implements PluginEndpoint {
        @EndpointExtension(uri = "/ok", method = PluginEndpoint.Method.GET)
        public EndpointResponse ok(EndpointRequest request) {
            return mock(EndpointResponse.class);
        }

        @EndpointExtension(uri = "/two", method = PluginEndpoint.Method.GET)
        public EndpointResponse twoParameters(EndpointRequest request, String extra) {
            return null;
        }

        @EndpointExtension(uri = "/string-return", method = PluginEndpoint.Method.GET)
        public String stringReturn(EndpointRequest request) {
            return "x";
        }

        @EndpointExtension(uri = "/string-param", method = PluginEndpoint.Method.GET)
        public EndpointResponse stringParameter(String request) {
            return null;
        }

        public EndpointResponse unannotated(EndpointRequest request) {
            return null;
        }
    }

    public static class VerbEndpoint implements PluginEndpoint {
        @EndpointExtension(uri = "items/{id}", method = PluginEndpoint.Method.GET)
        public EndpointResponse get(EndpointRequest r) { return null; }

        @EndpointExtension(uri = "items/{id}", method = PluginEndpoint.Method.POST)
        public EndpointResponse post(EndpointRequest r) { return null; }

        @EndpointExtension(uri = "items/{id}", method = PluginEndpoint.Method.PUT)
        public EndpointResponse put(EndpointRequest r) { return null; }

        @EndpointExtension(uri = "items/{id}", method = PluginEndpoint.Method.PATCH)
        public EndpointResponse patch(EndpointRequest r) { return null; }

        @EndpointExtension(uri = "items/{id}", method = PluginEndpoint.Method.DELETE)
        public EndpointResponse delete(EndpointRequest r) { return null; }

        @EndpointExtension(uri = "items/{id}", method = PluginEndpoint.Method.OPTIONS)
        public EndpointResponse options(EndpointRequest r) { return null; }
    }

    public static class SlashEndpoint implements PluginEndpoint {
        @EndpointExtension(uri = "/with-slash", method = PluginEndpoint.Method.GET)
        public EndpointResponse withSlash(EndpointRequest r) { return null; }

        @EndpointExtension(uri = "no-slash", method = PluginEndpoint.Method.GET)
        public EndpointResponse noSlash(EndpointRequest r) { return null; }
    }

    public static class LooseEndpoint implements PluginEndpoint {
        @EndpointExtension(uri = "/loose", method = PluginEndpoint.Method.GET)
        public Object handle(Object request) {
            return "not an EndpointResponse";
        }
    }

    // ------------------------------------------------------------------- setup

    private GenericApplicationContext context;
    private ReloadableRouterFunctionMapping mapping;
    private PluginEndpointHandlerImpl handler;

    @BeforeEach
    void setUp() {
        context = new GenericApplicationContext();
        context.refresh();
        mapping = mock(ReloadableRouterFunctionMapping.class);
        context.getDefaultListableBeanFactory().registerSingleton("routerFunctionMapping", mapping);
        handler = new PluginEndpointHandlerImpl(context, context.getDefaultListableBeanFactory(), new PluginAuthorizationManager());
    }

    private ServerRequest request(HttpMethod method, String path) {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.method(method, path).build());
        return ServerRequest.create(exchange, HandlerStrategies.withDefaults().messageReaders());
    }

    private long matches(HttpMethod method, String path) {
        ServerRequest request = request(method, path);
        return handler.registeredEndpoints().stream()
                .filter(route -> route.route(request).blockOptional(WAIT).isPresent())
                .count();
    }

    // ------------------------------------------------------------------- tests

    /** Catches methods with the wrong signature, or without the annotation, becoming routes. */
    @Test
    void registerEndpoints_registersOnlyAnnotatedMethodsWithTheEndpointSignature() {
        handler.registerEndpoints(PREFIX, List.of(new MixedEndpoint()));

        assertThat(handler.registeredEndpoints()).hasSize(1);
        assertThat(matches(HttpMethod.GET, BASE + "/ok")).isEqualTo(1);
        for (String other : new String[]{"/two", "/string-return", "/string-param"}) {
            assertThat(matches(HttpMethod.GET, BASE + other)).as(other).isZero();
        }
        String[] beans = context.getBeanNamesForType(RouterFunction.class);
        System.out.println("[PluginEndpointRegistrationTest] beans " + Arrays.toString(beans));
        assertThat(beans).hasSize(1);
        assertThat(beans[0]).matches("pluginEndpoint_MixedEndpoint_ok_\\d+");
        verify(mapping, times(1)).reloadFunctionMappings();
    }

    /** Catches the router being reloaded for nothing, or routes appearing, when there is nothing to register. */
    @Test
    void registerEndpoints_nullOrEmptyList_registersNothingAndDoesNotReload() {
        handler.registerEndpoints(PREFIX, null);
        handler.registerEndpoints(PREFIX, List.of());

        assertThat(handler.registeredEndpoints()).isEmpty();
        verify(mapping, never()).reloadFunctionMappings();
        System.out.println("[PluginEndpointRegistrationTest] null and empty list -> no routes, no reload");
    }

    /** Catches a verb being routed to another one, a wrong path matching, or the reload running once per endpoint. */
    @Test
    void registerEndpoints_routesEachVerbOnItsOwn_underThePluginPrefix_andReloadsOnce() {
        handler.registerEndpoints(PREFIX, List.of(new VerbEndpoint(), new SlashEndpoint()));

        for (HttpMethod method : new HttpMethod[]{HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE, HttpMethod.OPTIONS}) {
            assertThat(matches(method, BASE + "/items/5")).as(method.name()).isEqualTo(1);
        }
        assertThat(matches(HttpMethod.GET, BASE + "/other/5")).isZero();
        assertThat(matches(HttpMethod.GET, "/api/plugins/another/items/5")).isZero();
        assertThat(matches(HttpMethod.GET, "/items/5")).isZero();
        assertThat(handler.registeredEndpoints()).hasSize(8);
        verify(mapping, times(1)).reloadFunctionMappings();
        System.out.println("[PluginEndpointRegistrationTest] 8 routes, one reload");
    }

    /** Catches a missing leading slash of the endpoint uri producing a joined path without separator. */
    @Test
    void registerEndpoints_uriWithAndWithoutLeadingSlash_bothResolveUnderThePrefix() {
        handler.registerEndpoints(PREFIX, List.of(new SlashEndpoint()));

        assertThat(matches(HttpMethod.GET, BASE + "/with-slash")).isEqualTo(1);
        assertThat(matches(HttpMethod.GET, BASE + "/no-slash")).isEqualTo(1);
        assertThat(matches(HttpMethod.GET, BASE + "no-slash")).isZero();
        System.out.println("[PluginEndpointRegistrationTest] slash and no-slash uris routed");
    }

    /** Pins ruling (a): the lax signature check registers {@code Object handle(Object)}, which fails when run. */
    @Test
    void looseSignature_isRegistered_andFailsWithClassCastWhenInvoked() throws Exception {
        LooseEndpoint endpoint = new LooseEndpoint();
        handler.registerEndpoints(PREFIX, List.of(endpoint));

        assertThat(matches(HttpMethod.GET, BASE + "/loose")).isEqualTo(1);

        java.lang.reflect.Method method = LooseEndpoint.class.getMethod("handle", Object.class);
        EndpointExtension meta = method.getAnnotation(EndpointExtension.class);
        var authentication = new UsernamePasswordAuthenticationToken("user", "n/a", List.of());
        StepVerifier.create(handler.runPluginEndpointMethod(endpoint, meta, method, request(HttpMethod.GET, BASE + "/loose"))
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication)))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(ClassCastException.class);
                    System.out.println("[PluginEndpointRegistrationTest] loose signature registered; invoking -> " + error);
                }).verify(WAIT);
    }
}
