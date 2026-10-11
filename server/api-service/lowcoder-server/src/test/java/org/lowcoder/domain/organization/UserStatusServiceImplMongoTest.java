package org.lowcoder.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.user.constant.UserStatusType;
import org.lowcoder.domain.user.model.UserStatus;
import org.lowcoder.domain.user.service.UserStatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.ActiveProfiles;

/**
 * UserStatusServiceImpl against the MongoDB test container (unit U14, task L3-11b), shared {@code test} context, user
 * ids generated per test. The returned booleans of the upserts are printed, not asserted (see the observation on
 * MongoUpsertHelper.upsert reported with this task).
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
class UserStatusServiceImplMongoTest extends OrganizationMongoTestBase {

    @Autowired
    private UserStatusService userStatusService;

    private List<UserStatus> documentsOf(String userId) {
        return mongo.find(Query.query(Criteria.where("_id").is(userId)), UserStatus.class).collectList().block(TIMEOUT);
    }

    /** Catches: an unknown user failing or getting a status without his id; the defaults must be "not shown, not banned". */
    @Test
    void anUnknownUserGetsADefaultStatusCarryingTheId() {
        String user = newId();

        UserStatus status = userStatusService.findByUserId(user).block(TIMEOUT);

        System.out.println("[UserStatusServiceImplMongoTest] default status of " + user + ": " + status.getStatusMap());
        assertThat(status.getId()).isEqualTo(user);
        assertThat(status.hasShowNewUserGuidance()).isFalse();
        assertThat(status.isBanned()).isFalse();
        assertThat(status.getStatusMap()).containsOnly(Map.entry(UserStatusType.HAS_SHOW_NEW_USER_GUIDANCE.getValue(), false));
        assertThat(documentsOf(user)).as("reading a status does not create a document").isEmpty();
    }

    /** Catches: the guidance flag not stored, duplicate documents on a second call, or a stored ban being lost. */
    @Test
    void markingTheGuidanceShownIsStoredOnceAndKeepsAnExistingBan() {
        String fresh = newId();
        String banned = newId();
        mongo.save(UserStatus.builder().id(banned).banned(true).build()).block(TIMEOUT);

        Boolean first = userStatusService.markNewUserGuidanceShown(fresh).block(TIMEOUT);
        Boolean second = userStatusService.markNewUserGuidanceShown(fresh).block(TIMEOUT);
        Boolean onBanned = userStatusService.markNewUserGuidanceShown(banned).block(TIMEOUT);

        System.out.println("[UserStatusServiceImplMongoTest] returned: first=" + first + " second=" + second + " onBanned=" + onBanned);
        assertThat(documentsOf(fresh)).hasSize(1);
        assertThat(userStatusService.findByUserId(fresh).block(TIMEOUT).hasShowNewUserGuidance()).isTrue();
        UserStatus keptBan = userStatusService.findByUserId(banned).block(TIMEOUT);
        assertThat(keptBan.hasShowNewUserGuidance()).isTrue();
        assertThat(keptBan.isBanned()).as("marking the guidance must not lift a ban").isTrue();
        assertThat(documentsOf(banned)).hasSize(1);
    }

    /** Catches: a status written under the wrong key or overwriting the other keys of the map. */
    @Test
    void markWritesOneKeyOfTheStatusMapAndKeepsTheOthers() {
        String user = newId();

        userStatusService.mark(user, UserStatusType.NON_DEV_POP_UP_FOR_OLD_USERS, true).block(TIMEOUT);
        userStatusService.mark(user, UserStatusType.HAS_SHOW_NEW_USER_GUIDANCE, "seen").block(TIMEOUT);
        userStatusService.mark(user, UserStatusType.NON_DEV_POP_UP_FOR_OLD_USERS, false).block(TIMEOUT);

        UserStatus status = userStatusService.findByUserId(user).block(TIMEOUT);
        Map<String, Object> map = status.getStatusMap();
        System.out.println("[UserStatusServiceImplMongoTest] stored status map " + map);
        assertThat(documentsOf(user)).hasSize(1);
        assertThat(map).containsEntry(UserStatusType.NON_DEV_POP_UP_FOR_OLD_USERS.getValue(), false)
                .containsEntry(UserStatusType.HAS_SHOW_NEW_USER_GUIDANCE.getValue(), "seen");
        assertThat(map).hasSize(2);
    }
}
