package org.lowcoder.api.query;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.query.view.LibraryQueryRecordMetaView;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.model.LibraryQueryCombineId;
import org.lowcoder.domain.query.model.LibraryQueryRecord;
import org.lowcoder.domain.query.service.LibraryQueryRecordService;
import org.lowcoder.domain.query.service.LibraryQueryService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Tests of {@link LibraryQueryRecordApiServiceImpl} over mocked services. The sibling {@code LibraryQueryApiServiceImpl}
 * (its two permission checks are tested in LibraryQueryApiServiceImplTest) is mocked; the checks of this class itself
 * (record view and record management) run for real.
 *
 * <p>{@code LibraryQueryRecordMetaView} is already covered by the L1-7 publish test and LibraryQueryMetaViewTest; it is only
 * asserted here through {@code getByLibraryQueryId}'s output.
 *
 * <p>Event-log stubs (Mono.defer) show WHEN a service call executes, because the DSL read and the deletion are assembled
 * eagerly but must run only after the permission checks.
 */
class LibraryQueryRecordApiServiceImplTest {

    private static final String ORG_ID = "org-1";
    private static final String OTHER_ORG_ID = "org-2";
    private static final String USER_ID = "user-1";
    private static final String LIBRARY_QUERY_ID = "lq-1";
    private static final String OTHER_QUERY_ID = "lq-2";
    private static final String RECORD_ID = "record-1";
    private static final String LATEST = "latest";
    private static final Instant CREATED_AT = Instant.ofEpochMilli(1_700_000_000_000L);
    private static final Map<String, Object> LIVE_DSL = Map.of("which", "live");
    private static final Map<String, Object> RECORDED_DSL = Map.of("which", "recorded");

    private LibraryQueryService libraryQueryService;
    private LibraryQueryRecordService libraryQueryRecordService;
    private LibraryQueryApiServiceImpl libraryQueryApiService;
    private SessionUserService sessionUserService;
    private OrgDevChecker orgDevChecker;
    private UserService userService;
    private LibraryQueryRecordApiServiceImpl service;

    private final List<String> events = new ArrayList<>();

    @BeforeEach
    void setUp() {
        libraryQueryService = mock(LibraryQueryService.class);
        libraryQueryRecordService = mock(LibraryQueryRecordService.class);
        libraryQueryApiService = mock(LibraryQueryApiServiceImpl.class);
        sessionUserService = mock(SessionUserService.class);
        orgDevChecker = mock(OrgDevChecker.class);
        userService = mock(UserService.class);
        service = new LibraryQueryRecordApiServiceImpl(libraryQueryService, libraryQueryRecordService, libraryQueryApiService,
                sessionUserService, orgDevChecker, userService);
        lenient().when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(member(ORG_ID)));
        lenient().when(orgDevChecker.checkCurrentOrgDev()).thenReturn(logged("dev check"));
    }

    private static OrgMember member(String orgId) {
        return new OrgMember(orgId, USER_ID, MemberRole.MEMBER, "normal", 0L);
    }

    private static LibraryQuery libraryQuery(String id, String orgId) {
        LibraryQuery query = LibraryQuery.builder().organizationId(orgId).libraryQueryDSL(LIVE_DSL).build();
        query.setId(id);
        return query;
    }

    private static LibraryQueryRecord record(String id, String libraryQueryId, String creatorId) {
        Map<String, Object> query = new HashMap<>();
        query.put("compType", "mysql");
        Map<String, Object> dsl = new HashMap<>(RECORDED_DSL);
        dsl.put("query", query);
        LibraryQueryRecord record = LibraryQueryRecord.builder().libraryQueryId(libraryQueryId).tag("tag-" + id)
                .commitMessage("msg-" + id).libraryQueryDSL(dsl).build();
        record.setId(id);
        record.setCreatedAt(CREATED_AT);
        record.setCreatedBy(creatorId);
        return record;
    }

    private static User user(String id, String name) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        return user;
    }

    private Mono<Void> logged(String event) {
        return Mono.defer(() -> {
            events.add(event);
            return Mono.empty();
        });
    }

    private <T> Mono<T> logged(String event, T value) {
        return Mono.defer(() -> {
            events.add(event);
            return Mono.just(value);
        });
    }

    private static void assertBizError(Throwable error, BizError expected, String messageKey) {
        assertThat(error).isInstanceOf(BizException.class);
        assertThat(((BizException) error).getError()).isEqualTo(expected);
        assertThat(((BizException) error).getMessageKey()).isEqualTo(messageKey);
    }

    private static void say(String format, Object... args) {
        System.out.println("[LibraryQueryRecordApiServiceImplTest] " + String.format(format, args));
    }

    private void stubFirstCheckPasses() {
        when(libraryQueryApiService.checkLibraryQueryViewPermission(LIBRARY_QUERY_ID)).thenReturn(logged("view check " + LIBRARY_QUERY_ID));
    }

    // ------------------------------------------------------------------ getRecordDSLFromLibraryQueryCombineId

    /** Record id "latest": the live DSL of the combine's query; the record service is not asked at all. */
    @Test
    void getRecordDsl_latest_readsTheLiveDsl() {
        stubFirstCheckPasses();
        when(libraryQueryService.getById(LIBRARY_QUERY_ID)).thenReturn(logged("get query " + LIBRARY_QUERY_ID, libraryQuery(LIBRARY_QUERY_ID, ORG_ID)));
        when(libraryQueryService.getLiveDSLByLibraryQueryId(LIBRARY_QUERY_ID)).thenReturn(logged("read live dsl", LIVE_DSL));

        StepVerifier.create(service.getRecordDSLFromLibraryQueryCombineId(new LibraryQueryCombineId(LIBRARY_QUERY_ID, LATEST)))
                .expectNext(LIVE_DSL).verifyComplete();

        assertThat(events).containsExactly("view check " + LIBRARY_QUERY_ID, "get query " + LIBRARY_QUERY_ID, "read live dsl");
        verify(libraryQueryRecordService, never()).getById(anyString());
        say("latest: %s", events);
    }

    /** Another record id: the record's DSL; the live DSL is never asked and the second check follows the RECORD's own query. */
    @Test
    void getRecordDsl_recordId_readsTheRecordedDsl() {
        stubFirstCheckPasses();
        LibraryQueryRecord record = record(RECORD_ID, OTHER_QUERY_ID, USER_ID);
        when(libraryQueryRecordService.getById(RECORD_ID)).thenReturn(logged("get record", record));
        when(libraryQueryService.getById(OTHER_QUERY_ID)).thenReturn(logged("get query " + OTHER_QUERY_ID, libraryQuery(OTHER_QUERY_ID, ORG_ID)));

        StepVerifier.create(service.getRecordDSLFromLibraryQueryCombineId(new LibraryQueryCombineId(LIBRARY_QUERY_ID, RECORD_ID)))
                .expectNext(record.getLibraryQueryDSL()).verifyComplete();

        verify(libraryQueryService, never()).getLiveDSLByLibraryQueryId(anyString());
        verify(libraryQueryService, never()).getById(LIBRARY_QUERY_ID);
        assertThat(events).startsWith("view check " + LIBRARY_QUERY_ID, "get record", "get query " + OTHER_QUERY_ID);
        assertThat(events.get(events.size() - 1)).as("the DSL is read after the checks").isEqualTo("get record");
    }

    /**
     * Tenant isolation of query versions: (a) the first check refuses another org's query; (b) the live second check refuses
     * a query of another org; (c) an own-org query id combined with a record of ANOTHER org's query is refused. In every case
     * the DSL is never read (it is a lazy read that runs only after the checks).
     */
    @Test
    void getRecordDsl_deniesAnotherOrgsQueries_beforeAnyRead() {
        // (a) first check fails
        when(libraryQueryApiService.checkLibraryQueryViewPermission(LIBRARY_QUERY_ID))
                .thenReturn(Mono.defer(() -> org.lowcoder.sdk.util.ExceptionUtils.ofError(BizError.LIBRARY_QUERY_AND_ORG_NOT_MATCH, "LIBRARY_QUERY_AND_ORG_NOT_MATCH")));
        when(libraryQueryService.getLiveDSLByLibraryQueryId(LIBRARY_QUERY_ID)).thenReturn(logged("read live dsl", LIVE_DSL));
        StepVerifier.create(service.getRecordDSLFromLibraryQueryCombineId(new LibraryQueryCombineId(LIBRARY_QUERY_ID, LATEST)))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.LIBRARY_QUERY_AND_ORG_NOT_MATCH, "LIBRARY_QUERY_AND_ORG_NOT_MATCH")).verify();
        assertThat(events).as("(a) nothing read").isEmpty();
        verify(libraryQueryService, never()).getById(anyString());

        // (b) first check passes, the live query belongs to another org
        stubFirstCheckPasses();
        when(libraryQueryService.getById(LIBRARY_QUERY_ID)).thenReturn(logged("get query", libraryQuery(LIBRARY_QUERY_ID, OTHER_ORG_ID)));
        StepVerifier.create(service.getRecordDSLFromLibraryQueryCombineId(new LibraryQueryCombineId(LIBRARY_QUERY_ID, LATEST)))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.LIBRARY_QUERY_AND_ORG_NOT_MATCH, "LIBRARY_QUERY_AND_ORG_NOT_MATCH")).verify();
        assertThat(events).as("(b) the live DSL is not read").doesNotContain("read live dsl");

        // (c) own-org query id, record of another org's query
        events.clear();
        LibraryQueryRecord foreign = record(RECORD_ID, OTHER_QUERY_ID, USER_ID);
        when(libraryQueryRecordService.getById(RECORD_ID)).thenReturn(logged("get record", foreign));
        when(libraryQueryService.getById(OTHER_QUERY_ID)).thenReturn(logged("get foreign query", libraryQuery(OTHER_QUERY_ID, OTHER_ORG_ID)));
        StepVerifier.create(service.getRecordDSLFromLibraryQueryCombineId(new LibraryQueryCombineId(LIBRARY_QUERY_ID, RECORD_ID)))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.LIBRARY_QUERY_AND_ORG_NOT_MATCH, "LIBRARY_QUERY_AND_ORG_NOT_MATCH")).verify();
        assertThat(events).as("(c) record and query looked up once each by the check, no second record read for the DSL")
                .containsExactly("view check " + LIBRARY_QUERY_ID, "get record", "get foreign query");
    }

    /**
     * An unknown record id ends in LIBRARY_QUERY_NOT_FOUND (the record service errors, nothing is emitted). Behaviour: the
     * "editing" and blank record ids that LibraryQueryCombineId.isUsingEditingRecord names take the same record path and end
     * in NOT_FOUND here, because this class never branches on isUsingEditingRecord (same ruling as L2's twin test).
     */
    @ParameterizedTest(name = "record id [{0}]")
    @ValueSource(strings = {"unknown-record", "editing", ""})
    void getRecordDsl_unknownEditingOrBlankRecordId_endsInNotFound(String recordId) {
        stubFirstCheckPasses();
        when(libraryQueryRecordService.getById(recordId)).thenReturn(Mono.defer(() -> org.lowcoder.sdk.util.ExceptionUtils
                .ofError(BizError.LIBRARY_QUERY_NOT_FOUND, "LIBRARY_QUERY_NOT_FOUND")));

        StepVerifier.create(service.getRecordDSLFromLibraryQueryCombineId(new LibraryQueryCombineId(LIBRARY_QUERY_ID, recordId)))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.LIBRARY_QUERY_NOT_FOUND, "LIBRARY_QUERY_NOT_FOUND")).verify();
        verify(libraryQueryService, never()).getLiveDSLByLibraryQueryId(anyString());
    }

    // ------------------------------------------------------------------ delete

    /**
     * Order of the management check before a deletion: org developer check, the visitor's org, the record, the record's
     * library query, and only then deleteById, exactly once and with the record id.
     */
    @Test
    void delete_checksDevOrgAndRecord_thenDeletes() {
        LibraryQueryRecord record = record(RECORD_ID, OTHER_QUERY_ID, USER_ID);
        when(libraryQueryRecordService.getById(RECORD_ID)).thenReturn(logged("get record", record));
        when(libraryQueryService.getById(OTHER_QUERY_ID)).thenReturn(logged("get query", libraryQuery(OTHER_QUERY_ID, ORG_ID)));
        when(libraryQueryRecordService.deleteById(RECORD_ID)).thenReturn(logged("delete record"));

        StepVerifier.create(service.delete(RECORD_ID)).verifyComplete();

        assertThat(events).containsExactly("dev check", "get record", "get query", "delete record");
        say("delete: %s", events);
    }

    /** No deletion subscribes when the dev check fails, the org differs, or the record is unknown. */
    @Test
    void delete_neverDeletes_whenAnyCheckFails() {
        when(libraryQueryRecordService.deleteById(anyString())).thenReturn(logged("delete record"));

        // developer check fails
        when(orgDevChecker.checkCurrentOrgDev()).thenReturn(Mono.defer(() -> org.lowcoder.sdk.util.ExceptionUtils
                .ofError(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED")));
        when(libraryQueryRecordService.getById(RECORD_ID)).thenReturn(logged("get record", record(RECORD_ID, OTHER_QUERY_ID, USER_ID)));
        StepVerifier.create(service.delete(RECORD_ID))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED")).verify();
        assertThat(events).doesNotContain("delete record");

        // org of the record's query differs
        when(orgDevChecker.checkCurrentOrgDev()).thenReturn(logged("dev check"));
        when(libraryQueryService.getById(OTHER_QUERY_ID)).thenReturn(logged("get query", libraryQuery(OTHER_QUERY_ID, OTHER_ORG_ID)));
        StepVerifier.create(service.delete(RECORD_ID))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.LIBRARY_QUERY_AND_ORG_NOT_MATCH, "LIBRARY_QUERY_AND_ORG_NOT_MATCH")).verify();
        assertThat(events).doesNotContain("delete record");

        // unknown record
        when(libraryQueryRecordService.getById("missing")).thenReturn(Mono.defer(() -> org.lowcoder.sdk.util.ExceptionUtils
                .ofError(BizError.LIBRARY_QUERY_NOT_FOUND, "LIBRARY_QUERY_NOT_FOUND")));
        StepVerifier.create(service.delete("missing"))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.LIBRARY_QUERY_NOT_FOUND, "LIBRARY_QUERY_NOT_FOUND")).verify();
        assertThat(events).as("no deletion ever subscribed").doesNotContain("delete record");
    }

    // ------------------------------------------------------------------ getByLibraryQueryId

    /** The management check runs first (a failing check means the records are never read); views keep the service's order. */
    @Test
    void getByLibraryQueryId_checksManagementFirst_thenBuildsViewsWithCreatorNames() {
        when(libraryQueryApiService.checkLibraryQueryManagementPermission(LIBRARY_QUERY_ID)).thenReturn(logged("management check"));
        LibraryQueryRecord newer = record("r-new", LIBRARY_QUERY_ID, "creator-a");
        LibraryQueryRecord older = record("r-old", LIBRARY_QUERY_ID, "creator-b");
        when(libraryQueryRecordService.getByLibraryQueryId(LIBRARY_QUERY_ID)).thenReturn(logged("read records", List.of(newer, older)));
        when(userService.getByIds(anyCollection())).thenReturn(Mono.just(Map.of(
                "creator-a", user("creator-a", "Alice"), "creator-b", user("creator-b", "Bob"))));

        List<LibraryQueryRecordMetaView> views = service.getByLibraryQueryId(LIBRARY_QUERY_ID).block();

        assertThat(events).containsExactly("management check", "read records");
        assertThat(views).extracting(LibraryQueryRecordMetaView::id).containsExactly("r-new", "r-old");
        assertThat(views).extracting(LibraryQueryRecordMetaView::creatorName).containsExactly("Alice", "Bob");
        assertThat(views).extracting(LibraryQueryRecordMetaView::tag).containsExactly("tag-r-new", "tag-r-old");
        assertThat(views).extracting(LibraryQueryRecordMetaView::libraryQueryId).containsOnly(LIBRARY_QUERY_ID);
        org.mockito.ArgumentCaptor<java.util.Collection<String>> ids = org.mockito.ArgumentCaptor.forClass(java.util.Collection.class);
        verify(userService).getByIds(ids.capture());
        assertThat(Set.copyOf(ids.getValue())).containsExactlyInAnyOrder("creator-a", "creator-b");
    }

    @Test
    void getByLibraryQueryId_refusedManagementCheck_readsNoRecords() {
        when(libraryQueryApiService.checkLibraryQueryManagementPermission(LIBRARY_QUERY_ID)).thenReturn(Mono.defer(() -> org.lowcoder.sdk.util.ExceptionUtils
                .ofError(BizError.LIBRARY_QUERY_AND_ORG_NOT_MATCH, "LIBRARY_QUERY_AND_ORG_NOT_MATCH")));
        when(libraryQueryRecordService.getByLibraryQueryId(LIBRARY_QUERY_ID)).thenReturn(logged("read records", List.of()));

        StepVerifier.create(service.getByLibraryQueryId(LIBRARY_QUERY_ID))
                .expectErrorSatisfies(e -> assertBizError(e, BizError.LIBRARY_QUERY_AND_ORG_NOT_MATCH, "LIBRARY_QUERY_AND_ORG_NOT_MATCH")).verify();

        assertThat(events).isEmpty();
        verify(userService, never()).getByIds(anyCollection());
    }

    /**
     * Behaviour (same ruling as L2): a record whose creator is not in the user lookup is DROPPED from the version list (multiBuild
     * omits it), so a deleted user's published versions vanish from the list while the data and the DSL read by record id stay
     * available. No records gives an empty list.
     */
    @Test
    void getByLibraryQueryId_dropsRecordsWithAnUnknownCreator_andHandlesNoRecords() {
        when(libraryQueryApiService.checkLibraryQueryManagementPermission(LIBRARY_QUERY_ID)).thenReturn(Mono.empty());
        when(libraryQueryRecordService.getByLibraryQueryId(LIBRARY_QUERY_ID)).thenReturn(Mono.just(List.of(
                record("r-known", LIBRARY_QUERY_ID, "creator-a"), record("r-gone", LIBRARY_QUERY_ID, "creator-deleted"))));
        when(userService.getByIds(anyCollection())).thenReturn(Mono.just(Map.of("creator-a", user("creator-a", "Alice"))));

        assertThat(service.getByLibraryQueryId(LIBRARY_QUERY_ID).block()).extracting(LibraryQueryRecordMetaView::id).containsExactly("r-known");

        when(libraryQueryRecordService.getByLibraryQueryId(LIBRARY_QUERY_ID)).thenReturn(Mono.just(List.of()));
        when(userService.getByIds(any())).thenReturn(Mono.just(Map.of()));
        assertThat(service.getByLibraryQueryId(LIBRARY_QUERY_ID).block()).isEmpty();
    }
}
