package org.lowcoder.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.lowcoder.domain.organization.model.OrganizationState.ACTIVE;
import static org.lowcoder.domain.organization.model.OrganizationState.DELETED;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.organization.event.OrgDeletedEvent;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.context.event.EventListener;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * OrganizationServiceImpl.delete (unit U14, task L3-11b): the soft delete, the event, and the section 9 row "deleting an
 * org leaves its apps and datasources". The collecting listener and the extra property give this class a Spring context
 * (and database) of its own. The real OrgAndGroupEventListener runs too, asynchronously: the test waits for it by polling
 * the org's groups (bounded, 20 s, 100 ms interval). What it does with the members is the L4-8 section 9 row on
 * BiRelationServiceImpl.removeAllBiRelations and is not asserted here.
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

    /**
     * Pins plan section 9 row "deleting an org leaves its apps and datasources": OrgAndGroupEventListener.onOrgDeleted
     * (:58-70) ends with deleteOrgApplications() and deleteOrgDatasources() (:64-65), both of which return Mono.empty()
     * (:98-104), so after the org is deleted (and the listener has finished: the groups are gone) its applications and
     * datasources are still stored, still carrying the deleted org's id. A fix (delete them) changes this test on purpose.
     */
    @Test
    void deletingAnOrgLeavesItsApplicationsAndDatasources_pinsTheSection9Row() throws Exception {
        String orgId = savedOrgId();
        groupService.createAllUserGroup(orgId).block(TIMEOUT);
        groupService.createDevGroup(orgId).block(TIMEOUT);
        Application application = mongo.save(Application.builder().organizationId(orgId).name("app-of-the-doomed-org")
                .gid(UUID.randomUUID().toString()).applicationType(1).applicationStatus(ApplicationStatus.NORMAL).build()).block(TIMEOUT);
        Datasource datasource = mongo.save(Datasource.builder().organizationId(orgId).name("datasource-of-the-doomed-org")
                .type("postgres").creationSource(0).build()).block(TIMEOUT);

        assertThat(organizationService.delete(orgId).block(TIMEOUT)).isTrue();
        awaitGroupsRemoved(orgId);

        Application appAfter = mongo.findById(application.getId(), Application.class).block(TIMEOUT);
        Datasource datasourceAfter = mongo.findById(datasource.getId(), Datasource.class).block(TIMEOUT);
        System.out.println("[OrganizationServiceImplDeleteMongoTest] PINNED after the org deletion: application present="
                + (appAfter != null) + " datasource present=" + (datasourceAfter != null));
        assertThat(stored(orgId).getState()).isEqualTo(DELETED);
        assertThat(appAfter).isNotNull();
        assertThat(appAfter.getOrganizationId()).isEqualTo(orgId);
        assertThat(datasourceAfter).isNotNull();
        assertThat(datasourceAfter.getOrganizationId()).isEqualTo(orgId);
        assertThat(datasourceAfter.getDatasourceStatus()).as("not even soft-deleted").isEqualTo(DatasourceStatus.NORMAL);
    }
}
