package org.lowcoder.domain.asset.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Iterator;
import java.util.concurrent.atomic.AtomicInteger;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.domain.asset.model.Asset;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.config.dynamic.ConfigInstance;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * AssetServiceImpl (unit U13, task L3-10): upload validation, size estimate, thumbnails with real ImageIO, and the
 * image response. The repository is a mock whose save echoes the asset.
 */
class AssetServiceImplTest {

    private static final int DEFAULT_DIMENSION = 128;
    private static final int SMALL_DIMENSION = 32;
    private static final int CHUNK_KB = 4;
    private static final int CHUNK_BYTES = CHUNK_KB * 1024;
    private static final int MAX_KB = 4;
    private static final Duration TIMEOUT = Duration.ofSeconds(10);
    private static final String ASSET_ID = "asset-1";
    private static final String IMAGE_PARSE_ERROR = "IMAGE_PARSE_ERROR";
    private static final byte[] NOT_AN_IMAGE = "<html><script>alert(1)</script></html>".getBytes(StandardCharsets.UTF_8);

    private final AssetRepository repository = mock(AssetRepository.class);
    private final AtomicInteger dimension = new AtomicInteger(DEFAULT_DIMENSION);
    private final AssetServiceImpl service = newService(repository, dimension);
    private final DefaultDataBufferFactory buffers = new DefaultDataBufferFactory();

    private static AssetServiceImpl newService(AssetRepository repository, AtomicInteger dimension) {
        ConfigCenter center = mock(ConfigCenter.class);
        ConfigInstance asset = mock(ConfigInstance.class);
        Conf<Integer> conf = dimension::get;
        when(center.asset()).thenReturn(asset);
        when(asset.ofInteger("thumbNailPhotoDimension", DEFAULT_DIMENSION)).thenReturn(conf);
        when(repository.save(any(Asset.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        return new AssetServiceImpl(repository, center);
    }

    private Part part(MediaType type, DataBuffer... content) {
        Part part = mock(Part.class);
        HttpHeaders headers = new HttpHeaders();
        if (type != null) {
            headers.setContentType(type);
        }
        when(part.headers()).thenReturn(headers);
        when(part.content()).thenReturn(Flux.just(content));
        return part;
    }

    private DataBuffer buffer(byte[] bytes) {
        return buffers.wrap(bytes);
    }

    private DataBuffer buffer(int size) {
        return buffers.wrap(new byte[size]);
    }

    private static byte[] image(String format, int width, int height, int type, Color fill) throws Exception {
        BufferedImage image = new BufferedImage(width, height, type);
        java.awt.Graphics2D graphics = image.createGraphics();
        if (fill != null) {
            graphics.setColor(fill);
            graphics.fillRect(0, 0, width, height);
        }
        graphics.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, format, out);
        return out.toByteArray();
    }

    private static byte[] png(int width, int height) throws Exception {
        return image("png", width, height, BufferedImage.TYPE_INT_RGB, Color.RED);
    }

    private static byte[] jpeg(int width, int height) throws Exception {
        return image("jpg", width, height, BufferedImage.TYPE_INT_RGB, Color.BLUE);
    }

    private static void assertBizError(Throwable error, BizError expected, String messageKey) {
        assertThat(error).isInstanceOf(BizException.class);
        BizException biz = (BizException) error;
        System.out.println("[AssetServiceImplTest] error " + biz.getError() + " / " + biz.getMessageKey());
        assertThat(biz.getError()).isEqualTo(expected);
        assertThat(biz.getMessageKey()).isEqualTo(messageKey);
    }

    private Asset uploaded(Part part, int maxKb, boolean thumbnail) {
        return service.upload(part, maxKb, thumbnail).block(TIMEOUT);
    }

    private static String formatOf(byte[] data) throws Exception {
        try (ImageInputStream stream = ImageIO.createImageInputStream(new ByteArrayInputStream(data))) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(stream);
            return readers.next().getFormatName();
        }
    }

    // ---------------------------------------------------------------- validation

    /** Catches: a missing part causing an NPE instead of a clean FILE_EMPTY error. */
    @Test
    void aNullPartIsFileEmptyAndNothingIsSaved() {
        StepVerifier.create(service.upload(null, MAX_KB, false))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.INVALID_PARAMETER, "FILE_EMPTY"))
                .verify(TIMEOUT);
        verify(repository, never()).save(any());
    }

    /** Catches: an SVG or HTML upload being accepted (stored XSS, the reason for the allow-list at :59-60). */
    @ParameterizedTest(name = "{0} is rejected")
    @ValueSource(strings = {"image/svg+xml", "image/gif", "text/html", "application/octet-stream"})
    void onlyJpegAndPngAreAccepted(String rejected) {
        Part part = part(MediaType.parseMediaType(rejected), buffer(10));
        StepVerifier.create(service.upload(part, MAX_KB, false))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.INVALID_PARAMETER, "INCORRECT_IMAGE_TYPE"))
                .verify(TIMEOUT);
        verify(part, never()).content();
        verify(repository, never()).save(any());
    }

    @Test
    void aMissingContentTypeIsRejectedWithoutReadingTheContent() {
        Part part = part(null, buffer(10));
        StepVerifier.create(service.upload(part, MAX_KB, false))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.INVALID_PARAMETER, "INCORRECT_IMAGE_TYPE"))
                .verify(TIMEOUT);
        verify(part, never()).content();
    }

    // ---------------------------------------------------------------- size estimate (chunk count)

    /** Catches: an off-by-one or a lost multiplier in the size limit: 2 chunks are 8 KB, 1 chunk is exactly the limit. */
    @Test
    void sizeLimitComparesChunkCountTimesFourKbWithTheLimit() {
        Part tooBig = part(MediaType.IMAGE_PNG, buffer(CHUNK_BYTES), buffer(CHUNK_BYTES));
        StepVerifier.create(service.upload(tooBig, MAX_KB, false))
                .expectErrorSatisfies(e -> {
                    assertBizError(e, BizError.PAYLOAD_TOO_LARGE, "PAYLOAD_TOO_LARGE");
                    assertThat(((BizException) e).getArgs()).containsExactly(MAX_KB);
                })
                .verify(TIMEOUT);
        verify(repository, never()).save(any());

        Part atLimit = part(MediaType.IMAGE_PNG, buffer(CHUNK_BYTES));
        assertThat(uploaded(atLimit, MAX_KB, false)).isNotNull();
        System.out.println("[AssetServiceImplTest] 2 chunks rejected, 1 chunk at the limit accepted");
    }

    /**
     * Pins plan section 9 row "upload size limit estimated as chunks x 4 KB (:71-73), not bytes: one large buffer
     * passes, many tiny ones are rejected". Names say "chunk count" on purpose: the real effect depends on the chunk
     * size of the multipart reader. A fix (count bytes) changes this test on purpose.
     */
    @Test
    void pinsTheSection9Row_chunkCountDecidesNotBytes_oneLargeBufferPasses() {
        int oneMegabyte = 1024 * 1024;
        Part large = part(MediaType.IMAGE_PNG, buffer(oneMegabyte));

        Asset saved = uploaded(large, 100, false);
        System.out.println("[AssetServiceImplTest] PINNED: 1 MB in one chunk accepted with a 100 KB limit, saved " + saved.getData().length + " bytes");
        assertThat(saved.getData()).hasSize(oneMegabyte);
    }

    @Test
    void pinsTheSection9Row_chunkCountDecidesNotBytes_manyTinyBuffersAreRejected() {
        DataBuffer[] tiny = new DataBuffer[1000];
        for (int i = 0; i < tiny.length; i++) {
            tiny[i] = buffer(1);
        }
        Part part = part(MediaType.IMAGE_PNG, tiny);

        StepVerifier.create(service.upload(part, 100, false))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.PAYLOAD_TOO_LARGE, "PAYLOAD_TOO_LARGE"))
                .verify(TIMEOUT);
        System.out.println("[AssetServiceImplTest] PINNED: 1000 bytes in 1000 chunks rejected with a 100 KB limit");
    }

    /** Catches: an upload without any content crashing on the missing count or buffer; asserted as observed. */
    @Test
    void anUploadWithoutContentSavesNothing() {
        Part part = part(MediaType.IMAGE_PNG);
        StepVerifier.create(service.upload(part, MAX_KB, false)).verifyComplete();
        verify(repository, never()).save(any());
    }

    // ---------------------------------------------------------------- content handling

    /** Catches: logos being re-encoded or retyped; exactly the uploaded bytes are stored with the declared type. */
    @Test
    void aNonThumbnailUploadKeepsTheBytesAndTheContentType() throws Exception {
        byte[] original = png(40, 20);
        Asset saved = uploaded(part(MediaType.IMAGE_PNG, buffer(original)), MAX_KB, false);

        assertThat(saved.getData()).isEqualTo(original);
        assertThat(saved.getContentType()).isEqualTo(MediaType.IMAGE_PNG_VALUE);
        verify(repository).save(any(Asset.class));
    }

    /**
     * Behaviour first (candidate C): the bytes of a non-thumbnail upload are not checked, only the declared type is.
     * An HTML payload declared as image/png is stored and later served with that content type.
     */
    @Test
    void aNonThumbnailUploadStoresAnyBytesUnderTheDeclaredImageType() {
        Asset saved = uploaded(part(MediaType.IMAGE_PNG, buffer(NOT_AN_IMAGE)), MAX_KB, false);
        System.out.println("[AssetServiceImplTest] stored " + new String(saved.getData(), StandardCharsets.UTF_8) + " as " + saved.getContentType());
        assertThat(saved.getData()).isEqualTo(NOT_AN_IMAGE);
        assertThat(saved.getContentType()).isEqualTo(MediaType.IMAGE_PNG_VALUE);
    }

    // ---------------------------------------------------------------- thumbnails

    /** Catches: a wrong thumbnail format (must be JPEG whatever came in) or size (a square of the configured side). */
    @Test
    void aThumbnailIsAJpegSquareOfTheConfiguredDimensionForPngAndJpegInput() throws Exception {
        byte[][] inputs = {png(300, 100), jpeg(300, 100)};
        MediaType[] types = {MediaType.IMAGE_PNG, MediaType.IMAGE_JPEG};
        for (int i = 0; i < inputs.length; i++) {
            Asset saved = uploaded(part(types[i], buffer(inputs[i])), 1024, true);
            BufferedImage decoded = ImageIO.read(new ByteArrayInputStream(saved.getData()));
            System.out.println("[AssetServiceImplTest] thumbnail of " + types[i] + ": " + decoded.getWidth() + "x"
                    + decoded.getHeight() + " " + saved.getContentType());
            assertThat(saved.getContentType()).isEqualTo(MediaType.IMAGE_JPEG_VALUE);
            assertThat(formatOf(saved.getData())).isEqualToIgnoringCase("JPEG");
            assertThat(decoded.getWidth()).isEqualTo(DEFAULT_DIMENSION);
            assertThat(decoded.getHeight()).isEqualTo(DEFAULT_DIMENSION);
        }

        dimension.set(SMALL_DIMENSION);
        Asset small = uploaded(part(MediaType.IMAGE_PNG, buffer(png(300, 100))), 1024, true);
        BufferedImage decoded = ImageIO.read(new ByteArrayInputStream(small.getData()));
        assertThat(decoded.getWidth()).isEqualTo(SMALL_DIMENSION);
        assertThat(decoded.getHeight()).isEqualTo(SMALL_DIMENSION);
    }

    /** Observation as behaviour: fully transparent pixels become black in the thumbnail (background Color(0,0,0)). */
    @Test
    void transparentPixelsOfAThumbnailBecomeBlack() throws Exception {
        byte[] transparent = image("png", 64, 64, BufferedImage.TYPE_INT_ARGB, null);
        Asset saved = uploaded(part(MediaType.IMAGE_PNG, buffer(transparent)), 1024, true);

        int rgb = ImageIO.read(new ByteArrayInputStream(saved.getData())).getRGB(10, 10);
        System.out.println("[AssetServiceImplTest] transparent pixel became rgb=" + Integer.toHexString(rgb & 0xFFFFFF));
        assertThat((rgb >> 16) & 0xFF).isLessThan(10);
        assertThat((rgb >> 8) & 0xFF).isLessThan(10);
        assertThat(rgb & 0xFF).isLessThan(10);
    }

    /**
     * BF-128: a thumbnail of bytes that are no image, declared as png or jpeg, failed with a NullPointerException
     * ({@code ImageIO.read} answers null; the upload's catch handles IOException only). Reachable through the avatar upload,
     * {@code UserServiceImpl:204} (isThumbnail=true). Now the null is an IOException and the upload answers INVALID_PARAMETER
     * / IMAGE_PARSE_ERROR; nothing is saved.
     */
    @Test
    void thumbnailOfNonImageBytesIsImageParseErrorBF128() {
        StepVerifier.create(service.upload(part(MediaType.IMAGE_PNG, buffer(NOT_AN_IMAGE)), 1024, true))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.INVALID_PARAMETER, IMAGE_PARSE_ERROR))
                .verify(TIMEOUT);
        verify(repository, never()).save(any());
    }

    /**
     * BF-128: the joined content buffer is released on every path. With pooled (Netty) buffers, as the server's multipart
     * reader may hand them over, a thumbnail of non-image bytes kept its buffer allocated; a thumbnail and a plain upload
     * of an image release it too, exactly once (a second release would throw).
     */
    @Test
    void theContentBufferIsReleasedOnSuccessAndOnImageParseErrorBF128() throws Exception {
        org.springframework.core.io.buffer.NettyDataBufferFactory pooled =
                new org.springframework.core.io.buffer.NettyDataBufferFactory(io.netty.buffer.PooledByteBufAllocator.DEFAULT);

        org.springframework.core.io.buffer.PooledDataBuffer notAnImage = (org.springframework.core.io.buffer.PooledDataBuffer) pooled.wrap(
                io.netty.buffer.PooledByteBufAllocator.DEFAULT.buffer().writeBytes(NOT_AN_IMAGE));
        StepVerifier.create(service.upload(part(MediaType.IMAGE_PNG, notAnImage), 1024, true))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.INVALID_PARAMETER, IMAGE_PARSE_ERROR))
                .verify(TIMEOUT);
        System.out.println("[AssetServiceImplTest] non-image thumbnail: buffer allocated after the upload = " + notAnImage.isAllocated());
        assertThat(notAnImage.isAllocated()).as("released after IMAGE_PARSE_ERROR").isFalse();

        for (boolean thumbnail : new boolean[] {true, false}) {
            org.springframework.core.io.buffer.PooledDataBuffer image = (org.springframework.core.io.buffer.PooledDataBuffer) pooled.wrap(
                    io.netty.buffer.PooledByteBufAllocator.DEFAULT.buffer().writeBytes(png(8, 8)));
            Asset asset = uploaded(part(MediaType.IMAGE_PNG, image), 1024, thumbnail);
            System.out.println("[AssetServiceImplTest] thumbnail=" + thumbnail + ": buffer allocated after the upload = " + image.isAllocated());
            assertThat(asset).isNotNull();
            assertThat(image.isAllocated()).as("released after the upload, thumbnail=" + thumbnail).isFalse();
        }
    }

    // ---------------------------------------------------------------- repository delegation and response

    @Test
    void getByIdAndRemoveDelegateToTheRepository() {
        Asset asset = Asset.from(MediaType.IMAGE_PNG, new byte[] {1});
        when(repository.findById(ASSET_ID)).thenReturn(Mono.just(asset));
        when(repository.deleteById(ASSET_ID)).thenReturn(Mono.empty());

        StepVerifier.create(service.getById(ASSET_ID)).expectNext(asset).verifyComplete();
        StepVerifier.create(service.remove(ASSET_ID)).verifyComplete();
        verify(repository).deleteById(ASSET_ID);
    }

    /** Catches: a wrong status, content type header or body in the image response. */
    @Test
    void theImageResponseCarriesStatusContentTypeAndTheStoredBytes() {
        byte[] data = "binary-image-bytes".getBytes(StandardCharsets.UTF_8);
        when(repository.findById(ASSET_ID)).thenReturn(Mono.just(Asset.from(MediaType.IMAGE_PNG, data)));
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/assets/" + ASSET_ID));

        StepVerifier.create(service.makeImageResponse(exchange, ASSET_ID)).verifyComplete();

        System.out.println("[AssetServiceImplTest] response " + exchange.getResponse().getStatusCode() + " "
                + exchange.getResponse().getHeaders().getContentType());
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(exchange.getResponse().getHeaders().getFirst(HttpHeaders.CONTENT_TYPE)).isEqualTo(MediaType.IMAGE_PNG_VALUE);
        assertThat(exchange.getResponse().getBodyAsString().block(TIMEOUT)).isEqualTo("binary-image-bytes");
    }

    /** Catches: an NPE for legacy assets stored without a content type; no header is set but the bytes are written. */
    @Test
    void anAssetWithoutContentTypeIsServedWithoutAContentTypeHeader() {
        Asset legacy = Asset.from(null, "x".getBytes(StandardCharsets.UTF_8));
        when(repository.findById(ASSET_ID)).thenReturn(Mono.just(legacy));
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/assets/" + ASSET_ID));

        StepVerifier.create(service.makeImageResponse(exchange, ASSET_ID)).verifyComplete();

        assertThat(exchange.getResponse().getHeaders().containsKey(HttpHeaders.CONTENT_TYPE)).isFalse();
        assertThat(exchange.getResponse().getBodyAsString().block(TIMEOUT)).isEqualTo("x");
    }

    /**
     * Pins plan section 9 row "GET of an unknown asset id answers 200 with an empty body, not 404 (makeImageResponse
     * completes empty; AssetController:21)": nothing is written and no status is set, so the framework answers 200.
     * A fix (switchIfEmpty to a not-found error) changes this test on purpose.
     */
    @Test
    void anUnknownAssetCompletesWithoutWritingAnything_pinsTheSection9Row() {
        when(repository.findById(ASSET_ID)).thenReturn(Mono.empty());
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/assets/" + ASSET_ID));

        StepVerifier.create(service.makeImageResponse(exchange, ASSET_ID)).verifyComplete();

        System.out.println("[AssetServiceImplTest] PINNED: unknown asset, status=" + exchange.getResponse().getStatusCode()
                + " committed=" + exchange.getResponse().isCommitted());
        assertThat(exchange.getResponse().getStatusCode()).isNull();
        assertThat(exchange.getResponse().isCommitted()).isFalse();
        assertThat(exchange.getResponse().getHeaders().containsKey(HttpHeaders.CONTENT_TYPE)).isFalse();
    }
}
