package org.lowcoder.plugin.restapi;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.auth.OAuthInheritAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType;
import reactor.core.publisher.Mono;

/**
 * BF-058 (formerly pinned as "the token params are not sent"): the token properties of type "param" that OAuth "inherit
 * from login" adds reach the URL. authByOauth2InheritFromLogin merges them into the context's URL parameters, and the URI,
 * built before the token step, is built again from them, so a token param replaces the datasource value of its key and a
 * token param with a new key is added, while the path and the query typed in the URL stay as they were.
 */
class RestApiOauthParamsTest {

    static final String PATH = "/p";

    private final RestApiCallSupport support = new RestApiCallSupport();

    private static String query(String pathAndQuery) {
        return pathAndQuery.split("\\?")[1];
    }

    private List<String> queryParts(RecordingHttpServer server, String url, List<Property> token) {
        RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(url)
                .params(List.of(new Property("own", "1"), new Property("tok", "ds")))
                .authConfig(OAuthInheritAuthConfig.builder().type(RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN).build()).build();
        int before = server.requests().size();
        support.run(datasource, Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(null, Mono.just(token)));
        RecordingHttpServer.Request request = server.requests().get(before);
        System.out.println("[RestApiOauthParamsTest] token " + token + " -> " + request.pathAndQuery() + " X-Token-Header " + request.header("X-Token-Header"));
        assertThat(request.pathAndQuery()).startsWith(PATH + "?");
        assertThat(request.header("X-Token-Header")).containsExactly("H");
        return List.of(query(request.pathAndQuery()).split("&"));
    }

    /**
     * The control is the same URL and datasource with a token that has only a header: the query built before the token
     * step. With token params, the query is that one with the datasource value of {@code tok} replaced by the token's and
     * {@code fresh} added; the parameter typed in the URL is kept as the first build encoded it.
     */
    @Test
    void theTokenParamsAreSentAndReplaceTheDatasourceValueOfTheSameKeyBF058() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of(PATH, RestApiCallSupport.json(200, "{}")))) {
            String url = server.baseUrl() + PATH + "?typed=a%20b";
            Property header = new Property("X-Token-Header", "H", "header");

            List<String> control = queryParts(server, url, List.of(header));
            List<String> withParams = queryParts(server, url, List.of(new Property("tok", "T", "param"), new Property("fresh", "N &x", "param"), header));

            assertThat(control).contains("own=1", "tok=ds").hasSize(3);
            List<String> expected = new ArrayList<>(control);
            expected.remove("tok=ds");
            expected.add("tok=T");
            expected.add("fresh=N+%26x");
            // the order of the added params follows an unordered map, so it is not asserted
            assertThat(withParams).containsExactlyInAnyOrderElementsOf(expected);
            assertThat(withParams.get(0)).isEqualTo(control.get(0)).startsWith("typed=");
        }
    }

    @Test
    void withoutTokenParamsTheUrlIsTheOneBuiltBeforeTheTokenStep() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of(PATH, RestApiCallSupport.json(200, "{}")))) {
            RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(server.baseUrl() + PATH)
                    .params(List.of(new Property("own", "1")))
                    .authConfig(OAuthInheritAuthConfig.builder().type(RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN).build()).build();

            support.run(datasource, Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(null,
                    Mono.just(List.of(new Property("Authorization", "Bearer T", "header")))));

            String pathAndQuery = server.requests().get(0).pathAndQuery();
            System.out.println("[RestApiOauthParamsTest] request without token params " + pathAndQuery);
            assertThat(pathAndQuery).isEqualTo(PATH + "?own=1");
        }
    }
}
