package org.lowcoder.api.authentication;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.lowcoder.domain.authentication.AuthenticationServiceImpl;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.config.AuthProperties;
import org.lowcoder.sdk.config.CommonConfig;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * This class is for testing GenericAuth feature
 */
@SpringBootTest
@RunWith(SpringRunner.class)
public class GenericAuthenticateTest {

    @InjectMocks
    AuthenticationServiceImpl mockAuthenticationService;

    @Mock
    OrgMemberService mockOrgMemberService;

    @Mock
    OrganizationService mockOrganizationService;

    @Mock
    private AuthProperties authProperties;

    @Mock
    private CommonConfig commonConfig;

    @Test
    public  void findAllAuthConfigsTest() throws Exception {
        String orgId = "org123";
        boolean enableOnly = true;

        // Create mock objects
        Organization mockOrganization = mock(Organization.class);
        List<AbstractAuthConfig> mockAuthConfigs = Arrays.asList();
        CommonConfig.Workspace mockedWorkspace = new CommonConfig.Workspace();

        // Mock functions
        when(mockOrganization.getAuthConfigs()).thenReturn(mockAuthConfigs);
        when(mockOrganizationService.getByDomain()).thenReturn(Mono.just(mockOrganization));
        when(mockOrganizationService.getById(orgId)).thenReturn(Mono.just(mockOrganization));
        when(mockOrgMemberService.doesAtleastOneAdminExist()).thenReturn(Mono.just(true));
        when(commonConfig.getWorkspace()).thenReturn(mockedWorkspace);

        // Mocking auth properties email configuration
        AuthProperties.Email emailConfig = new AuthProperties.Email();
        emailConfig.setEnable(true);
        emailConfig.setEnableRegister(true);
        when(authProperties.getEmail()).thenReturn(emailConfig);

        // Use reflection to access the private method
        Method findAllAuthConfigsByDomain = AuthenticationServiceImpl.class.getDeclaredMethod("findAllAuthConfigsByDomain");
        findAllAuthConfigsByDomain.setAccessible(true);
        Method findAllAuthConfigsForEnterpriseMode = AuthenticationServiceImpl.class.getDeclaredMethod("findAllAuthConfigsForEnterpriseMode");
        findAllAuthConfigsForEnterpriseMode.setAccessible(true);
        Method findAllAuthConfigsForSaasMode = AuthenticationServiceImpl.class.getDeclaredMethod("findAllAuthConfigsForSaasMode", String.class);
        findAllAuthConfigsForSaasMode.setAccessible(true);

        // Act & Assert
        StepVerifier.create(mockAuthenticationService.findAllAuthConfigs(orgId, enableOnly))
                .expectNextMatches(findAuthConfig -> findAuthConfig.authConfig().isEnable())
                .verifyComplete();
    }
}
