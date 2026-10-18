package org.lowcoder.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.organization.model.OrganizationState.ACTIVE;
import static org.lowcoder.domain.organization.model.OrganizationState.DELETED;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
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

    /** The name of the org the gid case creates, and the count of events of one delete. */
    static final String BY_GID_NAME = "by-gid";
    static final long ONE_EVENT = 1L;

    /**
     * BF-135 and NEW-41: the org is also deleted, once, when named by its gid, and its one event carries the org's object
     * id, the key the cleanup listener removes by; the event carried the gid as given (NEW-41), so the cleanups found nothing.
     */
    @Test
    void anOrgNamedByItsGidIsDeletedOnceAndItsEventCarriesItsObjectIdNEW41() {
        String gid = UUID.randomUUID().toString();
        String orgId = mongo.save(Organization.builder().name(BY_GID_NAME).gid(gid).state(ACTIVE).build()).block(TIMEOUT).getId();
        System.out.println("[OrganizationServiceImplDeleteTwicePinMongoTest] deleting org " + orgId + " twice by its gid " + gid);

        Boolean first = organizationService.delete(gid).block(TIMEOUT);
        Boolean second = organizationService.delete(gid).block(TIMEOUT);

        long objectIdEvents = DELETED_ORG_IDS.stream().filter(orgId::equals).count();
        long gidEvents = DELETED_ORG_IDS.stream().filter(gid::equals).count();
        System.out.println("[OrganizationServiceImplDeleteTwicePinMongoTest] by gid first=" + first + " second=" + second
                + " events with the object id=" + objectIdEvents + " with the gid=" + gidEvents);
        assertThat(mongo.findById(orgId, Organization.class).block(TIMEOUT).getState()).isEqualTo(DELETED);
        assertThat(first).isTrue();
        assertThat(second).isFalse();
        assertThat(objectIdEvents).isEqualTo(ONE_EVENT);
        assertThat(gidEvents).isZero();
    }

    /**
     * NEW-41: a gid that names no org answers false and publishes nothing, as before. Nothing published is checked as no
     * event collected during the call, which holds since this module's tests run one at a time (no JUnit parallel
     * execution is configured).
     */
    @Test
    void deletingAnUnknownGidAnswersFalseAndPublishesNothingNEW41() {
        String unknownGid = UUID.randomUUID().toString();
        int eventsBefore = DELETED_ORG_IDS.size();
        System.out.println("[OrganizationServiceImplDeleteTwicePinMongoTest] deleting the unknown gid " + unknownGid + ", events before " + eventsBefore);

        Boolean answer = organizationService.delete(unknownGid).block(TIMEOUT);

        System.out.println("[OrganizationServiceImplDeleteTwicePinMongoTest] unknown gid " + unknownGid + " -> " + answer
                + ", events after " + DELETED_ORG_IDS.size());
        assertThat(answer).isFalse();
        assertThat(DELETED_ORG_IDS).hasSize(eventsBefore);
    }

    /**
     * A null or empty key names no org: the delete answers false and publishes nothing, as before NEW-41 (checked as in the
     * unknown-gid case).
     */
    @ParameterizedTest(name = "key=[{0}]")
    @NullAndEmptySource
    void deletingANullOrEmptyKeyAnswersFalseAndPublishesNothing(String key) {
        int eventsBefore = DELETED_ORG_IDS.size();
        System.out.println("[OrganizationServiceImplDeleteTwicePinMongoTest] deleting the key [" + key + "], events before " + eventsBefore);

        Boolean answer = organizationService.delete(key).block(TIMEOUT);

        System.out.println("[OrganizationServiceImplDeleteTwicePinMongoTest] key [" + key + "] -> " + answer + ", events after "
                + DELETED_ORG_IDS.size());
        assertThat(answer).isFalse();
        assertThat(DELETED_ORG_IDS).hasSize(eventsBefore);
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
