package org.lowcoder.api.framework.security;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.authentication.request.AuthRequestFactory;
import org.lowcoder.api.authentication.service.AuthenticationApiServiceImpl;
import org.lowcoder.api.authentication.util.JWTUtils;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.util.CookieHelper;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.security.web.server.WebFilterChainProxy;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/**
 * Pins D-12 (anonymous {@code POST /api/meta/}) and D-39 (anonymous actuator metrics/prometheus): both now require
 * authentication, while {@code /api/status/health} and the unrelated {@code byuser} matcher (D-13, left unchanged)
 * stay open to anonymous callers.
 */
class AnonymousRoutesSecurityTest {

    @RestController
    static class TestController {
        @PostMapping(org.lowcoder.infra.constant.Url.META_URL + "/")
        Mono<String> metaOld() { return Mono.just("ok"); }
        @PostMapping(org.lowcoder.infra.constant.NewUrl.META_URL + "/")
        Mono<String> metaNew() { return Mono.just("ok"); }
        @GetMapping(org.lowcoder.infra.constant.NewUrl.PREFIX + "/status/prometheus")
        Mono<String> prometheus() { return Mono.just("ok"); }
        @GetMapping(org.lowcoder.infra.constant.NewUrl.PREFIX + "/status/metrics")
        Mono<String> metrics() { return Mono.just("ok"); }
        @GetMapping(org.lowcoder.infra.constant.NewUrl.PREFIX + "/status/metrics/{metricName}")
        Mono<String> metricByName(@PathVariable String metricName) { return Mono.just("ok"); }
        @GetMapping(org.lowcoder.infra.constant.NewUrl.PREFIX + "/status/health")
        Mono<String> health() { return Mono.just("ok"); }
        @GetMapping(org.lowcoder.infra.constant.NewUrl.PREFIX + "/status/health/{component}")
        Mono<String> healthComponent(@PathVariable String component) { return Mono.just("ok"); }
        @GetMapping(org.lowcoder.infra.constant.Url.ORGANIZATION_URL + "/byuser/{email}")
        Mono<String> byUser(@PathVariable String email) { return Mono.just("ok"); }
        @GetMapping(org.lowcoder.infra.constant.NewUrl.ORGANIZATION_URL + "/byuser/{email}")
        Mono<String> byUserNew(@PathVariable String email) { return Mono.just("ok"); }
    }

    private WebTestClient anonymousClient() {
        var config = mock(CommonConfig.class, RETURNS_DEEP_STUBS);
        when(config.getSecurity().getForbiddenEndpoints()).thenReturn(List.of());
        when(config.getSecurity().getAllCorsAllowedDomains()).thenReturn(List.of("https://trusted.test"));
        var users = mock(SessionUserService.class);
        when(users.resolveSessionUserFromCookie(nullable(String.class))).thenReturn(Mono.empty());
        var cookieHelper = mock(CookieHelper.class);
        var entryPoint = mock(ServerAuthenticationEntryPoint.class);
        when(entryPoint.commence(any(), any())).thenAnswer(invocation -> {
            invocation.<org.springframework.web.server.ServerWebExchange>getArgument(0).getResponse()
                    .setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
            return Mono.empty();
        });
        var security = new SecurityConfig(config, users, mock(UserService.class), mock(AccessDeniedHandler.class),
                entryPoint, cookieHelper, mock(AuthenticationService.class), mock(AuthenticationApiServiceImpl.class),
                mock(AuthRequestFactory.class), mock(JWTUtils.class));
        return WebTestClient.bindToController(new TestController())
                .webFilter(new WebFilterChainProxy(security.securityWebFilterChain(
                        ServerHttpSecurity.http().authenticationManager(authentication -> Mono.empty()))))
                .build();
    }

    private WebTestClient authenticatedClient(String token) {
        var config = mock(CommonConfig.class, RETURNS_DEEP_STUBS);
        when(config.getSecurity().getForbiddenEndpoints()).thenReturn(List.of());
        when(config.getSecurity().getAllCorsAllowedDomains()).thenReturn(List.of("https://trusted.test"));
        var users = mock(SessionUserService.class);
        var cookieHelper = mock(CookieHelper.class);
        when(cookieHelper.getCookieToken(any())).thenReturn(token);
        User user = new User();
        user.setId("user1");
        when(users.resolveSessionUserFromCookie(token)).thenReturn(Mono.just(user));
        when(users.extendValidity(token)).thenReturn(Mono.empty());
        var security = new SecurityConfig(config, users, mock(UserService.class), mock(AccessDeniedHandler.class),
                mock(ServerAuthenticationEntryPoint.class), cookieHelper, mock(AuthenticationService.class),
                mock(AuthenticationApiServiceImpl.class), mock(AuthRequestFactory.class), mock(JWTUtils.class));
        return WebTestClient.bindToController(new TestController())
                .webFilter(new WebFilterChainProxy(security.securityWebFilterChain(
                        ServerHttpSecurity.http().authenticationManager(authentication -> Mono.empty()))))
                .build();
    }

    @Test
    void anonymousCallerIsRefusedMetaAndActuatorMetricsButHealthStaysOpen() {
        var client = anonymousClient();
        client.post().uri(org.lowcoder.infra.constant.Url.META_URL + "/").exchange().expectStatus().isUnauthorized();
        client.post().uri(org.lowcoder.infra.constant.NewUrl.META_URL + "/").exchange().expectStatus().isUnauthorized();
        client.get().uri(org.lowcoder.infra.constant.NewUrl.PREFIX + "/status/prometheus").exchange().expectStatus().isUnauthorized();
        client.get().uri(org.lowcoder.infra.constant.NewUrl.PREFIX + "/status/metrics").exchange().expectStatus().isUnauthorized();
        client.get().uri(org.lowcoder.infra.constant.NewUrl.PREFIX + "/status/metrics/jvm.memory.used").exchange().expectStatus().isUnauthorized();

        client.get().uri(org.lowcoder.infra.constant.NewUrl.PREFIX + "/status/health").exchange().expectStatus().isOk();
        client.get().uri(org.lowcoder.infra.constant.NewUrl.PREFIX + "/status/health/mongo").exchange().expectStatus().isOk();
        client.get().uri(org.lowcoder.infra.constant.Url.ORGANIZATION_URL + "/byuser/someone@example.com")
                .exchange().expectStatus().isOk();
        client.get().uri(org.lowcoder.infra.constant.NewUrl.ORGANIZATION_URL + "/byuser/someone@example.com")
                .exchange().expectStatus().isOk();
    }

    @Test
    void authenticatedCallerReachesMetaAndActuatorMetrics() {
        var client = authenticatedClient("tok");
        client.get().uri(org.lowcoder.infra.constant.NewUrl.PREFIX + "/status/health").exchange().expectStatus().isOk();
        client.post().uri(org.lowcoder.infra.constant.Url.META_URL + "/").exchange().expectStatus().isOk();
        client.post().uri(org.lowcoder.infra.constant.NewUrl.META_URL + "/").exchange().expectStatus().isOk();
        client.get().uri(org.lowcoder.infra.constant.NewUrl.PREFIX + "/status/prometheus").exchange().expectStatus().isOk();
        client.get().uri(org.lowcoder.infra.constant.NewUrl.PREFIX + "/status/metrics").exchange().expectStatus().isOk();
        client.get().uri(org.lowcoder.infra.constant.NewUrl.PREFIX + "/status/metrics/jvm.memory.used").exchange().expectStatus().isOk();
        client.get().uri(org.lowcoder.infra.constant.Url.ORGANIZATION_URL + "/byuser/someone@example.com")
                .exchange().expectStatus().isOk();
        client.get().uri(org.lowcoder.infra.constant.NewUrl.ORGANIZATION_URL + "/byuser/someone@example.com")
                .exchange().expectStatus().isOk();
    }
}
