package org.lowcoder.plugin.restapi;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;

/**
 * DEFECT pinned (plan section 9 row "reproduced, to pin (L4-9 follow-up)", probe P2; D-6, fix deferred): the two body
 * merges of {@link RestApiExecutor} use opposite precedence for a key that the datasource and the query both set. In a
 * urlencoded or multipart body the query's value wins (mergeBody(List, List), RestApiExecutor.java:466-470). In a JSON
 * body the datasource's value wins: mergeBody(QueryBody, List) overwrites the query's field with
 * {@code objectNode.put} (:223-226). A user who overrides a datasource default in a JSON query sees the default sent.
 * The obvious fix is one precedence for both (the query wins), which turns the JSON assertion red.
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
    void inAJsonBodyTheDatasourceValueOverridesTheQueryValueForTheSameKey() {
        String body = send("application/json", Map.of("httpMethod", "POST", "body", "{\"k\":\"fromQuery\",\"q\":1}"));

        System.out.println("[RestApiBodyMergePrecedenceTest] json body " + body);
        assertThat(body).isEqualTo("{\"k\":\"fromDatasource\",\"q\":1,\"only\":\"ds\"}");
    }

    @Test
    void inAFormBodyTheQueryValueOverridesTheDatasourceValueForTheSameKey() {
        String body = send("application/x-www-form-urlencoded", Map.of("httpMethod", "POST",
                "bodyFormData", List.of(new Property("k", "fromQuery"))));

        System.out.println("[RestApiBodyMergePrecedenceTest] form body " + body);
        assertThat(body.split("&")).containsExactlyInAnyOrder("k=fromQuery", "only=ds");
    }
}
