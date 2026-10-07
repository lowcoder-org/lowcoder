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
 * Pin of the section 9 row found by L3-11b on OrganizationServiceImpl.delete (follow-up). Own Spring context and database
 * (extra property), with a collecting OrgDeletedEvent listener.
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
     * Pins plan section 9 row "deleting a deleted org answers true and publishes a second OrgDeletedEvent": delete
     * (OrganizationServiceImpl:274-285) updates the state without checking it, and the update reports a change because the
     * auditing fields move, so a second delete answers true and publishes the event again (the cascades run twice). A fix
     * (guard on state ACTIVE) changes this test on purpose.
     */
    @Test
    void deletingADeletedOrgAnswersTrueAndPublishesASecondEvent_pinsTheSection9Row() {
        String orgId = mongo.save(Organization.builder().name("twice").gid(UUID.randomUUID().toString()).state(ACTIVE).build()).block(TIMEOUT).getId();

        Boolean first = organizationService.delete(orgId).block(TIMEOUT);
        Boolean second = organizationService.delete(orgId).block(TIMEOUT);

        long events = DELETED_ORG_IDS.stream().filter(orgId::equals).count();
        System.out.println("[OrganizationServiceImplDeleteTwicePinMongoTest] PINNED first=" + first + " second=" + second + " events=" + events);
        assertThat(mongo.findById(orgId, Organization.class).block(TIMEOUT).getState()).isEqualTo(DELETED);
        assertThat(first).isTrue();
        assertThat(second).isTrue();
        assertThat(events).isEqualTo(2L);
    }
}
