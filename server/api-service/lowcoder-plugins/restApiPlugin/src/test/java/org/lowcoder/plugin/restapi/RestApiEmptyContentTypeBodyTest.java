package org.lowcoder.plugin.restapi;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;

/**
 * BF-057 (formerly pinned as "a POST with a body and no content type sends an empty body"): when neither the datasource nor
 * the query sets a Content-Type header, the editor's body type decides, as the editor shows the query. A content-type body
 * type (JSON, Raw, x-www-form-urlencoded, Form Data: the header was removed by hand) is sent as that content type; "None"
 * sends no body, even with text left from an earlier body type; a query without a body type (not saved by the editor)
 * sends its body text as it is, without a Content-Type. Each case is checked on what a local server receives.
 */
class RestApiEmptyContentTypeBodyTest {

    static final String PATH = "/post";
    static final String CONTENT_TYPE = "Content-Type";
    static final String PAYLOAD = "payload ž";
    static final String BODY_TYPE = "bodyType";

    private final RestApiCallSupport support = new RestApiCallSupport();
    private RecordingHttpServer server;

    @BeforeEach
    void start() {
        server = RecordingHttpServer.start(Map.of(PATH, RestApiCallSupport.json(200, "{}")));
    }

    @AfterEach
    void stop() {
        server.close();
    }

    private RecordingHttpServer.Request send(String method, Map<String, Object> query) {
        Map<String, Object> config = new HashMap<>(query);
        config.put("httpMethod", method);
        RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(server.baseUrl() + PATH).build();
        int before = server.requests().size();
        support.run(datasource, config, RestApiCallSupport.visitor(null, null));
        assertThat(server.requests()).hasSize(before + 1);
        RecordingHttpServer.Request request = server.requests().get(before);
        System.out.println("[RestApiEmptyContentTypeBodyTest] " + method + " " + query + " -> body '" + request.bodyText()
                + "' Content-Type " + request.header(CONTENT_TYPE));
        return request;
    }

    @Test
    void aPostWithABodyAndNoBodyTypeSendsTheBodyWithoutAContentTypeBF057() {
        RecordingHttpServer.Request request = send("POST", Map.of("body", PAYLOAD));

        assertThat(request.bodyText()).isEqualTo(PAYLOAD);
        assertThat(request.header(CONTENT_TYPE)).isEmpty();
    }

    @Test
    void aRawOrJsonBodyTypeWithoutTheHeaderIsSentAsThatContentTypeBF057() {
        RecordingHttpServer.Request raw = send("POST", Map.of(BODY_TYPE, "text/plain", "body", PAYLOAD));
        assertThat(raw.bodyText()).isEqualTo(PAYLOAD);
        assertThat(raw.header(CONTENT_TYPE)).singleElement().asString().startsWith("text/plain");

        RecordingHttpServer.Request json = send("PUT", Map.of(BODY_TYPE, "application/json", "body", "{\"a\": 1, \"b\": [true]}"));
        assertThat(json.bodyText()).isEqualTo("{\"a\":1,\"b\":[true]}");
        assertThat(json.header(CONTENT_TYPE)).singleElement().asString().startsWith("application/json");
    }

    @Test
    void aFormBodyTypeWithoutTheHeaderIsEncodedAsThatFormBF057() {
        List<Property> fields = List.of(new Property("a", "1"), new Property("b", "x y"));

        RecordingHttpServer.Request urlEncoded = send("POST", Map.of(BODY_TYPE, "application/x-www-form-urlencoded", "bodyFormData", fields));
        assertThat(urlEncoded.bodyText()).isEqualTo("a=1&b=x+y");
        assertThat(urlEncoded.header(CONTENT_TYPE)).singleElement().asString().startsWith("application/x-www-form-urlencoded");

        RecordingHttpServer.Request multipart = send("POST", Map.of(BODY_TYPE, "multipart/form-data", "bodyFormData", fields));
        assertThat(multipart.header(CONTENT_TYPE)).singleElement().asString().startsWith("multipart/form-data;boundary=");
        assertThat(multipart.bodyText()).contains("name=\"a\"", "\r\n\r\n1\r\n", "name=\"b\"", "\r\n\r\nx y\r\n");
    }

    @Test
    void theNoneBodyTypeSendsNoBodyEvenWithTextLeftInTheQueryBF057() {
        RecordingHttpServer.Request request = send("POST", Map.of(BODY_TYPE, "none", "body", "left from the Raw body type"));

        assertThat(request.bodyText()).isEmpty();
        assertThat(request.header(CONTENT_TYPE)).isEmpty();
    }

    @Test
    void aGetSendsNoBodyWhateverTheBodyType() {
        RecordingHttpServer.Request request = send("GET", Map.of(BODY_TYPE, "text/plain", "body", PAYLOAD));

        assertThat(request.bodyText()).isEmpty();
    }
}
