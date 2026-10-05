package org.lowcoder.api.home;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.permission.PermissionHelper;
import org.lowcoder.api.permission.view.PermissionItemView;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.model.FolderElement;
import org.lowcoder.domain.folder.service.FolderElementRelationService;
import org.lowcoder.domain.folder.service.FolderService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.interaction.UserFolderInteraction;
import org.lowcoder.domain.interaction.UserFolderInteractionService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.ArgumentCaptor;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Mockito unit tests of {@link FolderApiServiceImpl}: every collaborator is a mock, so the tests show which checks run
 * and what the service hands to {@link FolderService}. The Spring + Mongo twin of the create pins is
 * {@code FolderCreateIgnoresClientIdPersistenceTest}.
 *
 * <p>Several operations are written as {@code a.then(b(...))}: {@code b(...)} is CALLED while the chain is assembled
 * even when {@code a} fails, and only subscribed when {@code a} succeeds. "Nothing was mutated" is therefore asserted
 * with a flag set when the mutation Mono is subscribed, never with {@code verify(..., never())}.
 *
 * <p>BF-004 (fixed; was pinned as plan §9 row "FolderApiServiceImpl.create keeps a client-supplied id ... overwrites that
 * folder (with the caller's org id)"): create ignores a client-supplied id and always generates the gid, tests
 * {@code create_withAClientSuppliedId*}, {@code create_withAnotherOrgsFolderId*}, {@code create_withIdEqualToParentFolderId*}.
 */
class FolderApiServiceImplTest {

    private static final String ORG = "org-caller";
    private static final String OTHER_ORG = "org-foreign";
    private static final String VISITOR = "visitor-1";
    private static final String OTHER_USER = "someone-else";
    private static final Instant CREATED = Instant.parse("2024-01-01T00:00:00Z");

    private FolderService folderService;
    private SessionUserService sessionUserService;
    private OrgDevChecker orgDevChecker;
    private UserHomeApiService userHomeApiService;
    private FolderElementRelationService relationService;
    private ResourcePermissionService permissionService;
    private PermissionHelper permissionHelper;
    private UserService userService;
    private OrganizationService organizationService;
    private UserFolderInteractionService interactionService;
    private FolderApiServiceImpl service;

    @BeforeEach
    void setUp() {
        folderService = mock(FolderService.class);
        sessionUserService = mock(SessionUserService.class);
        orgDevChecker = mock(OrgDevChecker.class);
        userHomeApiService = mock(UserHomeApiService.class);
        relationService = mock(FolderElementRelationService.class);
        permissionService = mock(ResourcePermissionService.class);
        permissionHelper = mock(PermissionHelper.class);
        userService = mock(UserService.class);
        organizationService = mock(OrganizationService.class);
        interactionService = mock(UserFolderInteractionService.class);
        service = new FolderApiServiceImpl(folderService, sessionUserService, orgDevChecker, userHomeApiService,
                relationService, permissionService, permissionHelper, mock(GroupService.class), userService,
                organizationService, interactionService);

        signedInAs(MemberRole.MEMBER);
        when(orgDevChecker.checkCurrentOrgDev()).thenReturn(Mono.empty());
        when(orgDevChecker.isCurrentOrgDev()).thenReturn(Mono.just(false));
        when(folderService.findByOrganizationId(anyString())).thenReturn(Flux.empty());
        when(folderService.create(any(Folder.class))).thenAnswer(invocation -> Mono.just(invocation.<Folder>getArgument(0)));
        when(userService.findById(anyString())).thenAnswer(invocation -> Mono.just(user(invocation.getArgument(0))));
    }

    // ----------------------------------------------------------------- fixtures

    private void signedInAs(MemberRole role) {
        OrgMember member = OrgMember.builder().orgId(ORG).userId(VISITOR).role(role).build();
        when(sessionUserService.getVisitorOrgMemberCache()).thenReturn(Mono.just(member));
        when(sessionUserService.getVisitorId()).thenReturn(Mono.just(VISITOR));
    }

    private static User user(String id) {
        User user = new User();
        user.setId(id);
        user.setName("name of " + id);
        return user;
    }

    private static Folder folder(String id, String org, String parent, String name, String creator) {
        Folder folder = new Folder();
        folder.setId(id);
        folder.setOrganizationId(org);
        folder.setParentFolderId(parent);
        folder.setName(name);
        folder.setCreatedBy(creator);
        folder.setCreatedAt(CREATED);
        return folder;
    }

    private static Folder request(String id, String parent, String name) {
        Folder folder = new Folder();
        folder.setId(id);
        folder.setParentFolderId(parent);
        folder.setName(name);
        return folder;
    }

    private static void expectBizError(org.reactivestreams.Publisher<?> mono, BizError error) {
        StepVerifier.create(mono)
                .expectErrorSatisfies(throwable -> {
                    assertThat(throwable).isInstanceOf(BizException.class);
                    assertThat(((BizException) throwable).getError()).isEqualTo(error);
                    System.out.println("[FolderApiServiceImplTest] " + error + ": " + throwable.getMessage());
                })
                .verify();
    }

    private Folder capturedCreate() {
        ArgumentCaptor<Folder> captor = ArgumentCaptor.forClass(Folder.class);
        verify(folderService).create(captor.capture());
        return captor.getValue();
    }

    private static <T> Mono<T> flagged(AtomicBoolean subscribed, T value) {
        return Mono.defer(() -> {
            subscribed.set(true);
            return Mono.justOrEmpty(value);
        });
    }

    private static Mono<Void> flaggedVoid(AtomicBoolean subscribed) {
        return Mono.defer(() -> {
            subscribed.set(true);
            return Mono.<Void>empty();
        });
    }

    // ------------------------------------------------------------------- create

    /** Catches nameless folders being stored: the name check comes before anything else runs. */
    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"  ", "\t"})
    void create_blankName_failsBeforeAnyServiceCall(String name) {
        expectBizError(service.create(request(null, null, name)), BizError.INVALID_PARAMETER);

        verifyNoInteractions(folderService, orgDevChecker, sessionUserService);
    }

    /** Catches the gid being missing, or organization and creator coming from the request instead of the session. */
    @Test
    void create_generatesGid_setsOrgAndCreatorFromTheVisitor_andBuildsTheView() {
        Folder body = request(null, null, "reports");
        body.setOrganizationId(OTHER_ORG);
        body.setCreatedBy(OTHER_USER);

        StepVerifier.create(service.create(body))
                .assertNext(view -> {
                    assertThat(view.getName()).isEqualTo("reports");
                    assertThat(view.getOrgId()).isEqualTo(ORG);
                    assertThat(view.getCreateBy()).isEqualTo("name of " + VISITOR);
                    assertThat(view.isVisible()).isTrue();
                    assertThat(view.isManageable()).isTrue();
                    assertThat(FieldName.isGID(view.getFolderGid())).isTrue();
                    System.out.println("[FolderApiServiceImplTest] created " + view);
                })
                .verifyComplete();

        Folder saved = capturedCreate();
        assertThat(saved.getOrganizationId()).isEqualTo(ORG);
        assertThat(saved.getCreatedBy()).isEqualTo(VISITOR);
        assertThat(FieldName.isGID(saved.getGid())).isTrue();
        assertThat(saved.getId()).isNull();
    }

    /** Catches folders being created by users who are not developers of the organization. */
    @Test
    void create_requiresOrgDev() {
        when(orgDevChecker.checkCurrentOrgDev()).thenReturn(Mono.error(new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED")));

        expectBizError(service.create(request(null, null, "reports")), BizError.NOT_AUTHORIZED);

        verify(folderService, never()).create(any());
    }

    /** Catches a folder being created under a missing parent or under a parent of another organization. */
    @Test
    void create_withParent_requiresAnExistingParentOfTheCallersOrg() {
        when(folderService.findById("missing-parent")).thenReturn(Mono.empty());
        when(folderService.findById("foreign-parent")).thenReturn(Mono.just(folder("foreign-parent", OTHER_ORG, null, "p", OTHER_USER)));
        when(folderService.findById("good-parent")).thenReturn(Mono.just(folder("good-parent", ORG, null, "p", OTHER_USER)));

        expectBizError(service.create(request(null, "missing-parent", "child")), BizError.FOLDER_NOT_EXIST);
        expectBizError(service.create(request(null, "foreign-parent", "child")), BizError.FOLDER_NOT_EXIST);
        verify(folderService, never()).create(any());

        StepVerifier.create(service.create(request(null, "good-parent", "child")))
                .assertNext(view -> assertThat(view.getParentFolderId()).isEqualTo("good-parent"))
                .verifyComplete();
        assertThat(capturedCreate().getParentFolderId()).isEqualTo("good-parent");
    }

    /** Catches duplicate sibling names, and names of other parents (or other organizations) counting as conflicts. */
    @Test
    void create_nameUniqueness_isPerParentWithinTheCallersOrg() {
        when(folderService.findByOrganizationId(ORG)).thenReturn(Flux.just(
                folder("f-root", ORG, null, "taken", OTHER_USER),
                folder("f-under-p", ORG, "p", "taken-in-p", OTHER_USER)));
        when(folderService.findById("p")).thenReturn(Mono.just(folder("p", ORG, null, "p", OTHER_USER)));

        expectBizError(service.create(request(null, null, "taken")), BizError.FOLDER_NAME_CONFLICT);
        expectBizError(service.create(request(null, "p", "taken-in-p")), BizError.FOLDER_NAME_CONFLICT);
        verify(folderService, never()).create(any());

        StepVerifier.create(service.create(request(null, "p", "taken"))).expectNextCount(1).verifyComplete();
        verify(folderService, atLeastOnce()).findByOrganizationId(ORG);
        verify(folderService, never()).findByOrganizationId(OTHER_ORG);
    }

    /**
     * BF-004 (was pinned as plan §9 row "FolderApiServiceImpl.create keeps a client-supplied id ..."), (a) an id of a
     * folder of the caller's own org: the entity handed to {@code folderService.create} (repository save) has no id, so it
     * is inserted as a new folder, gets a generated gid, and carries the caller's org and creator.
     */
    @Test
    void create_withAClientSuppliedId_ignoresIt_andSavesANewFolderWithAGeneratedGid() {
        StepVerifier.create(service.create(request("existing-id", null, "new name"))).expectNextCount(1).verifyComplete();

        Folder saved = capturedCreate();
        assertThat(saved.getId()).as("the client id is dropped").isNull();
        assertThat(saved.getGid()).as("a gid is generated").isNotBlank();
        assertThat(FieldName.isGID(saved.getGid())).isTrue();
        assertThat(saved.getOrganizationId()).isEqualTo(ORG);
        assertThat(saved.getCreatedBy()).isEqualTo(VISITOR);
        verify(folderService, never()).findById(any());
        System.out.println("[FolderApiServiceImplTest] (a) client id ignored: saved id " + saved.getId() + ", gid " + saved.getGid());
    }

    /**
     * Same name and parent as an existing folder, with that folder's id: the unique-name check lists the existing folder
     * as a sibling and rejects the create, as it does without the id.
     */
    @Test
    void create_withTheIdNameAndParentOfAnExistingFolder_isRejectedByTheNameCheck() {
        when(folderService.findByOrganizationId(ORG)).thenReturn(Flux.just(folder("existing-id", ORG, null, "same", OTHER_USER)));

        expectBizError(service.create(request("existing-id", null, "same")), BizError.FOLDER_NAME_CONFLICT);

        verify(folderService, never()).create(any());
    }

    /**
     * BF-004 (b), an id of ANOTHER org's folder: the saved entity has no id, so it is a new folder of the caller's org and
     * the other org's folder is not replaced; that folder is never looked up nor its org listed.
     */
    @Test
    void create_withAnotherOrgsFolderId_ignoresIt_andSavesANewFolderOfTheCallersOrg() {
        when(folderService.findByOrganizationId(ORG)).thenReturn(Flux.just(folder("mine", ORG, null, "mine", VISITOR)));

        StepVerifier.create(service.create(request("foreign-folder-id", null, "taken over"))).expectNextCount(1).verifyComplete();

        Folder saved = capturedCreate();
        assertThat(saved.getId()).as("the foreign id is dropped, nothing is replaced").isNull();
        assertThat(saved.getOrganizationId()).isEqualTo(ORG);
        assertThat(saved.getCreatedBy()).isEqualTo(VISITOR);
        verify(folderService, never()).findByOrganizationId(OTHER_ORG);
        verify(folderService, never()).findById("foreign-folder-id");
        System.out.println("[FolderApiServiceImplTest] (b) foreign id ignored: saved id " + saved.getId() + " org " + saved.getOrganizationId());
    }

    /**
     * BF-004 (c), id equal to parentFolderId: the parent check finds the folder in the caller's org, and the saved entity
     * is a new folder (no id) under that parent, not a folder that is its own parent.
     */
    @Test
    void create_withIdEqualToParentFolderId_savesANewChildOfThatFolder_notASelfParentedOne() {
        when(folderService.findById("self-id")).thenReturn(Mono.just(folder("self-id", ORG, null, "old", VISITOR)));

        StepVerifier.create(service.create(request("self-id", "self-id", "loop"))).expectNextCount(1).verifyComplete();

        Folder saved = capturedCreate();
        assertThat(saved.getId()).isNull();
        assertThat(saved.getParentFolderId()).isEqualTo("self-id");
        verify(folderService, times(1)).findById("self-id");
        System.out.println("[FolderApiServiceImplTest] (c) saved a new folder under parent " + saved.getParentFolderId());
    }

    // ------------------------------------------------------------ existence/org

    @Test
    void checkFolderExist_returnsTheFolder_orFailsWithTheId() {
        Folder existing = folder("f1", ORG, null, "f1", VISITOR);
        when(folderService.findById("f1")).thenReturn(Mono.just(existing));
        when(folderService.findById("f2")).thenReturn(Mono.empty());

        StepVerifier.create(service.checkFolderExist("f1")).expectNext(existing).verifyComplete();
        StepVerifier.create(service.checkFolderExist("f2"))
                .expectErrorSatisfies(throwable -> {
                    assertThat(((BizException) throwable).getError()).isEqualTo(BizError.FOLDER_NOT_EXIST);
                    assertThat(((BizException) throwable).getArgs()).containsExactly("f2");
                })
                .verify();
    }

    @Test
    void checkFolderCurrentOrg_acceptsOnlyTheSameOrg() {
        StepVerifier.create(service.checkFolderCurrentOrg(folder("f1", ORG, null, "n", null), ORG)).verifyComplete();
        expectBizError(service.checkFolderCurrentOrg(folder("f1", OTHER_ORG, null, "n", null), ORG), BizError.FOLDER_NOT_EXIST);
    }

    // ------------------------------------------------------------------- delete

    /** Catches the manage check: org admins and super admins skip the creator lookup, others must be the creator. */
    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "SUPER_ADMIN"})
    void delete_adminsMayDeleteWithoutBeingTheCreator(String role) {
        signedInAs(MemberRole.valueOf(role));
        when(folderService.findByOrganizationId(ORG)).thenReturn(Flux.just(folder("f1", ORG, null, "f1", OTHER_USER)));
        stubDeleteCollaborators();

        StepVerifier.create(service.delete("f1")).assertNext(deleted -> assertThat(deleted.getId()).isEqualTo("f1")).verifyComplete();

        verify(folderService, never()).findById(any());
    }

    @Test
    void delete_creatorMayDelete_otherMembersMayNot() {
        when(folderService.findByOrganizationId(ORG)).thenReturn(Flux.just(folder("f1", ORG, null, "f1", VISITOR), folder("f2", ORG, null, "f2", OTHER_USER)));
        when(folderService.findById("f1")).thenReturn(Mono.just(folder("f1", ORG, null, "f1", VISITOR)));
        when(folderService.findById("f2")).thenReturn(Mono.just(folder("f2", ORG, null, "f2", OTHER_USER)));
        AtomicBoolean deleted = new AtomicBoolean();
        when(folderService.deleteAllById(anyCollection())).thenReturn(flaggedVoid(deleted));
        stubDeleteCollaborators(deleted);

        StepVerifier.create(service.delete("f1")).expectNextCount(1).verifyComplete();
        assertThat(deleted).isTrue();

        deleted.set(false);
        expectBizError(service.delete("f2"), BizError.FOLDER_OPERATE_NO_PERMISSION);
        assertThat(deleted).as("nothing deleted for a non-creator").isFalse();
    }

    /**
     * Pins today's behaviour (no §9 row): a non-admin deleting a folder that does not exist gets an EMPTY result, not
     * a FOLDER_NOT_EXIST error, because the creator lookup is empty; nothing is deleted.
     */
    @Test
    void delete_unknownFolder_asANonAdmin_completesEmpty_withoutDeleting() {
        when(folderService.findById("ghost")).thenReturn(Mono.empty());
        AtomicBoolean deleted = new AtomicBoolean();
        when(folderService.deleteAllById(anyCollection())).thenReturn(flaggedVoid(deleted));

        StepVerifier.create(service.delete("ghost")).verifyComplete();

        assertThat(deleted).isFalse();
        System.out.println("[FolderApiServiceImplTest] delete of an unknown folder by a member completes empty");
    }

    @Test
    void delete_unknownFolderInTheTree_asAnAdmin_failsWithFolderNotExist() {
        signedInAs(MemberRole.ADMIN);
        when(folderService.findByOrganizationId(ORG)).thenReturn(Flux.just(folder("f1", ORG, null, "f1", VISITOR)));
        AtomicBoolean deleted = new AtomicBoolean();
        when(folderService.deleteAllById(anyCollection())).thenReturn(flaggedVoid(deleted));

        expectBizError(service.delete("ghost"), BizError.FOLDER_NOT_EXIST);

        assertThat(deleted).isFalse();
    }

    /** Catches sub folders surviving the delete, or the permissions and element relations of the subtree staying behind. */
    @Test
    void delete_removesTheWholeSubtree_itsPermissions_andItsRelations() {
        signedInAs(MemberRole.ADMIN);
        when(folderService.findByOrganizationId(ORG)).thenReturn(Flux.just(
                folder("top", ORG, null, "top", VISITOR),
                folder("child", ORG, "top", "child", VISITOR),
                folder("grandchild", ORG, "child", "grandchild", VISITOR),
                folder("unrelated", ORG, null, "unrelated", VISITOR)));
        stubDeleteCollaborators();

        StepVerifier.create(service.delete("top")).assertNext(deleted -> assertThat(deleted.getId()).isEqualTo("top")).verifyComplete();

        ArgumentCaptor<java.util.Collection<String>> deleted = ArgumentCaptor.forClass(java.util.Collection.class);
        verify(folderService).deleteAllById(deleted.capture());
        assertThat(deleted.getValue()).containsExactlyInAnyOrder("top", "child", "grandchild");
        ArgumentCaptor<List<String>> relations = ArgumentCaptor.forClass(List.class);
        verify(relationService).deleteByFolderIds(relations.capture());
        assertThat(relations.getValue()).containsExactlyInAnyOrder("top", "child", "grandchild");
        verify(permissionService).removeById("perm-1");
        verify(permissionService).removeById("perm-2");
        System.out.println("[FolderApiServiceImplTest] deleted " + deleted.getValue());
    }

    private void stubDeleteCollaborators() {
        stubDeleteCollaborators(new AtomicBoolean());
        when(folderService.deleteAllById(anyCollection())).thenReturn(Mono.empty());
    }

    private void stubDeleteCollaborators(AtomicBoolean ignored) {
        ResourcePermission p1 = ResourcePermission.builder().id("perm-1").build();
        ResourcePermission p2 = ResourcePermission.builder().id("perm-2").build();
        when(permissionService.getByResourceTypeAndResourceId(eq(ResourceType.FOLDER), anyString())).thenReturn(Mono.just(List.of(p1, p2)));
        when(permissionService.removeById(anyString())).thenReturn(Mono.just(true));
        when(relationService.deleteByFolderIds(anyList())).thenReturn(Mono.just(true));
    }

    // ------------------------------------------------------------------- update

    /** Catches update changing more than the six editable fields (id, org, parent, creator), or ignoring the name check. */
    @Test
    void update_copiesOnlyTheEditableFields_andAllowsKeepingItsOwnName() {
        signedInAs(MemberRole.ADMIN);
        Folder existing = folder("f1", ORG, "p", "own name", VISITOR);
        when(folderService.findById("f1")).thenReturn(Mono.just(existing));
        when(folderService.findByOrganizationId(ORG)).thenReturn(Flux.just(existing, folder("f2", ORG, "p", "sibling", VISITOR)));
        AtomicReference<Folder> sent = new AtomicReference<>();
        when(folderService.updateById(eq("f1"), any(Folder.class))).thenAnswer(invocation -> {
            sent.set(invocation.getArgument(1));
            return Mono.just(true);
        });
        Folder body = request("f1", "elsewhere", "own name");
        body.setOrganizationId(OTHER_ORG);
        body.setTitle("title");
        body.setType("type");
        body.setCategory("category");
        body.setDescription("description");
        body.setImage("image");

        StepVerifier.create(service.update(body)).assertNext(view -> assertThat(view.getName()).isEqualTo("own name")).verifyComplete();

        Folder update = sent.get();
        assertThat(update.getName()).isEqualTo("own name");
        assertThat(update.getTitle()).isEqualTo("title");
        assertThat(update.getType()).isEqualTo("type");
        assertThat(update.getCategory()).isEqualTo("category");
        assertThat(update.getDescription()).isEqualTo("description");
        assertThat(update.getImage()).isEqualTo("image");
        assertThat(update.getId()).isNull();
        assertThat(update.getOrganizationId()).isNull();
        assertThat(update.getParentFolderId()).isNull();
    }

    @Test
    void update_toASiblingsName_isRejected_andNotWrittenWithoutPermission() {
        signedInAs(MemberRole.ADMIN);
        Folder existing = folder("f1", ORG, "p", "own name", VISITOR);
        when(folderService.findById("f1")).thenReturn(Mono.just(existing));
        when(folderService.findByOrganizationId(ORG)).thenReturn(Flux.just(existing, folder("f2", ORG, "p", "sibling", VISITOR)));
        AtomicBoolean written = new AtomicBoolean();
        when(folderService.updateById(eq("f1"), any(Folder.class))).thenReturn(flagged(written, true));

        expectBizError(service.update(request("f1", null, "sibling")), BizError.FOLDER_NAME_CONFLICT);
        assertThat(written).isFalse();

        signedInAs(MemberRole.MEMBER);
        when(folderService.findById("f1")).thenReturn(Mono.just(folder("f1", ORG, "p", "own name", OTHER_USER)));
        expectBizError(service.update(request("f1", null, "fresh")), BizError.FOLDER_OPERATE_NO_PERMISSION);
        assertThat(written).as("a member who is not the creator writes nothing").isFalse();
    }

    // ------------------------------------------------------------- move/bundle

    private Mono<Void> doMove(boolean bundle, String id, String target) {
        return bundle ? service.moveBundle(id, target) : service.move(id, target);
    }

    /** Catches the permission check being skipped or using the wrong action, and relations changing before it passes. */
    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void move_checksTheMatchingPermissionFirst_thenReplacesTheRelation(boolean bundle) {
        ResourceAction action = bundle ? ResourceAction.MANAGE_BUNDLES : ResourceAction.MANAGE_APPLICATIONS;
        AtomicBoolean removed = new AtomicBoolean();
        AtomicBoolean created = new AtomicBoolean();
        when(relationService.deleteByElementId("el")).thenReturn(flagged(removed, true));
        when(relationService.create(anyString(), anyString())).thenReturn(flaggedVoid(created));

        when(permissionService.checkResourcePermissionWithError(VISITOR, "el", action))
                .thenReturn(Mono.error(new BizException(BizError.NOT_AUTHORIZED, "NO_PERMISSION")));
        expectBizError(doMove(bundle, "el", "target"), BizError.NOT_AUTHORIZED);
        assertThat(removed).isFalse();
        assertThat(created).isFalse();

        when(permissionService.checkResourcePermissionWithError(VISITOR, "el", action)).thenReturn(Mono.empty());
        StepVerifier.create(doMove(bundle, "el", "target")).verifyComplete();
        assertThat(removed).isTrue();
        assertThat(created).isTrue();
        verify(relationService).create("target", "el");
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void move_toTheRoot_onlyRemovesTheOldRelation(boolean bundle) {
        when(permissionService.checkResourcePermissionWithError(anyString(), anyString(), any(ResourceAction.class))).thenReturn(Mono.empty());
        when(relationService.deleteByElementId("el")).thenReturn(Mono.just(true));

        StepVerifier.create(doMove(bundle, "el", "  ")).verifyComplete();
        StepVerifier.create(doMove(bundle, "el", null)).verifyComplete();

        verify(relationService, times(2)).deleteByElementId("el");
        verify(relationService, never()).create(any(), any());
    }

    // ----------------------------------------------------------- last view time

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" "})
    void upsertLastViewTime_blankFolder_doesNothing(String folderId) {
        StepVerifier.create(service.upsertLastViewTime(folderId)).verifyComplete();

        verifyNoInteractions(interactionService);
    }

    @Test
    void upsertLastViewTime_recordsNowForTheVisitor() {
        AtomicBoolean subscribed = new AtomicBoolean();
        when(interactionService.upsert(eq(VISITOR), eq("f1"), any(Instant.class))).thenReturn(flaggedVoid(subscribed));
        Instant before = Instant.now();

        StepVerifier.create(service.upsertLastViewTime("f1")).verifyComplete();

        ArgumentCaptor<Instant> time = ArgumentCaptor.forClass(Instant.class);
        verify(interactionService).upsert(eq(VISITOR), eq("f1"), time.capture());
        assertThat(subscribed).isTrue();
        assertThat(time.getValue()).isBetween(before, Instant.now());
    }

    // -------------------------------------------------------------- getElements

    private static ApplicationInfoView app(String id, String name, long lastViewMillis) {
        return ApplicationInfoView.builder().applicationId(id).name(name)
                .lastViewTime(lastViewMillis == 0 ? null : Instant.ofEpochMilli(lastViewMillis)).build();
    }

    private void stubListing(List<Folder> folders, List<ApplicationInfoView> apps, Map<String, String> appToFolder,
                             List<UserFolderInteraction> interactions) {
        when(folderService.findByOrganizationId(ORG)).thenReturn(Flux.fromIterable(folders));
        when(userHomeApiService.getAllAuthorisedApplications4CurrentOrgMember(any(), any(), anyBoolean(), any(), any()))
                .thenReturn(Flux.fromIterable(apps));
        List<FolderElement> relations = new ArrayList<>();
        appToFolder.forEach((app, folder) -> relations.add(new FolderElement(folder, app)));
        when(relationService.getByElementIds(anyList())).thenReturn(Flux.fromIterable(relations));
        when(interactionService.findByUserId(VISITOR)).thenReturn(Flux.fromIterable(interactions));
        when(userService.getByIds(anyCollection())).thenReturn(Mono.just(Map.of(OTHER_USER, user(OTHER_USER), VISITOR, user(VISITOR))));
    }

    private static boolean anyBoolean() {
        return org.mockito.ArgumentMatchers.anyBoolean();
    }

    private List<Object> listing(String folderId, String name) {
        List<?> raw = service.getElements(folderId, null, name, null).collectList().block(java.time.Duration.ofSeconds(10));
        @SuppressWarnings("unchecked") List<Object> out = (List<Object>) raw;
        assertThat(out).isNotNull();
        return out;
    }

    /**
     * Catches the visibility rule (a folder is visible to devs and admins, or when something visible is inside),
     * the manageable rule (admin, super admin or creator), and the placement of applications into their folders.
     */
    @Test
    void getElements_root_marksVisibilityAndManageability_andPlacesApplications() {
        stubListing(
                List.of(folder("f-full", ORG, null, "Alpha", OTHER_USER), folder("f-empty", ORG, null, "Beta", VISITOR)),
                List.of(app("a-root", "zeta", 0), app("a-in", "inside", 0)),
                Map.of("a-in", "f-full"),
                List.of());

        List<Object> root = listing(null, null);

        assertThat(root).hasSize(3);
        FolderInfoView full = (FolderInfoView) root.stream().filter(o -> o instanceof FolderInfoView f && f.getFolderId().equals("f-full")).findFirst().orElseThrow();
        FolderInfoView empty = (FolderInfoView) root.stream().filter(o -> o instanceof FolderInfoView f && f.getFolderId().equals("f-empty")).findFirst().orElseThrow();
        assertThat(full.isVisible()).as("has an application inside").isTrue();
        assertThat(full.isManageable()).as("member, not the creator").isFalse();
        assertThat(full.getSubApplications()).extracting(ApplicationInfoView::getApplicationId).containsExactly("a-in");
        assertThat(empty.isVisible()).as("empty and the visitor is no developer").isFalse();
        assertThat(empty.isManageable())
                .as("the visitor created it, but the rule compares the user id with the creator's NAME (observed defect, pinned)")
                .isFalse();
        assertThat(root).anyMatch(o -> o instanceof ApplicationInfoView a && a.getApplicationId().equals("a-root"));
        System.out.println("[FolderApiServiceImplTest] root listing " + root.size() + " elements");
    }

    /**
     * Pins plan §9 row "getElements' creator rule compares user id with creator name": the creator rule of {@code manageable} compares the visitor's
     * user ID with {@code FolderInfoView.createBy}, which holds the creator's display NAME, so a non-admin creator
     * manages a folder only when the name happens to equal the id.
     */
    @Test
    void getElements_creatorRuleComparesTheUserIdWithTheCreatorsName_pinsTheSection9Row() {
        User sameNameAsId = new User();
        sameNameAsId.setId(VISITOR);
        sameNameAsId.setName(VISITOR);
        stubListing(List.of(folder("f-mine", ORG, null, "Mine", VISITOR)), List.of(), Map.of(), List.of());
        when(userService.getByIds(anyCollection())).thenReturn(Mono.just(Map.of(VISITOR, sameNameAsId)));

        FolderInfoView view = (FolderInfoView) listing(null, null).get(0);

        assertThat(view.getCreateBy()).isEqualTo(VISITOR);
        assertThat(view.isManageable()).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "SUPER_ADMIN"})
    void getElements_forDevsAndAdmins_everyFolderIsVisible_andAdminsManageEverything(String role) {
        signedInAs(MemberRole.valueOf(role));
        when(orgDevChecker.isCurrentOrgDev()).thenReturn(Mono.just(true));
        stubListing(List.of(folder("f-empty", ORG, null, "Beta", OTHER_USER)), List.of(), Map.of(), List.of());

        List<Object> root = listing(null, null);

        FolderInfoView view = (FolderInfoView) root.get(0);
        assertThat(view.isVisible()).isTrue();
        assertThat(view.isManageable()).isTrue();
    }

    /** Catches empty sub folders being listed to a visitor who may not see them: only visible children are listed. */
    @Test
    void getElements_subFolders_listOnlyTheVisibleOnes() {
        stubListing(
                List.of(folder("top", ORG, null, "top", OTHER_USER),
                        folder("with-app", ORG, "top", "with-app", OTHER_USER),
                        folder("empty-child", ORG, "top", "empty-child", OTHER_USER)),
                List.of(app("a-in", "inside", 0)),
                Map.of("a-in", "with-app"),
                List.of());

        FolderInfoView top = (FolderInfoView) listing(null, null).stream()
                .filter(o -> o instanceof FolderInfoView f && f.getFolderId().equals("top")).findFirst().orElseThrow();

        assertThat(top.getSubFolders()).extracting(FolderInfoView::getFolderId).containsExactly("with-app");
        assertThat(top.isVisible()).isTrue();
    }

    /** Catches the sort head: the most recently viewed element comes first (the rest of the order is not asserted). */
    @Test
    void getElements_mostRecentlyViewedComesFirst() {
        stubListing(
                List.of(folder("f-old", ORG, null, "old", OTHER_USER), folder("f-new", ORG, null, "new", OTHER_USER)),
                List.of(app("a1", "app", 0)),
                Map.of(),
                List.of(new UserFolderInteraction(VISITOR, "f-old", Instant.ofEpochMilli(1000)),
                        new UserFolderInteraction(VISITOR, "f-new", Instant.ofEpochMilli(2000))));
        when(orgDevChecker.isCurrentOrgDev()).thenReturn(Mono.just(true));

        List<Object> root = listing(null, null);

        assertThat(((FolderInfoView) root.get(0)).getFolderId()).isEqualTo("f-new");
    }

    @Test
    void getElements_ofAFolder_listsItsChildren_andAnUnknownFolderFails() {
        stubListing(
                List.of(folder("f1", ORG, null, "f1", OTHER_USER), folder("f2", ORG, "f1", "child folder", OTHER_USER)),
                List.of(app("a-in", "inside", 0), app("a-root", "outside", 0)),
                Map.of("a-in", "f1"),
                List.of());
        when(orgDevChecker.isCurrentOrgDev()).thenReturn(Mono.just(true));

        List<Object> children = listing("f1", null);

        assertThat(children).hasSize(2);
        assertThat(children).anyMatch(o -> o instanceof FolderInfoView f && f.getFolderId().equals("f2"));
        assertThat(children).anyMatch(o -> o instanceof ApplicationInfoView a && a.getApplicationId().equals("a-in"));

        expectBizError(service.getElements("ghost", null, null, null), BizError.FOLDER_NOT_EXIST);
    }

    /** Catches the name filter missing a folder's name, type or description (case-insensitive). */
    @Test
    void getElements_nameFilter_matchesFolderNameTypeOrDescription() {
        Folder byName = folder("f-name", ORG, null, "Quarterly", OTHER_USER);
        Folder byType = folder("f-type", ORG, null, "x1", OTHER_USER);
        byType.setType("quarter-type");
        Folder byDescription = folder("f-desc", ORG, null, "x2", OTHER_USER);
        byDescription.setDescription("about QUARTER");
        Folder none = folder("f-none", ORG, null, "unrelated", OTHER_USER);
        stubListing(List.of(byName, byType, byDescription, none), List.of(), Map.of(), List.of());

        List<Object> root = listing(null, "quarter");

        assertThat(root).extracting(o -> ((FolderInfoView) o).getFolderId()).containsExactlyInAnyOrder("f-name", "f-type", "f-desc");
    }

    // -------------------------------------------------------------- permissions

    @Test
    void grantPermission_withoutUsersAndGroups_isANoOp() {
        StepVerifier.create(service.grantPermission("f1", Set.of(), null, ResourceRole.VIEWER)).verifyComplete();

        verifyNoInteractions(sessionUserService, permissionService);
    }

    @Test
    void grantPermission_requiresManagePermissionAndAnExistingFolder() {
        AtomicBoolean inserted = new AtomicBoolean();
        when(permissionService.insertBatchPermission(any(), anyString(), any(), any(), any())).thenReturn(flaggedVoid(inserted));
        when(folderService.findById("f1")).thenReturn(Mono.just(folder("f1", ORG, null, "f1", OTHER_USER)));

        expectBizError(service.grantPermission("f1", Set.of("u2"), Set.of(), ResourceRole.VIEWER), BizError.FOLDER_OPERATE_NO_PERMISSION);
        assertThat(inserted).isFalse();

        signedInAs(MemberRole.ADMIN);
        when(folderService.findById("ghost")).thenReturn(Mono.empty());
        expectBizError(service.grantPermission("ghost", Set.of("u2"), Set.of(), ResourceRole.VIEWER), BizError.FOLDER_NOT_EXIST);
        assertThat(inserted).isFalse();

        StepVerifier.create(service.grantPermission("f1", Set.of("u2"), Set.of("g1"), ResourceRole.EDITOR)).verifyComplete();
        assertThat(inserted).isTrue();
        verify(permissionService).insertBatchPermission(ResourceType.FOLDER, "f1", Set.of("u2"), Set.of("g1"), ResourceRole.EDITOR);
    }

    /** Catches a permission id of another resource being accepted: it must be rejected before any mutation. */
    @Test
    void updateAndRemovePermission_rejectUnknownAndForeignPermissionIds_beforeMutating() {
        signedInAs(MemberRole.ADMIN);
        AtomicBoolean updated = new AtomicBoolean();
        AtomicBoolean removed = new AtomicBoolean();
        when(permissionService.updateRoleById(anyString(), any())).thenReturn(flagged(updated, true));
        when(permissionService.removeById(anyString())).thenReturn(flagged(removed, true));
        when(permissionService.getById("p-missing")).thenReturn(Mono.empty());
        when(permissionService.getById("p-foreign")).thenReturn(Mono.just(ResourcePermission.builder().id("p-foreign").resourceId("other-folder").build()));
        when(permissionService.getById("p-own")).thenReturn(Mono.just(ResourcePermission.builder().id("p-own").resourceId("f1").build()));

        for (boolean remove : new boolean[]{false, true}) {
            Mono<Void> missing = remove ? service.removePermission("f1", "p-missing") : service.updatePermission("f1", "p-missing", ResourceRole.VIEWER);
            StepVerifier.create(missing).expectErrorSatisfies(t -> {
                assertThat(((BizException) t).getError()).isEqualTo(BizError.ILLEGAL_FOLDER_PERMISSION_ID);
                assertThat(((BizException) t).getMessageKey()).isEqualTo("PERMISSION_NOT_EXIST");
            }).verify();
            Mono<Void> foreign = remove ? service.removePermission("f1", "p-foreign") : service.updatePermission("f1", "p-foreign", ResourceRole.VIEWER);
            StepVerifier.create(foreign).expectErrorSatisfies(t -> {
                assertThat(((BizException) t).getError()).isEqualTo(BizError.ILLEGAL_FOLDER_PERMISSION_ID);
                assertThat(((BizException) t).getMessageKey()).isEqualTo("NO_PERMISSION_TO_OPERATE_FOLDER");
            }).verify();
        }
        assertThat(updated).isFalse();
        assertThat(removed).isFalse();

        StepVerifier.create(service.updatePermission("f1", "p-own", ResourceRole.EDITOR)).verifyComplete();
        assertThat(updated).isTrue();
        StepVerifier.create(service.removePermission("f1", "p-own")).verifyComplete();
        assertThat(removed).isTrue();
        verify(permissionService).updateRoleById("p-own", ResourceRole.EDITOR);
    }

    @Test
    void updateAndRemovePermission_requireManagePermission() {
        when(folderService.findById("f1")).thenReturn(Mono.just(folder("f1", ORG, null, "f1", OTHER_USER)));
        AtomicBoolean mutated = new AtomicBoolean();
        when(permissionService.getById("p")).thenReturn(Mono.just(ResourcePermission.builder().id("p").resourceId("f1").build()));
        when(permissionService.updateRoleById(anyString(), any())).thenReturn(flagged(mutated, true));
        when(permissionService.removeById(anyString())).thenReturn(flagged(mutated, true));

        expectBizError(service.updatePermission("f1", "p", ResourceRole.VIEWER), BizError.FOLDER_OPERATE_NO_PERMISSION);
        expectBizError(service.removePermission("f1", "p"), BizError.FOLDER_OPERATE_NO_PERMISSION);

        assertThat(mutated).isFalse();
    }

    @Test
    void getPermissions_assemblesTheViewFromTheFolderItsPermissionsAndTheOrg() {
        when(folderService.findById("f1")).thenReturn(Mono.just(folder("f1", ORG, null, "f1", OTHER_USER)));
        when(folderService.findById("ghost")).thenReturn(Mono.empty());
        when(permissionService.getByResourceTypeAndResourceId(ResourceType.FOLDER, "f1")).thenReturn(Mono.just(List.of()));
        PermissionItemView groupItem = mock(PermissionItemView.class);
        PermissionItemView userItem = mock(PermissionItemView.class);
        when(permissionHelper.getGroupPermissions(anyList())).thenReturn(Mono.just(List.of(groupItem)));
        when(permissionHelper.getUserPermissions(anyList())).thenReturn(Mono.just(List.of(userItem)));
        Organization organization = new Organization();
        organization.setName("Acme");
        when(organizationService.getById(ORG)).thenReturn(Mono.just(organization));

        StepVerifier.create(service.getPermissions("f1")).assertNext(view -> {
            assertThat(view.getCreatorId()).isEqualTo(OTHER_USER);
            assertThat(view.getOrgName()).isEqualTo("Acme");
            assertThat(view.getGroupPermissions()).containsExactly(groupItem);
            assertThat(view.getUserPermissions()).containsExactly(userItem);
        }).verifyComplete();
        when(permissionService.getByResourceTypeAndResourceId(ResourceType.FOLDER, "ghost")).thenReturn(Mono.just(List.of()));
        StepVerifier.create(service.getPermissions("ghost")).verifyComplete();
    }

    // ------------------------------------------------------------ view building

    @Test
    void buildFolderInfoView_mapsTheFolder_andToleratesAMissingCreationTime() {
        Folder folder = folder("f1", ORG, "p", "name", OTHER_USER);
        folder.setGid("gid-1");
        folder.setDescription("d");
        folder.setCategory("c");
        folder.setType("t");
        folder.setImage("i");

        StepVerifier.create(service.buildFolderInfoView(folder, true, false)).assertNext(view -> {
            assertThat(view.getFolderId()).isEqualTo("f1");
            assertThat(view.getFolderGid()).isEqualTo("gid-1");
            assertThat(view.getParentFolderId()).isEqualTo("p");
            assertThat(view.getOrgId()).isEqualTo(ORG);
            assertThat(view.getDescription()).isEqualTo("d");
            assertThat(view.getCategory()).isEqualTo("c");
            assertThat(view.getType()).isEqualTo("t");
            assertThat(view.getImage()).isEqualTo("i");
            assertThat(view.getCreateAt()).isEqualTo(CREATED.toEpochMilli());
            assertThat(view.getCreateBy()).isEqualTo("name of " + OTHER_USER);
            assertThat(view.isVisible()).isTrue();
            assertThat(view.isManageable()).isFalse();
        }).verifyComplete();

        folder.setCreatedAt(null);
        StepVerifier.create(service.buildFolderInfoView(folder, false, true)).assertNext(view -> {
            assertThat(view.getCreateAt()).isZero();
            assertThat(view.isVisible()).isFalse();
            assertThat(view.isManageable()).isTrue();
        }).verifyComplete();
    }

    /**
     * Pins today's behaviour (no §9 row): when the creator user cannot be found the view Mono is EMPTY. After a real
     * {@code create} this cannot happen, because the creator is the caller; it is reachable for folders stored with
     * another creator id (for example one replaced through the client-id path), which {@code getElements} never builds
     * through this method.
     */
    @Test
    void buildFolderInfoView_withAMissingCreatorUser_completesEmpty() {
        when(userService.findById("ghost-user")).thenReturn(Mono.empty());

        StepVerifier.create(service.buildFolderInfoView(folder("f1", ORG, null, "n", "ghost-user"), true, true)).verifyComplete();
        System.out.println("[FolderApiServiceImplTest] missing creator user -> empty view");
    }
}
