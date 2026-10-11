package org.lowcoder.api.contract;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.framework.exception.ApiPerfHelper;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.util.JsonUtils;
import org.mockito.Mockito;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.RequestPath;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Codec-limit test of docs/API_PAYLOAD_TEST_PLAN.md §4.8 (E7): the server's JSON decoder buffers at most
 * {@link ServerCodecGuardTest#SERVER_MAX_IN_MEMORY_SIZE} bytes of a request body. A DSL {@code Map} body of exactly
 * that size is decoded through the harness's production codecs; one byte more is rejected, today by
 * {@code GlobalExceptionHandler}'s generic handler as {@code INTERNAL_SERVER_ERROR} (HTTP 500, code 5000, plan §9 O12),
 * which the mocked {@code ApiPerfHelper} records. The mapper's own limits are
 * the sdk module's {@code PayloadBoundsTest}; this body stays inside them (strings of {@link #ELEMENT_LENGTH}
 * characters, padded with whitespace to the exact size), so only the codec limit is reached.
 *
 * <p>The body is generated as a stream of data buffers; the largest objects held are the decoder's joined buffer and
 * the parsed list. Runs in every build (owner decision C10-A6). Limits: the configured value itself is
 * {@code ServerCodecGuardTest}'s assertion; client codecs are {@code ClientCodecGuardTest}'s.
 */
class PayloadBoundsTest {

    static final String BOUNDS_URL = "/api/contract-bounds";
    static final String DSL_PATH = BOUNDS_URL + "/dsl";
    static final String DSL_KEY = "dsl";
    static final int ELEMENT_LENGTH = 1000;
    /** {@code {"dsl":[}}, then elements joined by commas, then {@code ]}}. */
    static final byte[] PREFIX = ("{\"" + DSL_KEY + "\":[").getBytes(StandardCharsets.US_ASCII);
    static final byte[] SUFFIX = "]}".getBytes(StandardCharsets.US_ASCII);
    static final byte[] ELEMENT = ("\"" + "a".repeat(ELEMENT_LENGTH) + "\"").getBytes(StandardCharsets.US_ASCII);
    static final byte[] SEPARATOR = ",".getBytes(StandardCharsets.US_ASCII);
    static final byte PADDING = ' ';
    static final String CODE = "code";
    static final String DATA = "data";
    static final String SUCCESS = "success";

    @RestController
    @RequestMapping(BOUNDS_URL)
    public static class BoundsController {

        /** Answers the number of DSL elements decoded. */
        @PostMapping("/dsl")
        public Mono<ResponseView<Integer>> dsl(@RequestBody Map<String, Object> dsl) {
            return Mono.just(ResponseView.success(((List<?>) dsl.get(DSL_KEY)).size()));
        }
    }

    /** A body of {@code elements} DSL elements, padded with whitespace to {@code size} bytes. */
    record Body(int elements, int size) {

        static Body ofSize(int size) {
            int elements = (size - PREFIX.length - SUFFIX.length + SEPARATOR.length) / (ELEMENT.length + SEPARATOR.length);
            return new Body(elements, size);
        }

        Flux<DataBuffer> stream() {
            int content = PREFIX.length + elements * ELEMENT.length + (elements - 1) * SEPARATOR.length + SUFFIX.length;
            byte[] padding = new byte[size - content];
            Arrays.fill(padding, PADDING);
            Flux<byte[]> parts = Flux.concat(Flux.just(PREFIX),
                    Flux.range(0, elements).concatMap(i -> i == 0 ? Flux.just(ELEMENT) : Flux.just(SEPARATOR, ELEMENT)),
                    Flux.just(SUFFIX, padding));
            return parts.map(DefaultDataBufferFactory.sharedInstance::wrap);
        }
    }

    @Test
    void codecLimitBodyOfExactlyMaxInMemorySizeIsDecoded() throws IOException {
        Body body = Body.ofSize(ServerCodecGuardTest.SERVER_MAX_IN_MEMORY_SIZE);
        try (ContractTestClient client = client()) {
            JsonNode response = post(client, body, HttpStatus.OK);
            assertThat(response.path(CODE).intValue()).isEqualTo(ResponseView.SUCCESS);
            assertThat(response.path(DATA).intValue()).as("decoded DSL elements").isEqualTo(body.elements());
            Mockito.verifyNoInteractions(client.bean(ApiPerfHelper.class));
        }
    }

    @Test
    void codecLimitBodyOneByteOverMaxInMemorySizeIsRejected() throws IOException {
        Body body = Body.ofSize(ServerCodecGuardTest.SERVER_MAX_IN_MEMORY_SIZE + 1);
        BizError error = BizError.INTERNAL_SERVER_ERROR;
        try (ContractTestClient client = client()) {
            JsonNode response = post(client, body, HttpStatus.valueOf(error.getHttpErrorCode()));
            assertThat(response.path(CODE).intValue()).isEqualTo(error.getBizErrorCode());
            assertThat(response.path(SUCCESS).booleanValue()).isFalse();
            Mockito.verify(client.bean(ApiPerfHelper.class))
                    .perf(Mockito.eq(error), Mockito.argThat((RequestPath path) -> path.value().equals(DSL_PATH)));
        }
    }

    private static ContractTestClient client() {
        return ContractTestClient.builder().controller(BoundsController.class).build();
    }

    private static JsonNode post(ContractTestClient client, Body body, HttpStatus status) throws IOException {
        long start = System.nanoTime();
        EntityExchangeResult<byte[]> result = client.web().post().uri(DSL_PATH).contentType(MediaType.APPLICATION_JSON)
                .body(body.stream(), DataBuffer.class).exchange().expectBody().returnResult();
        String text = new String(result.getResponseBody(), StandardCharsets.UTF_8);
        System.out.println("[PayloadBoundsTest] body of " + body.size() + " bytes (" + body.elements() + " elements) -> "
                + result.getStatus().value() + " " + text + " in " + (System.nanoTime() - start) / 1_000_000 + " ms");
        assertThat(result.getStatus().value()).isEqualTo(status.value());
        return JsonUtils.getObjectMapper().readTree(text);
    }
}
