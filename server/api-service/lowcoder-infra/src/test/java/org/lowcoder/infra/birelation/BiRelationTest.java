package org.lowcoder.infra.birelation;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

/**
 * {@link BiRelation#getCreateTime()}, which {@code GroupMember.from} turns into a member's join time: the epoch
 * milliseconds of {@code createdAt} for a stored relation, and 0 for one not stored yet ({@code createdAt} still null),
 * where reading the time must not throw.
 */
class BiRelationTest {

    private static final Instant CREATED_AT = Instant.parse("2026-10-05T12:00:00.123Z");
    private static final long NOT_STORED_CREATE_TIME = 0L;

    private static BiRelation relation() {
        return BiRelation.builder()
                .bizType(BiRelationBizType.GROUP_MEMBER)
                .sourceId("group-1")
                .targetId("user-1")
                .relation("member")
                .build();
    }

    @Test
    void createTimeIsTheEpochMillisecondsOfCreatedAt() {
        BiRelation stored = relation();
        stored.setCreatedAt(CREATED_AT);

        long createTime = stored.getCreateTime();

        System.out.println("[BiRelationTest] createdAt " + CREATED_AT + " -> createTime " + createTime);
        assertThat(createTime).isEqualTo(CREATED_AT.toEpochMilli());
    }

    @Test
    void createTimeOfARelationWithoutCreatedAtIsZeroInsteadOfAnException() {
        BiRelation notStored = relation();

        long createTime = notStored.getCreateTime();

        System.out.println("[BiRelationTest] createdAt " + notStored.getCreatedAt() + " -> createTime " + createTime);
        assertThat(notStored.getCreatedAt()).isNull();
        assertThat(createTime).isEqualTo(NOT_STORED_CREATE_TIME);
    }
}
