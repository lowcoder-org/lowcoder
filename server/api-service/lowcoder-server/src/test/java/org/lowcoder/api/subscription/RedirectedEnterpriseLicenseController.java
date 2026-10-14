package org.lowcoder.api.subscription;

import com.fasterxml.jackson.databind.JsonNode;
import org.lowcoder.api.contract.support.WebClientRedirect;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.enterprise.EnterpriseLicenseCapabilityService;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.mockito.MockedStatic;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * The production {@link EnterpriseLicenseController} whose relay request goes to a local test server: {@code send} runs
 * the production {@code send} with {@link WebClientRedirect} open, so the client it builds keeps every production
 * setting but its connector, which sends the request to {@code redirectBaseUrl}'s scheme, host and port with the relay
 * URL's path.
 *
 * <p>Contract: the only public member is the constructor, the production constructor's parameters in their order, then
 * {@code redirectBaseUrl}; the only override is {@code send}, which adds nothing but opening and closing the redirection
 * around {@code super.send}. It lives in the production class's package because {@code send} is package-private.
 *
 * <p>Limit: the redirection is a static mock that applies only on the opening thread and only while open, so it relies on
 * the production {@code send} building its client before it returns the {@code Mono}
 * ({@code EnterpriseLicenseController.java:199}). A {@code send} that built its client later would miss the redirection
 * and send to the configured relay URL; with the {@code .invalid} relay hosts of the tests that request fails, and the
 * tests that expect a relay request fail with it.
 */
public class RedirectedEnterpriseLicenseController extends EnterpriseLicenseController {

    private final String redirectBaseUrl;

    public RedirectedEnterpriseLicenseController(SessionUserService sessions, ConfigCenter config,
            EnterpriseLicenseCapabilityService capabilities, String relayUrl, String publicUrl, String redirectBaseUrl) {
        super(sessions, config, capabilities, relayUrl, publicUrl);
        this.redirectBaseUrl = redirectBaseUrl;
    }

    @Override
    Mono<JsonNode> send(Map<String, Object> payload, String token) {
        try (MockedStatic<WebClientBuildHelper> ignored = WebClientRedirect.redirectTo(redirectBaseUrl)) {
            return super.send(payload, token);
        }
    }
}
