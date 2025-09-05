package org.lowcoder.api.application;

import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.time.Duration;
import java.util.Base64;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Serves per-application icons and PWA manifest.
 */
@RequiredArgsConstructor
@RestController
@RequestMapping({Url.APPLICATION_URL, NewUrl.APPLICATION_URL})
@Slf4j
public class AppIconController {

    private static final List<Integer> ALLOWED_SIZES = List.of(48, 72, 96, 120, 128, 144, 152, 167, 180, 192, 256, 384, 512);

    private final ApplicationService applicationService;
    private final ApplicationRecordService applicationRecordService;
    private final ReactiveRedisOperations<String, String> reactiveRedisOperations;

    @GetMapping("/{applicationId}/icons")
    public Mono<ResponseView<Map<String, Object>>> getAvailableIconSizes(@PathVariable String applicationId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("sizes", ALLOWED_SIZES);
        return Mono.just(ResponseView.success(payload));
    }

    @GetMapping("/{applicationId}/icons/{size}.png")
    public Mono<Void> getIconPng(@PathVariable String applicationId,
                                 @PathVariable int size,
                                 @RequestParam(name = "bg", required = false) String bg,
                                 ServerHttpResponse response) {
        if (!ALLOWED_SIZES.contains(size)) {
            // clamp to a safe default
            int fallback = 192;
            return getIconPng(applicationId, fallback, bg, response);
        }

        response.getHeaders().setContentType(MediaType.IMAGE_PNG);
        response.getHeaders().setCacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic());

        return applicationService.findById(applicationId)
                .flatMap(app -> Mono.zip(Mono.just(app), app.getIcon(applicationRecordService)))
                .flatMap(tuple -> {
                    Application app = tuple.getT1();
                    String iconIdentifier = Optional.ofNullable(tuple.getT2()).orElse("");

                    String cacheKey = buildCacheKey(applicationId, size, bg, iconIdentifier);

                    return reactiveRedisOperations.opsForValue().get(cacheKey)
                            .flatMap(encoded -> Mono.fromCallable(() -> Base64.getDecoder().decode(encoded)))
                            .switchIfEmpty(
                                    Mono.fromCallable(() -> buildIconPng(iconIdentifier, app.getName(), size, parseColor(bg)))
                                            .onErrorResume(e -> {
                                                log.warn("Failed to generate icon for app {}: {}", applicationId, e.getMessage());
                                                return Mono.fromCallable(() -> buildPlaceholderPng(app.getName(), size, parseColor(bg)));
                                            })
                                            .flatMap(bytes -> reactiveRedisOperations.opsForValue()
                                                    .set(cacheKey, Base64.getEncoder().encodeToString(bytes), java.time.Duration.ofHours(1))
                                                    .onErrorResume(err -> {
                                                        log.debug("Redis set failed for key {}: {}", cacheKey, err.toString());
                                                        return Mono.just(false);
                                                    })
                                                    .thenReturn(bytes)
                                            )
                            );
                })
                .switchIfEmpty(
                        Mono.defer(() -> {
                            String cacheKey = buildCacheKey(applicationId, size, bg, "");
                            byte[] generated = buildPlaceholderPng("Lowcoder", size, parseColor(bg));
                            return reactiveRedisOperations.opsForValue()
                                    .set(cacheKey, Base64.getEncoder().encodeToString(generated), java.time.Duration.ofHours(1))
                                    .onErrorResume(err -> {
                                        log.debug("Redis set failed for key {}: {}", cacheKey, err.toString());
                                        return Mono.just(false);
                                    })
                                    .thenReturn(generated);
                        })
                )
                .flatMap(bytes -> response.writeWith(Mono.just(response.bufferFactory().wrap(bytes))))
                .then();
    }

    // Manifest endpoint is provided by ApplicationController; do not duplicate here.

    private static byte[] buildIconPng(String iconIdentifier, String appName, int size, @Nullable Color bgColor) throws Exception {
        BufferedImage source = tryLoadImage(iconIdentifier);
        if (source == null) {
            return buildPlaceholderPng(appName, size, bgColor);
        }
        return scaleToSquarePng(source, size, bgColor);
    }

    private static String buildCacheKey(String applicationId, int size, @Nullable String bg, @Nullable String iconIdentifier) {
        String normBg = (bg == null || bg.isBlank()) ? "-" : bg.trim().toLowerCase(Locale.ROOT);
        String iconHash = (iconIdentifier == null) ? "0" : Integer.toHexString(iconIdentifier.hashCode());
        return "appicon:" + applicationId + '|' + size + '|' + normBg + '|' + iconHash;
    }

    private static BufferedImage tryLoadImage(String iconIdentifier) {
        if (iconIdentifier == null || iconIdentifier.isBlank()) return null;
        try {
            if (iconIdentifier.startsWith("data:image")) {
                String base64 = iconIdentifier.substring(iconIdentifier.indexOf(",") + 1);
                byte[] data = Base64.getDecoder().decode(base64);
                try (InputStream in = new ByteArrayInputStream(data)) {
                    return ImageIO.read(in);
                }
            }
            if (iconIdentifier.startsWith("http://") || iconIdentifier.startsWith("https://")) {
                try (InputStream in = new URL(iconIdentifier).openStream()) {
                    return ImageIO.read(in);
                }
            }
        } catch (Exception e) {
            // ignore and fallback
        }
        return null;
    }

    private static byte[] scaleToSquarePng(BufferedImage source, int size, @Nullable Color bgColor) throws Exception {
        int w = source.getWidth();
        int h = source.getHeight();
        double scale = Math.min((double) size / w, (double) size / h);
        int newW = Math.max(1, (int) Math.round(w * scale));
        int newH = Math.max(1, (int) Math.round(h * scale));

        BufferedImage canvas = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = canvas.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            if (bgColor != null) {
                g.setColor(bgColor);
                g.fillRect(0, 0, size, size);
            }
            int x = (size - newW) / 2;
            int y = (size - newH) / 2;
            g.drawImage(source, x, y, newW, newH, null);
        } finally {
            g.dispose();
        }
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(canvas, "png", baos);
        return baos.toByteArray();
    }

    private static byte[] buildPlaceholderPng(String appName, int size, @Nullable Color bgColor) {
        try {
            BufferedImage canvas = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g = canvas.createGraphics();
            try {
                g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                // Only add background if explicitly requested
                if (bgColor != null) {
                    g.setColor(bgColor);
                    g.fillRect(0, 0, size, size);
                }
                // draw first letter as simple placeholder
                String letter = (appName != null && !appName.isBlank()) ? appName.substring(0, 1).toUpperCase() : "L";
                // Use a contrasting color for the text - black if no background, white if background
                g.setColor(bgColor != null ? Color.WHITE : Color.BLACK);
                int fontSize = Math.max(24, (int) (size * 0.5));
                g.setFont(new Font("SansSerif", Font.BOLD, fontSize));
                FontMetrics fm = g.getFontMetrics();
                int textW = fm.stringWidth(letter);
                int textH = fm.getAscent();
                int x = (size - textW) / 2;
                int y = (size + textH / 2) / 2;
                g.drawString(letter, x, y);
            } finally {
                g.dispose();
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(canvas, "png", baos);
            return baos.toByteArray();
        } catch (Exception e) {
            // last resort
            return new byte[0];
        }
    }

    @Nullable
    private static Color parseColor(@Nullable String hex) {
        if (hex == null || hex.isBlank()) return null;
        String v = hex.trim();
        if (v.startsWith("#")) v = v.substring(1);
        try {
            if (v.length() == 6) {
                int r = Integer.parseInt(v.substring(0, 2), 16);
                int g = Integer.parseInt(v.substring(2, 4), 16);
                int b = Integer.parseInt(v.substring(4, 6), 16);
                return new Color(r, g, b);
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private static String toJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder();
        sb.append('{');
        Iterator<Map.Entry<String, Object>> it = map.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Object> e = it.next();
            sb.append('"').append(escape(e.getKey())).append('"').append(':');
            sb.append(valueToJson(e.getValue()));
            if (it.hasNext()) sb.append(',');
        }
        sb.append('}');
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private static String valueToJson(Object v) {
        if (v == null) return "null";
        if (v instanceof String s) return '"' + escape(s) + '"';
        if (v instanceof Number || v instanceof Boolean) return v.toString();
        if (v instanceof Map<?, ?> m) {
            return toJson((Map<String, Object>) m);
        }
        if (v instanceof Collection<?> c) {
            StringBuilder sb = new StringBuilder();
            sb.append('[');
            Iterator<?> it = c.iterator();
            while (it.hasNext()) {
                sb.append(valueToJson(it.next()));
                if (it.hasNext()) sb.append(',');
            }
            sb.append(']');
            return sb.toString();
        }
        return '"' + escape(String.valueOf(v)) + '"';
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}