package org.lowcoder.domain.query;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.query.model.LibraryQueryRecord;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;

/**
 * LibraryQueryRecordServiceImpl against the MongoDB test container (unit U14, task L3-11d). getByLibraryQueryIdIn is not
 * tested: no caller in main code (owner's list of unreferenced code).
 */
class LibraryQueryRecordServiceImplMongoTest extends LibraryQueryMongoTestBase {

    private static final Instant T0 = Instant.parse("2026-01-01T00:00:00Z");

    /** Catches: a lost field on insert, an unknown id not failing with LIBRARY_QUERY_NOT_FOUND. */
    @Test
    void insertThenGetByIdRoundTripsTheFieldsAndAnUnknownIdFails() {
        String queryId = newId();
        LibraryQueryRecord saved = insertRecord(queryId, "v1", "js", T0);

        LibraryQueryRecord read = libraryQueryRecordService.getById(saved.getId()).block(TIMEOUT);

        System.out.println("[LibraryQueryRecordServiceImplMongoTest] record " + read.getId() + " tag " + read.getTag());
        assertThat(read.getLibraryQueryId()).isEqualTo(queryId);
        assertThat(read.getTag()).isEqualTo("v1");
        assertThat(read.getCommitMessage()).isEqualTo("commit v1");
        assertThat(read.getCreateTime()).isEqualTo(T0.toEpochMilli());
        assertThat(read.getQuery().getCompType()).isEqualTo("js");
        BizException failure = assertThrows(BizException.class, () -> libraryQueryRecordService.getById(newId()).block(TIMEOUT));
        assertThat(failure.getError()).isEqualTo(BizError.LIBRARY_QUERY_NOT_FOUND);
    }

    /** Catches: the order not newest first, other queries' records mixed in, an unknown query not answering an empty list. */
    @Test
    void getByLibraryQueryIdAnswersThePublishedVersionsNewestFirstForThatQueryOnly() {
        String queryId = newId();
        insertRecord(queryId, "v2", "js", T0.plusSeconds(10));
        insertRecord(queryId, "v1", "js", T0);
        insertRecord(queryId, "v3", "js", T0.plusSeconds(20));
        insertRecord(newId(), "other", "js", T0.plusSeconds(30));

        assertThat(libraryQueryRecordService.getByLibraryQueryId(queryId).block(TIMEOUT))
                .extracting(LibraryQueryRecord::getTag).containsExactly("v3", "v2", "v1");
        assertThat(libraryQueryRecordService.getByLibraryQueryId(newId()).block(TIMEOUT)).isEmpty();
    }

    /** Catches: the oldest or another query's record answered as the latest, a query without records not completing empty. */
    @Test
    void theLatestRecordIsTheNewestOfThatQueryAndEmptyWhenThereIsNone() {
        String queryId = newId();
        insertRecord(queryId, "v1", "js", T0);
        insertRecord(queryId, "v2", "js", T0.plusSeconds(10));
        insertRecord(newId(), "other", "js", T0.plusSeconds(99));

        assertThat(libraryQueryRecordService.getLatestRecordByLibraryQueryId(queryId).block(TIMEOUT).getTag()).isEqualTo("v2");
        assertThat(libraryQueryRecordService.getLatestRecordByLibraryQueryId(newId()).blockOptional(TIMEOUT)).isEmpty();
    }

    /** Catches: the by-query delete reporting a wrong count or touching other queries, deleteById removing more than one record. */
    @Test
    void deleteAllByLibraryQueryIdAnswersTheCountAndDeleteByIdRemovesOneRecord() {
        String queryId = newId();
        String otherQueryId = newId();
        LibraryQueryRecord first = insertRecord(queryId, "v1", "js", T0);
        insertRecord(queryId, "v2", "js", T0.plusSeconds(1));
        insertRecord(otherQueryId, "o1", "js", T0);
        insertRecord(otherQueryId, "o2", "js", T0.plusSeconds(1));

        libraryQueryRecordService.deleteById(first.getId()).block(TIMEOUT);
        assertThat(libraryQueryRecordService.getByLibraryQueryId(queryId).block(TIMEOUT)).extracting(LibraryQueryRecord::getTag).containsExactly("v2");

        assertThat(libraryQueryRecordService.deleteAllLibraryQueryTagByLibraryQueryId(queryId).block(TIMEOUT)).isEqualTo(1L);
        assertThat(libraryQueryRecordService.getByLibraryQueryId(queryId).block(TIMEOUT)).isEmpty();
        assertThat(libraryQueryRecordService.getByLibraryQueryId(otherQueryId).block(TIMEOUT)).hasSize(2);
        assertThat(libraryQueryRecordService.deleteAllLibraryQueryTagByLibraryQueryId(newId()).block(TIMEOUT)).isZero();
    }
}
