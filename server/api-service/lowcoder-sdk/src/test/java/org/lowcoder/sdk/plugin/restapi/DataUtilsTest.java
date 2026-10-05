package org.lowcoder.sdk.plugin.restapi;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Request;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.exception.ServerException;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.models.RestBodyFormFileData;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * {@link DataUtils}: the form-urlencoded and multipart bodies the REST plugins send, and the parsing of the upload values of
 * the multipart file fields. Bodies are sent to a local server (port 0, loopback) and read back there, so the assertions are
 * about what goes on the wire.
 */
public class DataUtilsTest {

    private static final String HELLO_BASE64 = "aGVsbG8=";

    private static Request send(BodyInserter<?, ? super org.springframework.http.client.reactive.ClientHttpRequest> inserter, String contentType) {
        try (RecordingHttpServer server = RecordingHttpServer.start(Map.of("/b", new Response(200, Map.of(), null)))) {
            WebClient.RequestBodySpec spec = WebClientBuildHelper.builder().build().post().uri(server.baseUrl() + "/b");
            if (contentType != null) {
                spec.contentType(MediaType.parseMediaType(contentType));
            }
            spec.body(inserter).retrieve().toBodilessEntity().block();
            return server.requests().get(0);
        }
    }

    /** The client wraps what the body inserter throws in a WebClientRequestException; this returns the wrapped exception of the given type. */
    private static <T extends Throwable> T causeOfType(Class<T> type, org.junit.jupiter.api.function.Executable action) {
        Throwable thrown = assertThrows(RuntimeException.class, action);
        for (Throwable t = thrown; t != null; t = t.getCause()) {
            if (type.isInstance(t)) {
                return type.cast(t);
            }
        }
        throw new AssertionError("no " + type.getSimpleName() + " in the cause chain of " + thrown, thrown);
    }

    private final DataUtils dataUtils = DataUtils.getInstance();

    @Test
    public void theInstanceIsShared() {
        assertSame(DataUtils.getInstance(), DataUtils.getInstance());
    }

    @Test
    public void aNullBodyListSendsAnEmptyBody() {
        Request request = send(dataUtils.buildBodyInserter(null, MediaType.APPLICATION_FORM_URLENCODED_VALUE, true), MediaType.APPLICATION_FORM_URLENCODED_VALUE);

        assertEquals("", request.bodyText());
        assertEquals(List.of("0"), request.header("Content-Length"));
        for (String other : new String[] {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.TEXT_PLAIN_VALUE}) {
            Request sent = send(dataUtils.buildBodyInserter(null, other, true), other.equals(MediaType.TEXT_PLAIN_VALUE) ? other : null);
            assertEquals("", sent.bodyText(), other);
        }
    }

    @Test
    public void formUrlencodedJoinsTheEntriesAndEncodesTheValuesButNeverTheKeys() {
        List<Property> body = List.of(new Property("a", "1"), new Property("b c", "x y&z=1"), new Property(null, "dropped"));

        assertEquals("a=1&b c=x+y%26z%3D1", dataUtils.parseFormData(body, true));
        assertEquals("a=1&b c=x y&z=1", dataUtils.parseFormData(body, false), "with encoding switched off the value is sent as it is");
        Request request = send(dataUtils.buildBodyInserter(body, MediaType.APPLICATION_FORM_URLENCODED_VALUE, true), MediaType.APPLICATION_FORM_URLENCODED_VALUE);
        System.out.println("[DataUtilsTest] urlencoded body on the wire: '" + request.bodyText() + "'");
        assertEquals("a=1&b c=x+y%26z%3D1", request.bodyText());
        assertEquals(List.of(MediaType.APPLICATION_FORM_URLENCODED_VALUE), request.header("Content-Type").stream().map(v -> v.split(";")[0]).toList());
    }

    @Test
    public void anEmptyOrAllKeylessFormListSendsAnEmptyBody() {
        assertEquals("", dataUtils.parseFormData(null, true));
        assertEquals("", dataUtils.parseFormData(List.of(), true));
        assertEquals("", dataUtils.parseFormData(List.of(new Property(null, "x")), true), "entries without a key are dropped");
        Request request = send(dataUtils.buildBodyInserter(List.of(new Property(null, "x")), MediaType.APPLICATION_FORM_URLENCODED_VALUE, true),
                MediaType.APPLICATION_FORM_URLENCODED_VALUE);
        assertEquals("", request.bodyText());
    }

    @Test
    public void multipartSendsTextPartsAndFilePartsDecodedFromBase64WithTheirFileName() {
        MultipartFormData file = new MultipartFormData();
        file.setName("a.txt");
        file.setData(HELLO_BASE64 + "  ");
        List<Property> body = List.of(new Property("t", "text value"), new RestBodyFormFileData("f", List.of(file)),
                new Property(" ", "blank key part is dropped"), new Property("", "empty key part is dropped"));

        Request request = send(dataUtils.buildBodyInserter(body, MediaType.MULTIPART_FORM_DATA_VALUE, true), null);

        String text = request.bodyText();
        System.out.println("[DataUtilsTest] multipart content type " + request.header("Content-Type") + ", body:\n" + text);
        assertTrue(request.header("Content-Type").get(0).startsWith("multipart/form-data;boundary="));
        assertTrue(text.contains("Content-Disposition: form-data; name=\"t\""));
        assertTrue(text.contains("text value"));
        assertTrue(text.contains("Content-Disposition: form-data; name=\"f\"; filename=\"a.txt\""));
        assertTrue(text.contains("hello"), "the file part carries the decoded bytes, not the base64 text");
        assertTrue(!text.contains(HELLO_BASE64));
        assertTrue(!text.contains("blank key part"));
        assertTrue(!text.contains("empty key part"));
    }

    @Test
    public void anEmptyMultipartListSendsAnEmptyBody() {
        Request request = send(dataUtils.parseMultipartFileData(List.of()), null);

        assertEquals("", request.bodyText());
        assertEquals("", send(dataUtils.parseMultipartFileData(null), null).bodyText());
    }

    @Test
    public void aFilePartWithoutAFileNameKeepsAnEmptyFileName() {
        MultipartFormData file = new MultipartFormData();
        file.setData(HELLO_BASE64);

        Request request = send(dataUtils.parseMultipartFileData(List.of(new RestBodyFormFileData("f", List.of(file)))), null);

        System.out.println("[DataUtilsTest] file part without name:\n" + request.bodyText());
        assertTrue(request.bodyText().contains("name=\"f\""), request.bodyText());
        assertTrue(request.bodyText().contains("hello"));
    }

    @Test
    public void aFileFieldThatIsNotFileDataAndInvalidBase64AreRejectedWhenTheBodyIsWritten() {
        Property notFileData = new Property("f", "x", "FILE");
        MultipartFormData broken = new MultipartFormData();
        broken.setName("a.txt");
        broken.setData("this is not base64!");

        ServerException wrongType = causeOfType(ServerException.class, () -> send(dataUtils.parseMultipartFileData(List.of(notFileData)), null));
        PluginException badBase64 = causeOfType(PluginException.class,
                () -> send(dataUtils.parseMultipartFileData(List.of(new RestBodyFormFileData("f", List.of(broken)))), null));

        System.out.println("[DataUtilsTest] " + wrongType.getMessage() + " / " + badBase64.getMessageKey() + ": " + badBase64.getMessage());
        assertTrue(wrongType.getMessage().contains("invalid data type for MultipartForm"));
        assertEquals("FAIL_TO_PARSE_BASE64_STRING", badBase64.getMessageKey());
        assertEquals(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, badBase64.getError());
    }

    @Test
    public void anyOtherContentTypeSendsTheListItself() {
        List<Property> body = List.of(new Property("a", "1"));

        Request request = send(dataUtils.buildBodyInserter(body, MediaType.TEXT_PLAIN_VALUE, true), MediaType.APPLICATION_JSON_VALUE);

        System.out.println("[DataUtilsTest] other content type body: " + request.bodyText());
        assertTrue(request.bodyText().contains("\"key\":\"a\""), request.bodyText());
        assertTrue(request.bodyText().contains("\"value\":\"1\""), request.bodyText());
    }

    @Test
    public void parseJsonBodyKeepsNonStringsAndAnInternedEmptyStringBecomesEmptyBytes() {
        Object number = 5;

        assertSame(number, DataUtils.parseJsonBody(number));
        assertEquals(null, DataUtils.parseJsonBody(null));
        assertEquals(0, ((byte[]) DataUtils.parseJsonBody("")).length);
        assertEquals("{\"a\":1}", DataUtils.parseJsonBody("{\"a\":1}").toString());
    }

    @Test
    public void uploadValuesAreParsedFromAJsonObjectOrAnArrayOfThem() {
        List<MultipartFormData> one = DataUtils.convertToMultiformFileValue("{\"data\":\"{{d}}\",\"name\":\"{{n}}\"}", Map.of("d", HELLO_BASE64, "n", "a.txt"));
        List<MultipartFormData> many = DataUtils.convertToMultiformFileValue(
                "[{\"data\":\"QQ==\",\"name\":\"a\"},5,{\"data\":\"Qg==\",\"name\":\"b\"},\"x\"]", Map.of());

        assertEquals(1, one.size());
        assertEquals(HELLO_BASE64, one.get(0).getData());
        assertEquals("a.txt", one.get(0).getName());
        assertEquals(List.of("a", "b"), many.stream().map(MultipartFormData::getName).toList(), "elements that are not objects are dropped");
        assertEquals(List.of("QQ==", "Qg=="), many.stream().map(MultipartFormData::getData).toList());
        assertEquals(List.of(), DataUtils.convertToMultiformFileValue("[]", Map.of()));
    }

    @Test
    public void anUploadValueWhoseDataOrNameIsNotATextIsRejectedWithItsOwnMessage() {
        PluginException data = assertThrows(PluginException.class, () -> DataUtils.convertToMultiformFileValue("{\"data\":1,\"name\":\"a\"}", Map.of()));
        PluginException name = assertThrows(PluginException.class, () -> DataUtils.convertToMultiformFileValue("{\"data\":\"QQ==\",\"name\":2}", Map.of()));

        assertEquals("MULTIFORM_DATA_IS_NOT_STRING", data.getMessageKey());
        assertEquals("MULTIFORM_NAME_IS_NOT_STRING", name.getMessageKey());
        assertEquals(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, data.getError());
        assertEquals("Resolve upload data failed, data field is not a valid base64 string", data.getMessage());
        assertEquals("Resolve upload data failed, name field is not a valid string", name.getMessage());
    }
}
