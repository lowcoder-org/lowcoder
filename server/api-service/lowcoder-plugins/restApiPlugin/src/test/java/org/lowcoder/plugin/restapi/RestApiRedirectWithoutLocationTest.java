package org.lowcoder.plugin.restapi;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;

/**
 * DEFECT pinned (plan section 9 row "reproduced, to pin (L4-9 follow-up)", probe P1; D-6, fix deferred): an answer
 * with a 3xx status and no {@code Location} header, for example 304 Not Modified, is treated as a redirect and
 * {@code response.headers().header("Location").get(0)} (RestApiExecutor.java:276) reads an empty list. The caller does
 * not get the 304 as a plain response; it gets {@code PluginException: REST API execution error: Index: 0.}, a message
 * that names neither the status nor the header. One request is sent. The obvious fix is to treat a 3xx without a
 * Location as an ordinary response, which turns this test red.
 */
class RestApiRedirectWithoutLocationTest {

    private final RestApiCallSupport support = new RestApiCallSupport();

    @ParameterizedTest(name = "status {0}")
    @ValueSource(ints = {301, 302, 304})
    void aRedirectStatusWithoutALocationFailsWithAnIndexMessage(int status) {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/moved", new Response(status, Map.of(), null)))) {
            RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(server.baseUrl() + "/moved").build();

            Throwable failure = support.failureOf(datasource, Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(null, null));

            System.out.println("[RestApiRedirectWithoutLocationTest] " + status + " without Location -> " + failure);
            assertThat(failure).isInstanceOf(PluginException.class).hasMessageContaining("Index: 0");
            assertThat(server.requests()).hasSize(1);
            assertThat(List.of(failure.getMessage())).noneMatch(message -> message.contains("Location"));
        }
    }
}
