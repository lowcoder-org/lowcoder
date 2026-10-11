package org.lowcoder.plugin.restapi;

import static org.assertj.core.api.Assertions.assertThat;

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
 * DEFECT pinned (plan section 9 row "reproduced, to pin (L4-9 follow-up)", probe P4; D-6, fix deferred): the token
 * properties of type "param" that OAuth "inherit from login" adds never reach the URL. authByOauth2InheritFromLogin
 * merges them into the context's urlParams (RestApiExecutor.java:309-315), but the request URI was built earlier in
 * buildQueryExecutionContext (:161) and nothing reads urlParams afterwards. With a datasource param {@code tok=ds} and
 * a token param {@code tok=T}, the request carries {@code tok=ds}, and a token param with a new key is not sent at
 * all. (The token HEADERS do arrive: RestApiOauthInheritTest.) The obvious fix is to rebuild the URI after the token
 * step; it turns this test red, and with it in place removing the {@code setUrlParams} call changes the result too.
 */
class RestApiOauthParamsTest {

    private final RestApiCallSupport support = new RestApiCallSupport();

    @Test
    void theTokenParamsAreNotSentAndTheDatasourceValueOfTheSameKeyIsSent() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/p", RestApiCallSupport.json(200, "{}")))) {
            RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(server.baseUrl() + "/p")
                    .params(List.of(new Property("own", "1"), new Property("tok", "ds")))
                    .authConfig(OAuthInheritAuthConfig.builder().type(RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN).build()).build();

            support.run(datasource, Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(null,
                    Mono.just(List.of(new Property("tok", "T", "param"), new Property("fresh", "N", "param")))));

            String pathAndQuery = server.requests().get(0).pathAndQuery();
            System.out.println("[RestApiOauthParamsTest] request " + pathAndQuery);
            assertThat(server.requests()).hasSize(1);
            // the order of the params follows an unordered map, so it is not asserted
            assertThat(pathAndQuery.split("\\?")[1].split("&")).containsExactlyInAnyOrder("own=1", "tok=ds");
        }
    }
}
