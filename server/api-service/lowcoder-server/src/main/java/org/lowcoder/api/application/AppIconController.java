package org.lowcoder.api.application;

import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

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

    private static final long CACHE_TTL_MILLIS = Duration.ofHours(12).toMillis();
    private static final int CACHE_MAX_ENTRIES = 2000;
    private static final Map<String, CacheEntry> ICON_CACHE = new ConcurrentHashMap<>();

    private record CacheEntry(byte[] data, long expiresAtMs) {}

    private static String buildCacheKey(String applicationId, String iconIdentifier, String appName, int size, @Nullable Color bgColor) {
        String id = (iconIdentifier == null || iconIdentifier.isBlank()) ? ("placeholder:" + Objects.toString(appName, "Lowcoder")) : iconIdentifier;
        String bg = (bgColor == null) ? "none" : (bgColor.getRed()+","+bgColor.getGreen()+","+bgColor.getBlue());
        return applicationId + "|" + id + "|" + size + "|" + bg;
    }

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

        final Color bgColor = parseColor(bg);

        return applicationService.findById(applicationId)
                .flatMap(app -> Mono.zip(Mono.just(app), app.getIcon(applicationRecordService)))
                .flatMap(tuple -> {
                    Application app = tuple.getT1();
                    String iconIdentifier = Optional.ofNullable(tuple.getT2()).orElse("");
                    String cacheKey = buildCacheKey(applicationId, iconIdentifier, app.getName(), size, bgColor);

                    // Cache hit
                    CacheEntry cached = ICON_CACHE.get(cacheKey);
                    if (cached != null && cached.expiresAtMs() > System.currentTimeMillis()) {
                        byte[] bytes = cached.data();
                        return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes))).then();
                    }

                    // Cache miss: render and store
                    return Mono.fromCallable(() -> buildIconPng(iconIdentifier, app.getName(), size, bgColor))
                            .onErrorResume(e -> {
                                log.warn("Failed to generate icon for app {}: {}", applicationId, e.getMessage());
                                return Mono.fromCallable(() -> buildPlaceholderPng(app.getName(), size, bgColor));
                            })
                            .flatMap(bytes -> {
                                putInCache(cacheKey, bytes);
                                return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes))).then();
                            });
                })
                .switchIfEmpty(Mono.defer(() -> {
                    String cacheKey = buildCacheKey(applicationId, "", "Lowcoder", size, bgColor);
                    CacheEntry cached = ICON_CACHE.get(cacheKey);
                    if (cached != null && cached.expiresAtMs() > System.currentTimeMillis()) {
                        byte[] bytes = cached.data();
                        return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes))).then();
                    }
                    byte[] bytes = buildPlaceholderPng("Lowcoder", size, bgColor);
                    putInCache(cacheKey, bytes);
                    return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes))).then();
                }));
    }

    private static void putInCache(String key, byte[] data) {
        long expires = System.currentTimeMillis() + CACHE_TTL_MILLIS;
        if (ICON_CACHE.size() >= CACHE_MAX_ENTRIES) {
            // Best-effort cleanup of expired entries; if still large, remove one arbitrary entry
            ICON_CACHE.entrySet().removeIf(e -> e.getValue().expiresAtMs() <= System.currentTimeMillis());
            if (ICON_CACHE.size() >= CACHE_MAX_ENTRIES) {
                String firstKey = ICON_CACHE.keySet().stream().findFirst().orElse(null);
                if (firstKey != null) ICON_CACHE.remove(firstKey);
            }
        }
        ICON_CACHE.put(key, new CacheEntry(data, expires));
    }

    private static byte[] buildIconPng(String iconIdentifier, String appName, int size, @Nullable Color bgColor) throws Exception {
        BufferedImage source = tryLoadImage(iconIdentifier);
        if (source == null) {
            return buildPlaceholderPng(appName, size, bgColor);
        }
        return scaleToSquarePng(source, size, bgColor);
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
                Color background = bgColor != null ? bgColor : new Color(0xB4, 0x80, 0xDE); // #b480de
                g.setColor(background);
                g.fillRect(0, 0, size, size);
                // draw first letter as simple placeholder
                String letter = (appName != null && !appName.isBlank()) ? appName.substring(0, 1).toUpperCase() : "L";
                g.setColor(Color.WHITE);
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

    
}