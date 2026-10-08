package org.lowcoder.sdk.util;

import com.google.common.base.Preconditions;
import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.MediaType;

import java.util.Locale;

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

    /**
     * The media type of a file extension, in any case (BF-141: {@code PNG} or {@code Jpeg} got the default, so an
     * upper-case material was served as application/octet-stream). The extension is lower-cased with {@link Locale#ROOT},
     * so a Turkish default locale does not turn {@code GIF} into {@code gıf}.
     */
    @Nullable
    public static MediaType getMediaType(String fileType, @Nullable MediaType defaultContentType) {
        return switch (fileType.toLowerCase(Locale.ROOT)) {
            case "jpg", "jpeg" -> IMAGE_JPEG;
            case "gif" -> IMAGE_GIF;
            case "png" -> IMAGE_PNG;
            case "pdf" -> APPLICATION_PDF;
            case "svg" -> new MediaType("image", "svg+xml");
            default -> defaultContentType;
        };
    }
}
