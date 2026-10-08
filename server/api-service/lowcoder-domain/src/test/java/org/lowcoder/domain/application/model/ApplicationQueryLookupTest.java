package org.lowcoder.domain.application.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.query.model.ApplicationQuery;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Query lookup of an application by view mode, the module container size and the record-id predicates
 * (unit U4a, task L3-7). The live DSL comes from the latest published record, else from the editing DSL.
 */
class ApplicationQueryLookupTest {

    private static final String APP_ID = "app-1";
    private static final String LIVE_ONLY_QUERY = "liveOnly";
    private static final String EDIT_ONLY_QUERY = "editOnly";
    private static final String SHARED_QUERY = "shared";
    private static final String GID_ONLY_ID = "q-by-gid-id";
    private static final String GID_ONLY_GID = "q-by-gid";
    private static final String QUERY_NOT_FOUND_KEY = "LIBRARY_QUERY_NOT_FOUND";

    private final ApplicationRecordService records = mock(ApplicationRecordService.class);

    private static Map<String, Object> query(String id, String gid) {
        Map<String, Object> query = new HashMap<>();
        query.put("id", id);
        query.put("gid", gid);
        query.put("name", "name-" + id);
        query.put("datasourceId", "ds");
        query.put("comp", Map.of());
        query.put("compType", "query");
        return query;
    }

    @SafeVarargs
    private static Map<String, Object> dsl(Map<String, Object>... queries) {
        Map<String, Object> dsl = new HashMap<>();
        dsl.put("queries", List.of(queries));
        return dsl;
    }

    private Application application(Integer type, Map<String, Object> editingDsl, Map<String, Object> liveDsl) {
        Application application = Application.builder().id(APP_ID).applicationType(type).editingApplicationDSL(editingDsl).build();
        when(records.getLatestRecordByApplicationId(APP_ID)).thenReturn(liveDsl == null ? Mono.empty()
                : Mono.just(ApplicationVersion.builder().applicationId(APP_ID).applicationDSL(liveDsl).build()));
        return application;
    }

    private static void assertNotFound(Throwable error) {
        assertThat(error).isInstanceOf(BizException.class);
        assertThat(((BizException) error).getError()).isEqualTo(BizError.QUERY_NOT_FOUND);
    }

    /** Catches: edit/preview mode reading the published queries, or ignoring the editing ones. */
    @Test
    void editModeOnlyLooksAtTheEditingQueries() {
        Application application = application(ApplicationType.APPLICATION.getValue(),
                dsl(query(EDIT_ONLY_QUERY, null), query(SHARED_QUERY, null)),
                dsl(query(LIVE_ONLY_QUERY, null), query(SHARED_QUERY, null)));

        StepVerifier.create(application.getQueryByViewModeAndQueryId(false, EDIT_ONLY_QUERY, records))
                .assertNext(found -> {
                    System.out.println("[ApplicationQueryLookupTest] edit mode found " + found.getId());
                    assertThat(found.getId()).isEqualTo(EDIT_ONLY_QUERY);
                })
                .verifyComplete();
        // edit mode throws while the Mono is being assembled, not on subscription (see the unknown-id test)
        assertThatThrownBy(() -> application.getQueryByViewModeAndQueryId(false, LIVE_ONLY_QUERY, records))
                .satisfies(ApplicationQueryLookupTest::assertNotFound);
    }

    /** Catches: view mode reading the editing queries, or ignoring the published ones. */
    @Test
    void viewModeOnlyLooksAtTheLiveQueries() {
        Application application = application(ApplicationType.APPLICATION.getValue(),
                dsl(query(EDIT_ONLY_QUERY, null), query(SHARED_QUERY, null)),
                dsl(query(LIVE_ONLY_QUERY, null), query(SHARED_QUERY, null)));

        StepVerifier.create(application.getQueryByViewModeAndQueryId(true, LIVE_ONLY_QUERY, records))
                .assertNext(found -> assertThat(found.getId()).isEqualTo(LIVE_ONLY_QUERY))
                .verifyComplete();
        StepVerifier.create(application.getQueryByViewModeAndQueryId(true, EDIT_ONLY_QUERY, records))
                .expectErrorSatisfies(ApplicationQueryLookupTest::assertNotFound)
                .verify();
        System.out.println("[ApplicationQueryLookupTest] view mode sees live-only, not edit-only");
    }

    /** Catches: the gid half of the filter being dropped (modules and library queries are addressed by gid). */
    @Test
    void aQueryIsFoundByItsGidInBothModes() {
        Map<String, Object> withGid = query(GID_ONLY_ID, GID_ONLY_GID);
        Application application = application(ApplicationType.APPLICATION.getValue(), dsl(withGid), dsl(withGid));

        for (boolean viewMode : new boolean[] {false, true}) {
            StepVerifier.create(application.getQueryByViewModeAndQueryId(viewMode, GID_ONLY_GID, records))
                    .assertNext(found -> assertThat(found.getId()).isEqualTo(GID_ONLY_ID))
                    .verifyComplete();
        }
        System.out.println("[ApplicationQueryLookupTest] found by gid in edit and view mode");
    }

    /** Catches: an unknown id yielding anything but QUERY_NOT_FOUND, in either mode. */
    @Test
    void anUnknownQueryIdIsQueryNotFoundInBothModes() {
        Application application = application(ApplicationType.APPLICATION.getValue(), dsl(query(SHARED_QUERY, null)), dsl(query(SHARED_QUERY, null)));

        StepVerifier.create(application.getQueryByViewModeAndQueryId(true, "nope", records))
                .expectErrorSatisfies(ApplicationQueryLookupTest::assertNotFound).verify();
        // edit mode throws while the Mono is being assembled, not on subscription
        assertThatThrownBy(() -> application.getQueryByViewModeAndQueryId(false, "nope", records))
                .satisfies(ApplicationQueryLookupTest::assertNotFound);
        System.out.println("[ApplicationQueryLookupTest] unknown id: view mode errors in the Mono, edit mode throws synchronously");
    }

    /** Catches: view mode failing for an application that was never published (the live DSL falls back to editing). */
    @Test
    void viewModeFallsBackToTheEditingDslWhenThereIsNoPublishedRecord() {
        Application application = application(ApplicationType.APPLICATION.getValue(), dsl(query(EDIT_ONLY_QUERY, null)), null);

        StepVerifier.create(application.getQueryByViewModeAndQueryId(true, EDIT_ONLY_QUERY, records))
                .assertNext(found -> assertThat(found.getId()).isEqualTo(EDIT_ONLY_QUERY))
                .verifyComplete();
    }

    /**
     * BF-109 (fixed; was pinned as candidate defect L3-7(b)): when the published DSL has no "queries" key,
     * {@code getLiveQueries} maps JSON "null" to a null set and {@code mapNotNull} drops it, so it still completes empty;
     * the view-mode lookup now fails with QUERY_NOT_FOUND, as edit mode does with an empty editing set. It completed empty.
     */
    @Test
    void viewModeIsQueryNotFoundWhenTheLiveDslHasNoQueriesKeyBF109() {
        Application application = application(ApplicationType.APPLICATION.getValue(), dsl(query(EDIT_ONLY_QUERY, null)), new HashMap<>());

        StepVerifier.create(application.getQueryByViewModeAndQueryId(true, EDIT_ONLY_QUERY, records))
                .expectErrorSatisfies(error -> {
                    System.out.println("[ApplicationQueryLookupTest] live DSL without queries, view mode -> " + error);
                    assertNotFound(error);
                    assertThat(((BizException) error).getMessageKey()).isEqualTo(QUERY_NOT_FOUND_KEY);
                })
                .verify();
        StepVerifier.create(application.getLiveQueries(records)).verifyComplete();
    }

    /** Catches: the type test inverted, so an APPLICATION reports a container size or a module reports none. */
    @Test
    void containerSizeIsOnlyReportedForNonApplicationTypes() {
        Map<String, Object> liveDsl = new HashMap<>();
        liveDsl.put("ui", Map.of("comp", Map.of("containerSize", Map.of("height", 5))));

        Application app = application(ApplicationType.APPLICATION.getValue(), null, liveDsl);
        StepVerifier.create(app.getLiveContainerSize(records)).verifyComplete();

        Application module = application(ApplicationType.MODULE.getValue(), null, liveDsl);
        StepVerifier.create(module.getLiveContainerSize(records))
                .assertNext(size -> {
                    System.out.println("[ApplicationQueryLookupTest] module containerSize " + size);
                    assertThat(size).isEqualTo(Map.of("height", 5));
                })
                .verifyComplete();
    }

    /** Catches: a malformed or sparse DSL breaking the container size instead of yielding an empty map / nothing. */
    @Test
    void containerSizeOfASparseDslIsAnEmptyMapOrNothing() {
        Application noUi = application(ApplicationType.MODULE.getValue(), null, new HashMap<>());
        StepVerifier.create(noUi.getLiveContainerSize(records)).expectNext(Map.of()).verifyComplete();

        Application noComp = application(ApplicationType.MODULE.getValue(), null, Map.of("ui", Map.of()));
        StepVerifier.create(noComp.getLiveContainerSize(records)).expectNext(Map.of()).verifyComplete();

        Application noSize = application(ApplicationType.MODULE.getValue(), null, Map.of("ui", Map.of("comp", Map.of())));
        StepVerifier.create(noSize.getLiveContainerSize(records)).verifyComplete();
        System.out.println("[ApplicationQueryLookupTest] sparse DSLs: empty map, empty map, nothing");
    }

    /** Catches: the live record id and the editing record id being confused. */
    @Test
    void latestIsTheLiveRecordAndEditingIsAnythingBlankOrEditing() {
        assertThat(new ApplicationCombineId(APP_ID, "latest").isUsingLiveRecord()).isTrue();
        assertThat(new ApplicationCombineId(APP_ID, "latest").isUsingEditingRecord()).isFalse();
        assertThat(new ApplicationCombineId(APP_ID, "editing").isUsingLiveRecord()).isFalse();
        assertThat(new ApplicationCombineId(APP_ID, "editing").isUsingEditingRecord()).isTrue();
        assertThat(new ApplicationCombineId(APP_ID, "record-77").isUsingEditingRecord()).isFalse();
        assertThat(new ApplicationCombineId(APP_ID, "record-77").isUsingLiveRecord()).isFalse();
    }

    /** Catches: a missing record id (null, empty, blank) not meaning "editing". */
    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "\t"})
    void aMissingRecordIdMeansEditing(String recordId) {
        ApplicationCombineId id = new ApplicationCombineId(APP_ID, recordId);
        System.out.println("[ApplicationQueryLookupTest] record id [" + recordId + "] editing=" + id.isUsingEditingRecord());
        assertThat(id.isUsingEditingRecord()).isTrue();
        assertThat(id.isUsingLiveRecord()).isFalse();
    }
}
