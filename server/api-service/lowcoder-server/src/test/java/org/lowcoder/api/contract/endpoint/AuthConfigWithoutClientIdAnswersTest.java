package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.authentication.AuthenticationController;
import org.lowcoder.api.authentication.AuthenticationEndpoints;
import org.lowcoder.api.authentication.request.AuthRequestFactory;
import org.lowcoder.api.authentication.service.AuthenticationApiService;
import org.lowcoder.api.authentication.service.AuthenticationApiServiceImpl;
import org.lowcoder.api.authentication.service.factory.AuthConfigFactory;
import org.lowcoder.api.authentication.service.factory.AuthConfigFactoryFacade;
import org.lowcoder.api.authentication.service.factory.AuthConfigFactoryImpl;
import org.lowcoder.api.authentication.util.JWTUtils;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.InvitationApiService;
import org.lowcoder.api.usermanagement.OrgApiService;
import org.lowcoder.api.usermanagement.UserApiService;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationDomain;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.config.AuthProperties;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.util.CookieHelper;
import org.lowcoder.sdk.util.JsonUtils;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;

/**
 * NEW-34: {@code POST /api/auth/config} with an OAuth config that has no {@code clientId} answers INVALID_PARAMETER naming
 * {@code clientId} (HTTP 500, code 5002) and saves nothing; it used to answer a raw NullPointerException as an internal error.
 * The production {@link AuthenticationController}, {@link AuthenticationApiServiceImpl} and auth config factories (the
 * {@code @Primary} {@link AuthConfigFactoryFacade} over {@link AuthConfigFactoryImpl}, as Spring wires them) run in the
 * {@link ContractTestClient} harness; the service's other collaborators are mocked, the visitor an admin of {@link #ORG_ID}.
 * The endpoint has one mount ({@code NewUrl.CUSTOM_AUTH}, {@code /api/auth}).
 */
class AuthConfigWithoutClientIdAnswersTest {

    static final EndpointContract CONTRACT = new EndpointContract(AuthenticationEndpoints.class);
    static final String ENABLE_AUTH_CONFIG = "enableAuthConfig";
    static final String SERVICE_BEAN_NAME = "authenticationApiService";
    static final String ORG_ID = "AuthConfigWithoutClientIdAnswersTest.orgId";
    static final String USER_ID = "AuthConfigWithoutClientIdAnswersTest.userId";
    static final String CLIENT_ID = "AuthConfigWithoutClientIdAnswersTest.clientId";
    /** The name the refusal gives as its argument. */
    static final String CLIENT_ID_PARAMETER = "clientId";
    static final String AUTH_TYPE_KEY = "authType";
    static final String CLIENT_ID_KEY = "clientId";
    /** {@link AuthConfigFactoryFacade}'s injected factory list, set as Spring sets it. */
    static final String FACTORIES_FIELD = "factories";
    static final String LOG_PREFIX = "[AuthConfigWithoutClientIdAnswersTest] ";
    static final String NO_CONFIG_ADDED = "no config added";
    /** {@link OrganizationService#update}, counted in the printed line. */
    static final String UPDATE_METHOD = "update";

    private OrganizationService organizationService;
    private Organization organization;
    private AuthenticationApiService service;

    @BeforeEach
    void productionServiceAndFactories() {
        organizationService = Mockito.mock(OrganizationService.class);
        SessionUserService sessionUserService = Mockito.mock(SessionUserService.class);
        Mockito.when(sessionUserService.getVisitorOrgMemberCache())
                .thenReturn(Mono.just(OrgMember.builder().orgId(ORG_ID).userId(USER_ID).role(MemberRole.ADMIN).build()));
        OrganizationDomain domain = new OrganizationDomain();
        domain.setConfigs(new ArrayList<>());
        organization = Organization.builder().id(ORG_ID).build();
        organization.setOrganizationDomain(domain);
        Mockito.when(organizationService.getById(ORG_ID)).thenReturn(Mono.just(organization));
        Mockito.when(organizationService.update(anyString(), any())).thenReturn(Mono.just(Boolean.TRUE));
        AuthConfigFactoryFacade factories = new AuthConfigFactoryFacade();
        ReflectionTestUtils.setField(factories, FACTORIES_FIELD, List.<AuthConfigFactory>of(factories, new AuthConfigFactoryImpl()));
        factories.init();
        @SuppressWarnings("unchecked")
        AuthRequestFactory<AuthRequestContext> authRequestFactory = Mockito.mock(AuthRequestFactory.class);
        service = new AuthenticationApiServiceImpl(Mockito.mock(OrgApiService.class), organizationService, authRequestFactory,
                Mockito.mock(AuthenticationService.class), Mockito.mock(UserService.class), Mockito.mock(InvitationApiService.class),
                Mockito.mock(BusinessEventPublisher.class), sessionUserService, Mockito.mock(CookieHelper.class), factories,
                Mockito.mock(UserApiService.class), Mockito.mock(OrgMemberService.class), Mockito.mock(JWTUtils.class),
                Mockito.mock(AuthProperties.class), Mockito.mock(CommonConfig.class), Mockito.mock(GroupMemberService.class));
    }

    private ContractTestClient client() {
        return ContractTestClient.builder().singleton(SERVICE_BEAN_NAME, service)
                .controllerWithMockedDependencies(AuthenticationController.class).build();
    }

    private EntityExchangeResult<byte[]> post(Map<String, Object> body) {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, ENABLE_AUTH_CONFIG, Map.of(), JsonUtils.toJson(body));
            System.out.println(LOG_PREFIX + "POST " + JsonUtils.toJson(body) + " -> " + result.getStatus() + " "
                    + new String(result.getResponseBodyContent() == null ? new byte[0] : result.getResponseBodyContent()));
            return result;
        }
    }

    /** Each OAuth type without a client id is refused naming the field, and the organization is not updated. */
    @ParameterizedTest(name = "authType={0}")
    @ValueSource(strings = {AuthTypeConstants.GITHUB, AuthTypeConstants.GOOGLE, AuthTypeConstants.ORY, AuthTypeConstants.KEYCLOAK,
            AuthTypeConstants.GENERIC})
    void anOauthConfigWithoutAClientIdIsAnInvalidParameterNEW34(String authType) {
        assertRefusedAndNothingSaved(post(Map.of(AUTH_TYPE_KEY, authType)));
    }

    /** A client id sent as JSON {@code null} is refused as one left out. */
    @Test
    void anOauthConfigWithANullClientIdIsAnInvalidParameterNEW34() {
        Map<String, Object> body = new HashMap<>();
        body.put(AUTH_TYPE_KEY, AuthTypeConstants.GITHUB);
        body.put(CLIENT_ID_KEY, null);

        assertRefusedAndNothingSaved(post(body));
    }

    /** Nothing saved is checked first, so that a run against code that answers otherwise still checks it. */
    private void assertRefusedAndNothingSaved(EntityExchangeResult<byte[]> result) {
        System.out.println(LOG_PREFIX + "organization updates " + Mockito.mockingDetails(organizationService).getInvocations().stream()
                .filter(invocation -> invocation.getMethod().getName().equals(UPDATE_METHOD)).count() + ", configs " + organization.getAuthConfigs());
        Mockito.verify(organizationService, Mockito.never()).update(anyString(), any());
        assertThat(organization.getAuthConfigs()).as(NO_CONFIG_ADDED).isEmpty();
        EndpointContract.assertInvalidParameter(result, CLIENT_ID_PARAMETER);
    }

    /** The control: the same request with a client id reaches the save, so the refusal above is the client id's. */
    @Test
    void anOauthConfigWithAClientIdIsSaved() {
        EntityExchangeResult<byte[]> result = post(Map.of(AUTH_TYPE_KEY, AuthTypeConstants.GITHUB, CLIENT_ID_KEY, CLIENT_ID));

        EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(null));
        Mockito.verify(organizationService).update(ORG_ID, organization);
        List<AbstractAuthConfig> configs = organization.getAuthConfigs();
        assertThat(configs).hasSize(1);
        assertThat(configs.get(0)).isInstanceOfSatisfying(Oauth2SimpleAuthConfig.class,
                config -> assertThat(config.getClientId()).isEqualTo(CLIENT_ID));
    }
}
