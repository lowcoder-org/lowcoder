package org.lowcoder.plugin.restapi;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.databind.JsonNode;
import com.google.common.collect.Streams;

/**
 * BF-113 (fixed; was pinned as the plan section 9 row "reproduced, to pin (L4-9 follow-up)", probe P1): an answer with a
 * 3xx status and no {@code Location} header (or a blank one), for example 304 Not Modified, is an answer like any other:
 * the query result of a status that is not 2xx, {@code HTTP<status name>}, with the answer's headers and body. It was read as a redirect, and
 * {@code header("Location").get(0)} on the empty list failed the query with "REST API execution error: Index: 0.". One
 * request is sent.
 */
class RestApiRedirectWithoutLocationTest {

    private static final String PATH = "/moved";
    private static final String HTTP_CODE_PREFIX = "HTTP";
    private static final String LOCATION = "Location";
    private static final String BLANK = " ";
    private static final String ANSWER_HEADER = "X-Answer";
    private static final String ANSWER_HEADER_VALUE = "kept";
    private static final String ANSWER_FIELD = "answer";
    private static final String ANSWER_BODY = "{\"" + ANSWER_FIELD + "\":\"" + ANSWER_HEADER_VALUE + "\"}";
    private static final String CONTENT_TYPE = "Content-Type";
    private static final String JSON = "application/json";
    /** A 304 has no body; the other statuses carry {@link #ANSWER_BODY}. */
    private static final int NOT_MODIFIED = 304;

    private final RestApiCallSupport support = new RestApiCallSupport();

    @ParameterizedTest(name = "status {0}")
    @ValueSource(ints = {301, 302, 304})
    void aRedirectStatusWithoutALocationIsAnOrdinaryAnswerBF113(int status) {
        assertOrdinaryAnswer(status, answer(status, Map.of()));
    }

    @ParameterizedTest(name = "status {0}")
    @ValueSource(ints = {302, 307})
    void aRedirectStatusWithABlankLocationIsAnOrdinaryAnswerBF113(int status) {
        assertOrdinaryAnswer(status, answer(status, Map.of(LOCATION, List.of(BLANK))));
    }

    /** An answer with {@code headers}, the {@link #ANSWER_HEADER} and, unless a 304, the JSON {@link #ANSWER_BODY}. */
    private static Response answer(int status, Map<String, List<String>> headers) {
        Map<String, List<String>> all = new HashMap<>(headers);
        all.put(ANSWER_HEADER, List.of(ANSWER_HEADER_VALUE));
        if (status == NOT_MODIFIED) {
            return new Response(status, all, null);
        }
        all.put(CONTENT_TYPE, List.of(JSON));
        return new Response(status, all, ANSWER_BODY.getBytes(StandardCharsets.UTF_8));
    }

    /** The values of the result header named {@code name}, compared without case (the test server normalizes names). */
    private static JsonNode header(QueryExecutionResult result, String name) {
        JsonNode headers = result.getHeaders();
        return Streams.stream(headers.fieldNames()).filter(name::equalsIgnoreCase).findFirst().map(headers::get).orElse(null);
    }

    private void assertOrdinaryAnswer(int status, Response response) {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of(PATH, response))) {
            RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(server.baseUrl() + PATH).build();

            QueryExecutionResult result = support.run(datasource, Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(null, null));

            System.out.println("[RestApiRedirectWithoutLocationTest] " + status + " " + response.headers() + " -> success=" + result.isSuccess()
                    + " code=" + result.getQueryCode() + " data=" + result.getData());
            assertThat(result.isSuccess()).isFalse();
            assertThat(result.getQueryCode()).isEqualTo(HTTP_CODE_PREFIX + HttpStatus.valueOf(status).name());
            assertThat(server.requests()).hasSize(1);
            assertThat(header(result, ANSWER_HEADER)).as("the answer's headers").isNotNull();
            assertThat(header(result, ANSWER_HEADER).get(0).asText()).isEqualTo(ANSWER_HEADER_VALUE);
            if (status != NOT_MODIFIED) {
                assertThat(result.getData()).as("the answer's body").isInstanceOf(JsonNode.class);
                assertThat(((JsonNode) result.getData()).get(ANSWER_FIELD).asText()).isEqualTo(ANSWER_HEADER_VALUE);
            }
        }
    }
}
