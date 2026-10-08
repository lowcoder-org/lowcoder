package org.lowcoder.plugin.restapi;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;

/**
 * The two body merges of {@link RestApiExecutor} for a key that the datasource and the query both set: the query's value
 * wins, in a urlencoded or multipart body (mergeBody(List, List)) and in a JSON body (mergeBody(QueryBody, List)), as it
 * does for URL parameters and headers; the datasource's other keys are added. BF-114 (fixed; was pinned as the plan
 * section 9 row "reproduced, to pin (L4-9 follow-up)", probe P2): in a JSON body the datasource's value overwrote the
 * query's field, so a user who overrode a datasource default in a JSON query saw the default sent.
 */
class RestApiBodyMergePrecedenceTest {

    private static final String PATH = "/post";
    private static final String CONTENT_TYPE = "Content-Type";

    private final RestApiCallSupport support = new RestApiCallSupport();

    private String send(String contentType, Map<String, Object> query) {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of(PATH, RestApiCallSupport.json(200, "{}")))) {
            RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(server.baseUrl() + PATH)
                    .headers(List.of(new Property(CONTENT_TYPE, contentType)))
                    .bodyFormData(List.of(new Property("k", "fromDatasource"), new Property("only", "ds"))).build();
            support.run(datasource, query, RestApiCallSupport.visitor(null, null));
            assertThat(server.requests()).hasSize(1);
            return server.requests().get(0).bodyText();
        }
    }

    @Test
    void inAJsonBodyTheQueryValueOverridesTheDatasourceValueForTheSameKeyBF114() {
        String body = send("application/json", Map.of("httpMethod", "POST", "body", "{\"k\":\"fromQuery\",\"q\":1}"));

        System.out.println("[RestApiBodyMergePrecedenceTest] json body " + body);
        assertThat(body).isEqualTo("{\"k\":\"fromQuery\",\"q\":1,\"only\":\"ds\"}");
    }

    @Test
    void inAFormBodyTheQueryValueOverridesTheDatasourceValueForTheSameKey() {
        String body = send("application/x-www-form-urlencoded", Map.of("httpMethod", "POST",
                "bodyFormData", List.of(new Property("k", "fromQuery"))));

        System.out.println("[RestApiBodyMergePrecedenceTest] form body " + body);
        assertThat(body.split("&")).containsExactlyInAnyOrder("k=fromQuery", "only=ds");
    }
}
