package org.lowcoder.api.subscription;
import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.*;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.enterprise.EnterpriseLicenseCapabilityService;
import org.lowcoder.domain.enterprise.EnterpriseLicenseCapabilityService.PurchaseState;
import org.lowcoder.api.framework.exception.GlobalExceptionHandler;
import org.lowcoder.api.framework.exception.ApiPerfHelper;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.web.reactive.config.DelegatingWebFluxConfiguration;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.http.HttpHeaders;
import java.nio.charset.StandardCharsets;
import org.lowcoder.domain.organization.model.*;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import reactor.core.publisher.Mono;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EnterpriseLicenseControllerTest {
    final ObjectMapper mapper = new ObjectMapper();
    final SessionUserService sessions = mock(SessionUserService.class);
    final ConfigCenter config = mock(ConfigCenter.class,withSettings().defaultAnswer(RETURNS_DEEP_STUBS));
    final EnterpriseLicenseCapabilityService capabilities = mock(EnterpriseLicenseCapabilityService.class);
    EnterpriseLicenseController controller;
    JsonNode body;
    final ServerHttpRequest request = MockServerHttpRequest.post("https://ui.example/api/enterprise-licenses/checkout").build();
    JsonNode relayResult() {
        return mapper.valueToTree(Map.of("success", true, "requestId", "00000000-0000-4000-8000-000000000001",
                "checkoutUrl", "https://checkout.stripe.com/c/pay/test", "orders", List.of(Map.of("requestId", "existing")), "licenses", List.of()));
    }
    JsonNode emptyLibrary() { return mapper.valueToTree(Map.of("success", true, "orders", List.of(), "licenses", List.of())); }
    final List<AnnotationConfigApplicationContext> contexts = new ArrayList<>();
    WebTestClient webClient() {
        var context = new AnnotationConfigApplicationContext();
        contexts.add(context);
        context.register(DelegatingWebFluxConfiguration.class);
        context.registerBean(EnterpriseLicenseController.class, () -> controller);
        context.getBeanFactory().registerSingleton("apiPerfHelper", mock(ApiPerfHelper.class));
        context.registerBean(GlobalExceptionHandler.class);
        context.refresh();
        return WebTestClient.bindToApplicationContext(context).build();
    }
    @AfterEach void closeContexts() { contexts.forEach(AnnotationConfigApplicationContext::close); }
    @BeforeEach void setup() {
        controller = mock(EnterpriseLicenseController.class,withSettings().useConstructor(sessions,config,capabilities,"https://flow.example/webhook/enterprise","https://ui.example").defaultAnswer(CALLS_REAL_METHODS));
        when(capabilities.purchaseState("real-deployment", "org", "real-admin")).thenReturn(Mono.just(PurchaseState.CONFIRMED));
        when(capabilities.checkoutAttempted(anyString(), anyString(), anyString())).thenReturn(Mono.empty());
        when(capabilities.recordPurchaseStatus(anyString(), anyString(), anyString(), anyBoolean())).thenReturn(Mono.empty());
        when(capabilities.token("real-deployment","org","real-admin")).thenReturn(Mono.just("private-test-token"));
        when(sessions.getVisitorOrgMember()).thenReturn(Mono.just(new OrgMember("org","real-admin",MemberRole.ADMIN,"normal",0)));
        when(config.deployment().ofString("id", "").get()).thenReturn("real-deployment");
        body=mapper.valueToTree(Map.of("orgId","org","userId","forged","hostId","forged","requestId","00000000-0000-4000-8000-000000000001",
            "billingInterval","year","deploymentIds",List.of("real-deployment","other-deployment"),"contactData",Map.of("companyName","Company")));
        doReturn(Mono.just(relayResult())).when(controller).send(anyMap(),eq("private-test-token"));
    }
    @Test void ownerAndCurrentDeploymentComeOnlyFromSessionAndServerConfig() {
        doAnswer(call->{ Map<String,Object> p=call.getArgument(0);
            assertEquals("real-admin",p.get("userId")); assertEquals("real-deployment",p.get("hostId")); assertEquals("org",p.get("orgId"));
            assertEquals("https://ui.example/setting/subscription?enterpriseLicense=return",p.get("returnUrl")); assertFalse(p.containsKey("priceId"));
            return Mono.just(relayResult()); }).when(controller).send(anyMap(),eq("private-test-token"));
        assertNotNull(controller.request("checkout",body,request).block());
    }
    @Test void membersAndFormerAdminsCannotRetrieveOrGenerateFiles() {
        when(sessions.getVisitorOrgMember()).thenReturn(Mono.just(new OrgMember("org","real-admin",MemberRole.MEMBER,"normal",0)));
        for(String action:List.of("checkout","sync","status","download","portal"))
            assertThrows(ResponseStatusException.class,()->controller.request(action,body,request).block());
        verify(controller,never()).send(anyMap(),eq("private-test-token"));
    }
    @Test void foreignWorkspaceIsDenied() {
        assertThrows(ResponseStatusException.class,()->controller.request("status",mapper.valueToTree(Map.of("orgId","other")),request).block());
        verify(controller,never()).send(anyMap(),eq("private-test-token"));
    }
    @Test void anonymousSessionIsDenied() {
        when(sessions.getVisitorOrgMember()).thenReturn(Mono.empty());
        assertThrows(ResponseStatusException.class,()->controller.request("sync",body,request).block()); verify(controller,never()).send(anyMap(),eq("private-test-token"));
    }
    @Test void firstDeploymentCannotBeSubstituted() {
        ((com.fasterxml.jackson.databind.node.ObjectNode)body).set("deploymentIds",mapper.valueToTree(List.of("foreign")));
        assertThrows(ResponseStatusException.class,()->controller.request("checkout",body,request).block()); verify(controller,never()).send(anyMap(),eq("private-test-token"));
    }
    @Test void downloadScopeCannotBeOverriddenByRequestFields() {
        doAnswer(call->{ Map<String,Object> p=call.getArgument(0); assertEquals("real-admin",p.get("userId"));
            assertEquals("real-deployment",p.get("hostId")); assertFalse(p.containsKey("customerId"));assertFalse(p.containsKey("returnUrl"));
            return Mono.just(relayResult()); }).when(controller).send(anyMap(),eq("private-test-token"));
        assertNotNull(controller.request("download",body,request).block());
    }
    @Test void missingRelayConfigurationFailsClosed() {
        controller=mock(EnterpriseLicenseController.class,withSettings().useConstructor(sessions,config,capabilities,"","https://ui.example").defaultAnswer(CALLS_REAL_METHODS));
        ResponseStatusException error = assertThrows(ResponseStatusException.class,()->controller.request("checkout",body,request).block());
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatusCode());
        verify(capabilities, never()).recordPurchaseStatus(anyString(), anyString(), anyString(), anyBoolean());
    }
    @Test void localCheckoutAndPortalCanReturnToTheDevelopmentUi() {
        controller=mock(EnterpriseLicenseController.class,withSettings().useConstructor(sessions,config,capabilities,"https://flow.example/webhook/enterprise","").defaultAnswer(CALLS_REAL_METHODS));
        for (String origin:List.of("http://localhost:8000", "http://127.0.0.1:8000", "http://[::1]:8000", "https://ui.example")) {
            ((com.fasterxml.jackson.databind.node.ObjectNode)body).put("returnOrigin",origin);
            doAnswer(call->{ Map<String,Object> p=call.getArgument(0);
                assertEquals(origin+"/setting/subscription?enterpriseLicense=return",p.get("returnUrl"));
                return Mono.just(relayResult()); }).when(controller).send(anyMap(),eq("private-test-token"));
            for (String action:List.of("checkout", "portal")) assertNotNull(controller.request(action,body,request).block());
        }
    }
    @Test void publicCloudConfigurationRejectsCheckoutEvenWithForgedOrigins() {
        for (String publicUrl : List.of("https://app.lowcoder.cloud", "https://APP.LOWCODER.CLOUD/", "https://app.lowcoder.cloud.:443/")) {
            controller = mock(EnterpriseLicenseController.class,withSettings()
                    .useConstructor(sessions,config,capabilities,"https://flow.example/webhook/enterprise",publicUrl).defaultAnswer(CALLS_REAL_METHODS));
            ((com.fasterxml.jackson.databind.node.ObjectNode)body).put("returnOrigin", "https://self-hosted.example");
            ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> controller.request("checkout",body,request).block());
            assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
            verify(controller,never()).send(anyMap(),anyString());
        }
        verifyNoInteractions(capabilities);
    }
    @Test void publicCloudRequestHostRejectsCheckoutWithoutPublicUrlConfiguration() {
        controller = mock(EnterpriseLicenseController.class,withSettings()
                .useConstructor(sessions,config,capabilities,"https://flow.example/webhook/enterprise","").defaultAnswer(CALLS_REAL_METHODS));
        ((com.fasterxml.jackson.databind.node.ObjectNode)body).put("returnOrigin", "https://self-hosted.example");
        ServerHttpRequest cloudRequest = MockServerHttpRequest.post("https://app.lowcoder.cloud/api/enterprise-licenses/checkout").build();
        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> controller.request("checkout",body,cloudRequest).block());
        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(controller,never()).send(anyMap(),anyString());
        verifyNoInteractions(capabilities);
    }
    @Test void publicCloudReturnOriginCannotStartCheckoutThroughAnInternalHost() {
        ((com.fasterxml.jackson.databind.node.ObjectNode)body).put("returnOrigin", "https://app.lowcoder.cloud");
        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> controller.request("checkout",body,request).block());
        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(controller,never()).send(anyMap(),anyString());
        verifyNoInteractions(capabilities);
    }
    @Test void otherLowcoderHostsAndSimilarDomainsKeepCheckout() {
        for (String origin : List.of("https://lowcoder.cloud", "https://staging.lowcoder.cloud", "https://private.app.lowcoder.cloud",
                "https://app.lowcoder.cloud.example", "https://my-lowcoder.example")) {
            controller = mock(EnterpriseLicenseController.class,withSettings()
                    .useConstructor(sessions,config,capabilities,"https://flow.example/webhook/enterprise",origin).defaultAnswer(CALLS_REAL_METHODS));
            doReturn(Mono.just(relayResult())).when(controller).send(anyMap(),anyString());
            assertNotNull(controller.request("checkout",body,MockServerHttpRequest.post(origin + "/api/enterprise-licenses/checkout").build()).block());
            verify(controller).send(anyMap(),eq("private-test-token"));
        }
    }
    @Test void existingCloudPurchasesRemainManageableWithoutNewCheckout() {
        controller = mock(EnterpriseLicenseController.class,withSettings()
                .useConstructor(sessions,config,capabilities,"https://flow.example/webhook/enterprise","https://app.lowcoder.cloud").defaultAnswer(CALLS_REAL_METHODS));
        doReturn(Mono.just(relayResult())).when(controller).send(anyMap(),anyString());
        for (String action : List.of("status", "download", "portal")) {
            assertNotNull(controller.request(action,body,request).block());
        }
    }
    @Test void httpReturnExceptionDoesNotAllowRemoteHostsOrUrlTricks() {
        controller=mock(EnterpriseLicenseController.class,withSettings().useConstructor(sessions,config,capabilities,"https://flow.example/webhook/enterprise","").defaultAnswer(CALLS_REAL_METHODS));
        for (String origin:List.of("http://example.test", "http://localhost.evil.test", "http://127.0.0.1.evil.test",
                "http://localhost@evil.test", "http://evil.test@localhost", "http://192.168.1.2:8000", "http://localhost:0",
                "http://localhost:65536", "http://localhost:8000/other", "http://localhost?next=elsewhere", "http://localhost#other", "file:///tmp")) {
            ((com.fasterxml.jackson.databind.node.ObjectNode)body).put("returnOrigin",origin);
            assertThrows(ResponseStatusException.class,()->controller.request("checkout",body,request).block(),origin);
        }
        verify(controller,never()).send(anyMap(),anyString());
    }

    @Test void communityStatusAndOldClientSyncStayLocalWithoutCreatingCredentials() {
        when(capabilities.purchaseState("real-deployment", "org", "real-admin")).thenReturn(Mono.just(PurchaseState.NONE));
        for (String action : List.of("status", "sync")) {
            assertEquals(emptyLibrary(), controller.request(action, body, request).block().getData());
        }
        verify(capabilities, never()).token(anyString(), anyString(), anyString());
        verify(controller, never()).send(anyMap(), anyString());
    }

    @Test void openingLibraryExplicitlyCanDiscoverAnExistingPurchase() {
        when(capabilities.purchaseState("real-deployment", "org", "real-admin")).thenReturn(Mono.just(PurchaseState.NONE));
        ((com.fasterxml.jackson.databind.node.ObjectNode) body).put("refresh", true);
        controller.request("status", body, request).block();
        verify(controller).send(argThat(p -> "status".equals(p.get("action"))), anyString());
        verify(capabilities).recordPurchaseStatus("real-deployment", "org", "real-admin", true);
    }

    @Test void legacyCommunityCredentialIsCheckedWithoutGeneratingFiles() {
        when(capabilities.purchaseState("real-deployment", "org", "real-admin")).thenReturn(Mono.just(PurchaseState.UNKNOWN));
        doReturn(Mono.just(emptyLibrary())).when(controller).send(anyMap(), anyString());
        assertEquals(emptyLibrary(), controller.request("sync", body, request).block().getData());
        verify(controller).send(argThat(p -> "status".equals(p.get("action"))), anyString());
        verify(controller, never()).send(argThat(p -> "sync".equals(p.get("action"))), anyString());
        verify(capabilities).recordPurchaseStatus("real-deployment", "org", "real-admin", false);
    }

    @Test void legacyPurchaseOrInterruptedCheckoutCanActivateBeforeAnyLicenseIsInstalled() {
        when(capabilities.purchaseState("real-deployment", "org", "real-admin")).thenReturn(Mono.just(PurchaseState.UNKNOWN));
        assertNotNull(controller.request("sync", body, request).block());
        var sequence = inOrder(controller, capabilities);
        sequence.verify(controller).send(argThat(p -> "status".equals(p.get("action"))), anyString());
        sequence.verify(capabilities).recordPurchaseStatus("real-deployment", "org", "real-admin", true);
        sequence.verify(controller).send(argThat(p -> "sync".equals(p.get("action"))), anyString());
    }

    @Test void confirmedPurchaseContinuesToSyncForRenewals() {
        controller.request("sync", body, request).block();
        verify(controller).send(argThat(p -> "sync".equals(p.get("action"))), anyString());
        verify(controller, never()).send(argThat(p -> "status".equals(p.get("action"))), anyString());
    }

    @Test void checkoutIsRecordedBeforeRelayAndConfirmedOnlyAfterSuccess() {
        controller.request("checkout", body, request).block();
        var sequence = inOrder(controller, capabilities);
        sequence.verify(capabilities).checkoutAttempted("real-deployment", "org", "real-admin");
        sequence.verify(controller).send(anyMap(), anyString());
        sequence.verify(capabilities).recordPurchaseStatus("real-deployment", "org", "real-admin", true);
    }

    @Test void ambiguousCheckoutRemainsDiscoverableWithoutClaimingItSucceeded() {
        doReturn(Mono.error(new java.util.concurrent.TimeoutException("private relay detail"))).when(controller).send(anyMap(), anyString());
        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> controller.request("checkout", body, request).block());
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatusCode());
        verify(capabilities).checkoutAttempted("real-deployment", "org", "real-admin");
        verify(capabilities, never()).recordPurchaseStatus(anyString(), anyString(), anyString(), anyBoolean());
    }

    @Test void invalidRelayResultsCannotDisableRenewalsOrConfirmPurchases() {
        for (JsonNode result : List.of(mapper.createObjectNode(), mapper.valueToTree(Map.of("success", true)),
                mapper.valueToTree(Map.of("success", false, "orders", List.of(), "licenses", List.of())))) {
            doReturn(Mono.just(result)).when(controller).send(anyMap(), anyString());
            for (String action : List.of("status", "sync", "checkout")) {
                ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> controller.request(action, body, request).block());
                assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatusCode());
            }
        }
        verify(capabilities, never()).recordPurchaseStatus(anyString(), anyString(), anyString(), anyBoolean());
    }

    @Test void relayFailuresReturn503WithRetryAfterInsteadOfGlobal500() {
        WebTestClient client = webClient();
        for (Throwable cause : List.of(new java.net.UnknownHostException("private relay detail"),
                new java.io.IOException("Connection prematurely closed"), new java.util.concurrent.TimeoutException(),
                WebClientResponseException.create(500, "upstream", HttpHeaders.EMPTY, "private detail".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8))) {
            doReturn(Mono.error(cause)).when(controller).send(anyMap(), anyString());
            client.post().uri("/api/enterprise-licenses/sync").bodyValue(body).exchange()
                    .expectStatus().isEqualTo(503).expectHeader().valueEquals("Retry-After", "60")
                    .expectBody().jsonPath("$.code").isEqualTo(503)
                    .jsonPath("$.message").isEqualTo("Enterprise license service is temporarily unavailable. Please retry shortly.");
        }
    }

    @Test void authorizationAndValidationKeepTheirHttpStatus() {
        WebTestClient client = webClient();
        ((com.fasterxml.jackson.databind.node.ObjectNode) body).set("deploymentIds", mapper.valueToTree(List.of("foreign")));
        client.post().uri("/api/enterprise-licenses/checkout").bodyValue(body).exchange().expectStatus().isBadRequest();
        when(sessions.getVisitorOrgMember()).thenReturn(Mono.just(new OrgMember("org", "real-admin", MemberRole.MEMBER, "normal", 0)));
        client.post().uri("/api/enterprise-licenses/status").bodyValue(body).exchange().expectStatus().isForbidden();
        when(sessions.getVisitorOrgMember()).thenReturn(Mono.empty());
        client.post().uri("/api/enterprise-licenses/status").bodyValue(body).exchange().expectStatus().isUnauthorized();
    }
}
