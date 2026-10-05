package org.lowcoder.plugin.restapi;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;

/**
 * DEFECT pinned (plan section 9 row "reproduced, to pin (L4-9 follow-up)", probe P3; D-6, fix deferred): a POST whose
 * datasource and query set no content type drops the query body. buildBodyInserter returns an empty body for a blank
 * content type (RestApiExecutor.java:484-485), so {@code body: "payload"} is never sent, and no Content-Type header is
 * sent either. The user gets no error. The obvious fix is to send the body (or to default the content type), which
 * turns this test red.
 */
class RestApiEmptyContentTypeBodyTest {

    private final RestApiCallSupport support = new RestApiCallSupport();

    @Test
    void aPostWithABodyAndNoContentTypeSendsAnEmptyBodyAndNoContentType() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/post", RestApiCallSupport.json(200, "{}")))) {
            RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(server.baseUrl() + "/post").build();

            support.run(datasource, Map.of("httpMethod", "POST", "body", "payload"), RestApiCallSupport.visitor(null, null));

            RecordingHttpServer.Request request = server.requests().get(0);
            System.out.println("[RestApiEmptyContentTypeBodyTest] " + request.method() + " body '" + request.bodyText()
                    + "' Content-Type " + request.header("Content-Type"));
            assertThat(server.requests()).hasSize(1);
            assertThat(request.method()).isEqualTo("POST");
            assertThat(request.bodyText()).isEmpty();
            assertThat(request.header("Content-Type")).isEmpty();
        }
    }
}
