package org.lowcoder.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.lowcoder.domain.organization.model.OrganizationState.ACTIVE;
import static org.lowcoder.domain.organization.model.OrganizationState.DELETED;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.organization.event.OrgDeletedEvent;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.infra.birelation.BiRelation;
import org.lowcoder.infra.birelation.BiRelationBizType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.context.event.EventListener;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * OrganizationServiceImpl.delete (unit U14, task L3-11b): the soft delete, the event, and (BF-017, formerly the section 9
 * row "deleting an org leaves its apps and datasources") the soft delete of the org's applications and datasources. The
 * collecting listener and the extra property give this class a Spring context (and database) of its own. The real
 * OrgAndGroupEventListener runs too, asynchronously: the tests wait for it by polling the org's groups or, for its last
 * step, the datasource's status (bounded, 20 s, 100 ms interval). What it does with the members is the L4-8 section 9 row on
 * BiRelationServiceImpl.removeAllBiRelations (fixed by BF-016); only the gid case (NEW-41) asserts on the members, on the one
 * the case adds (see {@link #deletingAnOrgByItsGidRunsItsCleanupsNEW41}).
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
@TestPropertySource(properties = "l3_11b.context=org-delete")
@Import(OrganizationServiceImplDeleteMongoTest.OrgEventCollector.class)
class OrganizationServiceImplDeleteMongoTest extends OrganizationMongoTestBase {

    private static final Duration POLL_LIMIT = Duration.ofSeconds(20);
    private static final long POLL_INTERVAL_MILLIS = 100;
    static final List<String> DELETED_ORG_IDS = new CopyOnWriteArrayList<>();

    @TestConfiguration
    static class OrgEventCollector {
        @EventListener
        void onOrgDeleted(OrgDeletedEvent event) {
            DELETED_ORG_IDS.add(event.getOrgId());
        }
    }

    @Autowired
    private OrganizationService organizationService;

    private String savedOrgId() {
        return mongo.save(Organization.builder().name("doomed").gid(UUID.randomUUID().toString()).state(ACTIVE).build()).block(TIMEOUT).getId();
    }

    private Organization stored(String orgId) {
        return mongo.findById(orgId, Organization.class).block(TIMEOUT);
    }

    /** Polls (bounded) until the asynchronous org-deletion handler has removed the org's groups. */
    private void awaitGroupsRemoved(String orgId) throws InterruptedException {
        long deadline = System.nanoTime() + POLL_LIMIT.toNanos();
        while (System.nanoTime() < deadline) {
            if (groupService.getOrgGroupCount(orgId).block(TIMEOUT) == 0L) {
                return;
            }
            Thread.sleep(POLL_INTERVAL_MILLIS);
        }
        throw new AssertionError("the org deletion handler did not remove the groups of " + orgId + " within " + POLL_LIMIT);
    }

    /** Catches: a hard delete or no state change, a missing event, an event for a failed update. */
    @Test
    void deleteMarksTheOrgDeletedAndPublishesOneEventAndNothingForUnknownOrAlreadyDeletedOrgs() throws Exception {
        String orgId = savedOrgId();

        assertThat(organizationService.delete(orgId).block(TIMEOUT)).isTrue();
        awaitGroupsRemoved(orgId);

        System.out.println("[OrganizationServiceImplDeleteMongoTest] events: " + DELETED_ORG_IDS);
        assertThat(stored(orgId).getState()).isEqualTo(DELETED);
        assertThrows(RuntimeException.class, () -> organizationService.getById(orgId).block(TIMEOUT));
        assertThat(organizationService.getByIdWithDeleted(orgId).block(TIMEOUT).getId()).isEqualTo(orgId);
        assertThat(DELETED_ORG_IDS).containsOnlyOnce(orgId);

        // Deleting an already deleted org is deliberately not asserted: today the update still reports a change (the
        // auditing fields move), so the answer and a second event are an observation (candidate L9), printed only.
        Boolean again = organizationService.delete(orgId).block(TIMEOUT);
        System.out.println("[OrganizationServiceImplDeleteMongoTest] second delete answered " + again + ", events now " + DELETED_ORG_IDS);
        String unknown = newId();
        assertThat(organizationService.delete(unknown).block(TIMEOUT)).as("an unknown org changes nothing").isFalse();
        assertThat(DELETED_ORG_IDS).doesNotContain(unknown);
    }

    /** The org, application, datasource and their types of the gid case. */
    static final String BY_GID_ORG_NAME = "doomed-by-gid";
    static final String BY_GID_APPLICATION_NAME = "app-of-the-org-deleted-by-gid";
    static final int APPLICATION_TYPE = 1;
    static final String BY_GID_DATASOURCE_NAME = "datasource-of-the-org-deleted-by-gid";
    static final String DATASOURCE_TYPE = "postgres";
    static final int DATASOURCE_CREATION_SOURCE = 0;
    /** The count of groups the gid case creates. */
    static final long ONE_RECORD = 1L;
    static final String MEMBER_RELATION = MemberRole.MEMBER.getValue();
    static final String SUPER_ADMIN_RELATION = MemberRole.SUPER_ADMIN.getValue();
    static final int AT_MOST_ONE_OTHER_ROW = 1;

    /**
     * NEW-41: an org deleted by its gid gets the cleanups of one deleted by its object id: the event carries the object id, so
     * the real listener removes the org's member and group and soft-deletes its application and datasource, the last step of
     * its chain. Before NEW-41 the event carried the gid, by which the listener's cleanups match nothing.
     *
     * <p>The asserts name the member the case added, not a count (NEW-111): the startup super admin job
     * ({@code AddSuperAdminRunner}, not waited for) may make the super admin a SUPER_ADMIN member of this org at any point
     * of the case, if its query for the active orgs runs after the org is saved. Besides the case's member the case accepts
     * that one row, and no other. Limit: a defect that added or kept a super admin row wrongly is not caught here.
     */
    @Test
    void deletingAnOrgByItsGidRunsItsCleanupsNEW41() throws Exception {
        String gid = UUID.randomUUID().toString();
        String orgId = mongo.save(Organization.builder().name(BY_GID_ORG_NAME).gid(gid).state(ACTIVE).build()).block(TIMEOUT).getId();
        String memberId = newId();
        orgMemberService.addMember(orgId, memberId, MemberRole.MEMBER).block(TIMEOUT);
        groupService.createAllUserGroup(orgId).block(TIMEOUT);
        Application application = mongo.save(Application.builder().organizationId(orgId).name(BY_GID_APPLICATION_NAME)
                .gid(UUID.randomUUID().toString()).applicationType(APPLICATION_TYPE).applicationStatus(ApplicationStatus.NORMAL)
                .build()).block(TIMEOUT);
        Datasource datasource = mongo.save(Datasource.builder().organizationId(orgId).name(BY_GID_DATASOURCE_NAME)
                .type(DATASOURCE_TYPE).creationSource(DATASOURCE_CREATION_SOURCE).build()).block(TIMEOUT);
        System.out.println("[OrganizationServiceImplDeleteMongoTest] deleting org " + orgId + " by its gid " + gid + ", members "
                + orgMemberService.getOrgMemberCount(orgId).block(TIMEOUT) + ", groups " + groupService.getOrgGroupCount(orgId).block(TIMEOUT)
                + ", application " + application.getId() + ", datasource " + datasource.getId() + ", member rows " + memberRowsOf(orgId));

        assertThat(singleRow(BiRelationBizType.ORG_MEMBER, orgId, memberId).getRelation()).as("the member the case added, before the delete").isEqualTo(MEMBER_RELATION);
        assertOnlyTheStartupSuperAdminBesides(orgId, memberId, "before the delete");
        assertThat(groupService.getOrgGroupCount(orgId).block(TIMEOUT)).as("the group before the delete").isEqualTo(ONE_RECORD);

        assertThat(organizationService.delete(gid).block(TIMEOUT)).isTrue();
        Datasource datasourceAfter;
        try {
            datasourceAfter = awaitDatasourceDeleted(datasource.getId());
        } finally {
            // printed whether or not the poll succeeds, so that a failing run shows which earlier step did not run
            System.out.println("[OrganizationServiceImplDeleteMongoTest] after the delete by gid: members "
                    + orgMemberService.getOrgMemberCount(orgId).block(TIMEOUT) + ", member rows " + memberRowsOf(orgId)
                    + ", groups " + groupService.getOrgGroupCount(orgId).block(TIMEOUT)
                    + ", application status=" + mongo.findById(application.getId(), Application.class).block(TIMEOUT).getApplicationStatus()
                    + ", events " + DELETED_ORG_IDS);
        }

        Application applicationAfter = mongo.findById(application.getId(), Application.class).block(TIMEOUT);
        System.out.println("[OrganizationServiceImplDeleteMongoTest] datasource status=" + datasourceAfter.getDatasourceStatus());
        assertThat(stored(orgId).getState()).isEqualTo(DELETED);
        assertThat(rows(BiRelationBizType.ORG_MEMBER, orgId, memberId)).as("the cleanup removed the member the case added").isEmpty();
        assertOnlyTheStartupSuperAdminBesides(orgId, memberId, "after the delete");
        assertThat(groupService.getOrgGroupCount(orgId).block(TIMEOUT)).isZero();
        assertThat(applicationAfter.getApplicationStatus()).isEqualTo(ApplicationStatus.DELETED);
        assertThat(DELETED_ORG_IDS).containsOnlyOnce(orgId).doesNotContain(gid);
    }

    /** The ORG_MEMBER rows of the org as "targetId/relation/superAdmin flag of the target user", for the prints. */
    private List<String> memberRowsOf(String orgId) {
        return rowsOfSource(BiRelationBizType.ORG_MEMBER, orgId).stream().map(this::described).toList();
    }

    private String described(BiRelation row) {
        User user = mongo.findById(row.getTargetId(), User.class).block(TIMEOUT);
        return row.getTargetId() + "/" + row.getRelation() + "/superAdmin=" + (user == null ? "no user" : user.getSuperAdmin());
    }

    /**
     * Asserts that the org's ORG_MEMBER rows hold, besides the case's member, at most one row, and that it is the startup super
     * admin job's: relation SUPER_ADMIN, on a user whose superAdmin flag is true (NEW-111).
     */
    private void assertOnlyTheStartupSuperAdminBesides(String orgId, String memberId, String when) {
        List<BiRelation> others = rowsOfSource(BiRelationBizType.ORG_MEMBER, orgId).stream()
                .filter(row -> !memberId.equals(row.getTargetId())).toList();
        System.out.println("[OrganizationServiceImplDeleteMongoTest] " + when + ": ORG_MEMBER rows besides the case's member "
                + memberId + ": " + others.stream().map(this::described).toList());
        assertThat(others).as("rows besides the case's member " + when + " (only the startup super admin job, AddSuperAdminRunner, may add one)")
                .hasSizeLessThanOrEqualTo(AT_MOST_ONE_OTHER_ROW);
        for (BiRelation other : others) {
            User user = mongo.findById(other.getTargetId(), User.class).block(TIMEOUT);
            assertThat(other.getRelation()).as("relation of the other row " + when + " (the startup super admin job)").isEqualTo(SUPER_ADMIN_RELATION);
            assertThat(user).as("the user of the other row " + when).isNotNull();
            assertThat(user.getSuperAdmin()).as("superAdmin flag of the user of the other row " + when).isTrue();
        }
    }

    /** Polls (bounded) until the asynchronous org-deletion handler has soft-deleted the datasource, its last step. */
    private Datasource awaitDatasourceDeleted(String datasourceId) throws InterruptedException {
        long deadline = System.nanoTime() + POLL_LIMIT.toNanos();
        while (System.nanoTime() < deadline) {
            Datasource datasource = mongo.findById(datasourceId, Datasource.class).block(TIMEOUT);
            if (datasource != null && datasource.getDatasourceStatus() == DatasourceStatus.DELETED) {
                return datasource;
            }
            Thread.sleep(POLL_INTERVAL_MILLIS);
        }
        throw new AssertionError("the org deletion handler did not soft-delete datasource " + datasourceId + " within " + POLL_LIMIT);
    }

    /**
     * Catches a deleted org's applications and datasources staying usable (BF-017, formerly pinned as the plan section 9 row
     * "deleting an org leaves its apps and datasources"): after the org is deleted, the real listener soft-deletes them. Both
     * stay stored with the org's id and their other fields (an archive, not a removal), the application with the status
     * DELETED and no longer public (it was public to all and on the marketplace), the datasource with DELETED. The
     * datasource is used by the org's own application and by a live application of another organization (which the
     * "still used" check of DatasourceService.delete would count): it is archived all the same, and the other
     * organization's application is not touched.
     */
    @Test
    void deletingAnOrgSoftDeletesItsApplicationsAndDatasources() throws Exception {
        String orgId = savedOrgId();
        groupService.createAllUserGroup(orgId).block(TIMEOUT);
        groupService.createDevGroup(orgId).block(TIMEOUT);
        Datasource datasource = mongo.save(Datasource.builder().organizationId(orgId).name("datasource-of-the-doomed-org")
                .type("postgres").creationSource(0).build()).block(TIMEOUT);
        Map<String, Object> dslUsingTheDatasource = Map.of("queries", List.of(Map.of("datasourceId", datasource.getId())));
        Application application = mongo.save(Application.builder().organizationId(orgId).name("app-of-the-doomed-org")
                .gid(UUID.randomUUID().toString()).applicationType(1).applicationStatus(ApplicationStatus.NORMAL)
                .publicToAll(true).publicToMarketplace(true).editingApplicationDSL(dslUsingTheDatasource).build()).block(TIMEOUT);
        Application otherOrgsApplication = mongo.save(Application.builder().organizationId(newId()).name("app-of-another-org")
                .gid(UUID.randomUUID().toString()).applicationType(1).applicationStatus(ApplicationStatus.NORMAL)
                .editingApplicationDSL(dslUsingTheDatasource).build()).block(TIMEOUT);

        assertThat(organizationService.delete(orgId).block(TIMEOUT)).isTrue();
        Datasource datasourceAfter = awaitDatasourceDeleted(datasource.getId());

        Application appAfter = mongo.findById(application.getId(), Application.class).block(TIMEOUT);
        System.out.println("[OrganizationServiceImplDeleteMongoTest] after the org deletion: application status="
                + appAfter.getApplicationStatus() + " datasource status=" + datasourceAfter.getDatasourceStatus());
        assertThat(stored(orgId).getState()).isEqualTo(DELETED);
        assertThat(groupService.getOrgGroupCount(orgId).block(TIMEOUT)).isZero();
        assertThat(appAfter.getApplicationStatus()).isEqualTo(ApplicationStatus.DELETED);
        assertThat(appAfter.getOrganizationId()).isEqualTo(orgId);
        assertThat(appAfter.getName()).isEqualTo("app-of-the-doomed-org");
        assertThat(appAfter.getGid()).isEqualTo(application.getGid());
        assertThat(appAfter.isPublicToAll()).isFalse();
        assertThat(appAfter.isPublicToMarketplace()).isFalse();
        assertThat(datasourceAfter.getOrganizationId()).isEqualTo(orgId);
        assertThat(datasourceAfter.getName()).isEqualTo("datasource-of-the-doomed-org");
        assertThat(mongo.findById(otherOrgsApplication.getId(), Application.class).block(TIMEOUT).getApplicationStatus())
                .as("another organization's application is not touched").isEqualTo(ApplicationStatus.NORMAL);
    }
}
