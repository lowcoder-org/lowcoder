package org.lowcoder.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.lowcoder.domain.organization.model.OrganizationState.ACTIVE;
import static org.lowcoder.domain.organization.model.OrganizationState.DELETED;
import static org.lowcoder.infra.birelation.BiRelationBizType.GROUP_MEMBER;
import static org.lowcoder.infra.birelation.BiRelationBizType.ORG_MEMBER;

import java.util.Locale;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.organization.model.OrganizationDomain;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.infra.birelation.BiRelation;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.constants.GlobalContext;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Organisation creation, default organisations, enterprise-mode lookup and domain lookup of OrganizationServiceImpl (unit
 * U14, task L3-11b). They depend on state of the WHOLE database (the first active org, the single super-admin user, the
 * org count) and on the global workspace mode, so the class has a Spring context and database of its own (extra property);
 * its collections are emptied before every test and the CommonConfig singleton is restored after every test.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
@TestPropertySource(properties = "l3_11b.context=org-creation")
class OrganizationServiceImplCreationMongoTest extends OrganizationMongoTestBase {

    private static final String ENGLISH_SUFFIX = "'s workspace";
    private static final String CHINESE_SUFFIX = "的工作区";

    @Autowired
    private OrganizationService organizationService;
    @Autowired
    private CommonConfig commonConfig;

    private WorkspaceMode originalMode;
    private String originalEnterpriseOrgId;

    @BeforeEach
    void emptyTheCollectionsAndRememberTheConfiguration() {
        mongo.remove(new Query(), BiRelation.class).block(TIMEOUT);
        mongo.remove(new Query(), Organization.class).block(TIMEOUT);
        mongo.remove(new Query(), Group.class).block(TIMEOUT);
        mongo.remove(new Query(), User.class).block(TIMEOUT);
        originalMode = commonConfig.getWorkspace().getMode();
        originalEnterpriseOrgId = commonConfig.getWorkspace().getEnterpriseOrgId();
        commonConfig.getWorkspace().setMode(WorkspaceMode.SAAS);
    }

    @AfterEach
    void restoreTheConfiguration() {
        commonConfig.getWorkspace().setMode(originalMode);
        commonConfig.getWorkspace().setEnterpriseOrgId(originalEnterpriseOrgId);
    }

    private Organization newOrg(String name) {
        return Organization.builder().name(name).gid(UUID.randomUUID().toString()).build();
    }

    private Organization stored(String orgId) {
        return mongo.findById(orgId, Organization.class).block(TIMEOUT);
    }

    private User user(String name, boolean superAdmin) {
        return mongo.save(User.builder().name(name).superAdmin(superAdmin).build()).block(TIMEOUT);
    }

    private Organization saveOrg(OrganizationState state, String name) {
        return mongo.save(Organization.builder().name(name).gid(UUID.randomUUID().toString()).state(state).build()).block(TIMEOUT);
    }

    private long orgCount() {
        return mongo.count(new Query(), Organization.class).block(TIMEOUT);
    }

    // ------------------------------------------------------------------ create

    /** Catches: an org created from a null or an already stored organisation (an id means "not new"). */
    @Test
    void createRejectsANullOrganisationAndOneThatAlreadyHasAnId() {
        BizException nullOrg = assertThrows(BizException.class, () -> organizationService.create(null, newId(), false).block(TIMEOUT));
        assertThat(nullOrg.getError()).isEqualTo(BizError.INVALID_PARAMETER);

        Organization withId = newOrg("has-id");
        withId.setId(newId());
        BizException hasId = assertThrows(BizException.class, () -> organizationService.create(withId, newId(), false).block(TIMEOUT));
        assertThat(hasId.getError()).isEqualTo(BizError.INVALID_PARAMETER);
        assertThat(orgCount()).isZero();
    }

    /** Catches: a new org that is not ACTIVE, lacks its reset template or system groups, or whose creator has the wrong role. */
    @Test
    void createStoresAnActiveOrgWithTheDefaultTemplateGroupsAndAnAdminCreator() {
        String creator = newId();

        Organization created = organizationService.create(newOrg("fresh"), creator, false).block(TIMEOUT);

        Organization stored = stored(created.getId());
        System.out.println("[OrganizationServiceImplCreationMongoTest] created " + stored.getId() + " state " + stored.getState());
        assertThat(stored.getState()).isEqualTo(ACTIVE);
        assertThat(stored.getCommonSettings()).containsEntry(OrganizationCommonSettings.PASSWORD_RESET_EMAIL_TEMPLATE,
                OrganizationService.PASSWORD_RESET_EMAIL_TEMPLATE_DEFAULT);
        Group allUsers = groupService.getAllUsersGroup(created.getId()).block(TIMEOUT);
        assertThat(allUsers).isNotNull();
        assertThat(groupService.getDevGroup(created.getId()).block(TIMEOUT)).isNotNull();
        assertThat(singleRow(ORG_MEMBER, created.getId(), creator).getRelation()).isEqualTo(MemberRole.ADMIN.getValue());
        assertThat(rows(GROUP_MEMBER, allUsers.getId(), creator)).as("the creator joins the all-users group").hasSize(1);
    }

    /** Catches: the super-admin flag of the creator not giving SUPER_ADMIN, or the configured super admin not joining. */
    @Test
    void aSuperAdminCreatorIsSuperAdminAndAConfiguredSuperAdminJoinsEveryNewOrg() {
        User root = user("root", true);
        String creator = newId();

        Organization byCreator = organizationService.create(newOrg("by-creator"), creator, false).block(TIMEOUT);
        assertThat(singleRow(ORG_MEMBER, byCreator.getId(), creator).getRelation()).isEqualTo(MemberRole.ADMIN.getValue());
        assertThat(singleRow(ORG_MEMBER, byCreator.getId(), root.getId()).getRelation()).isEqualTo(MemberRole.SUPER_ADMIN.getValue());

        Organization byRoot = organizationService.create(newOrg("by-root"), root.getId(), true).block(TIMEOUT);
        assertThat(rows(ORG_MEMBER, byRoot.getId(), root.getId())).as("the super admin is not added twice").hasSize(1);
        assertThat(rows(ORG_MEMBER, byRoot.getId(), root.getId()).get(0).getRelation()).isEqualTo(MemberRole.SUPER_ADMIN.getValue());

        String other = newId();
        Organization flagged = organizationService.create(newOrg("flagged"), other, true).block(TIMEOUT);
        assertThat(singleRow(ORG_MEMBER, flagged.getId(), other).getRelation()).isEqualTo(MemberRole.SUPER_ADMIN.getValue());
        System.out.println("[OrganizationServiceImplCreationMongoTest] super admin handling checked");
    }

    // ------------------------------------------------------------------ createDefault

    /** Catches: a wrong default org name or locale, a missing auto-generated flag, a wrong creator role. */
    @Test
    void createDefaultInSaasModeCreatesALocalisedAutoGeneratedOrgWithAnAdminCreator() {
        User alice = user("Alice", false);
        User bob = user("Bob", false);

        Organization english = organizationService.createDefault(alice, false).block(TIMEOUT);
        Organization chinese = organizationService.createDefault(bob, false)
                .contextWrite(context -> context.put(GlobalContext.CLIENT_LOCALE, Locale.CHINESE)).block(TIMEOUT);

        System.out.println("[OrganizationServiceImplCreationMongoTest] default orgs: " + english.getName() + " / " + chinese.getName());
        assertThat(english.getName()).isEqualTo("Alice" + ENGLISH_SUFFIX);
        assertThat(chinese.getName()).isEqualTo("Bob" + CHINESE_SUFFIX);
        assertThat(stored(english.getId()).getIsAutoGeneratedOrganization()).isTrue();
        assertThat(singleRow(ORG_MEMBER, english.getId(), alice.getId()).getRelation()).isEqualTo(MemberRole.ADMIN.getValue());
    }

    /**
     * Catches: enterprise mode creating one org per user. Behaviour (candidate L5): when the user joins the enterprise
     * org the Mono completes EMPTY, so callers cannot use the result as "the org of the user".
     */
    @Test
    void createDefaultInEnterpriseModeJoinsTheEnterpriseOrgAndCompletesEmptyOrCreatesWhenThereIsNone() {
        commonConfig.getWorkspace().setMode(WorkspaceMode.ENTERPRISE);
        User carol = user("Carol", false);

        Organization first = organizationService.createDefault(carol, false).block(TIMEOUT);
        assertThat(first).as("no enterprise org yet: a normal org is created").isNotNull();
        assertThat(orgCount()).isEqualTo(1L);

        User dave = user("Dave", false);
        assertThat(organizationService.createDefault(dave, false).blockOptional(TIMEOUT)).as("joined: completes empty").isEmpty();

        assertThat(orgCount()).as("no organisation created for the joining user").isEqualTo(1L);
        assertThat(singleRow(ORG_MEMBER, first.getId(), dave.getId()).getRelation()).isEqualTo(MemberRole.MEMBER.getValue());
    }

    // ------------------------------------------------------------------ enterprise org lookup

    /** Catches: a wrong org returned or a wrong fallback in enterprise mode, and an enterprise org lookup in SaaS mode. */
    @Test
    void enterpriseOrgLookupFollowsTheConfigurationWithFallbacks() {
        commonConfig.getWorkspace().setMode(WorkspaceMode.ENTERPRISE);
        assertThat(organizationService.getOrganizationInEnterpriseMode().blockOptional(TIMEOUT)).as("no active org").isEmpty();

        Organization configured = saveOrg(ACTIVE, "configured");
        Organization other = saveOrg(ACTIVE, "other");
        commonConfig.getWorkspace().setMode(WorkspaceMode.SAAS);
        assertThat(organizationService.getOrganizationInEnterpriseMode().blockOptional(TIMEOUT)).as("SaaS mode, active orgs exist").isEmpty();
        commonConfig.getWorkspace().setMode(WorkspaceMode.ENTERPRISE);
        commonConfig.getWorkspace().setEnterpriseOrgId(configured.getId());
        assertThat(organizationService.getOrganizationInEnterpriseMode().block(TIMEOUT).getId()).isEqualTo(configured.getId());

        for (String fallbackId : new String[] {newId(), "", "  "}) {
            commonConfig.getWorkspace().setEnterpriseOrgId(fallbackId);
            String found = organizationService.getOrganizationInEnterpriseMode().block(TIMEOUT).getId();
            System.out.println("[OrganizationServiceImplCreationMongoTest] enterprise org id [" + fallbackId + "] resolves to the first active org");
            assertThat(found).isIn(configured.getId(), other.getId());
        }

        Organization deleted = saveOrg(DELETED, "deleted");
        commonConfig.getWorkspace().setEnterpriseOrgId(deleted.getId());
        BizException error = assertThrows(BizException.class, () -> organizationService.getOrganizationInEnterpriseMode().block(TIMEOUT));
        assertThat(error.getError()).isEqualTo(BizError.ORG_DELETED_FOR_ENTERPRISE_MODE);
    }

    // ------------------------------------------------------------------ domain lookup

    /** Catches: the domain lookup ignoring the domain of the request context, or returning a deleted org. */
    @Test
    void getByDomainUsesTheDomainOfTheRequestContextAndOnlyActiveOrgs() {
        String domain = "acme" + newId() + ".example";
        OrganizationDomain organizationDomain = new OrganizationDomain();
        organizationDomain.setDomain(domain);
        Organization acme = mongo.save(Organization.builder().name("acme").gid(UUID.randomUUID().toString()).state(ACTIVE)
                .organizationDomain(organizationDomain).build()).block(TIMEOUT);
        String goneDomain = "gone" + newId() + ".example";
        OrganizationDomain goneOrganizationDomain = new OrganizationDomain();
        goneOrganizationDomain.setDomain(goneDomain);
        mongo.save(Organization.builder().name("gone").gid(UUID.randomUUID().toString()).state(DELETED)
                .organizationDomain(goneOrganizationDomain).build()).block(TIMEOUT);

        assertThat(organizationService.getByDomain().contextWrite(context -> context.put(GlobalContext.DOMAIN, domain)).block(TIMEOUT).getId())
                .isEqualTo(acme.getId());
        assertThat(organizationService.getByDomain().contextWrite(context -> context.put(GlobalContext.DOMAIN, goneDomain)).blockOptional(TIMEOUT)).isEmpty();
        assertThat(organizationService.getByDomain().contextWrite(context -> context.put(GlobalContext.DOMAIN, "unknown.example")).blockOptional(TIMEOUT)).isEmpty();
        assertThat(organizationService.getByDomain().blockOptional(TIMEOUT)).as("no domain in the context").isEmpty();
    }
}
