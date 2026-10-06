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
 * Pins the plan section 9 row "enterprise mode: first getAllActiveOrgs of a user who is not yet in the enterprise org
 * returns an empty list" (task L3-11a follow-up). In its own Spring context (and database) because it changes the global
 * workspace mode; the CommonConfig singleton is restored after every test.
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
     * Pins the row: getAllActiveOrgs (OrgMemberServiceImpl:63-100) enrols a non-member in the configured enterprise org
     * (:85) but filters the memberships it read BEFORE that write (the cached orgMemberFlux), so the first call answers an
     * empty list and only the next call returns the org. Small reach: login enrols the user first through
     * tryAddUserToOrgAndSwitchOrg (AuthenticationApiServiceImpl:304), so this is hit only by an existing user who was
     * never added. A fix (re-read the memberships after the write) changes this test on purpose.
     */
    @Test
    void theFirstCallForANonMemberReturnsNothingAlthoughTheEnrolmentIsWritten_pinsTheSection9Row() {
        String enterpriseOrg = createActiveOrg();
        String otherOrg = createActiveOrg();
        String user = newId();
        orgMemberService.addMember(otherOrg, user, MemberRole.ADMIN).block(TIMEOUT);
        commonConfig.getWorkspace().setMode(WorkspaceMode.ENTERPRISE);
        commonConfig.getWorkspace().setEnterpriseOrgId(enterpriseOrg);

        List<String> first = orgMemberService.getAllActiveOrgs(user).map(OrgMember::getOrgId).collectList().block(TIMEOUT);
        List<String> second = orgMemberService.getAllActiveOrgs(user).map(OrgMember::getOrgId).collectList().block(TIMEOUT);

        System.out.println("[OrgMemberServiceImplEnterpriseEnrolmentPinMongoTest] PINNED first call " + first + ", second call " + second);
        assertThat(singleRow(ORG_MEMBER, enterpriseOrg, user).getRelation()).isEqualTo(MemberRole.MEMBER.getValue());
        assertThat(first).isEmpty();
        assertThat(second).containsExactly(enterpriseOrg);
    }
}
