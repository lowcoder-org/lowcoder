package org.lowcoder.domain.asset.service;

import lombok.extern.slf4j.Slf4j;
import org.lowcoder.domain.asset.model.Asset;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Set;

@Slf4j
@Service
public class AssetServiceImpl implements AssetService {

    private static final Set<MediaType> ALLOWED_CONTENT_TYPES = Set.of(MediaType.IMAGE_JPEG, MediaType.IMAGE_PNG);

    private final AssetRepository repository;
    private final Conf<Integer> thumbNailPhotoDimension;

    @Autowired
    public AssetServiceImpl(AssetRepository repository,
            ConfigCenter configCenter) {
        this.repository = repository;
        thumbNailPhotoDimension = configCenter.asset().ofInteger("thumbNailPhotoDimension", 128);
    }

    @Override
    public Mono<Asset> getById(String id) {
        return repository.findById(id);
    }

    // Falk TODO: Enable base64 upload

    @Override
    public Mono<Asset> upload(Part filePart, int maxFileSizeKB, boolean isThumbnail) {
        if (filePart == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "FILE_EMPTY"));
        }

        // The reason we restrict file types here is to avoid having to deal with dangerous image types such as SVG,
        // which can have arbitrary HTML/JS inside of them.
        final MediaType contentType = filePart.headers().getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INCORRECT_IMAGE_TYPE"));
        }

        final Flux<DataBuffer> contentCache = filePart.content().cache();

        return contentCache.count()
                .defaultIfEmpty(0L)
                .flatMap(count -> {
                    // Default implementation for the BufferFactory used breaks down the FilePart into chunks of 4KB.
                    // So we multiply the count of chunks with 4 to get an estimate on the file size in KB.
                    if (4 * count > maxFileSizeKB) {
                        return Mono.error(new BizException(BizError.PAYLOAD_TOO_LARGE, "PAYLOAD_TOO_LARGE", maxFileSizeKB));
                    }
                    return DataBufferUtils.join(contentCache);
                })
                .flatMap(dataBuffer -> {
                    try {
                        return repository.save(createAsset(dataBuffer, contentType, isThumbnail));
                    } catch (IOException e) {
                        log.error("failed to upload image", e);
                        return Mono.error(new BizException(BizError.INVALID_PARAMETER, "IMAGE_PARSE_ERROR"));
                    }
                });
    }

    @Override
    public Mono<Void> remove(String assetId) {
        return repository.deleteById(assetId)
                .then();
    }

    private Asset createAsset(DataBuffer dataBuffer, MediaType srcContentType, boolean createThumbnail) throws IOException {
        byte[] imageData;
        MediaType contentType;

        try {
            if (createThumbnail) {
                imageData = resizeImage(dataBuffer);
                contentType = MediaType.IMAGE_JPEG;
            } else {
                imageData = new byte[dataBuffer.readableByteCount()];
                dataBuffer.read(imageData);
                contentType = srcContentType;
            }
        } finally {
            // BF-128: released on every path; a failed thumbnail (bytes that are no image) used to keep it
            DataBufferUtils.release(dataBuffer);
        }
        return Asset.from(contentType, imageData);
    }

    /** The IOException text for content that no ImageIO reader recognises; the caller answers IMAGE_PARSE_ERROR. */
    private static final String NOT_AN_IMAGE = "the content is not an image ImageIO can read";

    private byte[] resizeImage(DataBuffer dataBuffer) throws IOException {
        int dimension = thumbNailPhotoDimension.get();
        BufferedImage bufferedImage = ImageIO.read(dataBuffer.asInputStream());
        if (bufferedImage == null) {
            // BF-128: ImageIO.read answers null, not an exception, for bytes no reader recognises (a NullPointerException below)
            throw new IOException(NOT_AN_IMAGE);
        }
        Image scaledImage = bufferedImage.getScaledInstance(dimension, dimension, Image.SCALE_SMOOTH);
        BufferedImage imageBuff = new BufferedImage(dimension, dimension, BufferedImage.TYPE_INT_RGB);
        imageBuff.getGraphics().drawImage(scaledImage, 0, 0, new Color(0, 0, 0), null);
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        ImageIO.write(imageBuff, "jpg", buffer);
        byte[] data = buffer.toByteArray();
        buffer.close();
        return data;
    }

    /**
     * Writes the asset's bytes with status 200 and its content type, or, for an id no asset has, completes the response
     * with status 404 and no body (BF-129: the response used to be left untouched, so the framework answered 200 with an
     * empty body). The 404 is decided before the write, because the write itself completes empty.
     */
    @Override
    public Mono<Void> makeImageResponse(ServerWebExchange exchange, String assetId) {
        return getById(assetId)
                .switchIfEmpty(Mono.defer(() -> notFound(exchange.getResponse())))
                .flatMap(asset -> {
                    final String contentType = asset.getContentType();
                    final ServerHttpResponse response = exchange.getResponse();

                    response.setStatusCode(HttpStatus.OK);

                    if (contentType != null) {
                        response.getHeaders().set(HttpHeaders.CONTENT_TYPE, contentType);
                    }

                    return response.writeWith(Mono.just(new DefaultDataBufferFactory().wrap(asset.getData())));
                });
    }

    /** Completes {@code response} with status 404 and no body; empty, so the image write that follows is skipped. */
    private static Mono<Asset> notFound(ServerHttpResponse response) {
        response.setStatusCode(HttpStatus.NOT_FOUND);
        return response.setComplete().then(Mono.empty());
    }

}
