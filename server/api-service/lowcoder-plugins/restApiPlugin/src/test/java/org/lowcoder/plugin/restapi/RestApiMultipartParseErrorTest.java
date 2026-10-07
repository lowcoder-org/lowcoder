package org.lowcoder.plugin.restapi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.query.QueryVisitorContext;

/**
 * DEFECT pinned, one level up (plan section 9 row "CONTENT_PARSE_ERROR is unformattable"; pinned at the sdk in
 * DataUtilsContentParseErrorTest; D-6, fix deferred): what the user receives. The server builds a query's context with
 * {@code buildQueryExecutionContextMono} (QueryExecutionServiceImpl.java:72), which wraps what the plugin throws as a coded
 * {@code QUERY_ARGUMENT_ERROR}. A file field of a multipart query whose value is not valid upload data reaches
 * {@code convertToMultiformFileValue} (RestApiExecutor.java:207), whose intended message cannot be built, so the coded
 * message carries the IllegalArgumentException text of the failed formatting instead of the upload-format hint. Escaping
 * the braces in locale_en.properties:183 turns the message assertions red. A local server (port 0, loopback) stands in for
 * the datasource url and must see no request.
 */
class RestApiMultipartParseErrorTest {

    private static final String BAD_UPLOAD_VALUE = "this is not upload data";

    private final RestApiExecutor executor = executor();

    private static RestApiExecutor executor() {
        CommonConfig config = new CommonConfig();
        config.setCookieName("LOWCODER_SESSION");
        return new RestApiExecutor(config);
    }

    private static Map<String, Object> multipartQuery(String uploadValue) {
        return Map.of("httpMethod", "POST", "headers", List.of(new Property("content-type", "multipart/form-data")),
                "bodyFormData", List.of(new Property("file", uploadValue, "FILE")), "params", List.of());
    }

    @Test
    void theUserGetsTheIllegalArgumentTextInsideACodedQueryArgumentErrorInsteadOfTheUploadHintPinsTheSection9Row() {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/upload", RestApiCallSupport.json(200, "{}")))) {
            RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url(server.baseUrl() + "/upload").build();
            QueryVisitorContext visitor = RestApiCallSupport.visitor(null, null);

            Throwable reactive = org.junit.jupiter.api.Assertions.assertThrows(PluginException.class,
                    () -> executor.buildQueryExecutionContextMono(datasource, multipartQuery(BAD_UPLOAD_VALUE), Map.of(), visitor).block());
            Throwable blocking = org.junit.jupiter.api.Assertions.assertThrows(PluginException.class,
                    () -> executor.doBuildQueryExecutionContext(datasource, multipartQuery(BAD_UPLOAD_VALUE), Map.of(), visitor));

            System.out.println("[RestApiMultipartParseErrorTest] user receives: " + ((PluginException) reactive).getError() + " / "
                    + ((PluginException) reactive).getMessageKey() + " / " + reactive.getMessage());
            for (Throwable failure : List.of(reactive, blocking)) {
                PluginException coded = (PluginException) failure;
                assertThat(coded.getError()).isEqualTo(PluginCommonError.INVALID_QUERY_SETTINGS);
                assertThat(coded.getMessageKey()).isEqualTo("QUERY_ARGUMENT_ERROR");
                assertThat(coded.getMessage()).contains("can't parse argument number: data:base64 string");
                assertThat(coded.getMessage()).doesNotContain("Resolve upload data failed");
            }
            assertThat(server.requests()).as("no request is made while the context is built").isEmpty();
        }
    }

    @Test
    void aFileValueThatParsesButHasANonTextDataFieldGetsItsOwnReadableMessage() {
        RestApiDatasourceConfig datasource = RestApiDatasourceConfig.builder().url("http://example.invalid/upload").build();
        QueryVisitorContext visitor = new QueryVisitorContext("v", "o", 0, null, null, Set.of());

        assertThatThrownBy(() -> executor.buildQueryExecutionContextMono(datasource, multipartQuery("{\"data\":1,\"name\":\"a\"}"), Map.of(), visitor).block())
                .isInstanceOf(PluginException.class)
                .hasMessageContaining("Resolve upload data failed, data field is not a valid base64 string");
    }
}
