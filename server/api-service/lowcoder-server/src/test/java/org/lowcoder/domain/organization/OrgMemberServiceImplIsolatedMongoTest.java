package org.lowcoder.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.infra.birelation.BiRelationBizType.GROUP_MEMBER;
import static org.lowcoder.infra.birelation.BiRelationBizType.ORG_MEMBER;

import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.FindAuthConfig;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.lowcoder.infra.birelation.BiRelation;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * OrgMemberServiceImpl behaviour that depends on state of the WHOLE database or on global configuration (unit U14, task
 * L3-11a): the global admin count, the "add to every active org" job and enterprise mode. The extra property gives this
 * class a Spring context, and therefore a MongoDB database, of its own (TestContainersInitializer), so the collections
 * can be emptied before every test without touching any other class; the CommonConfig singleton is restored after every
 * test. Email registration is switched off by configuration for the registration tests.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
@TestPropertySource(properties = {"l3_11a.context=org-member-isolated", "auth.email.enable-register=false"})
class OrgMemberServiceImplIsolatedMongoTest extends OrganizationMongoTestBase {

    @Autowired
    private CommonConfig commonConfig;
    @Autowired
    private AuthenticationService authenticationService;

    private WorkspaceMode originalMode;
    private String originalEnterpriseOrgId;

    @BeforeEach
    void emptyTheCollectionsAndRememberTheConfiguration() {
        mongo.remove(new Query(), BiRelation.class).block(TIMEOUT);
        mongo.remove(new Query(), Organization.class).block(TIMEOUT);
        mongo.remove(new Query(), Group.class).block(TIMEOUT);
        originalMode = commonConfig.getWorkspace().getMode();
        originalEnterpriseOrgId = commonConfig.getWorkspace().getEnterpriseOrgId();
    }

    @AfterEach
    void restoreTheConfiguration() {
        commonConfig.getWorkspace().setMode(originalMode);
        commonConfig.getWorkspace().setEnterpriseOrgId(originalEnterpriseOrgId);
    }

    private boolean emailRegistrationEnabled() {
        List<FindAuthConfig> configs = authenticationService.findAllAuthConfigs(null, false).collectList().block(TIMEOUT);
        return configs.stream()
                .filter(config -> AuthSourceConstants.EMAIL.equals(config.authConfig().getSource()))
                .findFirst().orElseThrow()
                .authConfig().isEnableRegister();
    }

    private List<String> activeOrgIdsOf(String userId) {
        return orgMemberService.getAllActiveOrgs(userId).map(OrgMember::getOrgId).collectList().block(TIMEOUT);
    }

    // ------------------------------------------------------------------ doesAtleastOneAdminExist

    /** Catches: the admin check answering true without any admin, or ignoring an ADMIN row. */
    @Test
    void anAdminExistsOnlyAfterAnAdminRowIsStored() {
        assertThat(orgMemberService.doesAtleastOneAdminExist().block(TIMEOUT)).isFalse();

        orgMemberService.addMember(createActiveOrg(), newId(), MemberRole.MEMBER).block(TIMEOUT);
        assertThat(orgMemberService.doesAtleastOneAdminExist().block(TIMEOUT)).isFalse();

        orgMemberService.addMember(createActiveOrg(), newId(), MemberRole.ADMIN).block(TIMEOUT);
        assertThat(orgMemberService.doesAtleastOneAdminExist().block(TIMEOUT)).isTrue();
        System.out.println("[OrgMemberServiceImplIsolatedMongoTest] admin exists after an ADMIN row");
    }

    /**
     * Pins plan section 9 row "registration forced open when the only admins are SUPER_ADMIN: doesAtleastOneAdminExist
     * counts relation `admin` only (OrgMemberServiceImpl:116), and AuthenticationServiceImpl:55-62 then sets
     * enableRegister TRUE despite configuration". Reachable on a fresh deployment: AddSuperAdminUserImpl:42-50 creates the
     * configured super admin through createDefault(user, true), whose first org membership is SUPER_ADMIN
     * (OrganizationServiceImpl:165-167), while a normal first sign-up gets ADMIN (AuthenticationApiServiceImpl:159,
     * :283-285). A fix (count ADMIN or SUPER_ADMIN) changes this test on purpose.
     */
    @Test
    void onlySuperAdminsCountAsNoAdminAndOpenRegistration_pinsTheSection9Row() {
        orgMemberService.addMember(createActiveOrg(), newId(), MemberRole.SUPER_ADMIN).block(TIMEOUT);

        boolean adminExists = orgMemberService.doesAtleastOneAdminExist().block(TIMEOUT);
        boolean registrationEnabled = emailRegistrationEnabled();
        System.out.println("[OrgMemberServiceImplIsolatedMongoTest] PINNED only SUPER_ADMIN rows: adminExists=" + adminExists
                + " email registration enabled=" + registrationEnabled + " (configured: disabled)");
        assertThat(adminExists).isFalse();
        assertThat(registrationEnabled).isTrue();

        orgMemberService.addMember(createActiveOrg(), newId(), MemberRole.ADMIN).block(TIMEOUT);
        assertThat(emailRegistrationEnabled()).as("with an ADMIN row the configuration (disabled) applies").isFalse();
    }

    // ------------------------------------------------------------------ addToAllOrgAsAdminIfNot

    /**
     * Catches: the job joining the wrong set of orgs (deleted ones, orgs the user is already in) or overwriting an existing
     * membership. Behaviour pinned (candidate C3, no row): the all-users group membership gets the ORG role, SUPER_ADMIN,
     * while addMember always uses MEMBER. GroupApiServiceImpl treats a SUPER_ADMIN group member as a manager
     * (:62, :121, :208) and hides it from member lists (:291, :313), so this looks intended.
     */
    @Test
    void addToAllOrgAsAdminIfNotMakesTheUserSuperAdminOfEveryActiveOrgTheyAreNotIn() {
        String[] already = createActiveOrgWithAllUsersGroup();
        String[] fresh1 = createActiveOrgWithAllUsersGroup();
        String[] fresh2 = createActiveOrgWithAllUsersGroup();
        String deleted = createOrg(OrganizationState.DELETED);
        String user = newId();
        orgMemberService.addMember(already[0], user, MemberRole.MEMBER).block(TIMEOUT);

        orgMemberService.addToAllOrgAsAdminIfNot(user).block(TIMEOUT);

        assertThat(singleRow(ORG_MEMBER, already[0], user).getRelation()).isEqualTo(MemberRole.MEMBER.getValue());
        assertThat(singleRow(ORG_MEMBER, fresh1[0], user).getRelation()).isEqualTo(MemberRole.SUPER_ADMIN.getValue());
        assertThat(singleRow(ORG_MEMBER, fresh2[0], user).getRelation()).isEqualTo(MemberRole.SUPER_ADMIN.getValue());
        assertThat(rows(ORG_MEMBER, deleted, user)).isEmpty();

        GroupMember inFresh = groupMemberService.getGroupMember(fresh1[1], user).block(TIMEOUT);
        System.out.println("[OrgMemberServiceImplIsolatedMongoTest] all-users group role of the job: " + inFresh.getRole());
        assertThat(inFresh.getRole()).isEqualTo(MemberRole.SUPER_ADMIN);
        assertThat(inFresh.getOrgId()).isEqualTo(fresh1[0]);
        assertThat(rows(GROUP_MEMBER, already[1], user)).hasSize(1);
        assertThat(groupMemberService.getGroupMember(already[1], user).block(TIMEOUT).getRole()).isEqualTo(MemberRole.MEMBER);

        orgMemberService.addToAllOrgAsAdminIfNot(user).block(TIMEOUT);
        assertThat(rows(ORG_MEMBER, fresh1[0], user)).as("a second run adds nothing").hasSize(1);
    }

    // ------------------------------------------------------------------ enterprise mode

    private void enterprise(String enterpriseOrgId) {
        commonConfig.getWorkspace().setMode(WorkspaceMode.ENTERPRISE);
        commonConfig.getWorkspace().setEnterpriseOrgId(enterpriseOrgId);
    }

    /** Catches: SaaS mode filtering the user's orgs, or enterprise mode leaking the other orgs of a member. */
    @Test
    void saasModeListsEveryActiveOrgAndEnterpriseModeOnlyTheEnterpriseOrg() {
        String enterpriseOrg = createActiveOrg();
        String otherOrg = createActiveOrg();
        String user = newId();
        orgMemberService.addMember(enterpriseOrg, user, MemberRole.MEMBER).block(TIMEOUT);
        orgMemberService.addMember(otherOrg, user, MemberRole.MEMBER).block(TIMEOUT);

        commonConfig.getWorkspace().setMode(WorkspaceMode.SAAS);
        assertThat(activeOrgIdsOf(user)).containsExactlyInAnyOrder(enterpriseOrg, otherOrg);

        enterprise(enterpriseOrg);
        assertThat(activeOrgIdsOf(user)).containsExactly(enterpriseOrg);
        assertThat(rows(ORG_MEMBER, enterpriseOrg, user)).as("an existing membership is not enrolled again").hasSize(1);
        System.out.println("[OrgMemberServiceImplIsolatedMongoTest] enterprise mode shows only " + enterpriseOrg);
    }

    /**
     * Catches: a user of an enterprise deployment not being enrolled in the enterprise org on first use. The result of the
     * FIRST call is deliberately not asserted: today it is empty (the memberships were read before the enrolment and the
     * new one is not in that snapshot), which is a defect candidate reported to the coordinator, not pinned. The
     * enrolment itself and the result of the second call are asserted.
     */
    @Test
    void enterpriseModeEnrolsANonMemberAsMemberInTheEnterpriseOrg() {
        String[] enterprise = createActiveOrgWithAllUsersGroup();
        String otherOrg = createActiveOrg();
        String user = newId();
        orgMemberService.addMember(otherOrg, user, MemberRole.ADMIN).block(TIMEOUT);
        enterprise(enterprise[0]);

        List<String> firstCall = activeOrgIdsOf(user);
        System.out.println("[OrgMemberServiceImplIsolatedMongoTest] first call after enrolment returned " + firstCall);

        BiRelation row = singleRow(ORG_MEMBER, enterprise[0], user);
        assertThat(row.getRelation()).isEqualTo(MemberRole.MEMBER.getValue());
        assertThat(rows(GROUP_MEMBER, enterprise[1], user)).hasSize(1);
        assertThat(singleRow(ORG_MEMBER, otherOrg, user).getRelation()).isEqualTo(MemberRole.ADMIN.getValue());
        assertThat(activeOrgIdsOf(user)).containsExactly(enterprise[0]);
    }

    /** Catches: an unconfigured enterprise org showing several orgs, or hiding the only one. */
    @Test
    void enterpriseModeWithoutAConfiguredOrgShowsOnlyTheFirstActiveOrg() {
        String orgA = createActiveOrg();
        String orgB = createActiveOrg();
        String orgC = createActiveOrg();
        String many = newId();
        for (String org : List.of(orgA, orgB, orgC)) {
            orgMemberService.addMember(org, many, MemberRole.MEMBER).block(TIMEOUT);
        }
        String single = newId();
        orgMemberService.addMember(orgB, single, MemberRole.MEMBER).block(TIMEOUT);

        for (String unconfigured : new String[] {null, "", "  "}) {
            enterprise(unconfigured);
            List<String> shown = activeOrgIdsOf(many);
            System.out.println("[OrgMemberServiceImplIsolatedMongoTest] enterprise org [" + unconfigured + "] shows " + shown.size());
            assertThat(shown).hasSize(1).isSubsetOf(orgA, orgB, orgC);
            assertThat(activeOrgIdsOf(single)).containsExactly(orgB);
        }
    }
}
