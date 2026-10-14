package org.lowcoder.api.application.marketplace;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.tomakehurst.wiremock.junit5.WireMockRuntimeInfo;
import com.github.tomakehurst.wiremock.junit5.WireMockTest;
import com.github.tomakehurst.wiremock.verification.LoggedRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.infra.js.NodeServerHelper;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.GoldenJson;
import org.mockito.Mockito;
import org.springframework.core.io.buffer.DataBufferLimitException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import reactor.test.StepVerifier;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Boundary tests of the JSON the server writes for the node-service renderer (group {@code marketplace-render}, B02):
 * the layout snapshot {@link MarketplacePreviewWorker#snapshotOf} serializes and hashes
 * ({@code MarketplacePreviewWorker.java:34}, {@code :113-121}), and the signed request
 * {@link MarketplaceRenderClient#render} posts ({@code MarketplaceRenderClient.java:28-46}). It lives in the production
 * package because {@code snapshotOf} and {@code staticDsl} are package-private.
 *
 * <ul>
 *   <li>{@link #snapshotWrittenWithSortedKeys}: a payload whose maps are not sorted, carrying the §4.6 representative
 *       input as the DSL, written with sorted keys; text and hash pinned in {@value #SNAPSHOT};</li>
 *   <li>{@link #renderRequestBody}: the body {@code {timestamp, payload, signature}}, the signature recomputed here
 *       with the production algorithm (HMAC-SHA256 of {@code timestamp + "\n" + payload} with the JS executor's password,
 *       {@code :34-36}), then pinned in {@value #RENDER_BODY} with the timestamp and signature replaced;</li>
 *   <li>{@link #renderRejectsANonJpegAnswer}: an answer without the JPEG marker is the error of {@code :43-44};</li>
 *   <li>{@link #renderEnforcesItsDeclaredLimit}: the client's codecs ({@code :21-22}, group {@code client-codec-guard})
 *       accept an answer of exactly 2 MiB and refuse one byte more, so the declared limit is the one in effect.</li>
 * </ul>
 *
 * <p>The renderer is WireMock, reached through a mocked {@link NodeServerHelper}; WireMock answers at once and every wait
 * is bounded by {@link #TIMEOUT}, so a mis-stub fails fast instead of waiting out the client's 90 seconds ({@code :42}).
 *
 * <p>Limits: the client's unconfigured-secret error ({@code :30}), its 90-second timeout, non-2xx renderer answers and
 * {@code createUri} failures are not JSON boundary behaviour and are not tested here. That the limit's error carries a
 * {@link DataBufferLimitException} is Spring's codec behaviour, asserted, not derived.
 */
@WireMockTest
class MarketplaceRenderContractTest {

    static final String SNAPSHOT = "boundary/marketplace-render/snapshot.json";
    static final String RENDER_BODY = "boundary/marketplace-render/render.body.json";
    /** The renderer's path as the client asks {@link NodeServerHelper} for it, {@code MarketplaceRenderClient.java:40}. */
    static final String RENDER_PATH = "marketplace/render";
    static final String WIREMOCK_RENDER_PATH = "/" + RENDER_PATH;
    static final String PASSWORD = "MarketplaceRenderContractTest.password";
    /** The text the worker passes as {@code payload}: a snapshot's JSON. */
    static final String PAYLOAD = "{\"applicationDSL\":{\"ui\":{}},\"moduleDSL\":{},\"orgCommonSettings\":null}";
    static final String TIMESTAMP_MEMBER = "timestamp";
    static final String PAYLOAD_MEMBER = "payload";
    static final String SIGNATURE_MEMBER = "signature";
    static final String HASH_MEMBER = "hash";
    static final String TEXT_MEMBER = "text";
    static final String TIMESTAMP_PLACEHOLDER = "@@render-timestamp@@";
    static final String SIGNATURE_PLACEHOLDER = "@@render-signature@@";
    static final String HMAC = "HmacSHA256";
    static final String SIGNED_SEPARATOR = "\n";
    /** HMAC-SHA256 in lower-case hex: 64 digits. */
    static final String SIGNATURE_FORMAT = "[0-9a-f]{64}";
    static final String NOT_A_JPEG_MESSAGE = "Renderer did not return a JPEG";
    /** The client's declared decoder limit, {@code MarketplaceRenderClient.java:22}. */
    static final int DECLARED_LIMIT = 2 * 1024 * 1024;
    static final byte[] JPEG_MARKER = {(byte) 0xFF, (byte) 0xD8};
    static final byte[] JPEG = concat(JPEG_MARKER, "MarketplaceRenderContractTest.jpeg".getBytes(StandardCharsets.UTF_8));
    static final byte[] NOT_A_JPEG = "MarketplaceRenderContractTest.png".getBytes(StandardCharsets.UTF_8);
    static final Duration TIMEOUT = Duration.ofSeconds(10);
    static final int OK = 200;
    /** The payload's keys, in an order that is not sorted: the order the snapshot must not keep. */
    static final String ORG_COMMON_SETTINGS = "orgCommonSettings";
    static final String MODULE_DSL = "moduleDSL";
    static final String APPLICATION_DSL = "applicationDSL";
    static final String MODULE_ID = "MarketplaceRenderContractTest.module";
    static final String THEME_MEMBER = "theme";
    static final String THEME = "MarketplaceRenderContractTest.theme";
    static final String LAYOUT_MEMBER = "layout";
    static final String LAYOUT = "MarketplaceRenderContractTest.layout";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private WireMockRuntimeInfo wireMock;
    private MarketplaceRenderClient client;

    @BeforeEach
    void harness(WireMockRuntimeInfo wireMock) {
        this.wireMock = wireMock;
        wireMock.getWireMock().resetMappings();
        wireMock.getWireMock().resetRequests();
        CommonConfig config = Mockito.mock(CommonConfig.class);
        CommonConfig.JsExecutor executor = new CommonConfig.JsExecutor();
        executor.setPassword(PASSWORD);
        Mockito.when(config.getJsExecutor()).thenReturn(executor);
        NodeServerHelper nodeServer = Mockito.mock(NodeServerHelper.class);
        Mockito.when(nodeServer.createUri(RENDER_PATH)).thenReturn(URI.create(wireMock.getHttpBaseUrl() + WIREMOCK_RENDER_PATH));
        client = new MarketplaceRenderClient(config, nodeServer);
    }

    /**
     * A payload whose top-level keys are not sorted ({@value #ORG_COMMON_SETTINGS}, {@value #MODULE_DSL},
     * {@value #APPLICATION_DSL}) and whose module map is not either, with the §4.6 representative input through
     * {@code staticDsl} as the application DSL, as the worker builds it ({@code MarketplacePreviewWorker.java:104-106}):
     * the snapshot's text has every key sorted ({@code :34}), and its hash is SHA-256 of the render version and that
     * text ({@code :116-117}); both pinned as strings, so a change of order changes the comparison.
     */
    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/application/marketplace/MarketplacePreviewWorker.java#MarketplacePreviewWorker.JSON#new ObjectMapper#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/application/marketplace/MarketplacePreviewWorker.java#MarketplacePreviewWorker.snapshotOf#writeValueAsString#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/application/marketplace/MarketplacePreviewWorker.java#<file>#import#1"})
    @Test
    void snapshotWrittenWithSortedKeys() throws JsonProcessingException {
        Map<String, Object> modules = new LinkedHashMap<>();
        modules.put(MODULE_ID, Map.of(LAYOUT_MEMBER, LAYOUT));
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put(THEME_MEMBER, THEME);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put(ORG_COMMON_SETTINGS, settings);
        payload.put(MODULE_DSL, modules);
        payload.put(APPLICATION_DSL, MarketplacePreviewWorker.staticDsl(
                PayloadAssertions.FIXTURE_EDITOR.readValue(PayloadSamples.representativeInputText(), Map.class)));
        MarketplacePreviewWorker.Snapshot snapshot = MarketplacePreviewWorker.snapshotOf(payload);
        System.out.println("[MarketplaceRenderContractTest] snapshot hash " + snapshot.hash() + " text " + snapshot.json());
        ObjectNode pinned = PayloadAssertions.FIXTURE_EDITOR.createObjectNode().put(HASH_MEMBER, snapshot.hash()).put(TEXT_MEMBER, snapshot.json());
        GOLDEN.assertJson(SNAPSHOT, PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(pinned));
        List<String> topLevel = new ArrayList<>();
        PayloadAssertions.FIXTURE_EDITOR.readTree(snapshot.json()).fieldNames().forEachRemaining(topLevel::add);
        assertThat(topLevel).as("top-level keys of the snapshot").isSorted();
    }

    /**
     * {@code render} posts {@code {timestamp, payload, signature}} ({@code MarketplaceRenderClient.java:41}): the
     * timestamp a time of the call, read when {@code block} subscribes ({@code :29-31}); the signature the HMAC this test
     * recomputes; the body pinned with both replaced, compared member order aside ({@code CanonicalJson}), since the
     * client writes a {@code Map.of}. The client answers the bytes the renderer sent.
     */
    @BoundarySites("lowcoder-server/src/main/java/org/lowcoder/api/application/marketplace/MarketplaceRenderClient.java#MarketplaceRenderClient.render#bodyValue#1")
    @Test
    void renderRequestBody() throws JsonProcessingException, GeneralSecurityException {
        rendererAnswers(JPEG);
        long before = System.currentTimeMillis();
        byte[] rendered = client.render(PAYLOAD).block(TIMEOUT);
        long after = System.currentTimeMillis();
        LoggedRequest request = receivedRequest();
        ObjectNode body = (ObjectNode) PayloadAssertions.FIXTURE_EDITOR.readTree(request.getBodyAsString());
        List<String> members = new ArrayList<>();
        body.fieldNames().forEachRemaining(members::add);
        assertThat(members).as("members of the render body").containsExactlyInAnyOrder(TIMESTAMP_MEMBER, PAYLOAD_MEMBER, SIGNATURE_MEMBER);
        JsonNode timestamp = body.get(TIMESTAMP_MEMBER);
        assertThat(timestamp.isIntegralNumber()).as("timestamp is an integral number: " + timestamp).isTrue();
        assertThat(timestamp.asLong()).as("timestamp, a time of the call").isBetween(before, after);
        String signature = body.get(SIGNATURE_MEMBER).asText();
        assertThat(signature).as("signature").matches(SIGNATURE_FORMAT);
        String expected = hmac(timestamp.asLong() + SIGNED_SEPARATOR + body.get(PAYLOAD_MEMBER).asText());
        System.out.println("[MarketplaceRenderContractTest] recomputed signature " + expected);
        assertThat(signature).as("signature, recomputed").isEqualTo(expected);
        body.put(TIMESTAMP_MEMBER, TIMESTAMP_PLACEHOLDER).put(SIGNATURE_MEMBER, SIGNATURE_PLACEHOLDER);
        GOLDEN.assertJson(RENDER_BODY, PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(body));
        System.out.println("[MarketplaceRenderContractTest] render returned " + describe(rendered));
        assertThat(rendered).as("bytes render returned").isEqualTo(JPEG);
    }

    /** An answer without the JPEG marker: the {@code IllegalStateException} built at {@code MarketplaceRenderClient.java:44}. */
    @Test
    void renderRejectsANonJpegAnswer() {
        rendererAnswers(NOT_A_JPEG);
        StepVerifier.create(client.render(PAYLOAD))
                .expectErrorSatisfies(error -> {
                    System.out.println("[MarketplaceRenderContractTest] render failed with " + error);
                    assertThat(error).isExactlyInstanceOf(IllegalStateException.class).hasMessage(NOT_A_JPEG_MESSAGE);
                })
                .verify(TIMEOUT);
        receivedRequest();
    }

    /**
     * The renderer answers a JPEG of exactly the declared limit, 2 MiB (above Spring's 256 KiB default): {@code render}
     * returns all of it; one byte more: {@code render} fails with a {@link DataBufferLimitException} in its cause chain.
     * The limit in effect is observed, not read from the client's configuration.
     */
    @BoundarySites("lowcoder-server/src/main/java/org/lowcoder/api/application/marketplace/MarketplaceRenderClient.java#MarketplaceRenderClient.client#codecs#1")
    @ParameterizedTest(name = "{0} bytes")
    @ValueSource(ints = {DECLARED_LIMIT, DECLARED_LIMIT + 1})
    void renderEnforcesItsDeclaredLimit(int size) {
        byte[] answer = Arrays.copyOf(JPEG_MARKER, size);
        rendererAnswers(answer);
        if (size <= DECLARED_LIMIT) {
            byte[] rendered = client.render(PAYLOAD).block(TIMEOUT);
            System.out.println("[MarketplaceRenderContractTest] render returned " + describe(rendered));
            assertThat(rendered).as("bytes render returned").isEqualTo(answer);
        } else {
            StepVerifier.create(client.render(PAYLOAD))
                    .expectErrorSatisfies(error -> {
                        System.out.println("[MarketplaceRenderContractTest] render failed with " + error);
                        assertThat(causes(error)).as("cause chain of " + error).anyMatch(DataBufferLimitException.class::isInstance);
                    })
                    .verify(TIMEOUT);
        }
    }

    private void rendererAnswers(byte[] body) {
        wireMock.getWireMock().register(post(urlPathEqualTo(WIREMOCK_RENDER_PATH)).willReturn(aResponse().withStatus(OK)
                .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_JPEG_VALUE).withBody(body)));
    }

    /** The one request the renderer received, printed. */
    private LoggedRequest receivedRequest() {
        List<LoggedRequest> requests = wireMock.getWireMock().find(postRequestedFor(urlPathEqualTo(WIREMOCK_RENDER_PATH)));
        assertThat(requests).as("render requests").hasSize(1);
        LoggedRequest request = requests.get(0);
        System.out.println("[MarketplaceRenderContractTest] renderer received " + request.getMethod() + " " + request.getUrl() + " "
                + request.getHeader(HttpHeaders.CONTENT_TYPE) + " " + request.getBodyAsString());
        return request;
    }

    /** HMAC-SHA256 of {@code text} with {@link #PASSWORD}, in lower-case hex. */
    private static String hmac(String text) throws GeneralSecurityException {
        Mac mac = Mac.getInstance(HMAC);
        mac.init(new SecretKeySpec(PASSWORD.getBytes(StandardCharsets.UTF_8), HMAC));
        return HexFormat.of().formatHex(mac.doFinal(text.getBytes(StandardCharsets.UTF_8)));
    }

    private static List<Throwable> causes(Throwable error) {
        List<Throwable> chain = new ArrayList<>();
        for (Throwable cause = error; cause != null && !chain.contains(cause); cause = cause.getCause()) {
            chain.add(cause);
        }
        return chain;
    }

    /** A body as its length and its first two bytes in hex, never the raw bytes. */
    private static String describe(byte[] body) {
        if (body == null) {
            return "no body";
        }
        return body.length + " bytes, starting " + HexFormat.of().formatHex(Arrays.copyOf(body, Math.min(JPEG_MARKER.length, body.length)));
    }

    private static byte[] concat(byte[] first, byte[] second) {
        byte[] bytes = Arrays.copyOf(first, first.length + second.length);
        System.arraycopy(second, 0, bytes, first.length, second.length);
        return bytes;
    }
}
