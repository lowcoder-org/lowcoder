package org.lowcoder.api.subscription;

import com.fasterxml.jackson.databind.JsonNode;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class WorkspaceSeatSyncService {
    public static final String FLOW_PATH = "webhook/secure/sync-workspace-seats";
    private static final Duration LEASE = Duration.ofSeconds(180);
    private static final RedisScript<Long> RELEASE = RedisScript.of(
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end", Long.class);
    private final SessionUserService sessionUsers;
    private final WorkspaceSeatCounter seats;
    private final ReactiveRedisTemplate<String, String> redis;
    private final ConfigCenter config;
    private final String relayToken;
    private final String relayUrl;

    public WorkspaceSeatSyncService(SessionUserService sessionUsers, WorkspaceSeatCounter seats,
            ReactiveRedisTemplate<String, String> redis, ConfigCenter config,
            @Value("${LOWCODER_BILLING_SEAT_SYNC_TOKEN:}") String relayToken,
            @Value("${LOWCODER_BILLING_SEAT_SYNC_URL:https://flow.lowcoder.cloud/webhook/secure/sync-workspace-seats}") String relayUrl) {
        this.sessionUsers = sessionUsers;
        this.seats = seats;
        this.redis = redis;
        this.config = config;
        this.relayToken = relayToken;
        this.relayUrl = relayUrl;
    }

    public Mono<String> synchronize(String expectedOrgId) {
        // This branch of /api/flow must authenticate locally, even though the generic flow proxy is public.
        return sessionUsers.getVisitorOrgMember().switchIfEmpty(Mono.error(
                new ResponseStatusException(HttpStatus.UNAUTHORIZED))).flatMap(member -> {
            if (member.isInvalid() || !member.getOrgId().equals(expectedOrgId)) {
                return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Workspace changed or access denied"));
            }
            String hostId = config.deployment().ofString("id", "").get();
            if (hostId == null || hostId.isBlank() || relayToken.isBlank()) {
                return Mono.error(new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Seat synchronization is not configured"));
            }
            String key = "billing:seat-sync:" + hostId + ":" + expectedOrgId;
            String requestId = UUID.randomUUID().toString();
            return redis.opsForValue().setIfAbsent(key, requestId, LEASE).flatMap(acquired -> {
                if (!acquired) return Mono.error(new ResponseStatusException(HttpStatus.CONFLICT, "Seat synchronization is already running"));
                return seats.count(expectedOrgId).flatMap(quantity -> send(Map.of(
                        "hostId", hostId, "orgId", expectedOrgId, "quantity", quantity,
                        "requestId", requestId, "issuedAt", System.currentTimeMillis()))
                        .flatMap(response -> {
                            if (!response.path("success").asBoolean(false) ||
                                    !requestId.equals(response.path("requestId").asText()) ||
                                    response.path("quantity").asInt(-1) != quantity) {
                                return Mono.error(new IllegalStateException("Seat relay did not confirm the requested quantity"));
                            }
                            return redis.execute(RELEASE, List.of(key), List.of(requestId)).then(Mono.just(response.toString()));
                        }));
                // On timeout/error retain the lease. The relay rejects old snapshots and has a 60s execution
                // limit; the 180s lease prevents another client from racing a possibly still-running request.
            });
        });
    }

    Mono<JsonNode> send(Map<String, Object> snapshot) {
        return WebClientBuildHelper.builder().systemProxy().timeoutMs(80000).build().post()
                .uri(relayUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Lowcoder-Seat-Sync-Token", relayToken)
                .bodyValue(snapshot).retrieve().bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(85));
    }
}
