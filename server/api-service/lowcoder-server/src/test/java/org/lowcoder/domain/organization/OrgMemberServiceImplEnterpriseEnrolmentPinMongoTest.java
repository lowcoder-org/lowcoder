package org.lowcoder.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.infra.birelation.BiRelationBizType.ORG_MEMBER;

import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * BF-131 (was pinned as plan section 9 row "enterprise mode: first getAllActiveOrgs of a user who is not yet in the
 * enterprise org returns an empty list", task L3-11a follow-up). In its own Spring context (and database) because it
 * changes the global workspace mode; the CommonConfig singleton is restored after every test.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
@TestPropertySource(properties = "l3_11a.context=enterprise-enrolment-pin")
class OrgMemberServiceImplEnterpriseEnrolmentPinMongoTest extends OrganizationMongoTestBase {

    @Autowired
    private CommonConfig commonConfig;

    private WorkspaceMode originalMode;
    private String originalEnterpriseOrgId;

    @BeforeEach
    void rememberTheConfiguration() {
        originalMode = commonConfig.getWorkspace().getMode();
        originalEnterpriseOrgId = commonConfig.getWorkspace().getEnterpriseOrgId();
    }

    @AfterEach
    void restoreTheConfiguration() {
        commonConfig.getWorkspace().setMode(originalMode);
        commonConfig.getWorkspace().setEnterpriseOrgId(originalEnterpriseOrgId);
    }

    /**
     * BF-131: getAllActiveOrgs (OrgMemberServiceImpl:63-100) enrols a non-member in the configured enterprise org (:85)
     * and answered from the memberships it had read before that write, so the first call was empty and only the next
     * call returned the org; after an enrolment it now reads the memberships again. Small reach: login enrols the user
     * first through tryAddUserToOrgAndSwitchOrg (AuthenticationApiServiceImpl:307), so this is hit only by an existing
     * user who was never added.
     */
    @Test
    void theFirstCallForANonMemberReturnsTheEnterpriseOrgItEnrolsTheUserInBF131() {
        String enterpriseOrg = createActiveOrg();
        String otherOrg = createActiveOrg();
        String user = newId();
        orgMemberService.addMember(otherOrg, user, MemberRole.ADMIN).block(TIMEOUT);
        enterpriseMode(enterpriseOrg);

        List<String> first = orgMemberService.getAllActiveOrgs(user).map(OrgMember::getOrgId).collectList().block(TIMEOUT);
        List<String> second = orgMemberService.getAllActiveOrgs(user).map(OrgMember::getOrgId).collectList().block(TIMEOUT);

        System.out.println("[OrgMemberServiceImplEnterpriseEnrolmentPinMongoTest] first call " + first + ", second call " + second);
        assertThat(singleRow(ORG_MEMBER, enterpriseOrg, user).getRelation()).isEqualTo(MemberRole.MEMBER.getValue());
        assertThat(first).containsExactly(enterpriseOrg);
        assertThat(second).containsExactly(enterpriseOrg);
    }

    /**
     * BF-131, through the lookup every request's context makes (GlobalContextFilter, SessionUserServiceImpl): the first
     * getCurrentOrgMember of a user who is no member yet answers the enterprise org it enrols them in.
     * Catches: an empty first answer, which left that request without a current org.
     */
    @Test
    void theFirstCurrentOrgLookupOfANonMemberIsTheEnterpriseOrgBF131() {
        String enterpriseOrg = createActiveOrg();
        String user = newId();
        enterpriseMode(enterpriseOrg);

        OrgMember current = orgMemberService.getCurrentOrgMember(user).block(TIMEOUT);

        System.out.println("[OrgMemberServiceImplEnterpriseEnrolmentPinMongoTest] first current org " + (current == null ? null : current.getOrgId()));
        assertThat(current).isNotNull();
        assertThat(current.getOrgId()).isEqualTo(enterpriseOrg);
        assertThat(singleRow(ORG_MEMBER, enterpriseOrg, user).getRelation()).isEqualTo(MemberRole.MEMBER.getValue());
    }

    /** Catches: a second enrolment, or an answer that is not the existing membership, for a user already in the org. */
    @Test
    void aMemberOfTheEnterpriseOrgIsAnsweredWithoutEnrollingAgainBF131() {
        String enterpriseOrg = createActiveOrg();
        String user = newId();
        orgMemberService.addMember(enterpriseOrg, user, MemberRole.ADMIN).block(TIMEOUT);
        enterpriseMode(enterpriseOrg);

        List<OrgMember> answer = orgMemberService.getAllActiveOrgs(user).collectList().block(TIMEOUT);

        System.out.println("[OrgMemberServiceImplEnterpriseEnrolmentPinMongoTest] member answer " + answer);
        assertThat(answer).extracting(OrgMember::getOrgId).containsExactly(enterpriseOrg);
        assertThat(answer).extracting(OrgMember::getRole).containsExactly(MemberRole.ADMIN);
        assertThat(rows(ORG_MEMBER, enterpriseOrg, user)).hasSize(1);
    }

    private void enterpriseMode(String enterpriseOrgId) {
        commonConfig.getWorkspace().setMode(WorkspaceMode.ENTERPRISE);
        commonConfig.getWorkspace().setEnterpriseOrgId(enterpriseOrgId);
    }
}
