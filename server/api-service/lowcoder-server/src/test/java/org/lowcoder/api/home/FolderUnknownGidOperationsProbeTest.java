package org.lowcoder.api.home;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.repository.FolderRepository;
import org.lowcoder.domain.permission.model.ResourceRole;
import reactor.test.publisher.PublisherProbe;
import org.lowcoder.domain.folder.service.FolderElementRelationService;
import org.lowcoder.domain.folder.service.FolderService;
import org.lowcoder.domain.folder.service.FolderServiceImpl;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.constants.Authentication;
import org.lowcoder.sdk.exception.BizError;
import org.mockito.Mockito;
import org.springframework.http.HttpMethod;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.lang.reflect.Constructor;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;

/**
 * Task L1-13b item 3 (lane L5): what the folder endpoints do with a folder gid that no folder has: delete
 * ({@code FolderController.java:51-52}), grant ({@code :137-138}), update permission ({@code :115-116}), remove permission
 * ({@code :124-125}) and get permissions ({@code :144-145}). The converter answers {@code Optional.empty()} for an unknown gid and each
 * of these passes {@code null} on ({@code objectId.orElse(null)}); this class records what {@link FolderApiServiceImpl} does with the
 * {@code null}, as an org admin and as an ordinary member.
 *
 * <p>These are observations, not pins of a defect: nothing here is named a plan row. Real: controller, {@code GidService},
 * {@code FolderApiServiceImpl}, {@code FolderServiceImpl} (whose {@code findById(null)} is a parameter error,
 * {@code FolderServiceImpl.java:38-41}). Mocks: the repositories, the permission, session and event services. The admin differs
 * from the member in {@code checkManagePermission} ({@code FolderApiServiceImpl.java:361-372}): the member goes through
 * {@code isCreator(null)}, whose {@code findById(null)} answers the parameter error before any permission lookup runs.
 *
 * <p>Limits: a real Mongo repository is not used, so what Spring Data does with a null id is not exercised; here the null never
 * reaches it because {@code FolderServiceImpl.findById} rejects it. The permission and organization services are stubs that answer
 * what the test sets.
 */
public class FolderUnknownGidOperationsProbeTest {

    static final String TAG = "[FolderUnknownGidOperationsProbeTest] ";
    static final String UNKNOWN_FOLDER_GID = "unknown-folder-gid";
    static final String PERMISSION_ID = "permission-id";
    static final String OTHER_FOLDER_ID = "other-folder-object-id";
    static final String ORG_ID = "org-id";
    static final String FIRST_FOLDER_ID = "65a1b2c3d4e5f60718293a01";
    static final String SECOND_FOLDER_ID = "65a1b2c3d4e5f60718293a02";
    static final String USER_ID = "user-id";
    static final String ROLE_VALUE = "viewer";
    static final String FOLDERS = NewUrl.FOLDER_URL + "/";
    static final ObjectMapper JSON = new ObjectMapper();

    /** The HTTP status and the {@code code} of the envelope. */
    record Outcome(int status, int code) {
    }

    private org.lowcoder.api.contract.support.ContractTestClient client;
    private FolderApiServiceImpl folderApiService;
    private ResourcePermissionService permissions;
    private SessionUserService session;
    private OrgMember orgMember;
    private FolderRepository folderRepository;
    private FolderElementRelationService relations;
    private PublisherProbe<Void> deleteFoldersProbe;
    private PublisherProbe<Boolean> deleteRelationsProbe;
    /** {@code updateRoleById} and {@code removeById} are called while the pipeline is assembled, so only a subscription is a write. */
    private PublisherProbe<Boolean> updateRoleProbe;
    private PublisherProbe<Boolean> removePermissionProbe;

    @BeforeEach
    void wire() {
        org.lowcoder.api.contract.support.ContractTestClient.Builder builder = org.lowcoder.api.contract.support.ContractTestClient.builder();
        folderRepository = Mockito.mock(FolderRepository.class);
        Mockito.when(folderRepository.findByGid(anyString())).thenReturn(Flux.empty());
        GidService gidService = new GidService();
        ReflectionTestUtils.setField(gidService, "folderRepository", folderRepository);
        builder.singleton("gidService", gidService);
        FolderService folderService = new FolderServiceImpl(folderRepository, Mockito.mock(MongoUpsertHelper.class));
        builder.singleton("folderService", folderService);

        Constructor<?> widest = Arrays.stream(FolderApiServiceImpl.class.getDeclaredConstructors())
                .max(Comparator.comparingInt(Constructor::getParameterCount)).orElseThrow();
        Object[] collaborators = Arrays.stream(widest.getParameterTypes())
                .map(type -> type == FolderService.class ? folderService : builder.mock(type)).toArray();
        try {
            folderApiService = (FolderApiServiceImpl) widest.newInstance(collaborators);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("cannot build FolderApiServiceImpl", e);
        }
        builder.singleton("folderApiService", folderApiService);
        permissions = builder.mock(ResourcePermissionService.class);
        session = builder.mock(SessionUserService.class);
        builder.mock(BusinessEventPublisher.class);
        relations = builder.mock(FolderElementRelationService.class);
        orgMember = Mockito.mock(OrgMember.class);
        Mockito.when(orgMember.getOrgId()).thenReturn(ORG_ID);
        Mockito.when(session.getVisitorOrgMemberCache()).thenReturn(Mono.just(orgMember));
        Mockito.when(permissions.getById(PERMISSION_ID)).thenReturn(Mono.empty());
        updateRoleProbe = PublisherProbe.of(Mono.just(true));
        removePermissionProbe = PublisherProbe.of(Mono.just(true));
        Mockito.when(permissions.updateRoleById(any(), any())).thenReturn(updateRoleProbe.mono());
        Mockito.when(permissions.removeById(any())).thenReturn(removePermissionProbe.mono());
        Mockito.when(permissions.insertBatchPermission(any(), any(), any(), any(), any())).thenReturn(Mono.empty());
        Mockito.when(permissions.getByResourceTypeAndResourceId(any(), any())).thenReturn(Mono.just(List.of()));

        // the organization has two folders, so that a delete that reached them would show
        Mockito.when(folderRepository.findByOrganizationId(ORG_ID)).thenReturn(Flux.just(folder(FIRST_FOLDER_ID), folder(SECOND_FOLDER_ID)));
        deleteFoldersProbe = PublisherProbe.empty();
        deleteRelationsProbe = PublisherProbe.of(Mono.just(true));
        Mockito.when(folderRepository.deleteAllById(anyCollection())).thenReturn(deleteFoldersProbe.mono());
        Mockito.when(relations.deleteByFolderIds(any())).thenReturn(deleteRelationsProbe.mono());

        builder.controller(FolderController.class);
        builder.mock(org.lowcoder.api.application.ApplicationApiService.class);
        client = builder.build();
        System.out.println(TAG + "wired: real controller, GidService, FolderApiServiceImpl and FolderServiceImpl; folder gid "
                + UNKNOWN_FOLDER_GID + " is in no repository");
    }

    @AfterEach
    void close() {
        client.close();
    }

    private static Folder folder(String id) {
        Folder folder = new Folder();
        folder.setOrganizationId(ORG_ID);
        ReflectionTestUtils.setField(folder, "id", id);
        return folder;
    }

    private void asRole(boolean admin) {
        Mockito.when(orgMember.isAdmin()).thenReturn(admin);
        Mockito.when(orgMember.isSuperAdmin()).thenReturn(false);
    }

    private void permissionExists() {
        ResourcePermission permission = ResourcePermission.builder().id(PERMISSION_ID).resourceId(OTHER_FOLDER_ID).build();
        Mockito.when(permissions.getById(PERMISSION_ID)).thenReturn(Mono.just(permission));
    }

    private Outcome call(String label, HttpMethod method, String path, Object body) {
        var spec = client.web().method(method).uri(path);
        EntityExchangeResult<byte[]> result = (body == null ? spec.exchange()
                : spec.bodyValue(body).exchange()).expectBody().returnResult();
        try {
            JsonNode json = JSON.readTree(result.getResponseBody());
            Outcome outcome = new Outcome(result.getStatus().value(), json.get("code").asInt());
            System.out.println(TAG + label + " -> " + outcome + " " + json);
            return outcome;
        } catch (java.io.IOException e) {
            throw new IllegalStateException("response is not JSON", e);
        }
    }

    private String path(String suffix) {
        return FOLDERS + UNKNOWN_FOLDER_GID + suffix;
    }

    private String permissionPath() {
        return path("/permissions/" + PERMISSION_ID);
    }

    private void assertOutcome(Outcome outcome, int status, BizError error) {
        assertEquals(new Outcome(status, error.getBizErrorCode()), outcome);
    }

    private static final int HTTP_OK = 200;
    private static final int HTTP_INTERNAL_SERVER_ERROR = 500;
    private static final int SUCCESS_CODE = 1;

    /** Guards the wiring: the stubs the observations depend on are the objects the service and the controller use. */
    @Test
    void theWiringReachedTheCollaboratorsTheObservationsRelyOn() {
        assertSame(permissions, ReflectionTestUtils.getField(folderApiService, "resourcePermissionService"));
        assertSame(relations, ReflectionTestUtils.getField(folderApiService, "folderElementRelationService"));
        assertSame(session, ReflectionTestUtils.getField(folderApiService, "sessionUserService"));
        assertTrue(ReflectionTestUtils.getField(folderApiService, "folderService") instanceof FolderServiceImpl);
        assertSame(folderApiService, client.bean(FolderApiService.class));
        System.out.println(TAG + "wiring reached permissions, relations, session service and the real folder service");
    }

    /**
     * Delete, admin: {@code Tree.get(null)} returns the tree itself for a blank id ({@code Tree.java:73-78}), so the lookup at
     * {@code FolderApiServiceImpl.java:147} finds a node and does not answer FOLDER_NOT_EXIST. The root has no folder of its own, so
     * {@code thenReturn(folderNode.getSelf())} (line 159) is {@code Mono.just(null)}, which throws an NPE while the lambda
     * runs; the deletion Monos assembled just before it are never subscribed. The client sees the generic 500. Nothing is deleted.
     */
    @Test
    void adminDeleteOfAnUnknownGidIsAnInternalServerErrorAndDeletesNothing() {
        asRole(true);

        assertOutcome(call("admin delete", HttpMethod.DELETE, path(""), null), HTTP_INTERNAL_SERVER_ERROR, BizError.INTERNAL_SERVER_ERROR);

        deleteFoldersProbe.assertWasNotSubscribed();
        deleteRelationsProbe.assertWasNotSubscribed();
        removePermissionProbe.assertWasNotSubscribed();
        Mockito.verify(folderRepository).findByOrganizationId(ORG_ID);
        StepVerifier.create(folderApiService.delete(null)).expectErrorSatisfies(error -> {
            System.out.println(TAG + "delete error " + error.getClass().getName() + ": " + error.getMessage()
                    + (error.getStackTrace().length > 0 ? " at " + error.getStackTrace()[0] : " (no stack trace)"));
            assertTrue(error instanceof NullPointerException, "NullPointerException expected, was " + error);
        }).verify();
        deleteFoldersProbe.assertWasNotSubscribed();
    }

    /** Delete, member: {@code isCreator(null)} calls {@code findById(null)}, which is a parameter error naming id. */
    @Test
    void memberDeleteOfAnUnknownGidIsAParameterError() {
        asRole(false);

        assertOutcome(call("member delete", HttpMethod.DELETE, path(""), null), HTTP_INTERNAL_SERVER_ERROR, BizError.INVALID_PARAMETER);

        deleteFoldersProbe.assertWasNotSubscribed();
    }

    /** Grant with users, admin: {@code checkFolderExist(null)} ends in the parameter error; no permission is inserted. */
    @Test
    void adminGrantOfAnUnknownGidIsAParameterErrorAndInsertsNothing() {
        asRole(true);

        assertOutcome(call("admin grant", HttpMethod.POST, path("/permissions"), grantRequest(Set.of(USER_ID))),
                HTTP_INTERNAL_SERVER_ERROR, BizError.INVALID_PARAMETER);

        Mockito.verify(permissions, Mockito.never()).insertBatchPermission(any(), any(), any(), any(), any());
    }

    /** Grant with users, member: the parameter error, from {@code isCreator(null)}. */
    @Test
    void memberGrantOfAnUnknownGidIsAParameterError() {
        asRole(false);

        assertOutcome(call("member grant", HttpMethod.POST, path("/permissions"), grantRequest(Set.of(USER_ID))),
                HTTP_INTERNAL_SERVER_ERROR, BizError.INVALID_PARAMETER);

        Mockito.verify(permissions, Mockito.never()).insertBatchPermission(any(), any(), any(), any(), any());
    }

    /**
     * Grant without any user or group, either role: {@code FolderApiServiceImpl.java:380-382} returns before any check, so the
     * answer is a success even though the folder does not exist and the member is no creator. Nothing is written.
     */
    @Test
    void grantWithoutUsersOrGroupsIsASuccessForAdminAndMemberAlike() {
        for (boolean admin : new boolean[]{true, false}) {
            asRole(admin);
            Outcome outcome = call((admin ? "admin" : "member") + " grant none", HttpMethod.POST, path("/permissions"), grantRequest(Set.of()));
            assertEquals(new Outcome(HTTP_OK, SUCCESS_CODE), outcome);
        }
        Mockito.verify(permissions, Mockito.never()).insertBatchPermission(any(), any(), any(), any(), any());
    }

    /** Update and remove permission, admin, permission not found: {@code PERMISSION_NOT_EXIST} (code 6304); the folder is never looked at. */
    @Test
    void adminUpdateAndRemoveOfAnAbsentPermissionAreIllegalPermissionIdErrors() {
        asRole(true);

        assertOutcome(call("admin update absent", HttpMethod.PUT, permissionPath(), new FolderEndpoints.UpdatePermissionRequest(ROLE_VALUE)),
                HTTP_INTERNAL_SERVER_ERROR, BizError.ILLEGAL_FOLDER_PERMISSION_ID);
        assertOutcome(call("admin remove absent", HttpMethod.DELETE, permissionPath(), null),
                HTTP_INTERNAL_SERVER_ERROR, BizError.ILLEGAL_FOLDER_PERMISSION_ID);
        updateRoleProbe.assertWasNotSubscribed();
        removePermissionProbe.assertWasNotSubscribed();
    }

    /**
     * Update and remove permission, admin, permission found: {@code checkPermissionResource} evaluates
     * {@code folderId.equals(resourcePermission.getResourceId())} with {@code folderId == null}
     * ({@code FolderApiServiceImpl.java:409}); the client sees the generic 500 (code 5000). The permission is neither changed nor removed.
     * The NPE is checked on the service itself by its type only: a JVM that has run the code hot throws a preallocated NPE without
     * message or stack trace (OmitStackTraceInFastThrow), so neither is asserted; the location is shown by the fix mutation
     * ({@code Objects.equals}) in evidence/L1-13b.mutations.py, which changes the outcome.
     */
    @Test
    void adminUpdateAndRemoveOfAFoundPermissionThrowANullPointerExceptionAtTheFolderIdEquals() {
        asRole(true);
        permissionExists();

        assertOutcome(call("admin update present", HttpMethod.PUT, permissionPath(), new FolderEndpoints.UpdatePermissionRequest(ROLE_VALUE)),
                HTTP_INTERNAL_SERVER_ERROR, BizError.INTERNAL_SERVER_ERROR);
        assertOutcome(call("admin remove present", HttpMethod.DELETE, permissionPath(), null),
                HTTP_INTERNAL_SERVER_ERROR, BizError.INTERNAL_SERVER_ERROR);

        List<Mono<Void>> operations = List.of(
                folderApiService.updatePermission(null, PERMISSION_ID, ResourceRole.VIEWER),
                folderApiService.removePermission(null, PERMISSION_ID));
        for (Mono<Void> operation : operations) {
            StepVerifier.create(operation).expectErrorSatisfies(error -> {
                System.out.println(TAG + "service error " + error.getClass().getName() + ": " + error.getMessage()
                        + (error.getStackTrace().length > 0 ? " at " + error.getStackTrace()[0] : " (no stack trace)"));
                assertTrue(error instanceof NullPointerException, "NullPointerException expected, was " + error);
            }).verify();
        }
        updateRoleProbe.assertWasNotSubscribed();
        removePermissionProbe.assertWasNotSubscribed();
    }

    /** Update and remove permission, member, either permission state: the parameter error from {@code isCreator(null)}, before the permission lookup. */
    @Test
    void memberUpdateAndRemoveAreParameterErrorsWhetherOrNotThePermissionExists() {
        asRole(false);
        for (boolean exists : new boolean[]{false, true}) {
            if (exists) {
                permissionExists();
            }
            String state = exists ? " present" : " absent";
            assertOutcome(call("member update" + state, HttpMethod.PUT, permissionPath(), new FolderEndpoints.UpdatePermissionRequest(ROLE_VALUE)),
                    HTTP_INTERNAL_SERVER_ERROR, BizError.INVALID_PARAMETER);
            assertOutcome(call("member remove" + state, HttpMethod.DELETE, permissionPath(), null),
                    HTTP_INTERNAL_SERVER_ERROR, BizError.INVALID_PARAMETER);
        }
        updateRoleProbe.assertWasNotSubscribed();
        removePermissionProbe.assertWasNotSubscribed();
    }

    /** Get permissions: no manage check; {@code findById(null)} is the parameter error for admin and member alike. */
    @Test
    void getPermissionsOfAnUnknownGidIsAParameterErrorForAdminAndMemberAlike() {
        for (boolean admin : new boolean[]{true, false}) {
            asRole(admin);
            assertOutcome(call((admin ? "admin" : "member") + " get", HttpMethod.GET, path("/permissions"), null),
                    HTTP_INTERNAL_SERVER_ERROR, BizError.INVALID_PARAMETER);
        }
    }

    private static FolderEndpoints.BatchAddPermissionRequest grantRequest(Set<String> userIds) {
        return new FolderEndpoints.BatchAddPermissionRequest(ROLE_VALUE, userIds, Set.of());
    }
}
