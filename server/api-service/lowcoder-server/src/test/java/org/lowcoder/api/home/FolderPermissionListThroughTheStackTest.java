package org.lowcoder.api.home;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;

import java.lang.reflect.Constructor;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.permission.PermissionHelper;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.repository.FolderRepository;
import org.lowcoder.domain.folder.service.FolderElementRelationService;
import org.lowcoder.domain.folder.service.FolderService;
import org.lowcoder.domain.folder.service.FolderServiceImpl;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.exception.BizError;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * {@code GET /api/folders/{folderId}/permissions} through the real controller, {@code GidService}, {@link
 * FolderApiServiceImpl} and {@link FolderServiceImpl} (D-8): a member of the folder's workspace reads the list, by
 * object id and by gid; a non-member gets NOT_AUTHORIZED, with none of the permission rows, the group or user view or
 * the organization read; an unknown object id still answers NO_RESOURCE_FOUND, unchanged. The unknown-gid answer
 * (FOLDER_NOT_EXIST before this method ever runs, BF-158) stays pinned by {@link FolderUnknownGidOperationsProbeTest}.
 * Wiring follows {@link FolderUnknownGidOperationsProbeTest#wire()}.
 */
class FolderPermissionListThroughTheStackTest {

    private static final String TAG = "[FolderPermissionListThroughTheStackTest] ";
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String FOREIGN_ORG = "org-of-the-folder";
    private static final String VISITOR = "visitor-id";
    private static final String CREATOR = "creator-user-id";
    private static final String KNOWN_ID = "65a1b2c3d4e5f60718293a0f";
    private static final String KNOWN_GID = "0190aaaa-bbbb-7ccc-8ddd-eeeeeeeeeeee";
    private static final String UNKNOWN_ID = "65a1b2c3d4e5f60718293aff";

    private org.lowcoder.api.contract.support.ContractTestClient client;
    private FolderApiServiceImpl folderApiService;
    private FolderService folderService;
    private FolderRepository folderRepository;
    private ResourcePermissionService permissions;
    private SessionUserService session;
    private PermissionHelper helper;
    private org.lowcoder.domain.organization.service.OrganizationService organizations;
    private OrgMemberService orgMembers;

    @BeforeEach
    void wire() {
        org.lowcoder.api.contract.support.ContractTestClient.Builder builder = org.lowcoder.api.contract.support.ContractTestClient.builder();
        folderRepository = Mockito.mock(FolderRepository.class);
        Folder folder = new Folder();
        ReflectionTestUtils.setField(folder, "id", KNOWN_ID);
        folder.setOrganizationId(FOREIGN_ORG);
        folder.setCreatedBy(CREATOR);
        folder.setGid(KNOWN_GID);
        Mockito.when(folderRepository.findById(KNOWN_ID)).thenReturn(Mono.just(folder));
        Mockito.when(folderRepository.findByGid(KNOWN_GID)).thenReturn(Flux.just(folder));
        Mockito.when(folderRepository.findByGid(Mockito.argThat(gid -> gid == null || !gid.equals(KNOWN_GID)))).thenReturn(Flux.empty());
        Mockito.when(folderRepository.findById(UNKNOWN_ID)).thenReturn(Mono.empty());
        GidService gidService = new GidService();
        ReflectionTestUtils.setField(gidService, "folderRepository", folderRepository);
        builder.singleton("gidService", gidService);
        folderService = new FolderServiceImpl(folderRepository, Mockito.mock(MongoUpsertHelper.class));
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
        helper = builder.mock(PermissionHelper.class);
        organizations = builder.mock(org.lowcoder.domain.organization.service.OrganizationService.class);
        orgMembers = builder.mock(OrgMemberService.class);
        builder.mock(BusinessEventPublisher.class);
        builder.mock(FolderElementRelationService.class);

        builder.visitor(VISITOR, Mockito.mock(OrgMember.class));
        Mockito.when(permissions.getByResourceTypeAndResourceId(any(), any())).thenReturn(Mono.just(List.<ResourcePermission>of()));
        Mockito.when(helper.getGroupPermissions(any())).thenReturn(Mono.just(List.of()));
        Mockito.when(helper.getUserPermissions(any())).thenReturn(Mono.just(List.of()));
        Organization foreign = new Organization();
        foreign.setName("Foreign");
        Mockito.when(organizations.getById(FOREIGN_ORG)).thenReturn(Mono.just(foreign));

        builder.controller(FolderController.class);
        builder.mock(org.lowcoder.api.application.ApplicationApiService.class);
        client = builder.build();
        System.out.println(TAG + "wired: real controller, GidService, FolderApiServiceImpl and FolderServiceImpl");
    }

    @AfterEach
    void close() {
        client.close();
    }

    /** Guards the wiring: the stubs the observations depend on are the objects the service and the controller use. */
    @Test
    void theWiringReachedTheCollaboratorsTheTestsRelyOn() {
        assertSame(orgMembers, ReflectionTestUtils.getField(folderApiService, "orgMemberService"));
        assertSame(permissions, ReflectionTestUtils.getField(folderApiService, "resourcePermissionService"));
        assertSame(session, ReflectionTestUtils.getField(folderApiService, "sessionUserService"));
        assertSame(helper, ReflectionTestUtils.getField(folderApiService, "permissionHelper"));
        assertSame(organizations, ReflectionTestUtils.getField(folderApiService, "organizationService"));
        assertTrue(ReflectionTestUtils.getField(folderApiService, "folderService") instanceof FolderServiceImpl);
        System.out.println(TAG + "wiring reached orgMembers, permissions, session, helper, organizations and the real folder service");
    }

    private record Outcome(int status, int code) {
    }

    private Outcome call(String label, String path) {
        var spec = client.web().method(org.springframework.http.HttpMethod.GET).uri(path);
        EntityExchangeResult<byte[]> result = spec.exchange().expectBody().returnResult();
        try {
            JsonNode json = JSON.readTree(result.getResponseBody());
            Outcome outcome = new Outcome(result.getStatus().value(), json.get("code").asInt());
            System.out.println(TAG + label + " -> " + outcome + " " + json);
            return outcome;
        } catch (java.io.IOException e) {
            throw new IllegalStateException("response is not JSON", e);
        }
    }

    private String permissionsPath(String folderKey) {
        return NewUrl.FOLDER_URL + "/" + folderKey + "/permissions";
    }

    private String body(String folderKey) {
        return new String(client.web().method(org.springframework.http.HttpMethod.GET).uri(permissionsPath(folderKey))
                .exchange().expectBody().returnResult().getResponseBody());
    }

    /** D-8, positive control: a member of the folder's workspace reads the list, by object id and by gid. */
    @Test
    void aMemberOfTheFolderWorkspaceReadsTheListByObjectIdAndByGidD8() {
        Mockito.when(orgMembers.getOrgMember(FOREIGN_ORG, VISITOR))
                .thenReturn(Mono.just(OrgMember.builder().orgId(FOREIGN_ORG).userId(VISITOR).role(org.lowcoder.domain.organization.model.MemberRole.MEMBER).build()));

        for (String key : List.of(KNOWN_ID, KNOWN_GID)) {
            Outcome outcome = call("member by " + key, permissionsPath(key));
            assertEquals(new Outcome(200, ResponseView.SUCCESS), outcome);
            String json = body(key);
            assertTrue(json.contains(CREATOR), "body carries the creator id");
        }
        System.out.println(TAG + "a member of the folder workspace reads the list by object id and by gid");
    }

    /** D-8 itself: a non-member of the folder's workspace is refused, and nothing of the list is read. */
    @Test
    void aNonMemberGetsNotAuthorizedByObjectIdAndByGidAndNoRowIsReadD8() {
        Mockito.when(orgMembers.getOrgMember(FOREIGN_ORG, VISITOR)).thenReturn(Mono.empty());

        for (String key : List.of(KNOWN_ID, KNOWN_GID)) {
            Outcome outcome = call("non-member by " + key, permissionsPath(key));
            assertEquals(new Outcome(BizError.NOT_AUTHORIZED.getHttpErrorCode(), BizError.NOT_AUTHORIZED.getBizErrorCode()), outcome);
            String json = body(key);
            assertFalse(json.contains(CREATOR), "the creator id does not leak");
            assertFalse(json.contains("Foreign"), "the workspace name does not leak");
        }
        Mockito.verify(permissions, Mockito.never()).getByResourceTypeAndResourceId(any(), any());
        Mockito.verify(helper, Mockito.never()).getGroupPermissions(any());
        Mockito.verify(helper, Mockito.never()).getUserPermissions(any());
        Mockito.verify(organizations, Mockito.never()).getById(any());
        System.out.println(TAG + "a non-member is refused by object id and by gid, and nothing of the list is read");
    }

    /** An unknown object id still answers NO_RESOURCE_FOUND, unchanged by this phase. */
    @Test
    void anUnknownObjectIdStillAnswersNoResourceFoundD8() {
        Outcome outcome = call("unknown object id", permissionsPath(UNKNOWN_ID));

        assertEquals(new Outcome(BizError.NO_RESOURCE_FOUND.getHttpErrorCode(), BizError.NO_RESOURCE_FOUND.getBizErrorCode()), outcome);
        Mockito.verify(orgMembers, Mockito.never()).getOrgMember(any(), any());
        Mockito.verify(permissions, Mockito.never()).getByResourceTypeAndResourceId(any(), any());
        System.out.println(TAG + "an unknown object id still answers NO_RESOURCE_FOUND; the membership check never runs");
    }
}
