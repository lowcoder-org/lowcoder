package org.lowcoder.domain.asset.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.domain.asset.model.Asset;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.config.dynamic.ConfigInstance;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.http.codec.multipart.Part;
import org.springframework.http.server.reactive.HttpHandler;
import org.springframework.http.server.reactive.ReactorHttpHandlerAdapter;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.server.HandlerStrategies;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;
import org.springframework.web.server.adapter.WebHttpHandlerBuilder;

import reactor.core.publisher.Mono;
import reactor.netty.DisposableServer;
import reactor.netty.http.server.HttpServer;

/**
 * BF-150: {@link AssetServiceImpl#upload} behind a real multipart upload. A Reactor Netty server on a loopback port reads
 * the request with the exchange's multipart reader, whose codecs are configured like
 * {@code CustomWebFluxConfiguration.configureHttpMessageCodecs} (max in-memory size {@value #CODEC_MAX_IN_MEMORY_BYTES} bytes),
 * and hands the {@code file} part to the service with the logo and avatar limit ({@value #LIMIT_KB} KB, the default of
 * {@code logoMaxSizeInKb} and {@code avatarMaxSizeInKb}, and the client's own check in {@code util/fileUtils.ts}). It prints
 * how many buffers the part arrived in, which is what the old check counted (× 4 KB).
 *
 * <p>Measured with this setup (spring-web 6.1.5, reactor-netty-http 1.1.17): every part up to {@value #CODEC_MAX_IN_MEMORY_BYTES}
 * bytes arrived as one buffer, so the old check estimated 4 KB and accepted a 20 MB file; one byte more arrived in 1024-byte
 * buffers. With Spring's default in-memory size (256 KiB, codecs not applied to the exchange) the switch came at 262145 bytes,
 * and a 300 KB file within the limit was rejected. Not covered: the controllers and the real Spring Boot context, whose codec
 * configuration this test copies rather than loads.
 */
class AssetServiceImplMultipartUploadTest {

    private static final int LIMIT_KB = 300;
    private static final int LIMIT_BYTES = LIMIT_KB * 1024;
    private static final int CODEC_MAX_IN_MEMORY_BYTES = 20 * 1024 * 1024;
    private static final String FILE_PART = "file";
    private static final String UPLOAD_PATH = "/upload";
    private static final String ACCEPTED = "accepted";
    private static final Duration TIMEOUT = Duration.ofSeconds(30);

    private final AssetRepository repository = mock(AssetRepository.class);
    private final List<Integer> chunkSizes = new CopyOnWriteArrayList<>();
    private AssetServiceImpl service;
    private DisposableServer server;
    private WebClient client;

    @BeforeEach
    void startServer() {
        ConfigCenter center = mock(ConfigCenter.class);
        ConfigInstance asset = mock(ConfigInstance.class);
        Conf<Integer> dimension = new AtomicInteger(128)::get;
        when(center.asset()).thenReturn(asset);
        when(asset.ofInteger("thumbNailPhotoDimension", 128)).thenReturn(dimension);
        when(repository.save(any(Asset.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        service = new AssetServiceImpl(repository, center);

        // configured like CustomWebFluxConfiguration.configureHttpMessageCodecs; the exchange reads the multipart body with it
        ServerCodecConfigurer codecs = ServerCodecConfigurer.create();
        codecs.defaultCodecs().maxInMemorySize(CODEC_MAX_IN_MEMORY_BYTES);
        HandlerStrategies strategies = HandlerStrategies.builder().codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(CODEC_MAX_IN_MEMORY_BYTES)).build();
        HttpHandler handler = WebHttpHandlerBuilder.webHandler(RouterFunctions.toWebHandler(RouterFunctions.route()
                .POST(UPLOAD_PATH, request -> request.multipartData()
                        .map(parts -> recording(parts.getFirst(FILE_PART)))
                        .flatMap(part -> service.upload(part, LIMIT_KB, false))
                        .flatMap(saved -> ServerResponse.ok().bodyValue(ACCEPTED + " " + saved.getData().length))
                        .onErrorResume(BizException.class, e -> ServerResponse.status(e.getHttpStatus()).bodyValue(e.getError() + " " + e.getMessageKey())))
                .build(), strategies)).codecConfigurer(codecs).build();
        server = HttpServer.create().host("127.0.0.1").port(0).handle(new ReactorHttpHandlerAdapter(handler)).bindNow();
        client = WebClient.builder().baseUrl("http://127.0.0.1:" + server.port()).build();
    }

    @AfterEach
    void stopServer() {
        server.disposeNow();
    }

    /** The part as the service sees it, with every chunk's size recorded on the way. */
    private Part recording(Part part) {
        Part probe = mock(Part.class);
        when(probe.headers()).thenReturn(part.headers());
        when(probe.content()).thenReturn(part.content().doOnNext(buffer -> chunkSizes.add(buffer.readableByteCount())));
        return probe;
    }

    private String upload(int bytes) {
        MultipartBodyBuilder body = new MultipartBodyBuilder();
        body.part(FILE_PART, new ByteArrayResource(new byte[bytes]) {
            @Override
            public String getFilename() {
                return "logo.png";
            }
        }).contentType(MediaType.IMAGE_PNG);
        return client.post().uri(UPLOAD_PATH)
                .body(BodyInserters.fromMultipartData(body.build()))
                .exchangeToMono(response -> response.bodyToMono(String.class))
                .block(TIMEOUT);
    }

    private void report(int bytes, String answer) {
        int received = chunkSizes.stream().mapToInt(Integer::intValue).sum();
        System.out.println("[AssetServiceImplMultipartUploadTest] " + bytes + " bytes uploaded with a " + LIMIT_KB + " KB limit: "
                + chunkSizes.size() + " chunks (" + received + " bytes, largest " + chunkSizes.stream().mapToInt(Integer::intValue).max().orElse(0)
                + "), old estimate " + 4 * chunkSizes.size() + " KB, answer: " + answer);
    }

    /** Catches: a file over the limit accepted because it arrived in few, large chunks (BF-150: the old check counted chunks × 4 KB). */
    @ParameterizedTest(name = "{0} bytes are rejected")
    @ValueSource(ints = {LIMIT_BYTES + 1, 2 * LIMIT_BYTES, 4 * LIMIT_BYTES})
    void aFileOverTheLimitIsRejectedWhateverItsChunks(int bytes) {
        String answer = upload(bytes);
        report(bytes, answer);
        assertThat(answer).isEqualTo(BizError.PAYLOAD_TOO_LARGE + " PAYLOAD_TOO_LARGE");
    }

    /** Catches: a file within the limit rejected because it arrived in many, small chunks; the limit itself is allowed. */
    @ParameterizedTest(name = "{0} bytes are accepted")
    @ValueSource(ints = {1, LIMIT_BYTES / 2, LIMIT_BYTES})
    void aFileWithinTheLimitIsAcceptedWhole(int bytes) {
        String answer = upload(bytes);
        report(bytes, answer);
        assertThat(answer).isEqualTo(ACCEPTED + " " + bytes);
    }
}
