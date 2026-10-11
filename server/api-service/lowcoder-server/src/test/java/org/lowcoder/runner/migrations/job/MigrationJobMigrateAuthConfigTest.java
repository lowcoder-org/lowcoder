package org.lowcoder.runner.migrations.job;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationDomain;
import org.lowcoder.domain.organization.repository.OrganizationRepository;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.config.AuthProperties;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit K3 (task L2-12, lane L5): {@code MigrateAuthConfigJobImpl}, the job behind changeset 017 ({@code migrate-auth-configs}):
 * in SAAS mode every organization that has a domain gets new ids and switched-on login and registration for its auth configs;
 * in enterprise mode the organization of the instance gets the configs of the server's {@code AuthProperties} as its domain
 * configs, minus the e-mail source. Mockito only: the services, the repository and the config are mocks, the organizations and
 * auth configs are real objects.
 *
 * <p>Limits: no database; the update is a mock, so what it would persist is not under test.
 */
@ExtendWith(MockitoExtension.class)
public class MigrationJobMigrateAuthConfigTest {

    static final String TAG = "[MigrationJobMigrateAuthConfigTest] ";
    static final String ORG_ONE = "org-1";
    static final String ORG_TWO = "org-2";
    static final String OLD_ID = "old-id";

    @Mock
    private OrganizationService organizationService;
    @Mock
    private CommonConfig commonConfig;
    @Mock
    private AuthProperties authProperties;
    @Mock
    private OrganizationRepository organizationRepository;
    @InjectMocks
    private MigrateAuthConfigJobImpl job;

    private static Organization organization(String id, List<AbstractAuthConfig> configs) {
        Organization organization = new Organization();
        organization.setId(id);
        OrganizationDomain domain = new OrganizationDomain();
        domain.setConfigs(new ArrayList<>(configs));
        organization.setOrganizationDomain(domain);
        return organization;
    }

    private static Oauth2SimpleAuthConfig oauth(String id, String source) {
        return Oauth2SimpleAuthConfig.builder().id(id).source(source).sourceName(source).enable(false).enableRegister(false).clientId("c").clientSecret("s").build();
    }

    private void mode(WorkspaceMode mode) {
        CommonConfig.Workspace workspace = new CommonConfig.Workspace();
        workspace.setMode(mode);
        when(commonConfig.getWorkspace()).thenReturn(workspace);
    }

    /** Every field of the job received its mock (a constructor or field mismatch would leave one null and fail here). */
    @Test
    public void injectionReachedEveryField() {
        for (String field : List.of("organizationService", "commonConfig", "authProperties", "organizationRepository")) {
            assertNotNull(ReflectionTestUtils.getField(job, field), field);
        }
        assertSame(organizationService, ReflectionTestUtils.getField(job, "organizationService"));
        assertSame(commonConfig, ReflectionTestUtils.getField(job, "commonConfig"));
        assertSame(authProperties, ReflectionTestUtils.getField(job, "authProperties"));
        assertSame(organizationRepository, ReflectionTestUtils.getField(job, "organizationRepository"));
    }

    @Test
    public void saasModeGivesEveryConfigANewIdAndSwitchesLoginAndRegistrationOn() {
        mode(WorkspaceMode.SAAS);
        Organization one = organization(ORG_ONE, List.of(oauth(OLD_ID, "GOOGLE"), new EmailAuthConfig(OLD_ID, false, false)));
        Organization two = organization(ORG_TWO, List.of(oauth(OLD_ID, "GITHUB")));
        when(organizationRepository.findByOrganizationDomainIsNotNull()).thenReturn(Flux.just(one, two));
        when(organizationService.update(anyString(), any(Organization.class))).thenReturn(Mono.just(true));

        job.migrateAuthConfig();

        ArgumentCaptor<Organization> updated = ArgumentCaptor.forClass(Organization.class);
        ArgumentCaptor<String> ids = ArgumentCaptor.forClass(String.class);
        verify(organizationService, times(2)).update(ids.capture(), updated.capture());
        assertEquals(List.of(ORG_ONE, ORG_TWO), ids.getAllValues());
        assertSame(one, updated.getAllValues().get(0));
        assertSame(two, updated.getAllValues().get(1));
        for (Organization organization : List.of(one, two)) {
            for (AbstractAuthConfig config : organization.getAuthConfigs()) {
                System.out.println(TAG + organization.getId() + " " + config.getSource() + " id=" + config.getId() + " enable=" + config.isEnable() + " register=" + config.isEnableRegister());
                assertNotEquals(OLD_ID, config.getId(), "a new id");
                assertTrue(config.isEnable());
                assertTrue(config.isEnableRegister());
            }
        }
        assertNotEquals(one.getAuthConfigs().get(0).getId(), one.getAuthConfigs().get(1).getId(), "each config gets its own id");
        verify(organizationService, never()).getOrganizationInEnterpriseMode();
    }

    @Test
    public void saasModeWithNoOrganizationUpdatesNothingAndDoesNotFail() {
        mode(WorkspaceMode.SAAS);
        when(organizationRepository.findByOrganizationDomainIsNotNull()).thenReturn(Flux.empty());
        job.migrateAuthConfig();
        verify(organizationService, never()).update(anyString(), any(Organization.class));
    }

    @Test
    public void enterpriseModeCopiesThePropertyConfigsToTheDomainWithoutTheEmailSource() {
        mode(WorkspaceMode.ENTERPRISE);
        Organization instanceOrganization = new Organization();
        instanceOrganization.setId(ORG_ONE);
        assertNull(instanceOrganization.getOrganizationDomain());
        when(organizationService.getOrganizationInEnterpriseMode()).thenReturn(Mono.just(instanceOrganization));
        EmailAuthConfig email = new EmailAuthConfig(null, true, true);
        Oauth2SimpleAuthConfig google = oauth(null, "GOOGLE");
        Oauth2SimpleAuthConfig github = oauth(null, "GITHUB");
        when(authProperties.getAuthConfigs()).thenReturn(List.of(email, google, github));
        when(organizationService.update(anyString(), any(Organization.class))).thenReturn(Mono.just(true));

        job.migrateAuthConfig();

        OrganizationDomain domain = instanceOrganization.getOrganizationDomain();
        assertNotNull(domain, "the domain is created when the organization has none");
        assertEquals(List.of("GOOGLE", "GITHUB"), domain.getConfigs().stream().map(AbstractAuthConfig::getSource).toList(), "the e-mail source is dropped, the order kept");
        assertNotEquals("GOOGLE", google.getId(), "an unset id reads as the source, so a generated id differs from it");
        assertNotEquals("GITHUB", github.getId());
        assertNotEquals(google.getId(), github.getId());
        verify(organizationService).update(ORG_ONE, instanceOrganization);
        verify(organizationRepository, never()).findByOrganizationDomainIsNotNull();
    }

    @Test
    public void enterpriseModeKeepsAnExistingDomainAndItsDomainName() {
        mode(WorkspaceMode.ENTERPRISE);
        Organization instanceOrganization = organization(ORG_ONE, List.of());
        instanceOrganization.getOrganizationDomain().setDomain("corp.example.com");
        OrganizationDomain existing = instanceOrganization.getOrganizationDomain();
        when(organizationService.getOrganizationInEnterpriseMode()).thenReturn(Mono.just(instanceOrganization));
        when(authProperties.getAuthConfigs()).thenReturn(List.of(oauth(null, "GOOGLE")));
        when(organizationService.update(anyString(), any(Organization.class))).thenReturn(Mono.just(true));
        job.migrateAuthConfig();
        assertSame(existing, instanceOrganization.getOrganizationDomain());
        assertEquals("corp.example.com", existing.getDomain());
        assertEquals(1, existing.getConfigs().size());
    }

    /**
     * Observation: with no configured authentication ({@code AuthProperties} gives an empty list) the enterprise branch is a no-op on
     * the organization (no domain is created, nothing is replaced) but the organization is still updated.
     */
    @Test
    public void enterpriseModeWithNoConfiguredAuthLeavesTheOrganizationAsItIsButStillUpdatesIt() {
        mode(WorkspaceMode.ENTERPRISE);
        Organization instanceOrganization = organization(ORG_ONE, List.of(oauth("keep", "GOOGLE")));
        when(organizationService.getOrganizationInEnterpriseMode()).thenReturn(Mono.just(instanceOrganization));
        when(authProperties.getAuthConfigs()).thenReturn(List.of());
        when(organizationService.update(anyString(), any(Organization.class))).thenReturn(Mono.just(true));
        job.migrateAuthConfig();
        assertEquals(List.of("keep"), instanceOrganization.getAuthConfigs().stream().map(AbstractAuthConfig::getId).toList());
        verify(organizationService).update(ORG_ONE, instanceOrganization);

        Organization bare = new Organization();
        bare.setId(ORG_TWO);
        job.setAuthConfigs2OrganizationDomain(bare, null);
        assertNull(bare.getOrganizationDomain(), "a null list is also a no-op");
    }

    /**
     * Observation (server-controlled data, run once at migration time): a property config whose source is null makes the filter throw a
     * NullPointerException, and an error from the update propagates raw out of the job (the changeset would fail the start-up).
     */
    @Test
    public void aNullSourceAndAFailingUpdateAreRawErrors() {
        mode(WorkspaceMode.ENTERPRISE);
        Organization instanceOrganization = new Organization();
        instanceOrganization.setId(ORG_ONE);
        when(organizationService.getOrganizationInEnterpriseMode()).thenReturn(Mono.just(instanceOrganization));
        when(authProperties.getAuthConfigs()).thenReturn(List.of(oauth(null, null)));
        assertThrows(NullPointerException.class, () -> job.migrateAuthConfig());

        Organization other = organization(ORG_TWO, List.of(oauth(OLD_ID, "GOOGLE")));
        when(organizationService.getOrganizationInEnterpriseMode()).thenReturn(Mono.just(other));
        when(authProperties.getAuthConfigs()).thenReturn(List.of(oauth(null, "GOOGLE")));
        when(organizationService.update(anyString(), any(Organization.class))).thenReturn(Mono.error(new IllegalStateException("update failed")));
        IllegalStateException thrown = assertThrows(IllegalStateException.class, () -> job.migrateAuthConfig());
        assertEquals("update failed", thrown.getMessage());
    }

    /** The real {@code AuthProperties} builds a fresh list on every call, so the ids the job writes do not stay in the properties. */
    @Test
    public void realAuthPropertiesGiveFreshConfigsEachCall() {
        AuthProperties properties = new AuthProperties();
        properties.getEmail().setEnable(true);
        List<AbstractAuthConfig> first = properties.getAuthConfigs();
        List<AbstractAuthConfig> second = properties.getAuthConfigs();
        assertEquals(1, first.size());
        assertEquals(AuthSourceConstants.EMAIL, first.get(0).getSource());
        assertTrue(first.get(0) != second.get(0));
    }
}
