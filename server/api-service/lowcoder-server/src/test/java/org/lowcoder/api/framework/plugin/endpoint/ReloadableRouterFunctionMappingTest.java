package org.lowcoder.api.framework.plugin.endpoint;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.http.HttpMethod;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;
import org.springframework.web.reactive.function.server.support.RouterFunctionMapping;
import org.springframework.web.util.pattern.PathPatternParser;

/** Tests of {@link ReloadableRouterFunctionMapping}: a RouterFunction bean added after start-up becomes routable on reload. */
class ReloadableRouterFunctionMappingTest {

    private static final Duration WAIT = Duration.ofSeconds(10);

    private static boolean routes(RouterFunctionMapping mapping, String path) {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.method(HttpMethod.GET, path).build());
        return mapping.getHandler(exchange).blockOptional(WAIT).isPresent();
    }

    /** Catches the reload not rescanning the context: a bean registered later stays unrouted without it. */
    @Test
    void reloadFunctionMappings_picksUpRouterFunctionsRegisteredAfterStart() throws Exception {
        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean("first", RouterFunction.class, () -> RouterFunctions.route()
                .GET("/first", request -> ServerResponse.ok().build()).build());
        PathPatternParser caseInsensitive = new PathPatternParser();
        caseInsensitive.setCaseSensitive(false);
        ReloadableRouterFunctionMapping mapping = new ReloadableRouterFunctionMapping() {
            @Override
            public PathPatternParser getPathPatternParser() {
                return caseInsensitive;
            }
        };
        mapping.setApplicationContext(context);
        context.refresh();
        mapping.afterPropertiesSet();
        assertThat(routes(mapping, "/first")).isTrue();
        assertThat(routes(mapping, "/second")).isFalse();

        context.registerBean("second", RouterFunction.class, () -> RouterFunctions.route()
                .GET("/second", request -> ServerResponse.ok().build()).build());
        assertThat(routes(mapping, "/second")).as("not routable before the reload").isFalse();

        mapping.reloadFunctionMappings();

        assertThat(routes(mapping, "/second")).isTrue();
        assertThat(routes(mapping, "/first")).isTrue();
        // the mapping's own path pattern parser (here: case insensitive) is applied to the new routes too
        assertThat(routes(mapping, "/SECOND")).as("parser of the mapping applied on reload").isTrue();
        System.out.println("[ReloadableRouterFunctionMappingTest] /second routable after reload, /first still routable");
    }

    /** Catches a context without any RouterFunction bean making the reload fail. */
    @Test
    void reloadFunctionMappings_withoutRouterFunctionBeans_doesNotFail() {
        GenericApplicationContext context = new GenericApplicationContext();
        ReloadableRouterFunctionMapping mapping = new ReloadableRouterFunctionMapping();
        mapping.setApplicationContext(context);
        context.refresh();

        assertThatCode(mapping::reloadFunctionMappings).doesNotThrowAnyException();
        System.out.println("[ReloadableRouterFunctionMappingTest] reload without beans is a no-op");
    }
}
