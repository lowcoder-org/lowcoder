package org.lowcoder.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.organization.model.OrganizationState.ACTIVE;
import static org.lowcoder.domain.organization.model.OrganizationState.DELETED;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
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
 * BF-135 (was the pin of the section 9 row found by L3-11b on OrganizationServiceImpl.delete, follow-up). Own Spring
 * context and database (extra property), with a collecting OrgDeletedEvent listener.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
@TestPropertySource(properties = "l3_11b.context=org-delete-twice")
@Import(OrganizationServiceImplDeleteTwicePinMongoTest.OrgEventCollector.class)
class OrganizationServiceImplDeleteTwicePinMongoTest extends OrganizationMongoTestBase {

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

    /**
     * BF-135 (was pinned as plan section 9 row "deleting a deleted org answers true and publishes a second OrgDeletedEvent"):
     * delete updated the state without checking it, and the update reported a change because the auditing fields moved,
     * so a second delete answered true and published the event again (the cascades ran twice). Only an org that is not
     * deleted yet is matched now: the second delete answers false and publishes nothing.
     */
    @Test
    void deletingADeletedOrgAnswersFalseAndPublishesNoSecondEventBF135() {
        String orgId = mongo.save(Organization.builder().name("twice").gid(UUID.randomUUID().toString()).state(ACTIVE).build()).block(TIMEOUT).getId();

        Boolean first = organizationService.delete(orgId).block(TIMEOUT);
        Boolean second = organizationService.delete(orgId).block(TIMEOUT);

        long events = DELETED_ORG_IDS.stream().filter(orgId::equals).count();
        System.out.println("[OrganizationServiceImplDeleteTwicePinMongoTest] first=" + first + " second=" + second + " events=" + events);
        assertThat(mongo.findById(orgId, Organization.class).block(TIMEOUT).getState()).isEqualTo(DELETED);
        assertThat(first).isTrue();
        assertThat(second).isFalse();
        assertThat(events).isEqualTo(1L);
    }

    /**
     * BF-135: the org is also deleted when named by its gid, as before (the key is an object id or a gid). The event
     * carries the gid as given, a limit stated on delete (NEW-41 in the plan); the REST caller passes the object id.
     */
    @Test
    void anOrgNamedByItsGidIsDeletedOnceBF135() {
        String gid = UUID.randomUUID().toString();
        String orgId = mongo.save(Organization.builder().name("by-gid").gid(gid).state(ACTIVE).build()).block(TIMEOUT).getId();

        Boolean first = organizationService.delete(gid).block(TIMEOUT);
        Boolean second = organizationService.delete(gid).block(TIMEOUT);

        System.out.println("[OrganizationServiceImplDeleteTwicePinMongoTest] by gid first=" + first + " second=" + second);
        assertThat(mongo.findById(orgId, Organization.class).block(TIMEOUT).getState()).isEqualTo(DELETED);
        assertThat(first).isTrue();
        assertThat(second).isFalse();
        assertThat(DELETED_ORG_IDS.stream().filter(gid::equals).count()).isEqualTo(1L);
    }

    /** BF-135: deleting an org id that names no org answers false and publishes nothing. */
    @Test
    void deletingAnUnknownOrgAnswersFalseAndPublishesNothingBF135() {
        String unknown = newId();

        Boolean answer = organizationService.delete(unknown).block(TIMEOUT);

        System.out.println("[OrganizationServiceImplDeleteTwicePinMongoTest] unknown " + unknown + " -> " + answer);
        assertThat(answer).isFalse();
        assertThat(DELETED_ORG_IDS).doesNotContain(unknown);
    }
}
