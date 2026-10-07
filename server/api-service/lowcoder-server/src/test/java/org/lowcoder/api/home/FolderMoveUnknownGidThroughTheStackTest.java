package org.lowcoder.api.home;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.application.ApplicationApiService;
import org.lowcoder.api.contract.support.ApplicationSamples;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.repository.FolderRepository;
import org.lowcoder.domain.folder.service.FolderElementRelationService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.plugin.api.event.LowcoderEvent.EventType;
import org.lowcoder.domain.folder.model.FolderElement;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.reflect.Constructor;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Task L1-13b (lane L5): {@code PUT /folders/move/{id}?targetFolderId=} with a folder gid that no folder has, through the real
 * {@link FolderController}, the real {@link GidService} and the real {@link FolderApiServiceImpl}, over the production codecs and
 * exception handling of {@link ContractTestClient}; only the repositories and services behind them are mocks.
 *
 * <p>BF-152 (fixed; was pinned as plan section 9 row "folder move to an unknown gid"): {@code GidService.convertFolderIdToObjectId}
 * answered {@code Optional.empty()} for an unknown gid, which the controller passed on as {@code null}, the root folder: the
 * application was taken out of its folder, the audit event recorded a move to nothing, and the client got a success. The converter
 * now answers {@code FOLDER_NOT_EXIST} for it ({@code GidService.java:96-102}), before the move runs
 * ({@code FolderController.java:99-102}).
 *
 * <p>Limits: the repositories and the permission, session and event services are mocks; what the real queries match and what the
 * real events store is not under test. The id sent is a gid because {@code FieldName.isGID} is true for any text with a hyphen.
 */
public class FolderMoveUnknownGidThroughTheStackTest {

    static final String TAG = "[FolderMoveUnknownGidThroughTheStackTest] ";
    static final String APPLICATION_ID = "application-object-id";
    static final String FROM_FOLDER_ID = "from-folder-object-id";
    static final String UNKNOWN_FOLDER_GID = "unknown-folder-gid";
    static final String KNOWN_FOLDER_GID = "known-folder-gid";
    static final String KNOWN_FOLDER_OBJECT_ID = "known-folder-object-id";
    /** No hyphen, so {@code FieldName.isGID} is false. */
    static final String PLAIN_OBJECT_ID = "65a1b2c3d4e5f60718293a4b";
    static final String MOVE_URL = NewUrl.FOLDER_URL + "/move/" + APPLICATION_ID;
    static final String TARGET_PARAMETER = "targetFolderId";
    static final int SUCCESS_CODE = 1;
    static final ObjectMapper JSON = new ObjectMapper();


    private ContractTestClient client;
    private FolderApiServiceImpl folderApiService;
    private FolderElementRelationService relations;
    private ResourcePermissionService permissions;
    private BusinessEventPublisher events;
    private FolderRepository folderRepository;

    @BeforeEach
    void wire() {
        ContractTestClient.Builder builder = ContractTestClient.builder();
        folderRepository = Mockito.mock(FolderRepository.class);
        Mockito.when(folderRepository.findByGid(anyString())).thenReturn(Flux.empty());
        GidService gidService = new GidService();
        ReflectionTestUtils.setField(gidService, "folderRepository", folderRepository);
        builder.singleton("gidService", gidService);

        // the real service: a mock for every parameter of its widest constructor, registered with the harness so that the
        // controller and the service share them
        Constructor<?> widest = Arrays.stream(FolderApiServiceImpl.class.getDeclaredConstructors())
                .max(Comparator.comparingInt(Constructor::getParameterCount)).orElseThrow();
        Object[] collaborators = Arrays.stream(widest.getParameterTypes()).map(builder::mock).toArray();
        try {
            folderApiService = (FolderApiServiceImpl) widest.newInstance(collaborators);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("cannot build FolderApiServiceImpl", e);
        }
        builder.singleton("folderApiService", folderApiService);

        relations = builder.mock(FolderElementRelationService.class);
        permissions = builder.mock(ResourcePermissionService.class);
        events = builder.mock(BusinessEventPublisher.class);
        ApplicationApiService applicationApiService = builder.mock(ApplicationApiService.class);
        Mockito.when(permissions.checkResourcePermissionWithError(anyString(), anyString(), any(ResourceAction.class)))
                .thenReturn(Mono.empty());
        Mockito.when(relations.getByElementIds(List.of(APPLICATION_ID)))
                .thenReturn(Flux.just(new FolderElement(FROM_FOLDER_ID, APPLICATION_ID)));
        Mockito.when(relations.deleteByElementId(APPLICATION_ID)).thenReturn(Mono.just(true));
        Mockito.when(relations.create(anyString(), anyString())).thenReturn(Mono.empty());
        Mockito.when(applicationApiService.getEditingApplication(APPLICATION_ID, true))
                .thenReturn(Mono.just(ApplicationSamples.applicationView()));
        Mockito.when(events.publishApplicationCommonEvent(any(), any(), any(), any(), any())).thenReturn(Mono.empty());

        builder.controller(FolderController.class);
        // the controller's FolderService is the one mock left that the controller needs and no test stubs
        builder.mock(org.lowcoder.domain.folder.service.FolderService.class);
        client = builder.build();
        System.out.println(TAG + "wired: real FolderController, GidService and FolderApiServiceImpl; mocks behind them");
    }

    @AfterEach
    void close() {
        client.close();
    }

    private JsonNode put(String targetFolderId, HttpStatus expectedStatus) {
        EntityExchangeResult<byte[]> result = client.web().put()
                .uri(uri -> {
                    uri.path(MOVE_URL);
                    if (targetFolderId != null) {
                        uri.queryParam(TARGET_PARAMETER, targetFolderId);
                    }
                    return uri.build();
                })
                .exchange().expectStatus().isEqualTo(expectedStatus)
                .expectBody().returnResult();
        try {
            JsonNode body = JSON.readTree(result.getResponseBody());
            System.out.println(TAG + "PUT " + MOVE_URL + " " + TARGET_PARAMETER + "=" + targetFolderId + " -> "
                    + result.getStatus() + " " + body);
            return body;
        } catch (java.io.IOException e) {
            throw new IllegalStateException("response is not JSON", e);
        }
    }

    /** Guards the wiring: the three collaborators the assertions rely on are the objects the test stubs and verifies. */
    @Test
    void theConstructorWiringReachedTheCollaboratorsTheTestsRelyOn() {
        assertSame(relations, ReflectionTestUtils.getField(folderApiService, "folderElementRelationService"));
        assertSame(permissions, ReflectionTestUtils.getField(folderApiService, "resourcePermissionService"));
        assertNotNull(ReflectionTestUtils.getField(folderApiService, "sessionUserService"));
        assertSame(relations, client.bean(FolderElementRelationService.class));
        assertSame(events, client.bean(BusinessEventPublisher.class));
        assertSame(folderApiService, client.bean(FolderApiService.class));
        assertSame(folderRepository, ReflectionTestUtils.getField(client.bean(GidService.class), "folderRepository"));
        System.out.println(TAG + "wiring reached relations, permissions, session service, events, gid service repository");
    }

    /**
     * BF-152: a move to a folder gid that no folder has is refused with FOLDER_NOT_EXIST (HTTP 500, code 6302, the status
     * {@code BizError.FOLDER_NOT_EXIST} carries); the application keeps its folder relation, no relation is created and no move
     * event is published. The permission check is not reached either, since the target is converted first.
     */
    @Test
    void moveToAnUnknownFolderGidIsRefusedAndKeepsTheApplicationInItsFolderBF152() {
        JsonNode body = put(UNKNOWN_FOLDER_GID, HttpStatus.valueOf(BizError.FOLDER_NOT_EXIST.getHttpErrorCode()));

        assertEquals(BizError.FOLDER_NOT_EXIST.getBizErrorCode(), body.get("code").asInt());
        verify(folderRepository).findByGid(UNKNOWN_FOLDER_GID);
        verify(relations, never()).deleteByElementId(any());
        verify(relations, never()).create(any(), any());
        verify(permissions, never()).checkResourcePermissionWithError(any(), any(), any());
        verify(events, never()).publishApplicationCommonEvent(any(), any(), any(), any(), any());
    }

    /** Control: a known gid is converted to its object id and the relation is created there. */
    @Test
    void moveToAKnownFolderGidCreatesTheRelationInThatFolder() {
        Folder folder = new Folder();
        ReflectionTestUtils.setField(folder, "id", KNOWN_FOLDER_OBJECT_ID);
        Mockito.when(folderRepository.findByGid(KNOWN_FOLDER_GID)).thenReturn(Flux.just(folder));

        JsonNode body = put(KNOWN_FOLDER_GID, HttpStatus.OK);

        assertEquals(SUCCESS_CODE, body.get("code").asInt());
        verify(relations).deleteByElementId(APPLICATION_ID);
        verify(relations).create(KNOWN_FOLDER_OBJECT_ID, APPLICATION_ID);
        verify(events).publishApplicationCommonEvent(any(), eq(APPLICATION_ID), eq(FROM_FOLDER_ID), eq(KNOWN_FOLDER_OBJECT_ID),
                eq(EventType.APPLICATION_MOVE));
    }

    /** Control: a target without a hyphen is no gid and is used as sent. */
    @Test
    void moveToAnObjectIdUsesItAsSent() {
        put(PLAIN_OBJECT_ID, HttpStatus.OK);

        verify(folderRepository, never()).findByGid(any());
        verify(relations).create(PLAIN_OBJECT_ID, APPLICATION_ID);
    }

    /** Control: no target at all is the documented way to move to the root, and still works. */
    @Test
    void moveWithoutATargetLandsInTheRootFolder() {
        JsonNode body = put(null, HttpStatus.OK);

        assertEquals(SUCCESS_CODE, body.get("code").asInt());
        verify(relations).deleteByElementId(APPLICATION_ID);
        verify(relations, never()).create(any(), any());
        verify(events).publishApplicationCommonEvent(any(), eq(APPLICATION_ID), eq(FROM_FOLDER_ID), eq(null),
                eq(EventType.APPLICATION_MOVE));
    }
}
