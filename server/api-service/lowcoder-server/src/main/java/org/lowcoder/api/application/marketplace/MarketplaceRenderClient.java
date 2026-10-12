package org.lowcoder.api.application.marketplace;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import org.lowcoder.infra.js.NodeServerHelper;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class MarketplaceRenderClient {
    private final CommonConfig config;
    private final NodeServerHelper nodeServer;
    private final WebClient client = WebClient.builder().codecs(codecs ->
            codecs.defaultCodecs().maxInMemorySize(2 * 1024 * 1024)).build();

    public boolean isConfigured() {
        return config.getJsExecutor().getPassword() != null && !config.getJsExecutor().getPassword().isBlank();
    }

    public Mono<byte[]> render(String payload) {
        return Mono.defer(() -> {
            if (!isConfigured()) return Mono.error(new IllegalStateException("Renderer secret is not configured"));
            long timestamp = System.currentTimeMillis();
            String signature;
            try {
                Mac mac = Mac.getInstance("HmacSHA256");
                mac.init(new SecretKeySpec(config.getJsExecutor().getPassword().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
                signature = HexFormat.of().formatHex(mac.doFinal((timestamp + "\n" + payload).getBytes(StandardCharsets.UTF_8)));
            } catch (Exception error) {
                return Mono.error(error);
            }
            return client.post().uri(nodeServer.createUri("marketplace/render"))
                    .bodyValue(Map.of("timestamp", timestamp, "payload", payload, "signature", signature))
                    .retrieve().bodyToMono(byte[].class).timeout(Duration.ofSeconds(90))
                    .filter(bytes -> bytes.length > 2 && bytes[0] == (byte) 0xff && bytes[1] == (byte) 0xd8)
                    .switchIfEmpty(Mono.error(new IllegalStateException("Renderer did not return a JPEG")));
        });
    }
}
