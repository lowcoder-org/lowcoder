package org.lowcoder.api.subscription;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import org.lowcoder.domain.enterprise.EnterpriseLicenseCapabilityService;
import org.lowcoder.domain.enterprise.EnterpriseLicenseCapabilityService.PurchaseState;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.lowcoder.api.framework.view.ResponseView;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Authenticates locally. Neither a user ID nor a relay credential is accepted from the browser. */
@RestController
@RequestMapping("/api/enterprise-licenses")
public class EnterpriseLicenseController {
    private final SessionUserService sessions;
    private final ConfigCenter config;
    private final String relayUrl;
    private final EnterpriseLicenseCapabilityService capabilities;
    private final String publicUrl;

    public EnterpriseLicenseController(SessionUserService sessions, ConfigCenter config,
            EnterpriseLicenseCapabilityService capabilities,
            @Value("${LOWCODER_ENTERPRISE_LICENSE_RELAY_URL:https://flow.lowcoder.cloud/webhook/secure/enterprise-licenses}") String relayUrl,
            @Value("${LOWCODER_PUBLIC_URL:}") String publicUrl) {
        this.sessions = sessions;
        this.config = config;
        this.relayUrl = relayUrl;
        this.capabilities = capabilities;
        this.publicUrl = publicUrl.replaceAll("/+$", "");
    }

    @PostMapping("/{action:checkout|sync|status|download|portal}")
    public Mono<ResponseView<JsonNode>> request(@PathVariable String action, @RequestBody JsonNode body,
            ServerHttpRequest request) {
        return sessions.getVisitorOrgMember()
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED)))
                .flatMap(member -> {
                    if (member.isInvalid() || !(member.isAdmin() || member.isSuperAdmin()) ||
                            !member.getOrgId().equals(body.path("orgId").asText())) {
                        return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
                    }
                    // The configured UI URL remains authoritative even behind an internal proxy
                    // or when a caller forges returnOrigin. Spring resolves forwarded request hosts.
                    if (action.equals("checkout") && (isPublicCloudUrl(publicUrl) ||
                            isPublicCloudUrl(request.getURI().toString()) ||
                            isPublicCloudUrl(body.path("returnOrigin").asText()))) {
                        return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN,
                                "Enterprise Edition is self-hosted. Purchase a license from your own Lowcoder installation."));
                    }
                    String hostId = config.deployment().ofString("id", "").get();
                    if (hostId == null || hostId.isBlank()) {
                        return Mono.error(new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                                "Enterprise licensing is not configured for this installation"));
                    }
                    Map<String, Object> payload = new LinkedHashMap<>();
                    payload.put("action", action);
                    payload.put("hostId", hostId);
                    payload.put("orgId", member.getOrgId());
                    payload.put("userId", member.getUserId());
                    if (action.equals("status") || action.equals("sync")) {
                        return library(payload, action.equals("status") && body.path("refresh").asBoolean(false));
                    }
                    if (action.equals("checkout")) {
                        JsonNode deployments = body.path("deploymentIds");
                        if (!deployments.isArray() || deployments.size() < 1 || deployments.size() > 3 ||
                                !hostId.equals(deployments.path(0).asText())) {
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "First instance must be this deployment");
                        }
                        for (String field : List.of("requestId", "billingInterval", "contactData", "deploymentIds")) {
                            if (!body.hasNonNull(field)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing " + field);
                            payload.put(field, body.get(field));
                        }
                    }
                    if (action.equals("download")) payload.put("licenseId", body.path("licenseId").asText());
                    if (action.equals("portal")) payload.put("requestId", body.path("requestId").asText());
                    if (action.equals("checkout") || action.equals("portal")) {
                        String origin = publicUrl.isBlank() ? body.path("returnOrigin").asText() : publicUrl;
                        URI base;
                        try { base = URI.create(origin); }
                        catch (IllegalArgumentException error) {
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Enterprise return origin");
                        }
                        // Local development may return over HTTP. Payment and relay traffic still use HTTPS.
                        boolean loopback = base.getHost() != null && List.of("localhost", "127.0.0.1", "[::1]").contains(base.getHost());
                        if (!("https".equals(base.getScheme()) || ("http".equals(base.getScheme()) && loopback)) ||
                                base.getHost() == null || base.getUserInfo() != null ||
                                (base.getPort() != -1 && (base.getPort() < 1 || base.getPort() > 65535)) ||
                                base.getQuery() != null || base.getFragment() != null ||
                                !(base.getPath() == null || base.getPath().isEmpty() || base.getPath().equals("/"))) {
                            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Use an HTTPS UI origin or localhost for Enterprise checkout");
                        }
                        payload.put("returnUrl", origin.replaceAll("/+$", "") + "/setting/subscription?enterpriseLicense=return");
                    }
                    return capabilities.token(hostId, member.getOrgId(), member.getUserId())
                            .flatMap(token -> {
                                if (!action.equals("checkout")) return relay(payload, token);
                                return capabilities.checkoutAttempted(hostId, member.getOrgId(), member.getUserId())
                                        .then(Mono.defer(() -> relay(payload, token)))
                                        .flatMap(result -> capabilities.recordPurchaseStatus(hostId, member.getOrgId(), member.getUserId(), true)
                                                .thenReturn(result));
                            });
                }).map(ResponseView::success);
    }

    private Mono<JsonNode> library(Map<String, Object> payload, boolean refresh) {
        String hostId = (String) payload.get("hostId"), orgId = (String) payload.get("orgId"), userId = (String) payload.get("userId");
        return capabilities.purchaseState(hostId, orgId, userId).flatMap(state -> {
            if (state == PurchaseState.NONE && !refresh) {
                var empty = JsonNodeFactory.instance.objectNode().put("success", true);
                empty.putArray("orders");
                empty.putArray("licenses");
                return Mono.just(empty);
            }
            return capabilities.token(hostId, orgId, userId).flatMap(token -> {
                Map<String, Object> lookup = new LinkedHashMap<>(payload);
                // Legacy credentials and ambiguous checkouts are discovered without issuing files.
                if (state != PurchaseState.CONFIRMED) lookup.put("action", "status");
                return relay(lookup, token).flatMap(result -> {
                    boolean purchased = hasPurchase(result);
                    return capabilities.recordPurchaseStatus(hostId, orgId, userId, purchased)
                            .then(Mono.defer(() -> "sync".equals(payload.get("action")) &&
                                    "status".equals(lookup.get("action")) && purchased
                                            ? relay(payload, token) : Mono.just(result)));
                });
            });
        });
    }

    private static boolean hasPurchase(JsonNode result) {
        return !result.path("orders").isEmpty() || !result.path("licenses").isEmpty();
    }

    private Mono<JsonNode> relay(Map<String, Object> payload, String token) {
        return Mono.defer(() -> {
            // Database work must not consume the relay's authenticated-request freshness window.
            payload.put("issuedAt", System.currentTimeMillis());
            return send(payload, token);
        }).filter(result -> {
            if (!result.path("success").asBoolean(false)) return false;
            String action = (String) payload.get("action");
            if (action.equals("status") || action.equals("sync")) {
                return result.path("orders").isArray() && result.path("licenses").isArray();
            }
            if (action.equals("checkout")) {
                return !result.path("checkoutUrl").asText().isBlank() &&
                        result.path("requestId").equals(payload.get("requestId"));
            }
            return true;
        }).switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "Enterprise license service returned an invalid response. Please retry shortly.")))
                .onErrorMap(error -> !(error instanceof ResponseStatusException), error ->
                        new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                                "Enterprise license service is temporarily unavailable. Please retry shortly.", error));
    }

    // The global handler converts non-plugin ResponseStatusExceptions to 500. Keep the
    // licensing API's authorization, validation and availability statuses intact locally.
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ResponseView<Void>> licensingError(ResponseStatusException error) {
        var response = ResponseEntity.status(error.getStatusCode());
        if (error.getStatusCode().value() == 503) response.header("Retry-After", "60");
        return response.body(ResponseView.error(error.getStatusCode().value(),
                error.getReason() == null ? "Enterprise licensing request could not be completed" : error.getReason()));
    }

    private static boolean isPublicCloudUrl(String url) {
        try {
            String host = URI.create(url).getHost();
            return host != null && "app.lowcoder.cloud".equalsIgnoreCase(host.replaceAll("\\.$", ""));
        } catch (IllegalArgumentException ignored) {
            return false; // Existing return-origin validation handles malformed URLs.
        }
    }

    Mono<JsonNode> send(Map<String, Object> payload, String token) {
        URI target;
        try { target = URI.create(relayUrl); }
        catch (IllegalArgumentException error) {
            return Mono.error(new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Enterprise relay requires HTTPS"));
        }
        if (!"https".equals(target.getScheme()) || target.getHost() == null || target.getUserInfo() != null) {
            return Mono.error(new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Enterprise relay requires HTTPS"));
        }
        return WebClientBuildHelper.builder().systemProxy().timeoutMs(110000).build().post()
                .uri(relayUrl).contentType(MediaType.APPLICATION_JSON)
                .header("Lowcoder-Enterprise-Owner", token)
                .bodyValue(payload).retrieve().bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(115));
    }
}
