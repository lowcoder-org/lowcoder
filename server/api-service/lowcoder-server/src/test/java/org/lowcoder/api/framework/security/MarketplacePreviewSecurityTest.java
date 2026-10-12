package org.lowcoder.api.framework.security;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.application.marketplace.MarketplacePreview;
import org.lowcoder.api.application.marketplace.MarketplacePreviewController;
import org.lowcoder.api.application.marketplace.MarketplacePreviewStore;
import org.lowcoder.api.authentication.request.AuthRequestFactory;
import org.lowcoder.api.authentication.service.AuthenticationApiServiceImpl;
import org.lowcoder.api.authentication.util.JWTUtils;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.repository.ApplicationRecordRepository;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.UserPermissionOnResourceStatus;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.util.CookieHelper;
import org.springframework.http.MediaType;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.security.web.server.WebFilterChainProxy;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

class MarketplacePreviewSecurityTest {
    @Test
    void anotherInstallationCanReadPublicImagesAnonymouslyButPrivateMarketplaceAccessStillDenies() {
        var config = mock(CommonConfig.class, RETURNS_DEEP_STUBS);
        when(config.getSecurity().getForbiddenEndpoints()).thenReturn(List.of());
        when(config.getSecurity().getAllCorsAllowedDomains()).thenReturn(List.of("https://trusted.test"));
        var users = mock(SessionUserService.class);
        when(users.resolveSessionUserFromCookie(nullable(String.class))).thenReturn(Mono.empty());
        when(users.getVisitorId()).thenReturn(Mono.just("anonymous"));
        var security = new SecurityConfig(config, users, mock(UserService.class), mock(AccessDeniedHandler.class),
                mock(ServerAuthenticationEntryPoint.class), mock(CookieHelper.class), mock(AuthenticationService.class),
                mock(AuthenticationApiServiceImpl.class), mock(AuthRequestFactory.class), mock(JWTUtils.class));
        var apps = mock(ApplicationService.class);
        var versions = mock(ApplicationRecordRepository.class);
        var permissions = mock(ResourcePermissionService.class);
        var store = mock(MarketplacePreviewStore.class);
        when(apps.findByIdWithoutDsl("app")).thenReturn(Mono.just(Application.builder().id("app")
                .publicToAll(true).publicToMarketplace(true).applicationStatus(ApplicationStatus.NORMAL).build()));
        when(versions.existsByApplicationId("app")).thenReturn(Mono.just(true));
        when(permissions.checkUserPermissionStatusOnApplication(anyString(), anyString(), any(), any()))
                .thenReturn(Mono.just(UserPermissionOnResourceStatus.success(ResourcePermission.builder().resourceRole(ResourceRole.VIEWER).build())));
        var image = new MarketplacePreview(); image.setRenderedHash("hash"); image.setImage(new byte[]{1, 2});
        when(store.read("app")).thenReturn(Mono.just(image));
        var client = WebTestClient.bindToController(new MarketplacePreviewController(apps, versions, permissions, users, store))
                .webFilter(new WebFilterChainProxy(security.securityWebFilterChain(
                        ServerHttpSecurity.http().authenticationManager(authentication -> Mono.empty()))))
                .configureClient().baseUrl("https://community.test").build();
        String path = "/api/v1/applications/app/marketplace-preview/image";
        client.get().uri(path).header("Origin", "https://another-installation.test").exchange()
                .expectStatus().isOk().expectHeader().contentType(MediaType.IMAGE_JPEG)
                .expectHeader().valueEquals("Access-Control-Allow-Origin", "https://another-installation.test")
                .expectBody(byte[].class).isEqualTo(new byte[]{1, 2});
        client.get().uri(path).header("If-None-Match", "\"hash\"").exchange().expectStatus().isNotModified();
        client.get().uri("/api/applications/app/marketplace-preview/image")
                .header("Origin", "https://another-installation.test").exchange().expectStatus().isOk();
        when(permissions.checkUserPermissionStatusOnApplication(anyString(), anyString(), any(), any()))
                .thenReturn(Mono.just(UserPermissionOnResourceStatus.anonymousUser()));
        client.get().uri(path).header("If-None-Match", "\"hash\"").exchange().expectStatus().isNotFound();
    }
}
