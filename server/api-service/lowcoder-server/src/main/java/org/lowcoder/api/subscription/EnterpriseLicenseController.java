package org.lowcoder.api.subscription;

import com.fasterxml.jackson.databind.JsonNode;
import org.lowcoder.domain.enterprise.EnterpriseLicenseCapabilityService;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.lowcoder.api.framework.view.ResponseView;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
    public Mono<ResponseView<JsonNode>> request(@PathVariable String action, @RequestBody JsonNode body) {
        return sessions.getVisitorOrgMember()
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED)))
                .flatMap(member -> {
                    if (member.isInvalid() || !(member.isAdmin() || member.isSuperAdmin()) ||
                            !member.getOrgId().equals(body.path("orgId").asText())) {
                        return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
                    }
                    String hostId = config.deployment().ofString("id", "").get();
                    if (hostId == null || hostId.isBlank() || relayUrl.isBlank()) {
                        return Mono.error(new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                                "Enterprise licensing is not configured for this installation"));
                    }
                    Map<String, Object> payload = new LinkedHashMap<>();
                    payload.put("action", action);
                    payload.put("hostId", hostId);
                    payload.put("orgId", member.getOrgId());
                    payload.put("userId", member.getUserId());
                    payload.put("issuedAt", System.currentTimeMillis());
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
                        URI base = URI.create(origin);
                        if (!"https".equals(base.getScheme()) || base.getHost() == null || base.getUserInfo() != null ||
                                base.getQuery() != null || base.getFragment() != null ||
                                !(base.getPath() == null || base.getPath().isEmpty() || base.getPath().equals("/"))) {
                            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Use an HTTPS UI origin for Enterprise checkout");
                        }
                        payload.put("returnUrl", origin.replaceAll("/+$", "") + "/setting/subscription?enterpriseLicense=return");
                    }
                    return capabilities.token(hostId, member.getOrgId(), member.getUserId())
                            .flatMap(token -> send(payload, token));
                }).map(ResponseView::success);
    }

    Mono<JsonNode> send(Map<String, Object> payload, String token) {
        URI target = URI.create(relayUrl);
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
