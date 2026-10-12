package org.lowcoder.api.subscription;

import com.fasterxml.jackson.databind.JsonNode;
import org.lowcoder.api.contract.support.WebClientRedirect;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.mockito.MockedStatic;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * The production {@link WorkspaceSeatSyncService} whose relay request goes to a local test server: {@code send} runs the
 * production {@code send} with {@link WebClientRedirect} open, so the client it builds keeps every production setting
 * but its connector, which sends the request to {@code redirectBaseUrl}'s scheme, host and port with the relay URL's
 * path.
 *
 * <p>Contract: the only public member is the constructor, the production constructor's parameters in their order, then
 * {@code redirectBaseUrl}; the only override is {@code send}, which adds nothing but opening and closing the redirection
 * around {@code super.send}. It lives in the production class's package because {@code send} is package-private.
 *
 * <p>Limit: the redirection is a static mock that applies only on the opening thread and only while open, so it relies on
 * the production {@code send} building its client before it returns the {@code Mono}
 * ({@code WorkspaceSeatSyncService.java:79}). A {@code send} that built its client later would miss the redirection and
 * send to the configured relay URL; with the {@code .invalid} relay hosts of the tests that request fails, and the tests
 * that expect a relay request fail with it.
 */
public class RedirectedWorkspaceSeatSyncService extends WorkspaceSeatSyncService {

    private final String redirectBaseUrl;

    public RedirectedWorkspaceSeatSyncService(SessionUserService sessionUsers, WorkspaceSeatCounter seats,
            ReactiveRedisTemplate<String, String> redis, ConfigCenter config, String relayToken, String relayUrl,
            String redirectBaseUrl) {
        super(sessionUsers, seats, redis, config, relayToken, relayUrl);
        this.redirectBaseUrl = redirectBaseUrl;
    }

    @Override
    Mono<JsonNode> send(Map<String, Object> snapshot) {
        try (MockedStatic<WebClientBuildHelper> ignored = WebClientRedirect.redirectTo(redirectBaseUrl)) {
            return super.send(snapshot);
        }
    }
}
