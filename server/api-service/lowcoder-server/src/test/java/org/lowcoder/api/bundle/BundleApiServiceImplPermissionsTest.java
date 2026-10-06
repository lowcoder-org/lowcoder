package org.lowcoder.api.bundle;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.bundle.BundleEndpoints.BundlePublicToMarketplaceRequest;
import org.lowcoder.api.bundle.BundleEndpoints.CreateBundleRequest;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.bundle.view.BundlePermissionView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.home.FolderApiService;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.permission.PermissionHelper;
import org.lowcoder.api.permission.view.PermissionItemView;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.repository.ApplicationRepository;
import org.lowcoder.domain.application.service.ApplicationServiceImpl;
import org.lowcoder.domain.asset.service.AssetService;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.model.BundleApplication;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.bundle.model.BundleStatus;
import org.lowcoder.domain.bundle.repository.BundleRepository;
import org.lowcoder.domain.bundle.service.BundleElementRelationService;
import org.lowcoder.domain.bundle.service.BundleService;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.repository.OrganizationRepository;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.organization.service.OrganizationServiceImpl;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourceHolder;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.domain.permission.model.UserPermissionOnResourceStatus;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.infra.birelation.BiRelation;
import org.lowcoder.infra.birelation.BiRelationBizType;
import org.lowcoder.infra.birelation.BiRelationServiceImpl;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@link BundleApiServiceImpl} with every collaborator mocked: the permission and status checks before each mutation, the
 * view-request matrix, the readable permission errors, the permission and element operations, creation and update.
 *
 * <p>Pinned production defects (owner decision D-6: fixes are deferred, a fix changes these tests on purpose), each in a
 * test named {@code ..._pinsTheSection9Row}:
 * <ul>
 * <li>"getPermissions looks up the org by the creator's user id; no permission check":
 * {@link #getPermissions_looksUpTheOrganizationByTheCreatorsUserId_andChecksNoPermission_pinsTheSection9Row}</li>
 * </ul>
 * Fixed since: "moveApp/addApp check only MANAGE_APPLICATIONS on the app, never the bundle" (BF-011), now asserted by
 * {@link #moveAndAddApp_withoutTheBundlePermission_areRefused_andChangeNothing} and
 * {@link #moveAndAddApp_withABundleOfAnotherOrganization_areRefused_andChangeNothing}; "getElements has no
 * permission/status/org check" (BF-020), now asserted by {@link #getElements_withoutReadPermission_isRefused_andReadsNoElements}
 * and {@link #getElements_ofABundleThatIsNotNormal_isBadRequest_andReadsNoElements}; "the bundle flag setters ask
 * application actions" (BF-035), now the PUBLIC_TO_ALL, PUBLIC_TO_MARKETPLACE and AGENCY_PROFILE rows of
 * {@link #mutatingOperation_checksPermissionAndStatus_beforeAnyChange}, which expect SET_BUNDLES_*.
 * Pinned as behaviour (no row): the null-flag NullPointerException of the view request (reachable only with documents
 * lacking the flag fields) and the application-copied EDIT action comparison of the readable error message.
 */
@ExtendWith(MockitoExtension.class)
class BundleApiServiceImplPermissionsTest {

    private static final String LOG_PREFIX = "[BundleApiServiceImplPermissionsTest] ";

    private static final String ORG = "org-1";
    private static final String VISITOR = "visitor-1";
    private static final String BUNDLE_ID = "bundle-1";
    private static final String OTHER_BUNDLE_ID = "bundle-2";
    private static final String APP_ID = "app-1";
    private static final String PERMISSION_ID = "permission-1";
    private static final String CREATOR_NAME = "Visitor Name";
    private static final Instant CREATED_AT = Instant.ofEpochMilli(1_700_000_000_000L);

    @Mock
    private BiRelationServiceImpl biRelationService;
    @Mock
    private BundleService bundleService;
    @Mock
    private SessionUserService sessionUserService;
    @Mock
    private OrgMemberService orgMemberService;
    @Mock
    private OrgDevChecker orgDevChecker;
    @Mock
    private UserHomeApiService userHomeApiService;
    @Mock
    private BundleElementRelationService bundleElementRelationService;
    @Mock
    private ResourcePermissionService resourcePermissionService;
    @Mock
    private PermissionHelper permissionHelper;
    @Mock
    private GroupService groupService;
    @Mock
    private UserService userService;
    @Mock
    private OrganizationService organizationService;
    @Mock
    private FolderApiService folderApiService;
    @Mock
    private ApplicationServiceImpl applicationServiceImpl;
    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private BundleRepository bundleRepository;

    private BundleApiServiceImpl service;

    private final List<String> events = new ArrayList<>();
    private final User creator = new User();
    private Bundle bundle;

    @BeforeEach
    void setUp() {
        service = newService(organizationService);

        creator.setId(VISITOR);
        creator.setName(CREATOR_NAME);
        bundle = bundle(BUNDLE_ID, BundleStatus.NORMAL);

        lenient().when(sessionUserService.getVisitorId()).thenReturn(Mono.just(VISITOR));
        lenient().when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(member()));
        lenient().when(userService.findById(VISITOR)).thenReturn(Mono.just(creator));
        lenient().when(bundleService.findById(BUNDLE_ID)).thenAnswer(invocation -> Mono.just(bundle));
        lenient().when(bundleService.findByIdWithoutDsl(BUNDLE_ID)).thenAnswer(invocation -> Mono.just(bundle));
        lenient().when(resourcePermissionService.checkResourcePermissionWithError(anyString(), anyString(), any(ResourceAction.class)))
                .thenAnswer(invocation -> loggedVoid(permEvent(invocation.getArgument(0), invocation.getArgument(1), invocation.getArgument(2))));
        lenient().when(resourcePermissionService.checkAndReturnMaxPermission(anyString(), anyString(), any(ResourceAction.class)))
                .thenAnswer(invocation -> logged(permEvent(invocation.getArgument(0), invocation.getArgument(1), invocation.getArgument(2)),
                        permission(BUNDLE_ID)));
    }

    private BundleApiServiceImpl newService(OrganizationService organizations) {
        return new BundleApiServiceImpl(biRelationService, bundleService, sessionUserService, orgMemberService, orgDevChecker,
                userHomeApiService, bundleElementRelationService, resourcePermissionService, permissionHelper, groupService,
                userService, organizations, folderApiService, applicationServiceImpl, applicationRepository, bundleRepository);
    }

    // ------------------------------------------------------------------ fixtures

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }

    private static OrgMember member() {
        return new OrgMember(ORG, VISITOR, MemberRole.MEMBER, "normal", 0L);
    }

    private static Bundle bundle(String id, BundleStatus status) {
        Bundle bundle = Bundle.builder().gid("gid-" + id).organizationId(ORG).name("Bundle " + id).title("Title").description("Desc")
                .category("Cat").image("img").bundleStatus(status).publicToAll(false).publicToMarketplace(false).agencyProfile(false)
                .editingBundleDSL(Map.of("editing", true)).publishedBundleDSL(Map.of("published", true)).build();
        bundle.setId(id);
        bundle.setCreatedBy(VISITOR);
        bundle.setCreatedAt(CREATED_AT);
        return bundle;
    }

    private static ResourcePermission permission(String resourceId) {
        return ResourcePermission.builder().resourceId(resourceId).build();
    }

    private Mono<Void> loggedVoid(String event) {
        return Mono.defer(() -> {
            events.add(event);
            return Mono.empty();
        });
    }

    private <T> Mono<T> logged(String event, T value) {
        return Mono.defer(() -> {
            events.add(event);
            return Mono.justOrEmpty(value);
        });
    }

    private static void assertBizError(Throwable error, BizError expected, String messageKey) {
        assertThat(error).isInstanceOf(BizException.class);
        assertThat(((BizException) error).getError()).isEqualTo(expected);
        assertThat(((BizException) error).getMessageKey()).isEqualTo(messageKey);
    }

    /** The event logged for a permission check: the action, flagged when asked for another user or another resource than expected. */
    private static String permEvent(String userId, String resourceId, ResourceAction action) {
        return "perm:" + action + (VISITOR.equals(userId) ? "" : "!user:" + userId)
                + (BUNDLE_ID.equals(resourceId) || APP_ID.equals(resourceId) ? "" : "@" + resourceId);
    }

    private void denyPermission(BizException denial) {
        lenient().when(resourcePermissionService.checkResourcePermissionWithError(anyString(), anyString(), any(ResourceAction.class)))
                .thenAnswer(invocation -> Mono.defer(() -> {
                    events.add(permEvent(invocation.getArgument(0), invocation.getArgument(1), invocation.getArgument(2)));
                    return Mono.error(denial);
                }));
        lenient().when(resourcePermissionService.checkAndReturnMaxPermission(anyString(), anyString(), any(ResourceAction.class)))
                .thenAnswer(invocation -> Mono.defer(() -> {
                    events.add(permEvent(invocation.getArgument(0), invocation.getArgument(1), invocation.getArgument(2)));
                    return Mono.error(denial);
                }));
    }

    // ------------------------------------------------------------------ matrix of the mutating operations

    private enum Op {
        RECYCLE(ResourceAction.MANAGE_BUNDLES, BundleStatus.NORMAL, true),
        RESTORE(ResourceAction.MANAGE_BUNDLES, BundleStatus.RECYCLED, true),
        DELETE(ResourceAction.MANAGE_BUNDLES, BundleStatus.RECYCLED, true),
        PUBLISH(ResourceAction.PUBLISH_BUNDLES, BundleStatus.NORMAL, true),
        GRANT(ResourceAction.MANAGE_BUNDLES, BundleStatus.NORMAL, false),
        UPDATE_PERMISSION(ResourceAction.MANAGE_BUNDLES, BundleStatus.NORMAL, false),
        REMOVE_PERMISSION(ResourceAction.MANAGE_BUNDLES, BundleStatus.NORMAL, false),
        PUBLIC_TO_ALL(ResourceAction.SET_BUNDLES_PUBLIC, BundleStatus.NORMAL, false),
        PUBLIC_TO_MARKETPLACE(ResourceAction.SET_BUNDLES_PUBLIC_TO_MARKETPLACE, BundleStatus.NORMAL, false),
        AGENCY_PROFILE(ResourceAction.SET_BUNDLES_AS_AGENCY_PROFILE, BundleStatus.NORMAL, false),
        REORDER(ResourceAction.MANAGE_BUNDLES, null, false);

        final ResourceAction action;
        final BundleStatus requiredStatus;
        /** the status is checked before the permission */
        final boolean statusFirst;

        Op(ResourceAction action, BundleStatus requiredStatus, boolean statusFirst) {
            this.action = action;
            this.requiredStatus = requiredStatus;
            this.statusFirst = statusFirst;
        }
    }

    private enum Gate {
        DENIED, WRONG_STATUS, ALLOWED
    }

    static Stream<Arguments> matrixRows() {
        List<Arguments> rows = new ArrayList<>();
        for (Op op : Op.values()) {
            for (Gate gate : Gate.values()) {
                if (op == Op.REORDER && gate == Gate.WRONG_STATUS) {
                    continue;
                }
                rows.add(Arguments.of(op, gate));
            }
        }
        return rows.stream();
    }

    private void stubMutations() {
        lenient().when(bundleService.updateById(eq(BUNDLE_ID), any(Bundle.class))).thenAnswer(invocation -> logged("mutate", true));
        lenient().when(bundleService.publish(BUNDLE_ID)).thenAnswer(invocation -> logged("mutate", bundle));
        lenient().when(resourcePermissionService.insertBatchPermission(any(), eq(BUNDLE_ID), any(), any(), any()))
                .thenAnswer(invocation -> loggedVoid("mutate"));
        lenient().when(resourcePermissionService.getById(PERMISSION_ID)).thenAnswer(invocation -> Mono.just(permission(BUNDLE_ID)));
        lenient().when(resourcePermissionService.updateRoleById(anyString(), any())).thenAnswer(invocation -> logged("mutate", true));
        lenient().when(resourcePermissionService.removeById(anyString())).thenAnswer(invocation -> logged("mutate", true));
        lenient().when(bundleService.setBundlePublicToAll(eq(BUNDLE_ID), anyBoolean())).thenAnswer(invocation -> logged("mutate", true));
        lenient().when(bundleService.setBundlePublicToMarketplace(eq(BUNDLE_ID), any())).thenAnswer(invocation -> logged("mutate", true));
        lenient().when(bundleService.setBundleAsAgencyProfile(eq(BUNDLE_ID), anyBoolean())).thenAnswer(invocation -> logged("mutate", true));
        lenient().when(bundleElementRelationService.updateElementPos(eq(BUNDLE_ID), anyString(), anyLong()))
                .thenAnswer(invocation -> loggedVoid("pos:" + invocation.getArgument(1) + ":" + invocation.getArgument(2)));
    }

    private static boolean anyBoolean() {
        return org.mockito.ArgumentMatchers.anyBoolean();
    }

    private Mono<?> invoke(Op op) {
        return switch (op) {
            case RECYCLE -> service.recycle(BUNDLE_ID);
            case RESTORE -> service.restore(BUNDLE_ID);
            case DELETE -> service.delete(BUNDLE_ID);
            case PUBLISH -> service.publish(BUNDLE_ID);
            case GRANT -> service.grantPermission(BUNDLE_ID, Set.of("u1"), Set.of("g1"), ResourceRole.EDITOR);
            case UPDATE_PERMISSION -> service.updatePermission(BUNDLE_ID, PERMISSION_ID, ResourceRole.VIEWER);
            case REMOVE_PERMISSION -> service.removePermission(BUNDLE_ID, PERMISSION_ID);
            case PUBLIC_TO_ALL -> service.setBundlePublicToAll(BUNDLE_ID, true);
            case PUBLIC_TO_MARKETPLACE -> service.setBundlePublicToMarketplace(BUNDLE_ID, new BundlePublicToMarketplaceRequest(true));
            case AGENCY_PROFILE -> service.setBundleAsAgencyProfile(BUNDLE_ID, true);
            case REORDER -> service.reorder(BUNDLE_ID, List.of("e0", "e1"));
        };
    }

    /**
     * Catches a viewer toggling the public/marketplace/agency flags, editing permissions or changing the state of a bundle:
     * every mutating operation asks the permission its action requires (MANAGE_BUNDLES; PUBLISH_BUNDLES through
     * {@code checkAndReturnMaxPermission}; the bundle actions SET_BUNDLES_* for the three flags, BF-035: they asked the
     * application actions SET_APPLICATIONS_*, which no user could pass on a bundle id), requires the bundle status it needs (NORMAL, RECYCLED for restore
     * and delete) with BAD_REQUEST otherwise, in the order the code has (recycle, restore, delete, publish check the status
     * first; the others the permission first), and mutates nothing when either check fails (counted subscriptions).
     */
    @ParameterizedTest(name = "{0}, {1}")
    @MethodSource("matrixRows")
    void mutatingOperation_checksPermissionAndStatus_beforeAnyChange(Op op, Gate gate) {
        stubMutations();
        BizException denial = new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED");
        if (gate == Gate.DENIED) {
            denyPermission(denial);
        }
        if (op.requiredStatus != null) {
            bundle.setBundleStatus(gate == Gate.WRONG_STATUS ? (op.requiredStatus == BundleStatus.NORMAL ? BundleStatus.RECYCLED : BundleStatus.NORMAL)
                    : op.requiredStatus);
        }
        String permEvent = "perm:" + op.action;

        Mono<?> result = invoke(op);

        switch (gate) {
            case DENIED -> {
                StepVerifier.create(result).expectErrorSatisfies(error -> assertThat(error).isSameAs(denial)).verify();
                assertThat(events).containsExactly(permEvent);
            }
            case WRONG_STATUS -> {
                StepVerifier.create(result).expectErrorSatisfies(error -> assertBizError(error, BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST")).verify();
                assertThat(events).isEqualTo(op.statusFirst ? List.of() : List.of(permEvent));
            }
            default -> {
                StepVerifier.create(result).thenConsumeWhile(value -> true).verifyComplete();
                if (op == Op.REORDER) {
                    assertThat(events).containsExactly(permEvent, "pos:e0:0", "pos:e1:1");
                } else {
                    assertThat(events).containsExactly(permEvent, "mutate");
                }
            }
        }
        say("%s, %s -> events %s", op, gate, events);
    }

    /**
     * Catches wrong arguments reaching the services: the batch insert gets the BUNDLE type, the id, the user and group sets
     * and the role; update and remove permission hand the permission id (and role); the flag setters hand the bundle id
     * and the requested value; delete and recycle write the new status only.
     */
    @Test
    void mutations_handTheRightArguments() {
        stubMutations();
        ArgumentCaptor<Bundle> written = ArgumentCaptor.forClass(Bundle.class);

        StepVerifier.create(service.grantPermission(BUNDLE_ID, Set.of("u1"), Set.of("g1"), ResourceRole.EDITOR)).expectNext(true).verifyComplete();
        verify(resourcePermissionService).insertBatchPermission(ResourceType.BUNDLE, BUNDLE_ID, Set.of("u1"), Set.of("g1"), ResourceRole.EDITOR);

        StepVerifier.create(service.updatePermission(BUNDLE_ID, PERMISSION_ID, ResourceRole.VIEWER)).expectNext(true).verifyComplete();
        verify(resourcePermissionService).updateRoleById(PERMISSION_ID, ResourceRole.VIEWER);

        StepVerifier.create(service.removePermission(BUNDLE_ID, PERMISSION_ID)).expectNext(true).verifyComplete();
        verify(resourcePermissionService).removeById(PERMISSION_ID);

        StepVerifier.create(service.setBundlePublicToAll(BUNDLE_ID, true)).expectNext(true).verifyComplete();
        verify(bundleService).setBundlePublicToAll(BUNDLE_ID, true);
        StepVerifier.create(service.setBundlePublicToMarketplace(BUNDLE_ID, new BundlePublicToMarketplaceRequest(true))).expectNext(true).verifyComplete();
        verify(bundleService).setBundlePublicToMarketplace(BUNDLE_ID, true);
        StepVerifier.create(service.setBundleAsAgencyProfile(BUNDLE_ID, false)).expectNext(true).verifyComplete();
        verify(bundleService).setBundleAsAgencyProfile(BUNDLE_ID, false);

        StepVerifier.create(service.recycle(BUNDLE_ID)).expectNext(true).verifyComplete();
        bundle.setBundleStatus(BundleStatus.RECYCLED);
        StepVerifier.create(service.restore(BUNDLE_ID)).expectNext(true).verifyComplete();
        StepVerifier.create(service.delete(BUNDLE_ID)).expectNext(bundle).verifyComplete();
        verify(bundleService, org.mockito.Mockito.times(3)).updateById(eq(BUNDLE_ID), written.capture());
        assertThat(written.getAllValues()).extracting(Bundle::getBundleStatus)
                .containsExactly(BundleStatus.RECYCLED, BundleStatus.NORMAL, BundleStatus.DELETED);
        assertThat(written.getAllValues()).allSatisfy(value -> assertThat(value.getName()).isNull());
        say("mutation arguments verified");
    }

    /** Catches a no-op grant doing work: empty user and group sets give true without any interaction. */
    @Test
    void grantPermission_emptySets_isANoOp() {
        StepVerifier.create(service.grantPermission(BUNDLE_ID, Set.of(), Set.of(), ResourceRole.EDITOR)).expectNext(true).verifyComplete();

        verifyNoInteractions(resourcePermissionService, bundleService, sessionUserService);
        say("grant with empty sets -> true, nothing touched");
    }

    /** Catches a grant ignored when only one of the two sets is empty: users only, or groups only, still reach the batch insert. */
    @ParameterizedTest
    @org.junit.jupiter.params.provider.ValueSource(booleans = {true, false})
    void grantPermission_oneEmptySet_stillGrants(boolean usersOnly) {
        stubMutations();
        Set<String> users = usersOnly ? Set.of("u1") : Set.of();
        Set<String> groups = usersOnly ? Set.of() : Set.of("g1");

        StepVerifier.create(service.grantPermission(BUNDLE_ID, users, groups, ResourceRole.VIEWER)).expectNext(true).verifyComplete();

        verify(resourcePermissionService).insertBatchPermission(ResourceType.BUNDLE, BUNDLE_ID, users, groups, ResourceRole.VIEWER);
        say("grant with users=%s groups=%s reached the batch insert", users, groups);
    }

    /** Catches a grant on a missing bundle succeeding: BUNDLE_NOT_EXIST with key BUNDLE_NOT_FOUND and the id; nothing inserted. */
    @Test
    void grantPermission_missingBundle_isBundleNotExist() {
        stubMutations();
        when(bundleService.findByIdWithoutDsl(BUNDLE_ID)).thenReturn(Mono.empty());

        StepVerifier.create(service.grantPermission(BUNDLE_ID, Set.of("u1"), Set.of(), ResourceRole.VIEWER))
                .expectErrorSatisfies(error -> {
                    assertBizError(error, BizError.BUNDLE_NOT_EXIST, "BUNDLE_NOT_FOUND");
                    assertThat(((BizException) error).getArgs()).containsExactly(BUNDLE_ID);
                })
                .verify();
        assertThat(events).doesNotContain("mutate");
        say("grant on a missing bundle -> BUNDLE_NOT_EXIST");
    }

    /**
     * Catches editing another bundle's permission through this bundle's endpoint: a permission id that belongs to another
     * bundle, or that does not exist, gives ILLEGAL_BUNDLE_PERMISSION_ID and nothing is updated or removed.
     */
    @ParameterizedTest
    @EnumSource(value = Op.class, names = {"UPDATE_PERMISSION", "REMOVE_PERMISSION"})
    void permissionOperations_refusePermissionsOfAnotherBundle_orUnknownOnes(Op op) {
        stubMutations();
        when(resourcePermissionService.getById("foreign")).thenReturn(Mono.just(permission(OTHER_BUNDLE_ID)));
        when(resourcePermissionService.getById("unknown")).thenReturn(Mono.empty());

        for (String permissionId : List.of("foreign", "unknown")) {
            Mono<Boolean> call = op == Op.UPDATE_PERMISSION ? service.updatePermission(BUNDLE_ID, permissionId, ResourceRole.OWNER)
                    : service.removePermission(BUNDLE_ID, permissionId);
            StepVerifier.create(call)
                    .expectErrorSatisfies(error -> assertBizError(error, BizError.ILLEGAL_BUNDLE_PERMISSION_ID, "ILLEGAL_BUNDLE_PERMISSION_ID"))
                    .verify();
        }
        assertThat(events).doesNotContain("mutate");
        say("%s with a foreign or unknown permission id -> ILLEGAL_BUNDLE_PERMISSION_ID", op);
    }

    // ------------------------------------------------------------------ update

    /**
     * Catches a non-creator updating a bundle or a wrong write: only the bundle's creator may update
     * (BUNDLE_OPERATE_NO_PERMISSION otherwise, nothing written); only name, title, category, description and image are
     * written (no id, organization, flags, status or DSL); the returned view is the stored bundle's.
     */
    @Test
    void update_onlyTheCreator_writesOnlyTheDescriptiveFields() {
        Bundle changes = new Bundle();
        changes.setId(BUNDLE_ID);
        changes.setName("New name");
        changes.setTitle("New title");
        changes.setCategory("New cat");
        changes.setDescription("New desc");
        changes.setImage("new-img");
        changes.setOrganizationId("other-org");
        changes.setPublicToAll(true);
        when(bundleService.updateById(eq(BUNDLE_ID), any(Bundle.class))).thenReturn(Mono.just(true));

        StepVerifier.create(service.update(changes)).assertNext(view -> {
            assertThat(view.getBundleId()).isEqualTo(BUNDLE_ID);
            assertThat(view.getCreateBy()).isEqualTo(CREATOR_NAME);
            assertThat(view.isVisible()).isTrue();
            assertThat(view.isManageable()).isTrue();
        }).verifyComplete();

        ArgumentCaptor<Bundle> written = ArgumentCaptor.forClass(Bundle.class);
        verify(bundleService).updateById(eq(BUNDLE_ID), written.capture());
        Bundle value = written.getValue();
        assertThat(value.getName()).isEqualTo("New name");
        assertThat(value.getTitle()).isEqualTo("New title");
        assertThat(value.getCategory()).isEqualTo("New cat");
        assertThat(value.getDescription()).isEqualTo("New desc");
        assertThat(value.getImage()).isEqualTo("new-img");
        assertThat(value.getId()).isNull();
        assertThat(value.getOrganizationId()).isNull();
        assertThat(value.getPublicToAll()).isNull();
        assertThat(value.getBundleStatus()).isNull();
        say("update by the creator wrote only the descriptive fields");
    }

    /** Catches a non-creator update: BUNDLE_OPERATE_NO_PERMISSION and no write. */
    @Test
    void update_nonCreator_isRefused() {
        when(sessionUserService.getVisitorId()).thenReturn(Mono.just("someone-else"));
        lenient().when(bundleService.updateById(anyString(), any(Bundle.class))).thenAnswer(invocation -> logged("mutate", true));
        Bundle changes = new Bundle();
        changes.setId(BUNDLE_ID);

        StepVerifier.create(service.update(changes))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.BUNDLE_OPERATE_NO_PERMISSION, "BUNDLE_OPERATE_NO_PERMISSION"))
                .verify();

        assertThat(events).doesNotContain("mutate");
        say("update by a non-creator -> BUNDLE_OPERATE_NO_PERMISSION");
    }

    // ------------------------------------------------------------------ create

    private CreateBundleRequest createRequest(String name, String gid, String folderId) {
        return new CreateBundleRequest(ORG, gid, name, "Title", "Desc", "Cat", "img", folderId);
    }

    private void stubCreateFlow(Bundle created) {
        lenient().when(orgMemberService.getOrgMember(ORG, VISITOR)).thenReturn(Mono.just(member()));
        lenient().when(orgDevChecker.checkCurrentOrgDev()).thenAnswer(invocation -> loggedVoid("dev"));
        lenient().when(bundleService.findByUserId(VISITOR)).thenReturn(Flux.just(bundle));
        lenient().when(bundleService.create(any(Bundle.class), eq(VISITOR))).thenAnswer(invocation -> logged("create", created));
        lenient().when(folderApiService.checkFolderExist("folder-1")).thenAnswer(invocation -> logged("folderExist", new Folder()));
        lenient().when(folderApiService.checkFolderCurrentOrg(any(Folder.class), eq(ORG))).thenAnswer(invocation -> loggedVoid("folderOrg"));
        lenient().when(folderApiService.moveBundle(anyString(), any())).thenAnswer(invocation -> loggedVoid("move"));
        lenient().when(folderApiService.getPermissions("folder-1")).thenReturn(Mono.just(ApplicationPermissionView.builder()
                .userPermissions(List.of(PermissionItemView.builder().type(ResourceHolder.USER).id("u1").role("editor").build(),
                        PermissionItemView.builder().type(ResourceHolder.USER).id("u2").role("viewer").build()))
                .groupPermissions(List.of(PermissionItemView.builder().type(ResourceHolder.GROUP).id("g1").role("editor").build()))
                .build()));
        lenient().when(resourcePermissionService.insertBatchPermission(eq(ResourceType.BUNDLE), eq("created-1"), any(), any(), any()))
                .thenAnswer(invocation -> loggedVoid("batch:" + invocation.getArgument(4) + ":" + sorted(invocation.getArgument(2))
                        + ":" + sorted(invocation.getArgument(3))));
    }

    @SuppressWarnings("unchecked")
    private static java.util.TreeSet<String> sorted(Object ids) {
        return new java.util.TreeSet<String>((java.util.Collection<String>) ids);
    }

    private Bundle createdBundle() {
        Bundle created = bundle("created-1", BundleStatus.NORMAL);
        created.setCreatedBy(VISITOR);
        return created;
    }

    /**
     * Catches a creation without its checks: a blank name gives INVALID_PARAMETER BUNDLE_NAME_EMPTY before any lookup; a
     * visitor who is not a member of the organization gets NOT_AUTHORIZED; a name the user already uses gives
     * BUNDLE_NAME_CONFLICT; a failing developer check stops everything; nothing is created after a failed check.
     */
    @Test
    void create_refusals_createNothing() {
        Bundle created = createdBundle();
        stubCreateFlow(created);

        StepVerifier.create(service.create(createRequest("  ", null, null)))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_PARAMETER, "BUNDLE_NAME_EMPTY")).verify();
        verifyNoInteractions(sessionUserService, orgMemberService, bundleService);

        when(orgMemberService.getOrgMember(ORG, VISITOR)).thenReturn(Mono.empty());
        StepVerifier.create(service.create(createRequest("Fresh", null, null)))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED")).verify();

        when(orgMemberService.getOrgMember(ORG, VISITOR)).thenReturn(Mono.just(member()));
        StepVerifier.create(service.create(createRequest(bundle.getName(), null, null)))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.BUNDLE_NAME_CONFLICT, "BUNDLE_NAME_CONFLICT")).verify();

        BizException devDenied = new BizException(BizError.NEED_DEV_TO_CREATE_RESOURCE, "NEED_DEV_TO_CREATE_RESOURCE");
        when(orgDevChecker.checkCurrentOrgDev()).thenReturn(Mono.error(devDenied));
        StepVerifier.create(service.create(createRequest("Fresh", null, "folder-1")))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(devDenied)).verify();

        assertThat(events).doesNotContain("create", "folderExist");
        say("create refusals -> nothing created");
    }

    /**
     * Catches a wrong creation: the gid is generated when empty and kept when given; the bundle is created NORMAL with all
     * flags false for the organization of the request, created by the member; without a folder no folder check, no default
     * permission and the move gets a null folder; with a folder the order is developer check, folder exists, folder belongs
     * to the organization, creation, one batch of default permissions per role (users and groups of that role from the
     * folder), then the move into the folder; the view carries the folder id and the creator's name.
     */
    @Test
    void create_buildsTheBundle_andAppliesTheFolderDefaults() {
        Bundle created = createdBundle();
        stubCreateFlow(created);
        ArgumentCaptor<Bundle> persisted = ArgumentCaptor.forClass(Bundle.class);

        StepVerifier.create(service.create(createRequest("Fresh", null, null))).assertNext(view -> {
            assertThat(view.getBundleId()).isEqualTo("created-1");
            assertThat(view.getFolderId()).isNull();
        }).verifyComplete();
        verify(bundleService).create(persisted.capture(), eq(VISITOR));
        Bundle first = persisted.getValue();
        assertThat(first.getGid()).isNotBlank().isNotEqualTo("given-gid");
        assertThat(first.getOrganizationId()).isEqualTo(ORG);
        assertThat(first.getBundleStatus()).isEqualTo(BundleStatus.NORMAL);
        assertThat(first.getPublicToAll()).isFalse();
        assertThat(first.getPublicToMarketplace()).isFalse();
        assertThat(first.getAgencyProfile()).isFalse();
        assertThat(first.getCreatedBy()).isEqualTo(VISITOR);
        assertThat(events).containsExactly("dev", "create", "move");
        verify(folderApiService, never()).checkFolderExist(any());
        verify(folderApiService, never()).getPermissions(any());

        events.clear();
        org.mockito.Mockito.clearInvocations(bundleService);
        StepVerifier.create(service.create(createRequest("Fresh", "given-gid", "folder-1")))
                .assertNext(view -> {
                    assertThat(view.getFolderId()).isEqualTo("folder-1");
                    assertThat(view.getCreateBy()).isEqualTo(CREATOR_NAME);
                }).verifyComplete();
        verify(bundleService).create(persisted.capture(), eq(VISITOR));
        assertThat(persisted.getValue().getGid()).isEqualTo("given-gid");
        assertThat(events).containsExactlyInAnyOrder("dev", "folderExist", "folderOrg", "create", "batch:EDITOR:[u1]:[g1]", "batch:VIEWER:[u2]:[]", "move");
        assertThat(events.indexOf("dev")).isLessThan(events.indexOf("folderExist"));
        assertThat(events.indexOf("folderExist")).isLessThan(events.indexOf("folderOrg"));
        assertThat(events.indexOf("folderOrg")).isLessThan(events.indexOf("create"));
        assertThat(events.indexOf("create")).isLessThan(events.indexOf("move"));
        say("create: %s", events);
    }

    // ------------------------------------------------------------------ view requests

    static Stream<Arguments> viewRequestRows() {
        List<Arguments> rows = new ArrayList<>();
        for (BundleRequestType type : BundleRequestType.values()) {
            for (boolean all : new boolean[] {false, true}) {
                for (boolean market : new boolean[] {false, true}) {
                    for (boolean agency : new boolean[] {false, true}) {
                        boolean allowed = switch (type) {
                            case PUBLIC_TO_ALL -> true;
                            case PUBLIC_TO_MARKETPLACE -> market && all;
                            case AGENCY_PROFILE -> agency && all;
                        };
                        rows.add(Arguments.of(type, all, market, agency, allowed));
                    }
                }
            }
        }
        return rows.stream();
    }

    private void stubPublishedView(BundleRequestType type) {
        lenient().when(resourcePermissionService.checkUserPermissionStatusOnBundle(VISITOR, BUNDLE_ID, ResourceAction.READ_BUNDLES, type))
                .thenReturn(Mono.just(UserPermissionOnResourceStatus.success(permission(BUNDLE_ID))));
    }

    /**
     * Catches a bundle being served to the wrong audience: PUBLIC_TO_ALL passes; PUBLIC_TO_MARKETPLACE needs
     * publicToMarketplace and publicToAll; AGENCY_PROFILE needs agencyProfile and publicToAll; everything else is BAD_REQUEST.
     * The read permission is asked with the request type and the view carries the published fields.
     */
    @ParameterizedTest(name = "{0}: all={1} marketplace={2} agency={3} -> allowed {4}")
    @MethodSource("viewRequestRows")
    void getPublishedBundle_viewRequestMatrix(BundleRequestType type, boolean all, boolean market, boolean agency, boolean allowed) {
        stubPublishedView(type);
        bundle.setPublicToAll(all);
        bundle.setPublicToMarketplace(market);
        bundle.setAgencyProfile(agency);

        Mono<BundleInfoView> result = service.getPublishedBundle(BUNDLE_ID, type);

        if (allowed) {
            StepVerifier.create(result).assertNext(view -> {
                assertThat(view.getBundleId()).isEqualTo(BUNDLE_ID);
                assertThat(view.getBundleGid()).isEqualTo("gid-" + BUNDLE_ID);
                assertThat(view.getName()).isEqualTo(bundle.getName());
                assertThat(view.getPublishedBundleDSL()).isEqualTo(Map.of("published", true));
                assertThat(view.getPublicToAll()).isEqualTo(all);
                assertThat(view.getPublicToMarketplace()).isEqualTo(market);
                assertThat(view.getAgencyProfile()).isEqualTo(agency);
                assertThat(view.getCreateAt()).isEqualTo(CREATED_AT.toEpochMilli());
                assertThat(view.getCreateBy()).isEqualTo(VISITOR);
            }).verifyComplete();
        } else {
            StepVerifier.create(result).expectErrorSatisfies(error -> assertBizError(error, BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST")).verify();
        }
        say("%s all=%s market=%s agency=%s -> allowed=%s", type, all, market, agency, allowed);
    }

    /** Catches a deleted or recycled bundle being served: the status must be NORMAL, otherwise BAD_REQUEST. */
    @ParameterizedTest
    @EnumSource(value = BundleStatus.class, names = {"RECYCLED", "DELETED"})
    void getPublishedBundle_andGetEditingBundle_requireANormalBundle(BundleStatus status) {
        stubPublishedView(BundleRequestType.PUBLIC_TO_ALL);
        when(resourcePermissionService.checkUserPermissionStatusOnResource(VISITOR, BUNDLE_ID, ResourceAction.READ_BUNDLES))
                .thenReturn(Mono.just(UserPermissionOnResourceStatus.success(permission(BUNDLE_ID))));
        bundle.setBundleStatus(status);

        StepVerifier.create(service.getPublishedBundle(BUNDLE_ID, BundleRequestType.PUBLIC_TO_ALL))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST")).verify();
        StepVerifier.create(service.getEditingBundle(BUNDLE_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST")).verify();
        say("status %s -> BAD_REQUEST for both views", status);
    }

    /**
     * Pins today's behaviour (no row): {@code checkBundleViewRequest} unboxes the {@code Boolean} getters, so a bundle whose
     * flag fields are null throws a NullPointerException for the marketplace and agency-profile requests while the
     * public-to-all request still works. Reachable only with documents lacking the field: the creation path always sets
     * the flags to false, the model's null-safe {@code isPublicToMarketplace()}/{@code agencyProfile()} are not used here.
     */
    @Test
    void getPublishedBundle_nullFlags_areANullPointerException_forMarketplaceAndAgencyRequests() {
        bundle.setPublicToAll(true);
        bundle.setPublicToMarketplace(null);
        bundle.setAgencyProfile(null);
        for (BundleRequestType type : BundleRequestType.values()) {
            stubPublishedView(type);
        }

        StepVerifier.create(service.getPublishedBundle(BUNDLE_ID, BundleRequestType.PUBLIC_TO_ALL)).expectNextCount(1).verifyComplete();
        StepVerifier.create(service.getPublishedBundle(BUNDLE_ID, BundleRequestType.PUBLIC_TO_MARKETPLACE)).expectError(NullPointerException.class).verify();
        StepVerifier.create(service.getPublishedBundle(BUNDLE_ID, BundleRequestType.AGENCY_PROFILE)).expectError(NullPointerException.class).verify();
        say("null flags -> NullPointerException for marketplace and agency requests");
    }

    /** Catches a wrong editing view: the read check on the bundle id, status NORMAL, the editing DSL and flags in the view. */
    @Test
    void getEditingBundle_returnsTheEditingView() {
        when(resourcePermissionService.checkUserPermissionStatusOnResource(VISITOR, BUNDLE_ID, ResourceAction.READ_BUNDLES))
                .thenReturn(Mono.just(UserPermissionOnResourceStatus.success(permission(BUNDLE_ID))));

        StepVerifier.create(service.getEditingBundle(BUNDLE_ID)).assertNext(view -> {
            assertThat(view.getBundleId()).isEqualTo(BUNDLE_ID);
            assertThat(view.getEditingBundleDSL()).isEqualTo(Map.of("editing", true));
            assertThat(view.getPublishedBundleDSL()).isNull();
            assertThat(view.getTitle()).isEqualTo("Title");
            assertThat(view.getCreateBy()).isEqualTo(VISITOR);
        }).verifyComplete();
        say("editing view built");
    }

    // ------------------------------------------------------------------ readable permission errors

    private enum Status {
        OK, ANONYMOUS, NOT_IN_ORG, NOT_ENOUGH
    }

    private UserPermissionOnResourceStatus status(Status status) {
        return switch (status) {
            case OK -> UserPermissionOnResourceStatus.success(permission(BUNDLE_ID));
            case ANONYMOUS -> UserPermissionOnResourceStatus.anonymousUser();
            case NOT_IN_ORG -> UserPermissionOnResourceStatus.notInOrg();
            case NOT_ENOUGH -> UserPermissionOnResourceStatus.notEnoughPermission();
        };
    }

    static Stream<Arguments> messageRows() {
        List<Arguments> rows = new ArrayList<>();
        for (boolean byBundle : new boolean[] {false, true}) {
            for (ResourceAction action : new ResourceAction[] {ResourceAction.READ_BUNDLES, ResourceAction.EDIT_BUNDLES, ResourceAction.EDIT_APPLICATIONS}) {
                if (byBundle && action == ResourceAction.EDIT_APPLICATIONS) {
                    continue;
                }
                for (Status status : Status.values()) {
                    String expectedKey = switch (status) {
                        case OK -> null;
                        case ANONYMOUS -> "USER_NOT_SIGNED_IN";
                        case NOT_IN_ORG -> "INSUFFICIENT_PERMISSION";
                        case NOT_ENOUGH -> byBundle ? (action == ResourceAction.EDIT_BUNDLES ? "NO_PERMISSION_TO_EDIT" : "NO_PERMISSION_TO_VIEW")
                                : (action == ResourceAction.EDIT_APPLICATIONS ? "NO_PERMISSION_TO_EDIT" : "NO_PERMISSION_TO_VIEW");
                    };
                    rows.add(Arguments.of(byBundle, action, status, expectedKey));
                }
            }
        }
        return rows.stream();
    }

    /**
     * Catches a wrong denial message: a granted check returns the permission; an anonymous visitor gets USER_NOT_SIGNED_IN, a
     * visitor outside the organization NO_PERMISSION_TO_REQUEST_APP / INSUFFICIENT_PERMISSION, otherwise
     * NO_PERMISSION_TO_REQUEST_APP with NO_PERMISSION_TO_EDIT or NO_PERMISSION_TO_VIEW. The bundle variant picks the EDIT key
     * for EDIT_BUNDLES. The id-based variant was copied from the application code and compares with EDIT_APPLICATIONS, so even
     * EDIT_BUNDLES gives the VIEW key there (pinned as behaviour, no row: its callers, getEditingBundle and getElements,
     * pass READ_BUNDLES, so no user sees it today).
     */
    @ParameterizedTest(name = "bundle variant {0}, {1}, {2} -> {3}")
    @MethodSource("messageRows")
    void readablePermissionErrors(boolean byBundle, ResourceAction action, Status status, String expectedKey) {
        if (byBundle) {
            when(resourcePermissionService.checkUserPermissionStatusOnBundle(VISITOR, BUNDLE_ID, action, BundleRequestType.PUBLIC_TO_ALL))
                    .thenReturn(Mono.just(status(status)));
        } else {
            when(resourcePermissionService.checkUserPermissionStatusOnResource(VISITOR, BUNDLE_ID, action)).thenReturn(Mono.just(status(status)));
        }

        Mono<ResourcePermission> result = byBundle ? service.checkBundlePermissionWithReadableErrorMsg(BUNDLE_ID, action, BundleRequestType.PUBLIC_TO_ALL)
                : service.checkPermissionWithReadableErrorMsg(BUNDLE_ID, action);

        if (status == Status.OK) {
            StepVerifier.create(result).assertNext(permission -> assertThat(permission.getResourceId()).isEqualTo(BUNDLE_ID)).verifyComplete();
        } else {
            BizError expectedError = status == Status.ANONYMOUS ? BizError.USER_NOT_SIGNED_IN : BizError.NO_PERMISSION_TO_REQUEST_APP;
            StepVerifier.create(result).expectErrorSatisfies(error -> assertBizError(error, expectedError, expectedKey)).verify();
        }
        say("bundleVariant=%s %s %s -> %s", byBundle, action, status, expectedKey);
    }

    // ------------------------------------------------------------------ permissions views

    /** Catches a wrong permission view: the read check first, status NORMAL, the organization looked up by the bundle's organization id, flags and creator in the view. */
    @Test
    void getBundlePermissions_readsAfterTheReadCheck_andBuildsTheView() {
        bundle.setPublicToAll(true);
        bundle.setPublicToMarketplace(true);
        bundle.setAgencyProfile(true);
        Organization organization = new Organization();
        organization.setName("Org Name");
        when(organizationService.getById(ORG)).thenReturn(Mono.just(organization));
        stubPermissionLists(List.of());

        StepVerifier.create(service.getBundlePermissions(BUNDLE_ID)).assertNext(view -> {
            assertThat(view.getCreatorId()).isEqualTo(VISITOR);
            assertThat(view.getOrgName()).isEqualTo("Org Name");
            assertThat(view.isPublicToAll()).isTrue();
            assertThat(view.isPublicToMarketplace()).isTrue();
            assertThat(view.isAgencyProfile()).isTrue();
            assertThat(view.getGroupPermissions()).extracting(PermissionItemView::getId).containsExactly("g1");
            assertThat(view.getUserPermissions()).extracting(PermissionItemView::getId).containsExactly("u1");
        }).verifyComplete();
        assertThat(events).containsExactly("perm:" + ResourceAction.READ_BUNDLES);
        say("getBundlePermissions view built");
    }

    private void stubPermissionLists(List<ResourcePermission> stored) {
        lenient().when(resourcePermissionService.getByBundleId(BUNDLE_ID)).thenReturn(Mono.just(stored));
        lenient().when(resourcePermissionService.getByResourceTypeAndResourceId(ResourceType.BUNDLE, BUNDLE_ID)).thenReturn(Mono.just(stored));
        lenient().when(permissionHelper.getGroupPermissions(anyList()))
                .thenReturn(Mono.just(List.of(PermissionItemView.builder().type(ResourceHolder.GROUP).id("g1").role("editor").build())));
        lenient().when(permissionHelper.getUserPermissions(anyList()))
                .thenReturn(Mono.just(List.of(PermissionItemView.builder().type(ResourceHolder.USER).id("u1").role("owner").build())));
    }

    /** Catches a permission view of an unreadable or inactive bundle: the read check denial is the result, a non-NORMAL status is BAD_REQUEST. */
    @Test
    void getBundlePermissions_deniedRead_andWrongStatus() {
        BizException denial = new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED");
        denyPermission(denial);
        stubPermissionLists(List.of());
        StepVerifier.create(service.getBundlePermissions(BUNDLE_ID)).expectErrorSatisfies(error -> assertThat(error).isSameAs(denial)).verify();
        verify(organizationService, never()).getById(any());

        lenient().when(resourcePermissionService.checkResourcePermissionWithError(anyString(), anyString(), any(ResourceAction.class)))
                .thenReturn(Mono.empty());
        bundle.setBundleStatus(BundleStatus.RECYCLED);
        stubPermissionLists(List.of());
        StepVerifier.create(service.getBundlePermissions(BUNDLE_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST")).verify();
        say("getBundlePermissions: denied read, wrong status");
    }

    /**
     * Pins the plan section 9 row "getPermissions looks up the org by the creator's user id; no permission check" (the
     * method behind {@code GET /bundles/{id}/permissions}, {@code BundleController.getBundlePermissions}): the organization
     * is looked up with {@code bundle.getCreatedBy()}, a user id, not with the bundle's organization id (the sibling
     * {@code getBundlePermissions} uses the organization id), and no permission, status or organization is checked at all.
     * A fix changes this test on purpose. What this test cannot show: with the mocked {@code OrganizationService} here the
     * lookup by the creator's id is stubbed to succeed; that the endpoint "always fails" with the real service is shown by the
     * next test.
     */
    @Test
    void getPermissions_looksUpTheOrganizationByTheCreatorsUserId_andChecksNoPermission_pinsTheSection9Row() {
        Organization organization = new Organization();
        organization.setName("Org Name");
        when(organizationService.getById(VISITOR)).thenReturn(Mono.just(organization));
        stubPermissionLists(List.of());

        StepVerifier.create(service.getPermissions(BUNDLE_ID)).assertNext(view -> {
            assertThat(view.getCreatorId()).isEqualTo(VISITOR);
            assertThat(view.getOrgName()).isEqualTo("Org Name");
            assertThat(view.getGroupPermissions()).extracting(PermissionItemView::getId).containsExactly("g1");
            assertThat(view.getUserPermissions()).extracting(PermissionItemView::getId).containsExactly("u1");
        }).verifyComplete();

        verify(organizationService).getById(VISITOR);
        verify(organizationService, never()).getById(ORG);
        verify(resourcePermissionService, never()).checkResourcePermissionWithError(anyString(), anyString(), any(ResourceAction.class));
        verify(resourcePermissionService, never()).checkAndReturnMaxPermission(anyString(), anyString(), any(ResourceAction.class));
        verify(resourcePermissionService, never()).checkUserPermissionStatusOnResource(anyString(), anyString(), any(ResourceAction.class));
        verifyNoInteractions(sessionUserService);
        say("getPermissions: organization looked up by creator id %s, no permission check (section 9 row pinned)", VISITOR);
    }

    /**
     * Shows the consequence of the same section 9 row with the real {@code OrganizationServiceImpl} over a mocked
     * repository that knows the bundle's organization: {@code getPermissions} (organization looked up by the creator's user
     * id) fails with UNABLE_TO_FIND_VALID_ORG (key INVALID_ORG_ID) for a bundle whose organization exists, while the sibling
     * {@code getBundlePermissions} (organization looked up by the organization id) succeeds on the same fixtures. A fix
     * changes this test on purpose. Limit: the repository is a mock that returns the organization for its id only (what a
     * database does), no database is involved.
     */
    @Test
    void getPermissions_withTheRealOrganizationService_failsWhileGetBundlePermissionsWorks_pinsTheSection9Row() {
        // object-id-like ids (no dash: an id with a dash is looked up as a GID)
        bundle.setCreatedBy("5f1234abcd");
        bundle.setOrganizationId("6a9876fedc");
        OrganizationRepository organizationRepository = mock(OrganizationRepository.class);
        Organization organization = new Organization();
        organization.setId("6a9876fedc");
        organization.setName("Org Name");
        lenient().when(organizationRepository.findBySlugAndState(anyString(), eq(OrganizationState.ACTIVE))).thenReturn(Mono.empty());
        lenient().when(organizationRepository.findByIdAndState(anyString(), eq(OrganizationState.ACTIVE))).thenReturn(Mono.empty());
        lenient().when(organizationRepository.findByIdAndState("6a9876fedc", OrganizationState.ACTIVE)).thenReturn(Mono.just(organization));
        OrganizationService realOrganizations = new OrganizationServiceImpl(mock(UserRepository.class), null, mock(AssetService.class),
                mock(OrgMemberService.class), mock(MongoUpsertHelper.class), organizationRepository, mock(GroupService.class),
                mock(ApplicationContext.class), mock(CommonConfig.class), null, null);
        BundleApiServiceImpl withRealOrganizations = newService(realOrganizations);
        stubPermissionLists(List.of());

        StepVerifier.create(withRealOrganizations.getPermissions(BUNDLE_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.UNABLE_TO_FIND_VALID_ORG, "INVALID_ORG_ID")).verify();
        StepVerifier.create(withRealOrganizations.getBundlePermissions(BUNDLE_ID))
                .assertNext(view -> assertThat(view.getOrgName()).isEqualTo("Org Name")).verifyComplete();
        say("getPermissions fails with UNABLE_TO_FIND_VALID_ORG, getBundlePermissions works (section 9 row pinned)");
    }

    // ------------------------------------------------------------------ moveApp / addApp

    private Application app() {
        Application application = mock(Application.class);
        lenient().when(application.getId()).thenReturn(APP_ID);
        lenient().when(application.getOrganizationId()).thenReturn(ORG);
        return application;
    }

    private Bundle bundleWithApps(String id, List<Application> applications) {
        Bundle value = bundle(id, BundleStatus.NORMAL);
        Map<String, Object> dsl = new HashMap<>();
        dsl.put("applications", new ArrayList<>(applications));
        value.setEditingBundleDSL(dsl);
        return value;
    }

    @SuppressWarnings("unchecked")
    private static List<Application> applicationsOf(Bundle bundle) {
        return (List<Application>) bundle.getEditingBundleDSL().get("applications");
    }

    private void stubRelations(Bundle from, Bundle to, Application application) {
        lenient().when(bundleElementRelationService.deleteByBundleIdAndElementId(anyString(), eq(APP_ID)))
                .thenAnswer(invocation -> logged("deleteRelation:" + invocation.getArgument(0), true));
        lenient().when(bundleElementRelationService.create(anyString(), eq(APP_ID)))
                .thenAnswer(invocation -> loggedVoid("createRelation:" + invocation.getArgument(0)));
        lenient().when(bundleService.findById("from-bundle")).thenAnswer(invocation -> logged("findFrom", from));
        lenient().when(bundleService.findById("to-bundle")).thenAnswer(invocation -> logged("findTo", to));
        lenient().when(bundleRepository.findById("to-bundle")).thenAnswer(invocation -> logged("repoFindTo", to));
        lenient().when(bundleRepository.save(any(Bundle.class))).thenAnswer(invocation -> logged("save:" + ((Bundle) invocation.getArgument(0)).getId(),
                invocation.getArgument(0)));
        lenient().when(applicationRepository.findById(APP_ID)).thenAnswer(invocation -> Mono.just(application));
    }

    /**
     * Catches an application moved or added without the permissions, or a wrong move: the application permission
     * (MANAGE_APPLICATIONS) is asked first, then MANAGE_BUNDLES on each bundle that is written, then each of those bundles is
     * read to compare its organization (BF-011); a blank bundle id is not checked; a blank target only removes the old relation
     * (for addApp, the removal of a relation of the blank id, which matches nothing); otherwise the application leaves the old
     * bundle's editing DSL, enters the new one's, both are saved and the new relation is created.
     */
    @Test
    void moveApp_andAddApp_changeTheBundlesAfterTheApplicationPermission() {
        Application application = app();
        Bundle from = bundleWithApps("from-bundle", List.of(application));
        Bundle to = bundleWithApps("to-bundle", List.of());
        stubRelations(from, to, application);

        StepVerifier.create(service.moveApp(APP_ID, "from-bundle", "to-bundle")).verifyComplete();

        assertThat(events).containsExactly("perm:" + ResourceAction.MANAGE_APPLICATIONS, "perm:" + ResourceAction.MANAGE_BUNDLES + "@from-bundle",
                "perm:" + ResourceAction.MANAGE_BUNDLES + "@to-bundle", "findFrom", "findTo",
                "deleteRelation:from-bundle", "findFrom", "save:from-bundle", "repoFindTo", "save:to-bundle", "createRelation:to-bundle");
        assertThat(applicationsOf(from)).isEmpty();
        assertThat(applicationsOf(to)).containsExactly(application);

        events.clear();
        Bundle target = bundleWithApps("to-bundle", List.of());
        stubRelations(from, target, application);
        StepVerifier.create(service.addApp(APP_ID, "to-bundle")).verifyComplete();
        assertThat(events).containsExactly("perm:" + ResourceAction.MANAGE_APPLICATIONS, "perm:" + ResourceAction.MANAGE_BUNDLES + "@to-bundle",
                "findTo", "deleteRelation:to-bundle", "findTo", "save:to-bundle", "createRelation:to-bundle");
        assertThat(applicationsOf(target)).containsExactly(application);

        events.clear();
        StepVerifier.create(service.moveApp(APP_ID, "from-bundle", "")).verifyComplete();
        assertThat(events).containsExactly("perm:" + ResourceAction.MANAGE_APPLICATIONS, "perm:" + ResourceAction.MANAGE_BUNDLES + "@from-bundle",
                "findFrom", "deleteRelation:from-bundle");
        events.clear();
        StepVerifier.create(service.addApp(APP_ID, " ")).verifyComplete();
        assertThat(events).containsExactly("perm:" + ResourceAction.MANAGE_APPLICATIONS, "deleteRelation: ");
        say("move/add: events verified");
    }

    /** Catches a move failing for a source bundle without an editing DSL: the DSL is created (with an empty application list) and saved. */
    @Test
    void moveApp_sourceBundleWithoutDsl_getsAnEmptyApplicationList() {
        Application application = app();
        Bundle from = bundle("from-bundle", BundleStatus.NORMAL);
        from.setEditingBundleDSL(null);
        Bundle to = bundleWithApps("to-bundle", List.of());
        stubRelations(from, to, application);

        StepVerifier.create(service.moveApp(APP_ID, "from-bundle", "to-bundle")).verifyComplete();

        assertThat(applicationsOf(from)).isEmpty();
        assertThat(applicationsOf(to)).containsExactly(application);
        say("move from a bundle without DSL -> empty application list created");
    }

    /** Catches a move or add by a visitor without the application permission: the denial is the result and nothing is changed. */
    @Test
    void moveApp_andAddApp_deniedApplicationPermission_changeNothing() {
        Application application = app();
        stubRelations(bundleWithApps("from-bundle", List.of(application)), bundleWithApps("to-bundle", List.of()), application);
        BizException denial = new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED");
        denyPermission(denial);

        StepVerifier.create(service.moveApp(APP_ID, "from-bundle", "to-bundle")).expectErrorSatisfies(error -> assertThat(error).isSameAs(denial)).verify();
        StepVerifier.create(service.addApp(APP_ID, "to-bundle")).expectErrorSatisfies(error -> assertThat(error).isSameAs(denial)).verify();

        assertThat(events).containsExactly("perm:" + ResourceAction.MANAGE_APPLICATIONS, "perm:" + ResourceAction.MANAGE_APPLICATIONS);
        verify(bundleRepository, never()).save(any());
        say("move/add denied -> nothing changed");
    }

    /**
     * No relation was deleted or created and no bundle saved. The relation calls are asserted on the logged events, which are
     * added on subscription: moveApp and addApp build those calls eagerly as arguments of {@code then}, so an invocation alone
     * does not mean the relation was changed.
     */
    private void assertNothingWritten() {
        assertThat(events).noneMatch(event -> event.startsWith("deleteRelation:") || event.startsWith("createRelation:"));
        verify(bundleRepository, never()).save(any());
    }

    /**
     * BF-011 (was the pin of the plan section 9 row "moveApp/addApp check only MANAGE_APPLICATIONS on the app, never the
     * bundle"): a visitor who manages the application but may not manage the bundle is refused with NOT_AUTHORIZED, for the
     * source bundle of a move as for the target of a move or add; no relation is deleted or created and no bundle is saved.
     */
    @ParameterizedTest(name = "denied bundle {0}")
    @ValueSource(strings = {"from-bundle", "to-bundle"})
    void moveAndAddApp_withoutTheBundlePermission_areRefused_andChangeNothing(String deniedBundleId) {
        Application application = app();
        stubRelations(bundleWithApps("from-bundle", List.of(application)), bundleWithApps("to-bundle", List.of()), application);
        BizException denial = new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED");
        when(resourcePermissionService.checkResourcePermissionWithError(VISITOR, deniedBundleId, ResourceAction.MANAGE_BUNDLES))
                .thenReturn(Mono.error(denial));

        StepVerifier.create(service.moveApp(APP_ID, "from-bundle", "to-bundle"))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(denial)).verify();
        if ("to-bundle".equals(deniedBundleId)) {
            StepVerifier.create(service.addApp(APP_ID, "to-bundle"))
                    .expectErrorSatisfies(error -> assertThat(error).isSameAs(denial)).verify();
        }

        assertNothingWritten();
        say("move/add without MANAGE_BUNDLES on %s -> NOT_AUTHORIZED, nothing changed; events %s", deniedBundleId, events);
    }

    /**
     * BF-011: a bundle of another organization is refused with APPLICATION_AND_ORG_NOT_MATCH even when the visitor may manage
     * it (as a member of both organizations can), whether it is the source or the target; nothing is changed.
     */
    @ParameterizedTest(name = "foreign bundle {0}")
    @ValueSource(strings = {"from-bundle", "to-bundle"})
    void moveAndAddApp_withABundleOfAnotherOrganization_areRefused_andChangeNothing(String foreignBundleId) {
        Application application = app();
        Bundle from = bundleWithApps("from-bundle", List.of(application));
        Bundle to = bundleWithApps("to-bundle", List.of());
        ("from-bundle".equals(foreignBundleId) ? from : to).setOrganizationId("someone-elses-org");
        stubRelations(from, to, application);

        StepVerifier.create(service.moveApp(APP_ID, "from-bundle", "to-bundle"))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.APPLICATION_AND_ORG_NOT_MATCH, "APPLICATION_AND_ORG_NOT_MATCH"))
                .verify();
        if ("to-bundle".equals(foreignBundleId)) {
            StepVerifier.create(service.addApp(APP_ID, "to-bundle"))
                    .expectErrorSatisfies(error -> assertBizError(error, BizError.APPLICATION_AND_ORG_NOT_MATCH, "APPLICATION_AND_ORG_NOT_MATCH"))
                    .verify();
        }

        assertThat(applicationsOf(from)).containsExactly(application);
        assertThat(applicationsOf(to)).isEmpty();
        assertNothingWritten();
        say("move/add with %s of another org -> APPLICATION_AND_ORG_NOT_MATCH, nothing changed", foreignBundleId);
    }

    /**
     * BF-011, the fail-closed fallback of the organization comparison: should the bundle or application lookup come back empty,
     * the move or add is refused (BUNDLE_NOT_EXIST, APPLICATION_NOT_FOUND) instead of passing with nothing compared; nothing is
     * changed. With the real services this is not the answer for a missing resource: the permission check, mocked as granted
     * here, already fails with NO_RESOURCE_FOUND, and BundleServiceImpl.findById itself errors instead of completing empty.
     */
    @Test
    void moveAndAddApp_whenABundleOrApplicationLookupIsEmpty_areRefused_andChangeNothing() {
        Application application = app();
        stubRelations(bundleWithApps("from-bundle", List.of(application)), bundleWithApps("to-bundle", List.of()), application);
        when(bundleService.findById("no-such-bundle")).thenReturn(Mono.empty());

        StepVerifier.create(service.addApp(APP_ID, "no-such-bundle"))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.BUNDLE_NOT_EXIST, "BUNDLE_NOT_EXIST")).verify();

        when(applicationRepository.findById(APP_ID)).thenReturn(Mono.empty());
        StepVerifier.create(service.moveApp(APP_ID, "from-bundle", "to-bundle"))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.APPLICATION_NOT_FOUND, "APPLICATION_NOT_FOUND")).verify();

        assertNothingWritten();
        say("empty bundle lookup -> BUNDLE_NOT_EXIST, empty application lookup -> APPLICATION_NOT_FOUND, nothing changed");
    }

    // ------------------------------------------------------------------ getElements

    private BiRelation relation(String target, String position) {
        return BiRelation.builder().targetId(target).extParam1(position).build();
    }

    private void readGranted(String bundleId) {
        when(resourcePermissionService.checkUserPermissionStatusOnResource(VISITOR, bundleId, ResourceAction.READ_BUNDLES))
                .thenReturn(Mono.just(UserPermissionOnResourceStatus.success(permission(bundleId))));
    }

    /**
     * Catches elements in the wrong order or wrongly numbered: once the read check passes, the bundle's element relations are
     * sorted by the numeric position in extParam1, each target is resolved through the application service, and each result
     * is wrapped with its index in the sorted order. A null or non-numeric position is a NumberFormatException (pinned as
     * behaviour).
     */
    @Test
    void getElements_sortsByPosition_andIndexesTheApplications() {
        readGranted(BUNDLE_ID);
        readGranted("bad-bundle");
        when(bundleService.findById("bad-bundle")).thenReturn(Mono.just(bundle("bad-bundle", BundleStatus.NORMAL)));
        Application a0 = mock(Application.class);
        Application a1 = mock(Application.class);
        Application a2 = mock(Application.class);
        when(biRelationService.getBySourceId(BiRelationBizType.BUNDLE_ELEMENT, BUNDLE_ID))
                .thenReturn(Flux.just(relation("t2", "10"), relation("t0", "2"), relation("t1", "3")));
        when(applicationServiceImpl.findById("t0")).thenReturn(Mono.just(a0));
        when(applicationServiceImpl.findById("t1")).thenReturn(Mono.just(a1));
        when(applicationServiceImpl.findById("t2")).thenReturn(Mono.just(a2));

        StepVerifier.create(service.getElements(BUNDLE_ID, null).cast(BundleApplication.class).collectList()).assertNext(elements -> {
            assertThat(elements).extracting(BundleApplication::application).containsExactly(a0, a1, a2);
            assertThat(elements).extracting(BundleApplication::position).containsExactly(0L, 1L, 2L);
        }).verifyComplete();

        for (String badPosition : new String[] {null, "first"}) {
            when(biRelationService.getBySourceId(BiRelationBizType.BUNDLE_ELEMENT, "bad-bundle"))
                    .thenReturn(Flux.just(relation("t0", "1"), relation("t1", badPosition)));
            StepVerifier.create(service.getElements("bad-bundle", null)).expectError(NumberFormatException.class).verify();
        }
        say("getElements sorted and indexed");
    }

    /**
     * BF-020 (was the pin of the plan section 9 row "getElements has no permission/status/org check", behind
     * {@code GET /bundles/{id}/elements}, {@code BundleController.getElements}): a visitor who may not read the bundle gets the
     * readable error of {@code checkPermissionWithReadableErrorMsg} (another organization's bundle: INSUFFICIENT_PERMISSION),
     * and neither the bundle nor its element relations are read.
     */
    @ParameterizedTest(name = "{0} -> {1}")
    @CsvSource({"NOT_IN_ORG, INSUFFICIENT_PERMISSION", "NOT_ENOUGH, NO_PERMISSION_TO_VIEW", "ANONYMOUS, USER_NOT_SIGNED_IN"})
    void getElements_withoutReadPermission_isRefused_andReadsNoElements(Status denial, String messageKey) {
        when(resourcePermissionService.checkUserPermissionStatusOnResource(VISITOR, "someone-elses-bundle", ResourceAction.READ_BUNDLES))
                .thenReturn(Mono.just(status(denial)));
        AtomicInteger bundleReads = new AtomicInteger();
        when(bundleService.findById("someone-elses-bundle")).thenReturn(Mono.defer(() -> {
            bundleReads.incrementAndGet();
            return Mono.just(bundle("someone-elses-bundle", BundleStatus.NORMAL));
        }));
        AtomicInteger relationReads = new AtomicInteger();
        when(biRelationService.getBySourceId(BiRelationBizType.BUNDLE_ELEMENT, "someone-elses-bundle"))
                .thenReturn(Flux.defer(() -> {
                    relationReads.incrementAndGet();
                    return Flux.just(relation("t0", "0"));
                }));
        lenient().when(applicationServiceImpl.findById("t0")).thenReturn(Mono.just(mock(Application.class)));
        BizError expected = denial == Status.ANONYMOUS ? BizError.USER_NOT_SIGNED_IN : BizError.NO_PERMISSION_TO_REQUEST_APP;

        StepVerifier.create(service.getElements("someone-elses-bundle", null))
                .expectErrorSatisfies(error -> assertBizError(error, expected, messageKey)).verify();

        assertThat(bundleReads).as("the bundle is not read").hasValue(0);
        assertThat(relationReads).as("the element relations are not read").hasValue(0);
        verify(applicationServiceImpl, never()).findById(anyString());
        say("getElements %s -> %s, nothing read", denial, messageKey);
    }

    /** BF-020: a recycled or deleted bundle is BAD_REQUEST even for a visitor who may read it, and its elements are not read. */
    @ParameterizedTest
    @EnumSource(value = BundleStatus.class, names = {"RECYCLED", "DELETED"})
    void getElements_ofABundleThatIsNotNormal_isBadRequest_andReadsNoElements(BundleStatus status) {
        readGranted(BUNDLE_ID);
        bundle.setBundleStatus(status);
        AtomicInteger relationReads = new AtomicInteger();
        when(biRelationService.getBySourceId(BiRelationBizType.BUNDLE_ELEMENT, BUNDLE_ID)).thenReturn(Flux.defer(() -> {
            relationReads.incrementAndGet();
            return Flux.just(relation("t0", "0"));
        }));
        lenient().when(applicationServiceImpl.findById("t0")).thenReturn(Mono.just(mock(Application.class)));

        StepVerifier.create(service.getElements(BUNDLE_ID, null))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST")).verify();

        assertThat(relationReads).hasValue(0);
        verify(applicationServiceImpl, never()).findById(anyString());
        say("getElements of a %s bundle -> BAD_REQUEST, nothing read", status);
    }

    // ------------------------------------------------------------------ small ones

    /** Catches a wrong info view: creator name from the user service, flags, folder id, visibility; a missing creation time gives 0. */
    @Test
    void buildBundleInfoView_carriesTheBundleFields() {
        bundle.setPublicToAll(true);
        bundle.setAgencyProfile(true);

        StepVerifier.create(service.buildBundleInfoView(bundle, true, false, "folder-9")).assertNext(view -> {
            assertThat(view.getUserId()).isEqualTo(VISITOR);
            assertThat(view.getCreateBy()).isEqualTo(CREATOR_NAME);
            assertThat(view.getCreateAt()).isEqualTo(CREATED_AT.toEpochMilli());
            assertThat(view.isVisible()).isTrue();
            assertThat(view.isManageable()).isFalse();
            assertThat(view.getFolderId()).isEqualTo("folder-9");
            assertThat(view.getPublicToAll()).isTrue();
            assertThat(view.getPublicToMarketplace()).isFalse();
            assertThat(view.getAgencyProfile()).isTrue();
            assertThat(view.getTitle()).isEqualTo("Title");
        }).verifyComplete();

        bundle.setCreatedAt(null);
        StepVerifier.create(service.buildBundleInfoView(bundle, false, true, null)).assertNext(view -> {
            assertThat(view.getCreateAt()).isZero();
            assertThat(view.isVisible()).isFalse();
            assertThat(view.isManageable()).isTrue();
        }).verifyComplete();
        say("bundle info view built");
    }

    /** Catches a missing bundle accepted or a foreign bundle treated as own: BUNDLE_NOT_EXIST with the id. */
    @Test
    void checkBundleExist_andCheckBundleCurrentUser() {
        when(bundleService.findById("missing")).thenReturn(Mono.empty());
        StepVerifier.create(service.checkBundleExist("missing")).expectErrorSatisfies(error -> {
            assertBizError(error, BizError.BUNDLE_NOT_EXIST, "BUNDLE_NOT_EXIST");
            assertThat(((BizException) error).getArgs()).containsExactly("missing");
        }).verify();
        StepVerifier.create(service.checkBundleExist(BUNDLE_ID)).expectNext(bundle).verifyComplete();

        StepVerifier.create(service.checkBundleCurrentUser(bundle, VISITOR)).verifyComplete();
        StepVerifier.create(service.checkBundleCurrentUser(bundle, "someone-else")).expectErrorSatisfies(error -> {
            assertBizError(error, BizError.BUNDLE_NOT_EXIST, "BUNDLE_NOT_EXIST");
            assertThat(((BizException) error).getArgs()).containsExactly(BUNDLE_ID);
        }).verify();
        say("checkBundleExist / checkBundleCurrentUser verified");
    }

    /** Catches the recycle bin showing the wrong bundles: the home service is asked for RECYCLED bundles. */
    @Test
    void getRecycledBundles_asksForRecycledBundles() {
        BundleInfoView view = BundleInfoView.builder().bundleId(BUNDLE_ID).build();
        when(userHomeApiService.getAllAuthorisedBundles4CurrentOrgMember(BundleStatus.RECYCLED)).thenReturn(Flux.just(view));

        StepVerifier.create(service.getRecycledBundles()).expectNext(view).verifyComplete();
        say("recycled bundles delegated");
    }
}
