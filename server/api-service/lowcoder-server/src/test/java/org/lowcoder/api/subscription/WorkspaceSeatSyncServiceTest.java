package org.lowcoder.api.subscription;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.misc.ApiFlowController;
import org.lowcoder.api.misc.ApiFlowEndpoints.FlowRequest;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class WorkspaceSeatSyncServiceTest {
    SessionUserService sessions = mock(SessionUserService.class);
    WorkspaceSeatCounter seats = mock(WorkspaceSeatCounter.class);
    ReactiveRedisTemplate<String, String> redis = mock(ReactiveRedisTemplate.class, RETURNS_DEEP_STUBS);
    ConfigCenter config = mock(ConfigCenter.class, RETURNS_DEEP_STUBS);
    WorkspaceSeatSyncService service;

    @BeforeEach void setup() {
        service = spy(new WorkspaceSeatSyncService(sessions, seats, redis, config, "server-only-test-token", "https://flow.lowcoder.cloud/webhook/secure/sync-workspace-seats"));
        when(sessions.getVisitorOrgMember()).thenReturn(Mono.just(new OrgMember("workspace", "user", MemberRole.ADMIN, "normal", 0)));
        when(config.deployment().ofString("id", "").get()).thenReturn("host");
        when(redis.opsForValue().setIfAbsent(anyString(), anyString(), any())).thenReturn(Mono.just(true));
        when(redis.execute(any(), anyList(), anyList())).thenReturn(Flux.just(1L));
        when(seats.count("workspace")).thenReturn(Mono.just(3));
    }

    @Test void flowDiscardsBrowserQuantityHostAndHeadersAndUsesCurrentServerCount() {
        doAnswer(call -> {
            Map<String, Object> snapshot = call.getArgument(0);
            assertEquals("host", snapshot.get("hostId"));
            assertEquals(3, snapshot.get("quantity"));
            return Mono.just(new ObjectMapper().valueToTree(Map.of("success", true, "quantity", 3,
                    "requestId", snapshot.get("requestId"))));
        }).when(service).send(anyMap());
        String response = new ApiFlowController(service).flow(new FlowRequest(WorkspaceSeatSyncService.FLOW_PATH,
                "post", Map.of("orgId", "workspace", "quantity", 0, "hostId", "foreign"),
                Map.of("Lowcoder-Seat-Sync-Token", "browser-forgery"), 1, 5)).block();
        assertTrue(response.contains("\"quantity\":3"));
        verify(redis).execute(any(), anyList(), anyList());
    }

    @Test void rejectsForeignWorkspaceWithoutCallingRelay() {
        assertThrows(ResponseStatusException.class, () -> service.synchronize("foreign").block());
        verify(service, never()).send(anyMap());
        verify(seats, never()).count(anyString());
    }

    @Test void anonymousRequestCannotSynchronize() {
        when(sessions.getVisitorOrgMember()).thenReturn(Mono.empty());
        assertThrows(ResponseStatusException.class, () -> service.synchronize("workspace").block());
        verify(service, never()).send(anyMap());
    }

    @Test void failedMemberReadNeverSendsAZeroQuantity() {
        when(seats.count("workspace")).thenReturn(Mono.error(new IllegalStateException("member store unavailable")));
        assertThrows(IllegalStateException.class, () -> service.synchronize("workspace").block());
        verify(service, never()).send(anyMap());
    }

    @Test void missingDeploymentConfigurationFailsBeforeReadingSeatsOrCallingRelay() {
        when(config.deployment().ofString("id", "").get()).thenReturn("");
        assertThrows(ResponseStatusException.class, () -> service.synchronize("workspace").block());
        verify(seats, never()).count(anyString());
        verify(service, never()).send(anyMap());
    }

    @Test void overlappingClientRequestDoesNotReachStripe() {
        when(redis.opsForValue().setIfAbsent(anyString(), anyString(), any())).thenReturn(Mono.just(false));
        assertThrows(ResponseStatusException.class, () -> service.synchronize("workspace").block());
        verify(service, never()).send(anyMap());
    }

    @Test void ambiguousFailureKeepsLeaseUntilItExpires() {
        doReturn(Mono.error(new IllegalStateException("timeout"))).when(service).send(anyMap());
        assertThrows(IllegalStateException.class, () -> service.synchronize("workspace").block());
        verify(redis, never()).execute(any(), anyList(), anyList());
    }

    @Test void mismatchedConfirmationIsNotReportedAsSuccess() {
        doReturn(Mono.just(new ObjectMapper().valueToTree(Map.of("success", true, "quantity", 3, "requestId", "wrong"))))
                .when(service).send(anyMap());
        assertThrows(IllegalStateException.class, () -> service.synchronize("workspace").block());
        verify(redis, never()).execute(any(), anyList(), anyList());
    }
}
