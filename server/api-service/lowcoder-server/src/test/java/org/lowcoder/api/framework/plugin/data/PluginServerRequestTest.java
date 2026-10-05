package org.lowcoder.api.framework.plugin.data;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.api.PluginEndpoint;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.reactive.function.server.HandlerStrategies;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

/** Tests of {@link PluginServerRequest}: conversion of a Spring {@code ServerRequest} for plugins. */
class PluginServerRequestTest {

    private static final long WAIT_SECONDS = 10;

    /** Catches any field of the request being dropped or mixed up in the conversion. */
    @Test
    void fromServerRequest_copiesEveryPartOfTheRequest() throws Exception {
        MockServerHttpRequest httpRequest = MockServerHttpRequest.post("/api/plugins/p/items/7?a=1&a=2&b=3")
                .header("X-Test", "h1", "h2")
                .cookie(new HttpCookie("sid", "s1"), new HttpCookie("sid", "s2"), new HttpCookie("other", "o"))
                .body("payload");
        MockServerWebExchange exchange = MockServerWebExchange.from(httpRequest);
        exchange.getAttributes().put("attr", "value");
        exchange.getAttributes().put(RouterFunctions.URI_TEMPLATE_VARIABLES_ATTRIBUTE, Map.of("id", "7"));
        Principal principal = () -> "alice";
        ServerWebExchange withPrincipal = exchange.mutate().principal(Mono.just(principal)).build();

        PluginServerRequest request = PluginServerRequest.fromServerRequest(
                ServerRequest.create(withPrincipal, HandlerStrategies.withDefaults().messageReaders()));

        assertThat(request.uri()).isEqualTo(URI.create("/api/plugins/p/items/7?a=1&a=2&b=3"));
        assertThat(request.method()).isEqualTo(PluginEndpoint.Method.POST);
        assertThat(request.body().get(WAIT_SECONDS, TimeUnit.SECONDS)).isEqualTo("payload".getBytes());
        assertThat(request.headers().get("X-Test")).containsExactly("h1", "h2");
        assertThat(request.cookies().get("sid")).extracting(Map.Entry::getKey, Map.Entry::getValue)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("sid", "s1"), org.assertj.core.groups.Tuple.tuple("sid", "s2"));
        assertThat(request.cookies().get("other")).hasSize(1);
        assertThat(request.attributes()).containsEntry("attr", "value");
        assertThat(request.pathVariables()).containsEntry("id", "7");
        assertThat(request.queryParams()).containsEntry("a", List.of("1", "2")).containsEntry("b", List.of("3"));
        assertThat(request.principal().get(WAIT_SECONDS, TimeUnit.SECONDS).getName()).isEqualTo("alice");
        System.out.println("[PluginServerRequestTest] uri " + request.uri() + " cookies " + request.cookies() + " query " + request.queryParams());
    }

    /** Catches a null part of the source request failing the conversion; the target maps stay empty. */
    @Test
    void fromServerRequest_nullParts_leaveEmptyMaps() throws Exception {
        ServerRequest source = mock(ServerRequest.class);
        lenient().when(source.uri()).thenReturn(URI.create("/x"));
        lenient().when(source.method()).thenReturn(HttpMethod.GET);
        lenient().when(source.bodyToMono(byte[].class)).thenReturn(Mono.empty());
        lenient().when(source.headers()).thenReturn(null);
        lenient().when(source.cookies()).thenReturn(null);
        lenient().when(source.attributes()).thenReturn(null);
        lenient().when(source.pathVariables()).thenReturn(null);
        lenient().when(source.queryParams()).thenReturn(null);
        when(source.principal()).thenReturn(Mono.empty());

        PluginServerRequest request = PluginServerRequest.fromServerRequest(source);

        assertThat(request.headers()).isEmpty();
        assertThat(request.cookies()).isEmpty();
        assertThat(request.attributes()).isEmpty();
        assertThat(request.pathVariables()).isEmpty();
        assertThat(request.queryParams()).isEmpty();
        assertThat(request.method()).isEqualTo(PluginEndpoint.Method.GET);
        System.out.println("[PluginServerRequestTest] null parts -> empty maps");
    }

    /** Catches a verb being mapped to the wrong one in either direction. */
    @Test
    void verbMappings_coverTheSixVerbs_andRejectOthers() {
        Object[][] pairs = {
                {HttpMethod.GET, PluginEndpoint.Method.GET}, {HttpMethod.POST, PluginEndpoint.Method.POST},
                {HttpMethod.PUT, PluginEndpoint.Method.PUT}, {HttpMethod.PATCH, PluginEndpoint.Method.PATCH},
                {HttpMethod.DELETE, PluginEndpoint.Method.DELETE}, {HttpMethod.OPTIONS, PluginEndpoint.Method.OPTIONS}};
        for (Object[] pair : pairs) {
            assertThat(PluginServerRequest.fromHttpMetod((HttpMethod) pair[0])).isEqualTo(pair[1]);
            assertThat(PluginServerRequest.fromPluginEndpointMethod((PluginEndpoint.Method) pair[1])).isEqualTo(pair[0]);
        }
        assertThat(PluginServerRequest.fromHttpMetod(HttpMethod.HEAD)).isNull();
        assertThat(PluginServerRequest.fromHttpMetod(HttpMethod.TRACE)).isNull();
        System.out.println("[PluginServerRequestTest] six verbs map both ways, HEAD and TRACE -> null");
    }
}
