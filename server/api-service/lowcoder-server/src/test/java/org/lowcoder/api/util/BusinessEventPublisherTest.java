package org.lowcoder.api.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.application.view.ApplicationPublishRequest;
import org.lowcoder.api.application.view.ApplicationView;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.permission.view.CommonPermissionView;
import org.lowcoder.api.permission.view.PermissionItemView;
import org.lowcoder.api.usermanagement.view.AddMemberRequest;
import org.lowcoder.api.usermanagement.view.UpdateRoleRequest;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.service.ApplicationRecordServiceImpl;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.service.FolderService;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.infra.event.AbstractEvent;
import org.lowcoder.infra.event.ApplicationCommonEvent;
import org.lowcoder.infra.event.DatasourceResourcePermissionEvent;
import org.lowcoder.infra.event.FolderCommonEvent;
import org.lowcoder.infra.event.LibraryQueryEvent;
import org.lowcoder.infra.event.LibraryQueryPublishEvent;
import org.lowcoder.infra.event.QueryExecutionEvent;
import org.lowcoder.infra.event.datasource.DatasourceEvent;
import org.lowcoder.infra.event.datasource.DatasourcePermissionEvent;
import org.lowcoder.infra.event.group.GroupCreateEvent;
import org.lowcoder.infra.event.group.GroupDeleteEvent;
import org.lowcoder.infra.event.group.GroupUpdateEvent;
import org.lowcoder.infra.event.groupmember.GroupMemberAddEvent;
import org.lowcoder.infra.event.groupmember.GroupMemberLeaveEvent;
import org.lowcoder.infra.event.groupmember.GroupMemberRemoveEvent;
import org.lowcoder.infra.event.groupmember.GroupMemberRoleUpdateEvent;
import org.lowcoder.infra.event.user.UserLoginEvent;
import org.lowcoder.infra.event.user.UserLogoutEvent;
import org.lowcoder.plugin.api.event.LowcoderEvent.EventType;
import org.lowcoder.sdk.constants.Authentication;
import org.lowcoder.sdk.constants.GlobalContext;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@link BusinessEventPublisher} (audit events) with every collaborator mocked; the published events are captured with an
 * {@link ArgumentCaptor} on {@code ApplicationEventPublisher.publishEvent} and read field by field. Every publish method
 * calls {@code event.populateDetails(contextView)}, which needs {@code GlobalContext.HEADERS} in the Reactor context, so
 * every call here runs with a context holding the headers and a client locale (the one test that omits it says so).
 * The infra class {@code AbstractEvent} is covered through these builders and in the last test.
 *
 * <p>Effects pinned as behaviour (none ruled a defect), each named in its test:
 * <ul>
 * <li>an audit event is lost, not an error, when its application cannot be loaded for the details, including the
 * recycle and restore calls of {@code ApplicationController} (:62, :71) when the application is addressed by a slug:
 * {@link #applicationCommon_idForm_applicationNotFoundByTheSecondLookup_publishesNothing}</li>
 * <li>the application common events fall back to an {@code OrgMember} with null ids, giving an audit event with null orgId
 * and userId: {@link #applicationCommon_visitorOrgMemberLookupFails_publishesAnEventWithNullOrgAndUser}</li>
 * <li>a failing visitor lookup gives no audit event and no error: {@link #failingVisitorLookup_isSwallowed_noEventNoError}</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class BusinessEventPublisherTest {

    private static final String LOG_PREFIX = "[BusinessEventPublisherTest] ";

    private static final String ORG = "org-1";
    private static final String USER = "user-1";
    private static final String TOKEN = "token-abc";
    private static final String APP_ID = "app-1";
    private static final String BUNDLE_ID = "bundle-1";
    private static final String FOLDER_TO = "f-to";
    private static final String FOLDER_FROM = "f-from";
    private static final String GROUP_ID = "group-1";
    private static final String MEMBER_ID = "member-1";
    private static final String DS_ID = "ds-1";
    private static final Locale LOCALE = Locale.GERMAN;
    private static final String GROUP_NAME = "name-" + LOCALE.toLanguageTag();
    private static final Map<String, String> HEADERS = Map.of("x-test", "header-value");
    private static final String ENVIRONMENT_ID = "env-test";

    @Mock
    private ApplicationEventPublisher applicationEventPublisher;
    @Mock
    private SessionUserService sessionUserService;
    @Mock
    private GroupService groupService;
    @Mock
    private UserService userService;
    @Mock
    private FolderService folderService;
    @Mock
    private ApplicationService applicationService;
    @Mock
    private DatasourceService datasourceService;
    @Mock
    private ResourcePermissionService resourcePermissionService;
    @Mock
    private ApplicationRecordServiceImpl applicationRecordServiceImpl;

    private BusinessEventPublisher publisher;

    private final Application app = mock(Application.class);
    private final Group group = mock(Group.class);
    private final Folder folderTo = new Folder();
    private final Folder folderFrom = new Folder();
    private final User member = new User();
    private final Datasource datasource = new Datasource();
    private final GroupMember groupMember = new GroupMember(GROUP_ID, MEMBER_ID, MemberRole.ADMIN, ORG, 0L);
    private final ResourcePermission oldResourcePermission = ResourcePermission.builder().resourceId(DS_ID).build();
    private final ResourcePermission newResourcePermission = ResourcePermission.builder().resourceId(DS_ID).build();
    private final CommonPermissionView oldPermissionView = mock(CommonPermissionView.class);
    private final CommonPermissionView newPermissionView = mock(CommonPermissionView.class);
    private final ApplicationPermissionView sharingView = ApplicationPermissionView.builder().build();
    private final List<PermissionItemView> oldPermissions = List.of(mock(PermissionItemView.class));
    private final List<PermissionItemView> newPermissions = List.of(mock(PermissionItemView.class));

    @BeforeEach
    void setUp() {
        publisher = new BusinessEventPublisher(applicationEventPublisher, sessionUserService, groupService, userService,
                folderService, applicationService, datasourceService, resourcePermissionService, applicationRecordServiceImpl);
        AbstractEvent.setEnvironmentID(ENVIRONMENT_ID);

        lenient().when(sessionUserService.getVisitorToken()).thenReturn(Mono.just(TOKEN));
        stubVisitor(USER, false);

        lenient().when(app.getId()).thenReturn(APP_ID);
        lenient().when(app.getGid()).thenReturn("gid-app-1");
        lenient().when(app.getName()).thenReturn("App");
        lenient().when(app.getCategory(any())).thenReturn(Mono.just("cat"));
        lenient().when(app.getDescription(any())).thenReturn(Mono.just("desc"));
        lenient().when(app.getTitle(any())).thenReturn(Mono.just("title"));
        lenient().when(applicationService.findById(APP_ID)).thenReturn(Mono.just(app));
        lenient().when(applicationService.findByIdWithoutDsl(APP_ID)).thenReturn(Mono.just(app));
        lenient().when(applicationService.findByIdWithoutDsl(BUNDLE_ID)).thenReturn(Mono.just(app));

        folderTo.setId(FOLDER_TO);
        folderTo.setName("Folder To");
        folderFrom.setId(FOLDER_FROM);
        folderFrom.setName("Folder From");
        lenient().when(folderService.findById(FOLDER_TO)).thenReturn(Mono.just(folderTo));
        lenient().when(folderService.findById(FOLDER_FROM)).thenReturn(Mono.just(folderFrom));

        lenient().when(group.getId()).thenReturn(GROUP_ID);
        lenient().when(group.getName(any(Locale.class))).thenAnswer(invocation -> "name-" + ((Locale) invocation.getArgument(0)).toLanguageTag());
        lenient().when(groupService.getById(GROUP_ID)).thenReturn(Mono.just(group));
        member.setId(MEMBER_ID);
        member.setName("Member Name");
        lenient().when(userService.findById(MEMBER_ID)).thenReturn(Mono.just(member));

        datasource.setId(DS_ID);
        datasource.setName("Datasource");
        datasource.setType("mysql");
        lenient().when(datasourceService.getById(DS_ID)).thenReturn(Mono.just(datasource));

        lenient().when(oldPermissionView.getPermissions()).thenReturn(oldPermissions);
        lenient().when(newPermissionView.getPermissions()).thenReturn(newPermissions);
    }

    @AfterEach
    void tearDown() {
        AbstractEvent.setEnvironmentID(null);
    }

    // ------------------------------------------------------------------ fixtures

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }

    private void stubVisitor(String userId, boolean sessionAnonymous) {
        OrgMember orgMember = new OrgMember(ORG, userId, MemberRole.MEMBER, "normal", 0L);
        lenient().when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(orgMember));
        lenient().when(sessionUserService.getVisitorOrgMember()).thenReturn(Mono.just(orgMember));
        lenient().when(sessionUserService.isAnonymousUser()).thenReturn(Mono.just(sessionAnonymous));
    }

    private static String sha512(String text) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-512").digest(text.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static Mono<Void> withContext(Mono<Void> mono) {
        return mono.contextWrite(context -> context.put(GlobalContext.HEADERS, HEADERS).put(GlobalContext.CLIENT_LOCALE, LOCALE));
    }

    private List<Object> publishedEvents(int expected) {
        ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
        verify(applicationEventPublisher, times(expected)).publishEvent(captor.capture());
        return captor.getAllValues();
    }

    private AbstractEvent singleEvent() {
        List<Object> events = publishedEvents(1);
        assertThat(events.get(0)).isInstanceOf(AbstractEvent.class);
        return (AbstractEvent) events.get(0);
    }

    private static Object field(Object event, String name) {
        return ReflectionTestUtils.getField(event, name);
    }

    private static Map<String, Object> fields(Object... keyValues) {
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            map.put((String) keyValues[i], keyValues[i + 1]);
        }
        return map;
    }

    private static void assertFields(Object event, Map<String, Object> expected) {
        expected.forEach((name, value) -> assertThat(field(event, name)).as("field " + name).isEqualTo(value));
    }

    private ApplicationView applicationView(String name, String category, String description, String title, String folderId, String folderIdFrom) {
        return ApplicationView.builder().applicationInfoView(ApplicationInfoView.builder()
                .orgId("author-org").applicationId(APP_ID).applicationGid("gid-app-1").name(name).createBy("author-1")
                .category(category).description(description).title(title).folderId(folderId).folderIdFrom(folderIdFrom).build()).build();
    }

    private ApplicationView originalView() {
        return applicationView("Old App", "old-cat", "old-desc", "old-title", null, null);
    }

    private BundleInfoView bundleView() {
        return BundleInfoView.builder().bundleId(BUNDLE_ID).bundleGid("gid-bundle-1").name("Bundle").folderId(FOLDER_TO).folderIdFrom(FOLDER_FROM).build();
    }

    // ------------------------------------------------------------------ the methods under test

    private enum Method {
        FOLDER(FolderCommonEvent.class, false, false),
        APP_VIEW_FORM(ApplicationCommonEvent.class, true, false),
        APP_ID_FORM(ApplicationCommonEvent.class, true, false),
        APP_PERMISSION(ApplicationCommonEvent.class, true, false),
        APP_SHARING(ApplicationCommonEvent.class, true, true),
        APP_PUBLISH(ApplicationCommonEvent.class, true, true),
        APP_VERSION(ApplicationCommonEvent.class, true, true),
        BUNDLE_VIEW(ApplicationCommonEvent.class, true, true),
        BUNDLE_ID(ApplicationCommonEvent.class, true, true),
        LOGIN(UserLoginEvent.class, false, false),
        LOGOUT(UserLogoutEvent.class, false, false),
        GROUP_CREATE(GroupCreateEvent.class, false, false),
        GROUP_UPDATE(GroupUpdateEvent.class, false, false),
        GROUP_DELETE(GroupDeleteEvent.class, false, false),
        MEMBER_ADD(GroupMemberAddEvent.class, false, false),
        MEMBER_ROLE(GroupMemberRoleUpdateEvent.class, false, false),
        MEMBER_LEAVE(GroupMemberLeaveEvent.class, false, false),
        MEMBER_REMOVE(GroupMemberRemoveEvent.class, false, false),
        DS_OBJECT(DatasourceEvent.class, false, false),
        DS_ID_FORM(DatasourceEvent.class, false, false),
        DS_PERMISSION(DatasourcePermissionEvent.class, false, false),
        DS_RESOURCE_PERMISSION(DatasourceResourcePermissionEvent.class, false, false),
        LQ_PUBLISH(LibraryQueryPublishEvent.class, false, false),
        LQ(LibraryQueryEvent.class, false, false);

        final Class<? extends AbstractEvent> eventType;
        /** anonymity comes from {@code SessionUserService.isAnonymousUser()} instead of the org member's user id */
        final boolean sessionAnonymity;
        /** an anonymous visitor produces no event at all */
        final boolean skipsAnonymous;

        Method(Class<? extends AbstractEvent> eventType, boolean sessionAnonymity, boolean skipsAnonymous) {
            this.eventType = eventType;
            this.sessionAnonymity = sessionAnonymity;
            this.skipsAnonymous = skipsAnonymous;
        }
    }

    private Mono<Void> call(Method method, boolean publish) {
        return switch (method) {
            case FOLDER -> publisher.publishFolderCommonEvent("folder-1", "Folder", "From", EventType.FOLDER_UPDATE);
            case APP_VIEW_FORM -> publisher.publishApplicationCommonEvent(originalView(),
                    applicationView("App", "cat-view", "desc-view", "title-view", FOLDER_TO, FOLDER_FROM), EventType.APPLICATION_UPDATE);
            case APP_ID_FORM -> publisher.publishApplicationCommonEvent(originalView(), APP_ID, FOLDER_FROM, FOLDER_TO, EventType.APPLICATION_MOVE);
            case APP_PERMISSION -> publisher.publishApplicationPermissionEvent(APP_ID, Set.of("u1"), Set.of("g1"), "perm-1", "admin");
            case APP_SHARING -> publisher.publishApplicationSharingEvent(APP_ID, "public", sharingView);
            case APP_PUBLISH -> publisher.publishApplicationPublishEvent(APP_ID, new ApplicationPublishRequest("release notes", "v2"));
            case APP_VERSION -> publisher.publishApplicationVersionChangeEvent(APP_ID, "v3");
            case BUNDLE_VIEW -> publisher.publishBundleCommonEvent(bundleView(), EventType.BUNDLE_UPDATE);
            case BUNDLE_ID -> publisher.publishBundleCommonEvent(BUNDLE_ID, FOLDER_FROM, FOLDER_TO, EventType.BUNDLE_UPDATE);
            case LOGIN -> publisher.publishUserLoginEvent("GITHUB");
            case LOGOUT -> publisher.publishUserLogoutEvent();
            case GROUP_CREATE -> publisher.publishGroupCreateEvent(group);
            case GROUP_UPDATE -> publisher.publishGroupUpdateEvent(publish, group, "New Group Name");
            case GROUP_DELETE -> publisher.publishGroupDeleteEvent(publish, group);
            case MEMBER_ADD -> publisher.publishGroupMemberAddEvent(publish, GROUP_ID, addMemberRequest());
            case MEMBER_ROLE -> publisher.publishGroupMemberRoleUpdateEvent(publish, GROUP_ID, groupMember, updateRoleRequest());
            case MEMBER_LEAVE -> publisher.publishGroupMemberLeaveEvent(publish, groupMember);
            case MEMBER_REMOVE -> publisher.publishGroupMemberRemoveEvent(publish, groupMember);
            case DS_OBJECT -> publisher.publishDatasourceEvent(datasource, EventType.DATA_SOURCE_UPDATE, "Old Name");
            case DS_ID_FORM -> publisher.publishDatasourceEvent(DS_ID, EventType.DATA_SOURCE_DELETE, "Old Name");
            case DS_PERMISSION -> publisher.publishDatasourcePermissionEvent(DS_ID, List.of("u1"), List.of("g1"), "admin",
                    EventType.DATA_SOURCE_PERMISSION_UPDATE, oldPermissionView, newPermissionView);
            case DS_RESOURCE_PERMISSION -> publisher.publishDatasourceResourcePermissionEvent(EventType.DATA_SOURCE_PERMISSION_GRANT,
                    oldResourcePermission, newResourcePermission);
            case LQ_PUBLISH -> publisher.publishLibraryQueryPublishEvent("lq-1", "v1", "v2", EventType.LIBRARY_QUERY_PUBLISH);
            case LQ -> publisher.publishLibraryQueryEvent("lq-1", "Query Name", EventType.LIBRARY_QUERY_UPDATE, "Old Query Name");
        };
    }

    private AddMemberRequest addMemberRequest() {
        AddMemberRequest request = new AddMemberRequest();
        request.setUserId(MEMBER_ID);
        request.setRole("member");
        return request;
    }

    private UpdateRoleRequest updateRoleRequest() {
        UpdateRoleRequest request = new UpdateRoleRequest();
        request.setUserId(MEMBER_ID);
        request.setRole("super_admin");
        return request;
    }

    private void run(Method method) {
        StepVerifier.create(withContext(call(method, true))).verifyComplete();
    }

    /** The method-specific fields of the event published by {@link #call}, besides the identity fields. */
    private Map<String, Object> payload(Method method) {
        return switch (method) {
            case FOLDER -> fields("id", "folder-1", "name", "Folder", "fromName", "From", "type", EventType.FOLDER_UPDATE);
            case APP_VIEW_FORM -> fields("applicationId", APP_ID, "applicationGid", "gid-app-1", "applicationName", "App",
                    "applicationAuthor", "author-1", "applicationAuthorOrgId", "author-org",
                    "applicationCategory", "cat", "applicationDescription", "desc", "applicationTitle", "title",
                    "oldApplicationName", "Old App", "oldApplicationCategory", "old-cat", "oldApplicationDescription", "old-desc",
                    "oldApplicationTitle", "old-title", "type", EventType.APPLICATION_UPDATE,
                    "folderId", FOLDER_TO, "folderName", "Folder To", "oldFolderId", FOLDER_FROM, "oldFolderName", "Folder From");
            case APP_ID_FORM -> fields("applicationId", APP_ID, "applicationName", "App", "applicationCategory", "cat",
                    "oldApplicationName", "Old App", "type", EventType.APPLICATION_MOVE,
                    "folderId", FOLDER_TO, "folderName", "Folder To", "oldFolderId", FOLDER_FROM, "oldFolderName", "Folder From");
            case APP_PERMISSION -> fields("applicationId", APP_ID, "applicationGid", "gid-app-1", "applicationName", "App",
                    "applicationCategory", "cat", "applicationDescription", "desc", "type", EventType.APPLICATION_PERMISSION_CHANGE,
                    "permissionId", "perm-1", "role", "admin", "userIds", Set.of("u1"), "groupIds", Set.of("g1"));
            case APP_SHARING -> fields("applicationId", APP_ID, "applicationGid", "gid-app-1", "applicationName", "App", "applicationCategory", "cat",
                    "applicationDescription", "desc", "type", EventType.APPLICATION_SHARING_CHANGE, "shareType", "public",
                    "sharingDetails", sharingView);
            case APP_PUBLISH -> fields("applicationId", APP_ID, "applicationGid", "gid-app-1", "applicationName", "App", "applicationCategory", "cat",
                    "applicationDescription", "desc", "type", EventType.APPLICATION_PUBLISH, "commitMessage", "release notes", "tag", "v2");
            case APP_VERSION -> fields("applicationId", APP_ID, "applicationGid", "gid-app-1", "applicationName", "App", "applicationCategory", "cat",
                    "applicationDescription", "desc", "type", EventType.APPLICATION_VERSION_CHANGE, "tag", "v3");
            case BUNDLE_VIEW, BUNDLE_ID -> fields("applicationId", BUNDLE_ID, "applicationGid", method == Method.BUNDLE_VIEW ? "gid-bundle-1" : null,
                    "applicationName", method == Method.BUNDLE_VIEW ? "Bundle" : "App",
                    "type", EventType.BUNDLE_UPDATE, "folderId", FOLDER_TO, "folderName", "Folder To",
                    "oldFolderId", FOLDER_FROM, "oldFolderName", "Folder From");
            case LOGIN -> fields("source", "GITHUB");
            case LOGOUT -> fields();
            case GROUP_CREATE, GROUP_DELETE -> fields("groupId", GROUP_ID, "groupName", GROUP_NAME);
            case GROUP_UPDATE -> fields("groupId", GROUP_ID, "groupName", "New Group Name", "oldGroupName", GROUP_NAME);
            case MEMBER_ADD -> fields("groupId", GROUP_ID, "groupName", GROUP_NAME, "memberId", MEMBER_ID,
                    "memberName", "Member Name", "memberRole", "member");
            case MEMBER_ROLE -> fields("groupId", GROUP_ID, "groupName", GROUP_NAME, "memberId", MEMBER_ID,
                    "memberName", "Member Name", "memberRole", "super_admin", "oldMemberRole", "admin");
            case MEMBER_LEAVE, MEMBER_REMOVE -> fields("groupId", GROUP_ID, "groupName", GROUP_NAME, "memberId", MEMBER_ID,
                    "memberName", "Member Name", "memberRole", "admin");
            case DS_OBJECT -> fields("datasourceId", DS_ID, "name", "Datasource", "type", "mysql", "oldName", "Old Name",
                    "eventType", EventType.DATA_SOURCE_UPDATE);
            case DS_ID_FORM -> fields("datasourceId", DS_ID, "name", "Datasource", "type", "mysql", "oldName", "Old Name",
                    "eventType", EventType.DATA_SOURCE_DELETE);
            case DS_PERMISSION -> fields("datasourceId", DS_ID, "name", "Datasource", "type", "mysql", "userIds", List.of("u1"),
                    "groupIds", List.of("g1"), "role", "admin", "oldPermissions", oldPermissions, "newPermissions", newPermissions,
                    "eventType", EventType.DATA_SOURCE_PERMISSION_UPDATE);
            case DS_RESOURCE_PERMISSION -> fields("name", "Datasource", "type", "mysql", "oldPermission", oldResourcePermission,
                    "newPermission", newResourcePermission, "eventType", EventType.DATA_SOURCE_PERMISSION_GRANT);
            case LQ_PUBLISH -> fields("id", "lq-1", "oldVersion", "v1", "newVersion", "v2", "eventType", EventType.LIBRARY_QUERY_PUBLISH);
            case LQ -> fields("id", "lq-1", "name", "Query Name", "oldName", "Old Query Name", "eventType", EventType.LIBRARY_QUERY_UPDATE);
        };
    }

    // ------------------------------------------------------------------ identity fields

    /**
     * Catches a missing or mis-attributed audit event: for every publish method exactly one event of the expected class is
     * published with the visitor's org and user ids, {@code isAnonymous} false, the SHA-512 (hex, 128 characters, not the
     * token itself) of the visitor token as session hash, the context headers as event headers, and populated details.
     */
    @ParameterizedTest
    @EnumSource(Method.class)
    void everyPublishMethod_publishesOneEventWithTheVisitorsIdentity(Method method) {
        run(method);

        AbstractEvent event = singleEvent();
        assertThat(event).isInstanceOf(method.eventType);
        assertThat(event.getOrgId()).isEqualTo(ORG);
        assertThat(event.getUserId()).isEqualTo(USER);
        assertThat(event.getIsAnonymous()).isFalse();
        assertThat(event.getSessionHash()).isEqualTo(sha512(TOKEN)).hasSize(128).isNotEqualTo(TOKEN);
        assertThat(event.getEventHeaders()).isEqualTo(HEADERS);
        assertThat(event.getDetails()).isNotNull();
        say("%s -> %s published for %s/%s", method, event.getClass().getSimpleName(), event.getOrgId(), event.getUserId());
    }

    /**
     * Catches a wrong anonymous flag: application and bundle events take it from {@code isAnonymousUser()}, the others
     * from the org member's user id ({@code Authentication.isAnonymousUser}); an anonymous visitor produces no event for
     * sharing, publish, version change and the two bundle forms, and an event with {@code isAnonymous} true otherwise.
     */
    @ParameterizedTest
    @EnumSource(Method.class)
    void anonymousVisitor_isFlagged_orSkipped(Method method) {
        if (method.sessionAnonymity) {
            stubVisitor(USER, true);
        } else {
            stubVisitor(Authentication.ANONYMOUS_USER_ID, false);
        }

        run(method);

        if (method.skipsAnonymous) {
            verifyNoInteractions(applicationEventPublisher);
        } else {
            AbstractEvent event = singleEvent();
            assertThat(event.getIsAnonymous()).isTrue();
            assertThat(event.getUserId()).isEqualTo(method.sessionAnonymity ? USER : Authentication.ANONYMOUS_USER_ID);
        }
        say("%s anonymous -> %s", method, method.skipsAnonymous ? "no event" : "event flagged anonymous");
    }

    /** Catches wrong or missing payload fields: each method's event carries the fields its audit entry is about. */
    @ParameterizedTest
    @EnumSource(Method.class)
    void everyPublishMethod_carriesTheRightPayload(Method method) {
        run(method);

        assertFields(singleEvent(), payload(method));
        say("%s payload verified: %s", method, payload(method).keySet());
    }

    // ------------------------------------------------------------------ application common event details

    /**
     * Catches wrong "old" values: they come from the original view and are null when there is no original view; the new
     * values come from the new view / the live DSL.
     */
    @Test
    void applicationCommon_oldValuesComeFromTheOriginalView_nullWithoutOne() {
        ApplicationView view = applicationView("App", "cat-view", "desc-view", "title-view", null, null);
        StepVerifier.create(withContext(publisher.publishApplicationCommonEvent(null, view, EventType.APPLICATION_CREATE))).verifyComplete();

        AbstractEvent event = singleEvent();
        assertFields(event, fields("oldApplicationName", null, "oldApplicationCategory", null, "oldApplicationDescription", null,
                "oldApplicationTitle", null, "applicationName", "App", "type", EventType.APPLICATION_CREATE));
        say("application common without original view: old values null");
    }

    static Stream<Arguments> folderRows() {
        return Stream.of(
                Arguments.of("resolved folders", FOLDER_TO, FOLDER_FROM, FOLDER_TO, "Folder To", FOLDER_FROM, "Folder From"),
                Arguments.of("null folder ids", null, null, null, null, null, null),
                Arguments.of("blank folder ids", "  ", "", null, null, null, null),
                Arguments.of("unknown folders", "f-missing", "f-missing-2", null, null, null, null));
    }

    /**
     * Catches wrong folder fields: folders are resolved through {@code FolderService} only for non-blank ids (a blank or
     * null id makes no lookup), a folder that cannot be found (the real service errors with FOLDER_NOT_FOUND) gives null id and name instead of an error, and the "from"
     * folder fills the old folder fields.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("folderRows")
    void applicationCommon_resolvesFoldersOnlyForNonBlankIds_andToleratesUnknownOnes(String label, String folderId, String folderIdFrom,
            String expectedId, String expectedName, String expectedOldId, String expectedOldName) {
        lenient().when(folderService.findById("f-missing")).thenReturn(Mono.error(new IllegalStateException("not found")));
        lenient().when(folderService.findById("f-missing-2")).thenReturn(Mono.error(new BizException(BizError.NO_RESOURCE_FOUND, "FOLDER_NOT_FOUND", "f-missing-2")));
        ApplicationView view = applicationView("App", null, null, null, folderId, folderIdFrom);

        StepVerifier.create(withContext(publisher.publishApplicationCommonEvent(null, view, EventType.APPLICATION_MOVE))).verifyComplete();

        assertFields(singleEvent(), fields("folderId", expectedId, "folderName", expectedName, "oldFolderId", expectedOldId,
                "oldFolderName", expectedOldName));
        if (folderId == null || folderId.isBlank()) {
            verify(folderService, never()).findById(any());
        }
        say("%s -> folder %s / old folder %s", label, expectedId, expectedOldId);
    }

    /**
     * Catches wrong folder fields of the bundle events (view form): folders are resolved only for non-blank ids (no lookup
     * for a null or blank id), a folder that cannot be found gives null id and name, not an error.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("folderRows")
    void bundleCommon_resolvesFoldersOnlyForNonBlankIds_andToleratesUnknownOnes(String label, String folderId, String folderIdFrom,
            String expectedId, String expectedName, String expectedOldId, String expectedOldName) {
        lenient().when(folderService.findById("f-missing")).thenReturn(Mono.error(new BizException(BizError.NO_RESOURCE_FOUND, "FOLDER_NOT_FOUND", "f-missing")));
        lenient().when(folderService.findById("f-missing-2")).thenReturn(Mono.error(new BizException(BizError.NO_RESOURCE_FOUND, "FOLDER_NOT_FOUND", "f-missing-2")));
        BundleInfoView view = BundleInfoView.builder().bundleId(BUNDLE_ID).name("Bundle").folderId(folderId).folderIdFrom(folderIdFrom).build();

        StepVerifier.create(withContext(publisher.publishBundleCommonEvent(view, EventType.BUNDLE_UPDATE))).verifyComplete();

        assertFields(singleEvent(), fields("folderId", expectedId, "folderName", expectedName, "oldFolderId", expectedOldId,
                "oldFolderName", expectedOldName));
        if (folderId == null || folderId.isBlank()) {
            verify(folderService, never()).findById(any());
        }
        say("bundle %s -> folder %s / old folder %s", label, expectedId, expectedOldId);
    }

    /** Catches a datasource permission change audited without old or new permission views: both permission lists are then null. */
    @Test
    void datasourcePermission_withoutPermissionViews_hasNullPermissions() {
        StepVerifier.create(withContext(publisher.publishDatasourcePermissionEvent(DS_ID, List.of("u1"), List.of("g1"), "admin",
                EventType.DATA_SOURCE_PERMISSION_GRANT, null, null))).verifyComplete();

        assertFields(singleEvent(), fields("oldPermissions", null, "newPermissions", null, "eventType", EventType.DATA_SOURCE_PERMISSION_GRANT));
        say("datasource permission without views -> null permissions");
    }

    // ------------------------------------------------------------------ guards and swallowed failures

    /** Catches an audit event for a change that was not made: with {@code publish == false} there is no event and no service call. */
    @ParameterizedTest
    @EnumSource(value = Method.class, names = {"GROUP_UPDATE", "GROUP_DELETE", "MEMBER_ADD", "MEMBER_ROLE", "MEMBER_LEAVE", "MEMBER_REMOVE"})
    void guardedMethods_withPublishFalse_doNothing(Method method) {
        StepVerifier.create(withContext(call(method, false))).verifyComplete();

        verifyNoInteractions(applicationEventPublisher, sessionUserService, groupService, userService);
        say("%s with publish=false -> nothing", method);
    }

    private enum Failure {
        TOKEN, ORG_MEMBER
    }

    static Stream<Arguments> failureRows() {
        List<Arguments> rows = new ArrayList<>();
        for (Method method : Method.values()) {
            for (Failure failure : Failure.values()) {
                boolean appCommonFallback = failure == Failure.ORG_MEMBER && (method == Method.APP_VIEW_FORM || method == Method.APP_ID_FORM);
                if (!appCommonFallback) {
                    rows.add(Arguments.of(method, failure));
                }
            }
        }
        return rows.stream();
    }

    /**
     * Pins today's behaviour: an audit failure never aborts the business call. When the visitor token or the organization
     * member cannot be read, every publish method completes empty (no error) and publishes no event, so that audit event
     * is lost. (The application common events with a failing org member are the next test.)
     */
    @ParameterizedTest(name = "{0}, failing {1}")
    @MethodSource("failureRows")
    void failingVisitorLookup_isSwallowed_noEventNoError(Method method, Failure failure) {
        IllegalStateException failureCause = new IllegalStateException("lookup failed");
        if (failure == Failure.TOKEN) {
            lenient().when(sessionUserService.getVisitorToken()).thenReturn(Mono.error(failureCause));
        } else {
            lenient().when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.error(failureCause));
            lenient().when(sessionUserService.getVisitorOrgMember()).thenReturn(Mono.error(failureCause));
        }

        StepVerifier.create(withContext(call(method, true))).verifyComplete();

        verifyNoInteractions(applicationEventPublisher);
        say("%s with failing %s -> completes empty, no event", method, failure);
    }

    /**
     * Pins today's behaviour: the application common events (view and id form) replace a failing organization member
     * lookup by {@code new OrgMember(null, null, null, null, 0)}, so an audit event IS published, with a null orgId and a
     * null userId (the audit entry cannot say who did it or in which organization).
     */
    @ParameterizedTest
    @EnumSource(value = Method.class, names = {"APP_VIEW_FORM", "APP_ID_FORM"})
    void applicationCommon_visitorOrgMemberLookupFails_publishesAnEventWithNullOrgAndUser(Method method) {
        lenient().when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.error(new IllegalStateException("no member")));

        run(method);

        AbstractEvent event = singleEvent();
        assertThat(event.getOrgId()).isNull();
        assertThat(event.getUserId()).isNull();
        assertThat(event.getSessionHash()).isEqualTo(sha512(TOKEN));
        say("%s with failing org member -> event with null org and user", method);
    }

    /**
     * Pins today's behaviour: the application common events are lost, with no error, when the application cannot be
     * loaded for the details. (1) id form: an unknown id gives an empty result. (2) both forms: the second lookup
     * {@code applicationService.findById(applicationInfoView.getApplicationId())} failing or empty drops the event. The
     * id form passes the raw id of the caller on to that second lookup; {@code ApplicationController.recycle} (:62) and
     * {@code restore} (:71) pass the path variable as is, and {@code findById} resolves only an object id or a GID
     * ({@code CustomApplicationRepositoryImpl.findByIdWithDsl}, :28-29), so for an application addressed by its slug
     * (which {@code findByIdWithoutDsl} and {@code GidService.convertApplicationIdToObjectId} do accept) the recycle and
     * restore audit events are lost. The delete flow (:87) passes the view built after the soft delete, whose id resolves,
     * so it is not affected. Not verified against a real database here: the second lookup is stubbed to fail.
     */
    @Test
    void applicationCommon_idForm_applicationNotFoundByTheSecondLookup_publishesNothing() {
        lenient().when(applicationService.findByIdWithoutDsl("app-slug")).thenReturn(Mono.just(app));
        lenient().when(applicationService.findById("app-slug"))
                .thenReturn(Mono.error(new BizException(BizError.NO_RESOURCE_FOUND, "CANT_FIND_APPLICATION", "app-slug")));
        lenient().when(applicationService.findByIdWithoutDsl("app-unknown")).thenReturn(Mono.empty());
        lenient().when(applicationService.findById("app-empty")).thenReturn(Mono.empty());

        StepVerifier.create(withContext(publisher.publishApplicationCommonEvent(originalView(), "app-slug", null, null, EventType.APPLICATION_RECYCLED))).verifyComplete();
        StepVerifier.create(withContext(publisher.publishApplicationCommonEvent(originalView(), "app-unknown", null, null, EventType.APPLICATION_RECYCLED))).verifyComplete();
        StepVerifier.create(withContext(publisher.publishApplicationCommonEvent(originalView(),
                ApplicationView.builder().applicationInfoView(ApplicationInfoView.builder().applicationId("app-empty").build()).build(),
                EventType.APPLICATION_DELETE))).verifyComplete();

        verifyNoInteractions(applicationEventPublisher);
        say("application common: unresolvable application -> no event, no error");
    }

    /**
     * Pins today's behaviour (explains why every test here writes the headers into the context): without
     * {@code GlobalContext.HEADERS} in the Reactor context {@code populateDetails} throws, the failure is swallowed and no
     * event is published. In production the web filter always puts the headers (L4-7 evidence in plan section 9), so this
     * is only reachable here.
     */
    @Test
    void contextWithoutHeaders_populateDetailsFails_eventSwallowed() {
        StepVerifier.create(publisher.publishUserLogoutEvent()).verifyComplete();

        verifyNoInteractions(applicationEventPublisher);
        say("no headers in the context -> no event");
    }

    /** Catches a failing datasource lookup by id breaking the caller: an unknown datasource gives an empty result and no event. */
    @Test
    void datasourceEvent_idForm_unknownDatasource_publishesNothing() {
        lenient().when(datasourceService.getById("ds-missing")).thenReturn(Mono.error(new IllegalStateException("not found")));

        StepVerifier.create(withContext(publisher.publishDatasourceEvent("ds-missing", EventType.DATA_SOURCE_DELETE, "Old"))).verifyComplete();

        verifyNoInteractions(applicationEventPublisher);
        say("datasource event for an unknown datasource -> no event, no error");
    }

    // ------------------------------------------------------------------ the synchronous query execution event

    /** Catches a modified or dropped query execution event: it is handed to the publisher unchanged. */
    @Test
    void publishQueryExecutionEvent_handsTheEventOverUnchanged() {
        QueryExecutionEvent event = QueryExecutionEvent.builder().build();

        publisher.publishQueryExecutionEvent(event);

        assertThat(publishedEvents(1).get(0)).isSameAs(event);
        say("query execution event handed over");
    }

    // ------------------------------------------------------------------ AbstractEvent (lowcoder-infra), covered through the builders

    /**
     * Covers {@code AbstractEvent}: the builder's {@code detail(name, value)} stores the value and the environment id;
     * {@code populateDetails} adds {@code environmentId} and the headers and copies the declared fields of the concrete event
     * into {@code details}, skipping a null field annotated {@code @JsonInclude(NON_NULL)} and keeping a null field without
     * it, and takes the event headers from the context. ({@code details()} is only called after {@code detail(...)} or
     * {@code populateDetails}: it fails on an event without details, which no production path reaches, plan section 9.)
     */
    @Test
    void abstractEvent_detailsAndPopulateDetails() {
        FolderCommonEvent withDetail = FolderCommonEvent.builder().detail("custom", "value").build();
        assertThat(withDetail.getDetails()).containsEntry("custom", "value").containsEntry("environmentId", ENVIRONMENT_ID);
        assertThat(withDetail.details()).containsEntry("custom", "value").containsEntry("environmentId", ENVIRONMENT_ID);

        run(Method.APP_PUBLISH);
        AbstractEvent populated = singleEvent();
        assertThat(populated.getDetails()).containsEntry("tag", "v2").containsEntry("commitMessage", "release notes")
                .containsEntry("applicationName", "App");
        assertThat(populated.getDetails()).doesNotContainKeys("permissionId", "role", "userIds", "groupIds", "shareType", "sharingDetails", "folderId");
        assertThat(populated.getDetails()).containsKey("oldApplicationName");
        assertThat(populated.getDetails().get("oldApplicationName")).isNull();
        assertThat(populated.getDetails()).containsEntry("environmentId", ENVIRONMENT_ID).containsEntry("headers", HEADERS);
        assertThat(populated.details()).containsEntry("environmentId", ENVIRONMENT_ID);
        assertThat(populated.getEventHeaders()).isEqualTo(HEADERS);
        say("AbstractEvent details: %s", populated.getDetails().keySet());
    }
}
