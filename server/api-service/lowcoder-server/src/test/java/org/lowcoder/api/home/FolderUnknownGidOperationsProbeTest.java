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
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
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
 * Task L1-13b item 3 (lane L5), fixed as BF-158 and BF-159: what the folder endpoints do with a folder gid that no folder has:
 * delete ({@code FolderController.java:51-52}), grant ({@code :137-138}), update permission ({@code :115-116}), remove permission
 * ({@code :124-125}) and get permissions ({@code :144-145}). The converter used to answer {@code Optional.empty()} for an unknown
 * gid and each of these passed {@code null} on: an admin's delete took the whole folder tree as its target (only an NPE at
 * {@code getSelf()} stopped it), and an admin's permission update or remove threw an NPE at {@code folderId.equals}. The converter
 * now answers {@code FOLDER_NOT_EXIST} before any of them runs; the service also refuses a blank delete id and compares the
 * permission's folder null-safely, so a direct call with {@code null} is an error too, not an NPE.
 *
 * <p>Real: controller, {@code GidService}, {@code FolderApiServiceImpl}, {@code FolderServiceImpl}. Mocks: the repositories, the
 * permission, session and event services.
 *
 * <p>Limits: a real Mongo repository is not used, so what Spring Data does with a null id is not exercised. The permission and
 * organization services are stubs that answer what the test sets.
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

    private static final int HTTP_INTERNAL_SERVER_ERROR = 500;

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
     * BF-158, BF-159: every folder endpoint refuses a gid that no folder has with FOLDER_NOT_EXIST (HTTP 500, code 6302), for an
     * admin and for a member, whether or not the permission of the path exists: no folder tree is built, nothing is deleted,
     * no permission is inserted, changed or removed. A grant without users or groups, which returned a success before any check,
     * is refused too.
     */
    @Test
    void everyFolderEndpointRefusesAnUnknownGidWithFolderNotExistAndWritesNothingBF158() {
        for (boolean admin : new boolean[]{true, false}) {
            for (boolean permissionExists : new boolean[]{false, true}) {
                asRole(admin);
                if (permissionExists) {
                    permissionExists();
                }
                String who = (admin ? "admin" : "member") + (permissionExists ? " permission present " : " permission absent ");
                assertOutcome(call(who + "delete", HttpMethod.DELETE, path(""), null), HTTP_INTERNAL_SERVER_ERROR, BizError.FOLDER_NOT_EXIST);
                assertOutcome(call(who + "grant", HttpMethod.POST, path("/permissions"), grantRequest(Set.of(USER_ID))),
                        HTTP_INTERNAL_SERVER_ERROR, BizError.FOLDER_NOT_EXIST);
                assertOutcome(call(who + "grant none", HttpMethod.POST, path("/permissions"), grantRequest(Set.of())),
                        HTTP_INTERNAL_SERVER_ERROR, BizError.FOLDER_NOT_EXIST);
                assertOutcome(call(who + "update", HttpMethod.PUT, permissionPath(), new FolderEndpoints.UpdatePermissionRequest(ROLE_VALUE)),
                        HTTP_INTERNAL_SERVER_ERROR, BizError.FOLDER_NOT_EXIST);
                assertOutcome(call(who + "remove", HttpMethod.DELETE, permissionPath(), null), HTTP_INTERNAL_SERVER_ERROR, BizError.FOLDER_NOT_EXIST);
                assertOutcome(call(who + "get", HttpMethod.GET, path("/permissions"), null), HTTP_INTERNAL_SERVER_ERROR, BizError.FOLDER_NOT_EXIST);
            }
        }
        Mockito.verify(folderRepository, Mockito.never()).findByOrganizationId(any());
        deleteFoldersProbe.assertWasNotSubscribed();
        deleteRelationsProbe.assertWasNotSubscribed();
        updateRoleProbe.assertWasNotSubscribed();
        removePermissionProbe.assertWasNotSubscribed();
        Mockito.verify(permissions, Mockito.never()).insertBatchPermission(any(), any(), any(), any(), any());
        Mockito.verify(permissions, Mockito.never()).getById(any());
    }

    /**
     * BF-158: a blank folder id names the root of the tree ({@code Tree.get}), so {@code delete} refuses it before anything runs,
     * with the parameter error {@code findById(null)} also gives; the organization's folders are not even read.
     */
    @Test
    void deleteOfABlankIdIsAParameterErrorBeforeTheTreeIsBuiltBF158() {
        asRole(true);
        for (String blank : Arrays.asList(null, "", "  ")) {
            StepVerifier.create(folderApiService.delete(blank)).expectErrorSatisfies(error -> {
                System.out.println(TAG + "delete '" + blank + "' -> " + error);
                assertTrue(error instanceof BizException, "BizException expected, was " + error);
                assertEquals(BizError.INVALID_PARAMETER, ((BizException) error).getError());
            }).verify();
        }
        Mockito.verify(folderRepository, Mockito.never()).findByOrganizationId(any());
        deleteFoldersProbe.assertWasNotSubscribed();
        deleteRelationsProbe.assertWasNotSubscribed();
    }

    /**
     * BF-159: an admin's permission update or remove with a null folder id, for an existing permission of another folder, is
     * refused as a permission of another folder (ILLEGAL_FOLDER_PERMISSION_ID) instead of a NullPointerException at
     * {@code folderId.equals}; nothing is changed or removed.
     */
    @Test
    void updateAndRemovePermissionWithANullFolderIdAreRefusedWithoutANullPointerExceptionBF159() {
        asRole(true);
        permissionExists();

        List<Mono<Void>> operations = List.of(
                folderApiService.updatePermission(null, PERMISSION_ID, ResourceRole.VIEWER),
                folderApiService.removePermission(null, PERMISSION_ID));
        for (Mono<Void> operation : operations) {
            StepVerifier.create(operation).expectErrorSatisfies(error -> {
                System.out.println(TAG + "service error " + error);
                assertTrue(error instanceof BizException, "BizException expected, was " + error);
                assertEquals(BizError.ILLEGAL_FOLDER_PERMISSION_ID, ((BizException) error).getError());
            }).verify();
        }
        updateRoleProbe.assertWasNotSubscribed();
        removePermissionProbe.assertWasNotSubscribed();
    }

    private static FolderEndpoints.BatchAddPermissionRequest grantRequest(Set<String> userIds) {
        return new FolderEndpoints.BatchAddPermissionRequest(ROLE_VALUE, userIds, Set.of());
    }
}
