package org.lowcoder.api.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.application.view.ApplicationRecordMetaView;
import org.lowcoder.domain.application.model.ApplicationVersion;
import org.lowcoder.domain.user.model.User;

/** The two factories of {@link ApplicationRecordMetaView}, the list entry of an application's versions. */
class ApplicationRecordMetaViewTest {

    private static final String TAG = "[ApplicationRecordMetaViewTest] ";
    private static final long CREATED_AT_MILLIS = 1_700_000_123_456L;

    private static ApplicationVersion version(Instant createdAt) {
        return ApplicationVersion.builder().id("record-1").applicationId("app-1").tag("1.2.3")
                .commitMessage("fix the table").createdAt(createdAt).build();
    }

    /** Catches a field mapped from the wrong source, a time unit other than epoch milliseconds, or a creator name made up. */
    @Test
    void from_record_copiesTheFields_withEpochMillisAndNoCreatorName() {
        ApplicationRecordMetaView view = ApplicationRecordMetaView.from(version(Instant.ofEpochMilli(CREATED_AT_MILLIS)));

        System.out.println(TAG + view);
        assertThat(view.id()).isEqualTo("record-1");
        assertThat(view.applicationId()).isEqualTo("app-1");
        assertThat(view.tag()).isEqualTo("1.2.3");
        assertThat(view.commitMessage()).isEqualTo("fix the table");
        assertThat(view.createTime()).isEqualTo(CREATED_AT_MILLIS);
        assertThat(view.creatorName()).isNull();
    }

    /** Catches the creator name taken from the wrong user field. */
    @Test
    void from_recordAndUser_addsTheUsersName() {
        User creator = User.builder().id("user-1").name("Ada Lovelace").build();

        ApplicationRecordMetaView view = ApplicationRecordMetaView.from(version(Instant.ofEpochMilli(CREATED_AT_MILLIS)), creator);

        System.out.println(TAG + view);
        assertThat(view.creatorName()).isEqualTo("Ada Lovelace");
        assertThat(view.createTime()).isEqualTo(CREATED_AT_MILLIS);
        assertThat(view.id()).isEqualTo("record-1");
    }

    /**
     * A record without {@code createdAt} makes both factories throw a NullPointerException ({@code getCreatedAt().toEpochMilli()}).
     * Pinned as behaviour: not reachable for rows written through auditing or by {@code DatabaseChangelog.publishedToRecord}
     * (L2-11a), which both set {@code createdAt}; it would only occur for a hand-written row.
     */
    @Test
    void from_recordWithoutCreatedAt_throwsNullPointerException() {
        ApplicationVersion withoutTime = version(null);

        assertThatThrownBy(() -> ApplicationRecordMetaView.from(withoutTime)).isInstanceOf(NullPointerException.class);
        assertThatThrownBy(() -> ApplicationRecordMetaView.from(withoutTime, User.builder().name("x").build()))
                .isInstanceOf(NullPointerException.class);
    }
}
