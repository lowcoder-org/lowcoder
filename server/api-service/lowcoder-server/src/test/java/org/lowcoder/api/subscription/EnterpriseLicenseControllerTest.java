package org.lowcoder.api.subscription;
import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.*;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.enterprise.EnterpriseLicenseCapabilityService;
import org.lowcoder.domain.organization.model.*;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EnterpriseLicenseControllerTest {
    final ObjectMapper mapper = new ObjectMapper();
    final SessionUserService sessions = mock(SessionUserService.class,withSettings().mockMaker("mock-maker-subclass"));
    final ConfigCenter config = mock(ConfigCenter.class,withSettings().mockMaker("mock-maker-subclass").defaultAnswer(RETURNS_DEEP_STUBS));
    final EnterpriseLicenseCapabilityService capabilities = mock(EnterpriseLicenseCapabilityService.class,withSettings().mockMaker("mock-maker-subclass"));
    EnterpriseLicenseController controller;
    JsonNode body;
    @BeforeEach void setup() {
        controller = mock(EnterpriseLicenseController.class,withSettings().mockMaker("mock-maker-subclass").useConstructor(sessions,config,capabilities,"https://flow.example/webhook/enterprise","https://ui.example").defaultAnswer(CALLS_REAL_METHODS));
        when(capabilities.token("real-deployment","org","real-admin")).thenReturn(Mono.just("private-test-token"));
        when(sessions.getVisitorOrgMember()).thenReturn(Mono.just(new OrgMember("org","real-admin",MemberRole.ADMIN,"normal",0)));
        when(config.deployment().ofString("id", "").get()).thenReturn("real-deployment");
        body=mapper.valueToTree(Map.of("orgId","org","userId","forged","hostId","forged","requestId","00000000-0000-4000-8000-000000000001",
            "billingInterval","year","deploymentIds",List.of("real-deployment","other-deployment"),"contactData",Map.of("companyName","Company")));
        doReturn(Mono.just(mapper.valueToTree(Map.of("success",true)))).when(controller).send(anyMap(),eq("private-test-token"));
    }
    @Test void ownerAndCurrentDeploymentComeOnlyFromSessionAndServerConfig() {
        doAnswer(call->{ Map<String,Object> p=call.getArgument(0);
            assertEquals("real-admin",p.get("userId")); assertEquals("real-deployment",p.get("hostId")); assertEquals("org",p.get("orgId"));
            assertEquals("https://ui.example/setting/subscription?enterpriseLicense=return",p.get("returnUrl")); assertFalse(p.containsKey("priceId"));
            return Mono.just(mapper.valueToTree(Map.of("success",true))); }).when(controller).send(anyMap(),eq("private-test-token"));
        assertNotNull(controller.request("checkout",body).block());
    }
    @Test void membersAndFormerAdminsCannotRetrieveOrGenerateFiles() {
        when(sessions.getVisitorOrgMember()).thenReturn(Mono.just(new OrgMember("org","real-admin",MemberRole.MEMBER,"normal",0)));
        for(String action:List.of("checkout","sync","status","download","portal"))
            assertThrows(ResponseStatusException.class,()->controller.request(action,body).block());
        verify(controller,never()).send(anyMap(),eq("private-test-token"));
    }
    @Test void foreignWorkspaceIsDenied() {
        assertThrows(ResponseStatusException.class,()->controller.request("status",mapper.valueToTree(Map.of("orgId","other"))).block());
        verify(controller,never()).send(anyMap(),eq("private-test-token"));
    }
    @Test void anonymousSessionIsDenied() {
        when(sessions.getVisitorOrgMember()).thenReturn(Mono.empty());
        assertThrows(ResponseStatusException.class,()->controller.request("sync",body).block()); verify(controller,never()).send(anyMap(),eq("private-test-token"));
    }
    @Test void firstDeploymentCannotBeSubstituted() {
        ((com.fasterxml.jackson.databind.node.ObjectNode)body).set("deploymentIds",mapper.valueToTree(List.of("foreign")));
        assertThrows(ResponseStatusException.class,()->controller.request("checkout",body).block()); verify(controller,never()).send(anyMap(),eq("private-test-token"));
    }
    @Test void downloadScopeCannotBeOverriddenByRequestFields() {
        doAnswer(call->{ Map<String,Object> p=call.getArgument(0); assertEquals("real-admin",p.get("userId"));
            assertEquals("real-deployment",p.get("hostId")); assertFalse(p.containsKey("customerId"));assertFalse(p.containsKey("returnUrl"));
            return Mono.just(mapper.valueToTree(Map.of("success",true))); }).when(controller).send(anyMap(),eq("private-test-token"));
        assertNotNull(controller.request("download",body).block());
    }
    @Test void missingRelayConfigurationFailsClosed() {
        controller=mock(EnterpriseLicenseController.class,withSettings().mockMaker("mock-maker-subclass").useConstructor(sessions,config,capabilities,"","https://ui.example").defaultAnswer(CALLS_REAL_METHODS));
        assertThrows(ResponseStatusException.class,()->controller.request("checkout",body).block());verify(controller,never()).send(anyMap(),eq("private-test-token"));
    }
}
