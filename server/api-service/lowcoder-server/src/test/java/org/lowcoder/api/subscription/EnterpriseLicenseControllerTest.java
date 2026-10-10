package org.lowcoder.api.subscription;
import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.*;
import org.lowcoder.api.home.SessionUserService;
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
    final SessionUserService sessions = mock(SessionUserService.class);
    final ConfigCenter config = mock(ConfigCenter.class, RETURNS_DEEP_STUBS);
    EnterpriseLicenseController controller;
    JsonNode body;
    @BeforeEach void setup() {
        controller = spy(new EnterpriseLicenseController(sessions,config,"https://flow.example/webhook/enterprise","private-test-token","https://ui.example"));
        when(sessions.getVisitorOrgMember()).thenReturn(Mono.just(new OrgMember("org","real-admin",MemberRole.ADMIN,"normal",0)));
        when(config.deployment().ofString("id", "").get()).thenReturn("real-deployment");
        body=mapper.valueToTree(Map.of("orgId","org","userId","forged","hostId","forged","requestId","00000000-0000-4000-8000-000000000001",
            "billingInterval","year","deploymentIds",List.of("real-deployment","other-deployment"),"contactData",Map.of("companyName","Company")));
        doReturn(Mono.just(mapper.valueToTree(Map.of("success",true)))).when(controller).send(anyMap());
    }
    @Test void ownerAndCurrentDeploymentComeOnlyFromSessionAndServerConfig() {
        doAnswer(call->{ Map<String,Object> p=call.getArgument(0);
            assertEquals("real-admin",p.get("userId")); assertEquals("real-deployment",p.get("hostId")); assertEquals("org",p.get("orgId"));
            assertEquals("https://ui.example/setting/subscription?enterpriseLicense=return",p.get("returnUrl")); assertFalse(p.containsKey("priceId"));
            return Mono.just(mapper.valueToTree(Map.of("success",true))); }).when(controller).send(anyMap());
        assertNotNull(controller.request("checkout",body).block());
    }
    @Test void membersAndFormerAdminsCannotRetrieveOrGenerateFiles() {
        when(sessions.getVisitorOrgMember()).thenReturn(Mono.just(new OrgMember("org","real-admin",MemberRole.MEMBER,"normal",0)));
        for(String action:List.of("checkout","sync","status","download","portal"))
            assertThrows(ResponseStatusException.class,()->controller.request(action,body).block());
        verify(controller,never()).send(anyMap());
    }
    @Test void foreignWorkspaceIsDenied() {
        assertThrows(ResponseStatusException.class,()->controller.request("status",mapper.valueToTree(Map.of("orgId","other"))).block());
        verify(controller,never()).send(anyMap());
    }
    @Test void anonymousSessionIsDenied() {
        when(sessions.getVisitorOrgMember()).thenReturn(Mono.empty());
        assertThrows(ResponseStatusException.class,()->controller.request("sync",body).block()); verify(controller,never()).send(anyMap());
    }
    @Test void firstDeploymentCannotBeSubstituted() {
        ((com.fasterxml.jackson.databind.node.ObjectNode)body).set("deploymentIds",mapper.valueToTree(List.of("foreign")));
        assertThrows(ResponseStatusException.class,()->controller.request("checkout",body).block()); verify(controller,never()).send(anyMap());
    }
    @Test void downloadScopeCannotBeOverriddenByRequestFields() {
        doAnswer(call->{ Map<String,Object> p=call.getArgument(0); assertEquals("real-admin",p.get("userId"));
            assertEquals("real-deployment",p.get("hostId")); assertFalse(p.containsKey("customerId"));assertFalse(p.containsKey("returnUrl"));
            return Mono.just(mapper.valueToTree(Map.of("success",true))); }).when(controller).send(anyMap());
        assertNotNull(controller.request("download",body).block());
    }
    @Test void missingRelayConfigurationFailsClosed() {
        controller=spy(new EnterpriseLicenseController(sessions,config,"","","https://ui.example"));
        assertThrows(ResponseStatusException.class,()->controller.request("checkout",body).block());verify(controller,never()).send(anyMap());
    }
}
