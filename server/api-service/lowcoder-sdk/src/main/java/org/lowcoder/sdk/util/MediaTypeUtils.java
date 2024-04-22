package org.lowcoder.sdk.util;

import com.google.common.base.Preconditions;
import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.MediaType;

import static org.springframework.http.MediaType.*;

public class MediaTypeUtils {

    @Nonnull
    @SuppressWarnings("ConstantConditions")
    public static MediaType parse(String filename) {
        return parse(filename, APPLICATION_OCTET_STREAM);
    }

    @Nullable
    public static MediaType parse(String filename, @Nullable MediaType defaultContentType) {
        Preconditions.checkArgument(StringUtils.isNotBlank(filename));
        String[] split = filename.split("\\.");
        return getMediaType(split[split.length - 1], defaultContentType);
    }

    @Nonnull
    @SuppressWarnings("ConstantConditions")
    public static MediaType getMediaType(String fileType) {
        return getMediaType(fileType, APPLICATION_OCTET_STREAM);
    }

    @Nullable
    public static MediaType getMediaType(String fileType, @Nullable MediaType defaultContentType) {
        return switch (fileType) {
            case "jpg", "jpeg" -> IMAGE_JPEG;
            case "gif" -> IMAGE_GIF;
            case "png" -> IMAGE_PNG;
            case "pdf" -> APPLICATION_PDF;
            case "svg" -> new MediaType("image", "svg+xml");
            default -> defaultContentType;
        };
    }
}
