package org.lowcoder.api.query.view;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.model.LibraryQueryRecord;
import org.lowcoder.domain.user.model.User;

/**
 * Unit tests that the Query Library view factories tolerate an unresolved creator (a {@code null} User)
 * instead of NPEing. This is the crash that 500'd {@code GET /api/library-queries/dropDownList} for a
 * cross-environment-deployed library query whose {@code createdBy} has no matching {@code User} on the
 * target -- one such row would take down the whole list. The integration test
 * {@link org.lowcoder.api.query.LibraryQueryApiServiceIntegrationTest} is {@code @Disabled}, so these guard
 * the leaf factories directly.
 */
class LibraryQueryMetaViewTest {

    private static LibraryQuery libraryQuery() {
        return LibraryQuery.builder()
                .id("lq1")
                .gid("gid1")
                .organizationId("org1")
                .name("qryX")
                .libraryQueryDSL(Map.of("query", Map.of("compType", "js")))
                .createdAt(Instant.EPOCH)
                .build();
    }

    @Test
    void metaViewFromNullUserYieldsNullCreatorName() {
        LibraryQueryMetaView view = LibraryQueryMetaView.from(libraryQuery(), null);
        assertThat(view.creatorName()).isNull();
        assertThat(view.name()).isEqualTo("qryX");
    }

    @Test
    void libraryQueryViewFromNullUserYieldsNullCreatorName() {
        LibraryQueryView view = LibraryQueryView.from(libraryQuery(), null);
        assertThat(view.creatorName()).isNull();
        assertThat(view.name()).isEqualTo("qryX");
    }

    @Test
    void recordMetaViewFromNullCreatorYieldsNullCreatorName() {
        LibraryQueryRecord record = LibraryQueryRecord.builder()
                .id("rec1")
                .libraryQueryId("lq1")
                .tag("v1.0.0")
                .commitMessage("msg")
                .libraryQueryDSL(Map.of("query", Map.of("compType", "js")))
                .createdAt(Instant.EPOCH)
                .build();
        LibraryQueryRecordMetaView view = LibraryQueryRecordMetaView.from(record, (User) null);
        assertThat(view.creatorName()).isNull();
        assertThat(view.tag()).isEqualTo("v1.0.0");
    }

    @Test
    void aggregateViewFromNullCreatorDoesNotThrow() {
        // dropDownList builds LibraryQueryAggregateView with a possibly-null creator via both overloads.
        assertThatCode(() -> {
            LibraryQueryAggregateView noRecords = LibraryQueryAggregateView.from(libraryQuery(), null);
            assertThat(noRecords.libraryQueryMetaView().creatorName()).isNull();

            LibraryQueryAggregateView withRecords =
                    LibraryQueryAggregateView.from(libraryQuery(), null, List.<LibraryQueryRecord>of());
            assertThat(withRecords.libraryQueryMetaView().creatorName()).isNull();
        }).doesNotThrowAnyException();
    }
}
