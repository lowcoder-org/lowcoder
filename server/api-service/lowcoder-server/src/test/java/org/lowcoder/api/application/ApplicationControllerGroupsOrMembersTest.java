package org.lowcoder.api.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.framework.view.PageResponseView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.usermanagement.view.GroupView;
import org.lowcoder.api.usermanagement.view.OrgMemberListView.OrgMemberView;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.repository.ApplicationRepository;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.query.repository.LibraryQueryRepository;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Tests of {@link ApplicationController#getGroupsOrMembersWithoutPermissions} (GET /{applicationId}/groups-members/available)
 * with the REAL {@link GidService} over mocked repositories, so the id converter the controller picks is exercised (the
 * endpoint tests mock the converter and cannot see it).
 *
 * <p>BF-085 (fixed; was pinned as the section 9 row "ApplicationController uses convertLibraryQueryIdToObjectId for an
 * application id"): {@link #applicationGid_isResolvedInTheApplicationRepositoryBF085} and
 * {@link #applicationSlug_isResolvedInTheApplicationRepositoryBF085}.
 */
class ApplicationControllerGroupsOrMembersTest {

    private static final String OBJECT_ID = "appobjectid1";
    private static final String GID = "app-gid-1"; // an id with a dash is looked up as a GID
    private static final String SLUG = "myslug";
    private static final String TYPE = "type";
    private static final String DATA = "data";
    private static final String GROUP_TYPE = "Group";
    private static final String USER_TYPE = "User";
    private static final int DEFAULT_PAGE_NUM = 1;
    private static final int DEFAULT_PAGE_SIZE = 1000;
    private static final int INTERNAL_SERVER_ERROR_BIZ_CODE = BizError.INTERNAL_SERVER_ERROR.getBizErrorCode();

    private ApplicationApiService applicationApiService;
    private ApplicationRepository applicationRepository;
    private LibraryQueryRepository libraryQueryRepository;
    private ApplicationController controller;

    @BeforeEach
    void setUp() {
        applicationApiService = mock(ApplicationApiService.class);
        applicationRepository = mock(ApplicationRepository.class);
        libraryQueryRepository = mock(LibraryQueryRepository.class);
        GidService gidService = new GidService();
        ReflectionTestUtils.setField(gidService, "applicationRepository", applicationRepository);
        ReflectionTestUtils.setField(gidService, "libraryQueryRepository", libraryQueryRepository);
        when(libraryQueryRepository.findByGid(anyString())).thenReturn(Flux.empty());
        when(applicationRepository.findByGid(anyString())).thenReturn(Flux.empty());
        when(applicationRepository.findBySlug(anyString())).thenReturn(Flux.empty());
        controller = new ApplicationController(mock(UserHomeApiService.class), applicationApiService,
                mock(BusinessEventPublisher.class), gidService, mock(ApplicationRecordService.class));
    }

    private static Map<String, Object> group(String name) {
        Map<String, Object> map = new HashMap<>();
        map.put(TYPE, GROUP_TYPE);
        map.put(DATA, GroupView.builder().groupId("g-" + name).groupName(name).build());
        return map;
    }

    private static Map<String, Object> user(String name) {
        Map<String, Object> map = new HashMap<>();
        map.put(TYPE, USER_TYPE);
        map.put(DATA, OrgMemberView.builder().userId("u-" + name).name(name).build());
        return map;
    }

    private void serviceReturns(List<Object> items) {
        when(applicationApiService.getGroupsOrMembersWithoutPermissions(OBJECT_ID)).thenReturn(Mono.just(items));
    }

    private ResponseView<List<Object>> call(String search, int pageNum, int pageSize) {
        return controller.getGroupsOrMembersWithoutPermissions(OBJECT_ID, search, pageNum, pageSize).block();
    }

    private static List<Object> names(ResponseView<List<Object>> view) {
        List<Object> out = new ArrayList<>();
        for (Object item : view.getData()) {
            Map<?, ?> map = (Map<?, ?>) item;
            Object data = map.get(DATA);
            out.add(data instanceof GroupView g ? g.getGroupName() : ((OrgMemberView) data).getName());
        }
        return out;
    }

    private static void assertPage(ResponseView<List<Object>> view, int pageNum, int pageSize, int total) {
        assertThat(view).isInstanceOf(PageResponseView.class);
        PageResponseView<?> page = (PageResponseView<?>) view;
        assertThat(page.isSuccess()).isTrue();
        assertThat(page.getPageNum()).as("pageNum").isEqualTo(pageNum);
        assertThat(page.getPageSize()).as("pageSize").isEqualTo(pageSize);
        assertThat(page.getTotal()).as("total").isEqualTo(total);
    }

    // ---- id forms (section 9 row) ----

    /**
     * BF-085 (fixed; was pinned: the GID was looked up in the LIBRARY QUERY repository, found nothing, and the Mono ended
     * empty, an empty 200 body over HTTP): an application GID is resolved in the application repository and the
     * application's object id reaches the service.
     */
    @Test
    void applicationGid_isResolvedInTheApplicationRepositoryBF085() {
        when(applicationRepository.findByGid(GID)).thenReturn(Flux.just(Application.builder().id(OBJECT_ID).build()));
        serviceReturns(List.of(group("a")));

        ResponseView<List<Object>> view = controller.getGroupsOrMembersWithoutPermissions(GID, null, DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE).block();

        System.out.println("[ApplicationControllerGroupsOrMembersTest] gid " + GID + " -> " + (view == null ? null : names(view)));
        verify(applicationRepository).findByGid(GID);
        verify(libraryQueryRepository, never()).findByGid(anyString());
        verify(applicationApiService).getGroupsOrMembersWithoutPermissions(OBJECT_ID);
        assertThat(view).isNotNull();
        assertPage(view, DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE, 1);
    }

    /**
     * BF-085 (fixed; was pinned: a slug was forwarded unresolved, so the service looked up an application by the slug as
     * its id): a slug is resolved in the application repository, like every sibling endpoint, and the application's object
     * id reaches the service.
     */
    @Test
    void applicationSlug_isResolvedInTheApplicationRepositoryBF085() {
        when(applicationRepository.findBySlug(SLUG)).thenReturn(Flux.just(Application.builder().id(OBJECT_ID).build()));
        serviceReturns(List.of(group("a")));

        ResponseView<List<Object>> view = controller.getGroupsOrMembersWithoutPermissions(SLUG, null, DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE).block();

        System.out.println("[ApplicationControllerGroupsOrMembersTest] slug " + SLUG + " -> " + (view == null ? null : names(view)));
        verify(applicationRepository).findBySlug(SLUG);
        verify(applicationApiService).getGroupsOrMembersWithoutPermissions(OBJECT_ID);
        verify(applicationApiService, never()).getGroupsOrMembersWithoutPermissions(SLUG);
        assertThat(view).isNotNull();
        assertPage(view, DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE, 1);
    }

    @Test
    void objectId_isForwardedUnchanged() {
        serviceReturns(List.of(group("a"), user("b")));

        ResponseView<List<Object>> view = call(null, DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE);

        verify(applicationApiService).getGroupsOrMembersWithoutPermissions(OBJECT_ID);
        verify(libraryQueryRepository, never()).findByGid(anyString());
        assertThat(names(view)).containsExactly("a", "b");
    }

    // ---- search ----

    @ParameterizedTest(name = "search=[{0}]")
    @NullSource
    @ValueSource(strings = {"", "   "})
    void noOrBlankSearch_returnsEveryItem_withPageFieldsAndTotal(String search) {
        List<Object> items = List.of(group("Admins"), user("Bob"), "not a map", Map.of(TYPE, "Other"));
        serviceReturns(items);

        ResponseView<List<Object>> view = call(search, DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE);

        assertThat(view.getData()).containsExactlyElementsOf(items);
        assertPage(view, DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE, items.size());
    }

    @Test
    void search_filtersGroupNameAndUserName_caseInsensitively() {
        serviceReturns(List.of(group("Developers"), group("Sales"), user("Dev Dana"), user("Carol")));

        assertThat(names(call("dEV", DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE))).containsExactly("Developers", "Dev Dana");
        assertThat(names(call("SALES", DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE))).containsExactly("Sales");
        assertThat(names(call("carol", DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE))).containsExactly("Carol");
        ResponseView<List<Object>> none = call("zzz", DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE);
        assertThat(none.getData()).isEmpty();
        assertPage(none, DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE, 0);
    }

    @Test
    void search_dropsItemsItCannotMatch() {
        Map<String, Object> groupWithUserData = new HashMap<>();
        groupWithUserData.put(TYPE, GROUP_TYPE);
        groupWithUserData.put(DATA, OrgMemberView.builder().name("match").build());
        Map<String, Object> userWithGroupData = new HashMap<>();
        userWithGroupData.put(TYPE, USER_TYPE);
        userWithGroupData.put(DATA, GroupView.builder().groupName("match").build());
        Map<String, Object> otherType = new HashMap<>();
        otherType.put(TYPE, "Other");
        otherType.put(DATA, GroupView.builder().groupName("match").build());
        Map<String, Object> nullNameGroup = new HashMap<>();
        nullNameGroup.put(TYPE, GROUP_TYPE);
        nullNameGroup.put(DATA, GroupView.builder().groupId("g").build());
        Map<String, Object> nullNameUser = new HashMap<>();
        nullNameUser.put(TYPE, USER_TYPE);
        nullNameUser.put(DATA, OrgMemberView.builder().userId("u").build());
        Map<String, Object> typeless = new HashMap<>();
        typeless.put(DATA, GroupView.builder().groupName("match").build());
        serviceReturns(List.of("match", groupWithUserData, userWithGroupData, otherType, nullNameGroup, nullNameUser,
                typeless, group("match")));

        ResponseView<List<Object>> view = call("match", DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE);

        assertThat(names(view)).containsExactly("match");
        assertPage(view, DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE, 1);
    }

    // ---- paging ----

    @Test
    void paging_skipsAndTakes_andTotalCountsTheFilteredItems() {
        serviceReturns(List.of(group("g1"), group("g2"), group("g3"), group("g4"), group("g5"), user("other")));

        ResponseView<List<Object>> second = call("g", 2, 2);
        assertThat(names(second)).containsExactly("g3", "g4");
        assertPage(second, 2, 2, 5);

        ResponseView<List<Object>> last = call("g", 3, 2);
        assertThat(names(last)).containsExactly("g5");
        assertPage(last, 3, 2, 5);

        ResponseView<List<Object>> past = call("g", 4, 2);
        assertThat(past.getData()).isEmpty();
        assertPage(past, 4, 2, 5);

        ResponseView<List<Object>> unfiltered = call(null, 1, 4);
        assertThat(unfiltered.getData()).hasSize(4);
        assertPage(unfiltered, 1, 4, 6);
    }

    @Test
    void pageSizeZero_meansNoLimit() {
        serviceReturns(List.of(group("g1"), group("g2"), group("g3")));

        ResponseView<List<Object>> view = call(null, 1, 0);

        assertThat(names(view)).containsExactly("g1", "g2", "g3");
        assertPage(view, 1, 0, 3);
    }

    // ---- upstream ----

    @Test
    void upstreamIsSubscribedOnce_forTheCountAndThePage() {
        AtomicInteger subscriptions = new AtomicInteger();
        when(applicationApiService.getGroupsOrMembersWithoutPermissions(OBJECT_ID)).thenReturn(Mono.defer(() -> {
            subscriptions.incrementAndGet();
            return Mono.just(List.<Object>of(group("g1"), group("g2")));
        }));

        ResponseView<List<Object>> view = call(null, DEFAULT_PAGE_NUM, 1);

        assertThat(subscriptions.get()).as("subscriptions of the application service Mono").isEqualTo(1);
        assertPage(view, DEFAULT_PAGE_NUM, 1, 2);
    }

    @Test
    void serviceError_reachesTheCaller() {
        BizException failure = new BizException(BizError.NO_RESOURCE_FOUND, "CANT_FIND_APPLICATION", OBJECT_ID);
        when(applicationApiService.getGroupsOrMembersWithoutPermissions(OBJECT_ID)).thenReturn(Mono.error(failure));

        StepVerifier.create(controller.getGroupsOrMembersWithoutPermissions(OBJECT_ID, null, DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(failure))
                .verify();
    }

    /**
     * Behaviour (consistent with L3's C6, not a section 9 row): pageNum 0 makes {@code skip((pageNum - 1) * pageSize)}
     * negative, and Reactor's {@code Flux.skip} rejects it with an IllegalArgumentException that arrives as an error signal.
     * It is not a BizException, so GlobalExceptionHandler.catchException (the catch-all for non-Biz exceptions) answers it:
     * HTTP 500 with bizErrorCode 5000 (BizError.INTERNAL_SERVER_ERROR) and the generic INTERNAL_SERVER_ERROR message, i.e. a
     * raw 500 for {@code ?pageNum=0}; the unit test does not run the handler. A negative pageSize on page 1 skips 0 and, since
     * pageSize is not positive, applies no limit; on page 2 or later it is negative again and fails the same way.
     */
    @Test
    void pageNumZero_andNegativePageSizeOnLaterPages_endInIllegalArgumentException() {
        serviceReturns(List.of(group("g1"), group("g2"), group("g3")));

        StepVerifier.create(controller.getGroupsOrMembersWithoutPermissions(OBJECT_ID, null, 0, DEFAULT_PAGE_SIZE))
                .expectErrorSatisfies(error -> assertThat(error).isInstanceOf(IllegalArgumentException.class)
                        .isNotInstanceOf(BizException.class))
                .verify();
        StepVerifier.create(controller.getGroupsOrMembersWithoutPermissions(OBJECT_ID, null, 2, -5))
                .expectErrorSatisfies(error -> assertThat(error).isInstanceOf(IllegalArgumentException.class))
                .verify();

        ResponseView<List<Object>> firstPage = call(null, 1, -5);
        assertThat(names(firstPage)).containsExactly("g1", "g2", "g3");
        assertPage(firstPage, 1, -5, 3);
        assertThat(INTERNAL_SERVER_ERROR_BIZ_CODE).as("code the catch-all handler answers").isEqualTo(5000);
    }
}
