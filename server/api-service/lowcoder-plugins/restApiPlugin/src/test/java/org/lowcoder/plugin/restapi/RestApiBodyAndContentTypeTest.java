package org.lowcoder.plugin.restapi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;

/**
 * Content type validation, header, parameter and body merging of {@link RestApiExecutor}: what the datasource and the
 * query each contribute, and who wins. The multipart file part and the encoding cases are in RestApiEngineTest.
 */
class RestApiBodyAndContentTypeTest {

    private static final String PATH = "/post";
    private static final String CONTENT_TYPE = "Content-Type";
    private static final String FORM = "application/x-www-form-urlencoded";
    private static final String JSON = "application/json";

    private final RestApiCallSupport support = new RestApiCallSupport();
    private RecordingHttpServer server;

    @BeforeEach
    void startServer() {
        server = RecordingHttpServer.start(Map.of(PATH, RestApiCallSupport.json(200, "{}")));
    }

    @AfterEach
    void stopServer() {
        server.close();
    }

    private RestApiDatasourceConfig.RestApiDatasourceConfigBuilder datasource() {
        return RestApiDatasourceConfig.builder().url(server.baseUrl() + PATH);
    }

    private RecordingHttpServer.Request send(RestApiDatasourceConfig datasource, Map<String, Object> query) {
        int before = server.requests().size();
        support.run(datasource, query, RestApiCallSupport.visitor(null, null));
        assertThat(server.requests()).hasSize(before + 1);
        return server.requests().get(before);
    }

    private static List<String> formFields(String body) {
        return Arrays.stream(body.split("&")).sorted().toList();
    }

    @Test
    void anInvalidContentTypeIsRejectedBeforeAnyRequest() {
        RestApiDatasourceConfig datasource = datasource().headers(List.of(new Property(CONTENT_TYPE, "not a type"))).build();

        PluginException error = assertThrows(PluginException.class,
                () -> support.buildContext(datasource, Map.of("httpMethod", "POST"), RestApiCallSupport.visitor(null, null)));

        System.out.println("[RestApiBodyAndContentTypeTest] invalid content type -> " + error.getMessage());
        assertThat(error).hasMessageContaining("Invalid Content-Type").hasMessageContaining("not a type");
        assertThat(server.requests()).isEmpty();
    }

    @Test
    void aBlankContentTypeIsAcceptedAndNoContentTypeHeaderIsSent() {
        RecordingHttpServer.Request request = send(datasource().build(), Map.of("httpMethod", "GET"));

        assertThat(request.header(CONTENT_TYPE)).isEmpty();
    }

    @Test
    void formFieldsOfTheDatasourceAreMergedWithThoseOfTheQueryAndTheQueryWinsForADuplicateKey() {
        RestApiDatasourceConfig datasource = datasource().headers(List.of(new Property(CONTENT_TYPE, FORM)))
                .bodyFormData(List.of(new Property("a", "1"), new Property("b", "2"))).build();

        RecordingHttpServer.Request request = send(datasource, Map.of("httpMethod", "POST",
                "bodyFormData", List.of(new Property("a", "9"), new Property("c", "3"))));

        System.out.println("[RestApiBodyAndContentTypeTest] form body " + request.bodyText());
        assertThat(formFields(request.bodyText())).containsExactly("a=9", "b=2", "c=3");
    }

    @Test
    void headersAndParamsOfTheQueryOverrideThoseOfTheDatasourceAndBlankHeadersAreDropped() {
        RestApiDatasourceConfig datasource = datasource()
                .headers(List.of(new Property("X-A", "1"), new Property("X-Ds", "kept")))
                .params(List.of(new Property("p", "1"), new Property("q", "kept"))).build();

        RecordingHttpServer.Request request = send(datasource, Map.of("httpMethod", "GET",
                "headers", List.of(new Property("X-A", "2"), new Property("X-Blank-Value", " "), new Property(" ", "v")),
                "params", List.of(new Property("p", "2"))));

        System.out.println("[RestApiBodyAndContentTypeTest] " + request.pathAndQuery() + " " + request.headers().keySet());
        assertThat(request.header("X-A")).containsExactly("2");
        assertThat(request.header("X-Ds")).containsExactly("kept");
        assertThat(request.header("X-Blank-Value")).isEmpty();
        assertThat(request.pathAndQuery().split("\\?")[1].split("&")).containsExactlyInAnyOrder("p=2", "q=kept");
    }

    @Test
    void aGetSendsAnEmptyBodyEvenWhenTheQueryHasOne() {
        RestApiDatasourceConfig datasource = datasource().headers(List.of(new Property(CONTENT_TYPE, JSON))).build();

        RecordingHttpServer.Request request = send(datasource, Map.of("httpMethod", "GET", "body", "{\"ignored\":true}"));

        assertThat(request.method()).isEqualTo("GET");
        assertThat(request.bodyText()).isEmpty();
    }

    /**
     * Only the unambiguous part is asserted: a POST without any content type is sent. What happens to its body is
     * reported to the coordinator as probe P3 and not pinned (see log-L4.md, L4-9).
     */
    @Test
    void aPostWithoutAContentTypeIsSent() {
        RecordingHttpServer.Request request = send(datasource().build(), Map.of("httpMethod", "POST", "body", "payload"));

        System.out.println("[RestApiBodyAndContentTypeTest] POST without content type: body '" + request.bodyText() + "' type " + request.header(CONTENT_TYPE));
        assertThat(request.method()).isEqualTo("POST");
    }

    @Test
    void aJsonQueryBodyObjectIsMergedWithTheDatasourceFormFieldsAndAnArrayBodyIsSentUnchanged() {
        RestApiDatasourceConfig datasource = datasource().headers(List.of(new Property(CONTENT_TYPE, JSON)))
                .bodyFormData(List.of(new Property("only", "ds"))).build();

        RecordingHttpServer.Request object = send(datasource, Map.of("httpMethod", "POST", "body", "{\"q\":1}"));
        RecordingHttpServer.Request array = send(datasource, Map.of("httpMethod", "POST", "body", "[1,2]"));

        System.out.println("[RestApiBodyAndContentTypeTest] json object " + object.bodyText() + ", array " + array.bodyText());
        assertThat(object.bodyText()).isEqualTo("{\"q\":1,\"only\":\"ds\"}");
        assertThat(array.bodyText()).isEqualTo("[1,2]");
    }
}
