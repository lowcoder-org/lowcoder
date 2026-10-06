package org.lowcoder.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.group.event.GroupDeletedEvent;
import org.lowcoder.domain.group.model.Group;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.event.EventListener;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.Locale;

/**
 * GroupServiceImpl.delete (unit U14, task L3-11a): the group is removed and exactly one GroupDeletedEvent carrying its id
 * is published. A collecting listener makes this class's Spring context, and therefore its database, its own. What the
 * real listener does with the group's members on that event is the L4-8 section 9 row on
 * BiRelationServiceImpl.removeAllBiRelations (fixed by BF-016) and is not asserted here.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
@TestPropertySource(properties = "l3_11a.context=group-delete-event")
@Import(GroupServiceImplDeleteEventMongoTest.EventCollector.class)
class GroupServiceImplDeleteEventMongoTest extends OrganizationMongoTestBase {

    static final List<String> DELETED_GROUP_IDS = new CopyOnWriteArrayList<>();

    @TestConfiguration
    static class EventCollector {
        @EventListener
        void onGroupDeleted(GroupDeletedEvent event) {
            DELETED_GROUP_IDS.add(event.getGroupId());
        }

        @Bean
        String l3_11aMarker() {
            return "collector";
        }
    }

    /** Catches: a deleted group that stays stored, an event that is not published, or one for the wrong id. */
    @Test
    void deleteRemovesTheGroupAndPublishesOneEventWithItsId() {
        String org = newId();
        Group keep = mongo.save(Group.builder().organizationId(org).name("keep").gid(newId()).build()).block(TIMEOUT);
        Group doomed = mongo.save(Group.builder().organizationId(org).name("doomed").gid(newId()).build()).block(TIMEOUT);

        groupService.delete(doomed.getId()).block(TIMEOUT);

        System.out.println("[GroupServiceImplDeleteEventMongoTest] events: " + DELETED_GROUP_IDS);
        assertThat(groupService.getById(doomed.getId()).blockOptional(TIMEOUT)).isEmpty();
        assertThat(groupService.getById(keep.getId()).block(TIMEOUT).getName(Locale.ENGLISH)).isEqualTo("keep");
        assertThat(DELETED_GROUP_IDS).containsOnlyOnce(doomed.getId()).doesNotContain(keep.getId());
    }
}
