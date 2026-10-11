package org.lowcoder.domain.query;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.query.model.BaseQuery;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;

/**
 * LibraryQueryServiceImpl against the MongoDB test container (unit U14, task L3-11d). Not repeated: the L1-7 tests of
 * LibraryQueryApiServiceImpl (Mockito) and the section 9 tenant-isolation row. The two defect pins have classes of their own
 * (LibraryQueryServiceImplGetByIdsPinMongoTest, LibraryQueryServiceImplGetByNamePinMongoTest).
 */
class LibraryQueryServiceImplMongoTest extends LibraryQueryMongoTestBase {

    private static BizException failure(Runnable call) {
        return assertThrows(BizException.class, call::run);
    }

    /** Catches: no gid generated, a given gid replaced, a lost field. */
    @Test
    void insertGeneratesAGidWhenNoneIsGivenKeepsAGivenOneAndRoundTripsTheFields() {
        String orgId = newId();
        LibraryQuery generated = insertQuery(orgId, "lq-" + newId(), COMP_TYPE);
        String explicitGid = "fixed-" + newId();
        LibraryQuery explicit = libraryQueryService.insert(LibraryQuery.builder().organizationId(orgId).name("lq-" + newId())
                .gid(explicitGid).libraryQueryDSL(dsl(COMP_TYPE)).build()).block(TIMEOUT);

        System.out.println("[LibraryQueryServiceImplMongoTest] generated gid " + generated.getGid());
        assertThat(generated.getId()).isNotBlank();
        assertThat(generated.getGid()).contains("-").hasSize(36);
        assertThat(explicit.getGid()).isEqualTo(explicitGid);
        LibraryQuery read = libraryQueryService.getById(generated.getId()).block(TIMEOUT);
        assertThat(read.getOrganizationId()).isEqualTo(orgId);
        assertThat(read.getName()).isEqualTo(generated.getName());
        assertThat(read.getGid()).isEqualTo(generated.getGid());
        assertThat(read.getQuery().getCompType()).isEqualTo(COMP_TYPE);
        assertThat(read.getCreatedAt()).isNotNull();
    }

    /** Catches: the gid branch missing, an unknown key not failing with LIBRARY_QUERY_NOT_FOUND. */
    @Test
    void getByIdAnswersByIdAndByGidAndFailsForAnUnknownKey() {
        LibraryQuery saved = insertQuery(newId());

        assertThat(libraryQueryService.getById(saved.getId()).block(TIMEOUT).getId()).isEqualTo(saved.getId());
        assertThat(libraryQueryService.getById(saved.getGid()).block(TIMEOUT).getId()).isEqualTo(saved.getId());
        assertThat(failure(() -> libraryQueryService.getById(newId()).block(TIMEOUT)).getError()).isEqualTo(BizError.LIBRARY_QUERY_NOT_FOUND);
        assertThat(failure(() -> libraryQueryService.getById("no-such-gid").block(TIMEOUT)).getError()).isEqualTo(BizError.LIBRARY_QUERY_NOT_FOUND);
    }

    /** Catches: getByIds querying the wrong key type for a homogeneous list, an empty list failing. */
    @Test
    void getByIdsAnswersHomogeneousIdOrGidListsAndNothingForAnEmptyList() {
        String orgId = newId();
        LibraryQuery a = insertQuery(orgId);
        LibraryQuery b = insertQuery(orgId);
        insertQuery(orgId);

        assertThat(libraryQueryService.getByIds(List.of(a.getId(), b.getId())).collectList().block(TIMEOUT))
                .extracting(LibraryQuery::getId).containsExactlyInAnyOrder(a.getId(), b.getId());
        assertThat(libraryQueryService.getByIds(List.of(a.getGid(), b.getGid())).collectList().block(TIMEOUT))
                .extracting(LibraryQuery::getId).containsExactlyInAnyOrder(a.getId(), b.getId());
        assertThat(libraryQueryService.getByIds(List.of()).collectList().block(TIMEOUT)).isEmpty();
    }

    /** Catches: a cross-org leak in the organisation listing. */
    @Test
    void getByOrganizationIdIsScopedToTheOrg() {
        String orgId = newId();
        LibraryQuery a = insertQuery(orgId);
        LibraryQuery b = insertQuery(orgId);
        insertQuery(newId());

        assertThat(libraryQueryService.getByOrganizationId(orgId).collectList().block(TIMEOUT))
                .extracting(LibraryQuery::getId).containsExactlyInAnyOrder(a.getId(), b.getId());
        assertThat(libraryQueryService.getByOrganizationId(newId()).collectList().block(TIMEOUT)).isEmpty();
    }

    /**
     * Catches: the name lookup failing for a unique name, an unknown name not failing with LIBRARY_QUERY_NOT_FOUND. The lookup
     * has no org parameter (section 9 tenant-isolation row, L1-7): the query of another org is answered too. Two orgs with the
     * same name is the next class's pin.
     */
    @Test
    void getByNameAnswersTheQueryWithThatNameWhicheverOrgOwnsItAndFailsForAnUnknownName() {
        String name = "lq-" + newId();
        LibraryQuery saved = insertQuery(newId(), name, COMP_TYPE);

        assertThat(libraryQueryService.getByName(name).block(TIMEOUT).getId()).isEqualTo(saved.getId());
        assertThat(failure(() -> libraryQueryService.getByName("lq-" + newId()).block(TIMEOUT)).getError())
                .isEqualTo(BizError.LIBRARY_QUERY_NOT_FOUND);
    }

    /** Catches: update overwriting fields that were not given, an unknown id answered true. */
    @Test
    void updateChangesOnlyTheGivenFieldsAndAnUnknownIdAnswersFalse() {
        LibraryQuery saved = insertQuery(newId());
        String newName = "renamed-" + newId();

        boolean updated = libraryQueryService.update(saved.getId(), LibraryQuery.builder().name(newName).build()).block(TIMEOUT);

        assertThat(updated).isTrue();
        LibraryQuery read = libraryQueryService.getById(saved.getId()).block(TIMEOUT);
        assertThat(read.getName()).isEqualTo(newName);
        assertThat(read.getOrganizationId()).isEqualTo(saved.getOrganizationId());
        assertThat(read.getGid()).isEqualTo(saved.getGid());
        assertThat(read.getQuery().getCompType()).isEqualTo(COMP_TYPE);
        assertThat(libraryQueryService.update(newId(), LibraryQuery.builder().name("x").build()).block(TIMEOUT)).isFalse();
    }

    /** Catches: delete by id or by gid removing the neighbours, or nothing. Observed: the query's records stay (the API layer removes them, LibraryQueryApiServiceImpl:144-145). */
    @Test
    void deleteByIdAndByGidRemoveOnlyThatQueryAndLeaveItsRecords() {
        String orgId = newId();
        LibraryQuery byId = insertQuery(orgId);
        LibraryQuery byGid = insertQuery(orgId);
        LibraryQuery kept = insertQuery(orgId);
        insertRecord(byId.getId(), "v1", COMP_TYPE, Instant.now());

        libraryQueryService.delete(byId.getId()).block(TIMEOUT);
        libraryQueryService.delete(byGid.getGid()).block(TIMEOUT);

        assertThat(libraryQueryService.getByOrganizationId(orgId).collectList().block(TIMEOUT))
                .extracting(LibraryQuery::getId).containsExactly(kept.getId());
        assertThat(libraryQueryRecordService.getByLibraryQueryId(byId.getId()).block(TIMEOUT)).hasSize(1);
    }

    /** Catches: the editing query not read from the library query, a missing query not failing. */
    @Test
    void theEditingBaseQueryIsTheLibraryQueriesOwnAndFailsForAnUnknownId() {
        LibraryQuery saved = insertQuery(newId(), "lq-" + newId(), "editing");

        BaseQuery editing = libraryQueryService.getEditingBaseQueryByLibraryQueryId(saved.getId()).block(TIMEOUT);

        assertThat(editing.getCompType()).isEqualTo("editing");
        assertThat(failure(() -> libraryQueryService.getEditingBaseQueryByLibraryQueryId(newId()).block(TIMEOUT)).getError())
                .isEqualTo(BizError.LIBRARY_QUERY_NOT_FOUND);
    }

    /** Catches: live reading the editing version when records exist, not falling back when none, the newest record not chosen. */
    @Test
    void theLiveQueryAndDslAreTheLatestRecordsAndFallBackToTheEditingOneWithoutRecords() {
        LibraryQuery withRecords = insertQuery(newId(), "lq-" + newId(), "editing");
        LibraryQuery withoutRecords = insertQuery(newId(), "lq-" + newId(), "editing");
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        insertRecord(withRecords.getId(), "v1", "old", now);
        insertRecord(withRecords.getId(), "v3", "newest", now.plusSeconds(20));
        insertRecord(withRecords.getId(), "v2", "middle", now.plusSeconds(10));

        assertThat(libraryQueryService.getLiveBaseQueryByLibraryQueryId(withRecords.getId()).block(TIMEOUT).getCompType()).isEqualTo("newest");
        assertThat(libraryQueryService.getEditingBaseQueryByLibraryQueryId(withRecords.getId()).block(TIMEOUT).getCompType())
                .as("the editing query is not the published one").isEqualTo("editing");
        assertThat(libraryQueryService.getLiveBaseQueryByLibraryQueryId(withoutRecords.getId()).block(TIMEOUT).getCompType()).isEqualTo("editing");
        assertThat(libraryQueryService.getLiveDSLByLibraryQueryId(withRecords.getId()).block(TIMEOUT))
                .extracting(dsl -> ((java.util.Map<?, ?>) dsl.get("query")).get("compType")).isEqualTo("newest");
        assertThat(libraryQueryService.getLiveDSLByLibraryQueryId(withoutRecords.getId()).block(TIMEOUT))
                .extracting(dsl -> ((java.util.Map<?, ?>) dsl.get("query")).get("compType")).isEqualTo("editing");
        assertThat(failure(() -> libraryQueryService.getLiveBaseQueryByLibraryQueryId(newId()).block(TIMEOUT)).getError())
                .isEqualTo(BizError.LIBRARY_QUERY_NOT_FOUND);
        assertThat(failure(() -> libraryQueryService.getLiveDSLByLibraryQueryId(newId()).block(TIMEOUT)).getError())
                .isEqualTo(BizError.LIBRARY_QUERY_NOT_FOUND);
    }
}
