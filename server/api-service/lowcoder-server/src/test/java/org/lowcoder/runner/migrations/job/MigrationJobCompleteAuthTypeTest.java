package org.lowcoder.runner.migrations.job;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationDomain;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit K3 (task L2-12, lane L5): {@code CompleteAuthTypeImpl}, the job behind changeset 018 ({@code complete-auth-type}): it reads
 * the organizations that have a domain, sets the auth type of their e-mail configs to {@code FORM}, leaves every other config
 * alone, skips organizations without configs, and updates each of the others once. Mockito only.
 *
 * <p>Limits: the query is captured and read, not run against a database.
 */
@ExtendWith(MockitoExtension.class)
public class MigrationJobCompleteAuthTypeTest {

    static final String TAG = "[MigrationJobCompleteAuthTypeTest] ";
    static final String ORG_ONE = "org-1";
    static final String ORG_TWO = "org-2";
    static final String ORG_EMPTY = "org-empty";

    @Mock
    private ReactiveMongoTemplate reactiveMongoTemplate;
    @Mock
    private OrganizationService organizationService;
    @InjectMocks
    private CompleteAuthTypeImpl job;

    private static Organization organization(String id, List<AbstractAuthConfig> configs) {
        Organization organization = new Organization();
        organization.setId(id);
        OrganizationDomain domain = new OrganizationDomain();
        domain.setConfigs(new ArrayList<>(configs));
        organization.setOrganizationDomain(domain);
        return organization;
    }

    private static Oauth2SimpleAuthConfig oauth() {
        return Oauth2SimpleAuthConfig.builder().id("g").source("GOOGLE").sourceName("GOOGLE").enable(true).enableRegister(true).clientId("c").clientSecret("s").build();
    }

    @Test
    public void injectionReachedEveryField() {
        assertSame(reactiveMongoTemplate, ReflectionTestUtils.getField(job, "reactiveMongoTemplate"));
        assertSame(organizationService, ReflectionTestUtils.getField(job, "organizationService"));
    }

    @Test
    public void emailConfigsGetFormAndOthersAreLeftAloneAndEachOrganizationIsUpdatedOnce() {
        EmailAuthConfig email = new EmailAuthConfig("e", true, true);
        ReflectionTestUtils.setField(email, "authType", "OTHER");
        Oauth2SimpleAuthConfig google = oauth();
        String googleType = google.getAuthType();
        Organization one = organization(ORG_ONE, List.of(email, google));
        EmailAuthConfig secondEmail = new EmailAuthConfig("e2", true, false);
        ReflectionTestUtils.setField(secondEmail, "authType", null);
        Organization two = organization(ORG_TWO, List.of(secondEmail));
        Organization empty = organization(ORG_EMPTY, List.of());
        when(reactiveMongoTemplate.find(any(Query.class), eq(Organization.class))).thenReturn(Flux.just(one, empty, two));
        when(organizationService.update(anyString(), any(Organization.class))).thenReturn(Mono.just(true));

        job.complete();

        assertEquals(AuthTypeConstants.FORM, email.getAuthType(), "an e-mail config is completed, over any previous type");
        assertEquals(AuthTypeConstants.FORM, secondEmail.getAuthType(), "also from a missing type");
        assertEquals(googleType, google.getAuthType(), "a config of another kind is not touched");
        ArgumentCaptor<String> ids = ArgumentCaptor.forClass(String.class);
        verify(organizationService, times(2)).update(ids.capture(), any(Organization.class));
        assertEquals(List.of(ORG_ONE, ORG_TWO), ids.getAllValues());
        verify(organizationService, never()).update(eq(ORG_EMPTY), any(Organization.class));
    }

    @Test
    public void theQuerySelectsOrganizationsThatHaveADomain() {
        when(reactiveMongoTemplate.find(any(Query.class), eq(Organization.class))).thenReturn(Flux.empty());
        job.complete();
        ArgumentCaptor<Query> query = ArgumentCaptor.forClass(Query.class);
        verify(reactiveMongoTemplate).find(query.capture(), eq(Organization.class));
        String text = query.getValue().getQueryObject().toJson();
        System.out.println(TAG + "query: " + text);
        assertTrue(text.contains("organizationDomain") && text.contains("$ne"), text);
        assertNotNull(query.getValue().getQueryObject().get("organizationDomain"));
        verify(organizationService, never()).update(anyString(), any(Organization.class));
    }

    @Test
    public void completeAuthTypeSetsFormOnlyOnEmailConfigs() {
        EmailAuthConfig email = new EmailAuthConfig("e", true, true);
        ReflectionTestUtils.setField(email, "authType", "OTHER");
        job.completeAuthType(email);
        assertEquals(AuthTypeConstants.FORM, email.getAuthType());
        Oauth2SimpleAuthConfig google = oauth();
        String before = google.getAuthType();
        job.completeAuthType(google);
        assertEquals(before, google.getAuthType());
    }
}
