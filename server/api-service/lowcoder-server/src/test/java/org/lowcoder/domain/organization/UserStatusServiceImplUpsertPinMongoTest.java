package org.lowcoder.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.user.model.UserStatus;
import org.lowcoder.domain.user.service.UserStatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.ActiveProfiles;

/**
 * Pin of the section 9 row found by L3-11b on MongoUpsertHelper.upsert (follow-up). Shared {@code test} context, user id
 * generated per test.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
class UserStatusServiceImplUpsertPinMongoTest extends OrganizationMongoTestBase {

    @Autowired
    private UserStatusService userStatusService;

    /**
     * Pins plan section 9 row "MongoUpsertHelper.upsert answers false for an insert; markNewUserGuidanceShown returns false
     * to the client": upsert (MongoUpsertHelper:148) answers {@code getModifiedCount() > 0}, which is 0 for an insert and for
     * an update that changes nothing, so the first call and a repeat answer false although the status is stored;
     * UserController.newUserGuidanceShown (:176-180) returns that boolean. A fix (also count an upserted id) changes this test
     * on purpose.
     */
    @Test
    void markNewUserGuidanceShownAnswersFalseForTheInsert_pinsTheSection9Row() {
        String user = newId();

        Boolean first = userStatusService.markNewUserGuidanceShown(user).block(TIMEOUT);
        Boolean repeat = userStatusService.markNewUserGuidanceShown(user).block(TIMEOUT);

        List<UserStatus> stored = mongo.find(Query.query(Criteria.where("_id").is(user)), UserStatus.class).collectList().block(TIMEOUT);
        System.out.println("[UserStatusServiceImplUpsertPinMongoTest] PINNED first=" + first + " repeat=" + repeat + " stored=" + stored.size());
        assertThat(stored).hasSize(1);
        assertThat(stored.get(0).hasShowNewUserGuidance()).isTrue();
        assertThat(first).isFalse();
        assertThat(repeat).isFalse();
    }
}
