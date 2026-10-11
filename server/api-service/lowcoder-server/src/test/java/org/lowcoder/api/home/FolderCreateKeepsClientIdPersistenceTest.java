package org.lowcoder.api.home;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.service.FolderService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.test.context.ActiveProfiles;

import reactor.test.StepVerifier;

/**
 * Real-persistence reproduction (Spring + MongoDB container) of plan §9 row "FolderApiServiceImpl.create keeps a
 * client-supplied id ... overwrites that folder (with the caller's org id)": {@code POST} body = the {@code Folder}
 * entity, {@code create} never looks at an id it is given, and {@code FolderServiceImpl.create} is
 * {@code repository.save}, a replace by {@code _id}.
 *
 * <p>The three cases: (a) the id of a folder of the caller's org, (b) the id of ANOTHER org's folder, (c) id equal to
 * {@code parentFolderId}. For (c) only the creation of the self-parented data is shown; what listing and deletion do
 * with it is pinned by the domain tests of the folder {@code Tree} (L3-8) and is not repeated here.
 * Observed on top of the row: the replaced document has no {@code createdAt} (a replace of a non-new entity does not set
 * it), which {@code getElements} would hit as a NullPointerException when building {@code createAt}; that is not exercised here.
 *
 * <p>Pinned under D-6: a fix (rejecting an existing id, or ignoring a client id) makes these tests fail on purpose.
 *
 * <p>Isolation: the profile {@code folderCreateClientId} is this class's own (its own context and database); the seed
 * data is loaded by {@code InitData} (not profile-specific) and read only; every folder written here has a generated
 * unique id or name and is deleted again in {@code @AfterAll}; seed folders are never touched.
 */
@SpringBootTest
@ActiveProfiles("folderCreateClientId")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class FolderCreateKeepsClientIdPersistenceTest {

    private static final String CALLER_ORG = "org01";
    private static final Duration WAIT = Duration.ofSeconds(30);

    @Autowired
    private FolderApiService folderApiService;
    @Autowired
    private FolderService folderService;
    @Autowired
    private InitData initData;

    private final String run = UUID.randomUUID().toString();
    private final List<String> createdIds = new ArrayList<>();

    @BeforeAll
    void beforeAll() {
        initData.init();
    }

    /**
     * Deletes the folders this test wrote right after it: a client-id create leaves a folder WITHOUT gid, the unique
     * index on gid is not sparse, and a second gid-less folder in the same database fails with a duplicate key (see
     * {@link #create_withAClientSuppliedId_whileAGidlessFolderExists_failsWithDuplicateKey_pinsClientIdRow}).
     */
    @AfterEach
    void cleanUp() {
        if (!createdIds.isEmpty()) {
            folderService.deleteAllById(createdIds).block(WAIT);
        }
        System.out.println("[FolderCreateKeepsClientIdPersistenceTest] deleted own folders " + createdIds);
        createdIds.clear();
    }

    private Folder body(String id, String parent, String name) {
        Folder folder = new Folder();
        folder.setId(id);
        folder.setParentFolderId(parent);
        folder.setName(name + "-" + run);
        return folder;
    }

    private FolderInfoView createViaApi(Folder body) {
        FolderInfoView view = folderApiService.create(body).block(WAIT);
        assertThat(view).isNotNull();
        if (!createdIds.contains(view.getFolderId())) {
            createdIds.add(view.getFolderId());
        }
        return view;
    }

    /** (a) A create carrying the id of an existing folder of the caller's org replaces that folder. */
    @Test
    @WithMockUser
    void create_withTheIdOfAnExistingFolder_replacesIt_pinsClientIdRow() {
        FolderInfoView original = createViaApi(body(null, null, "victim-a"));
        Folder before = folderService.findById(original.getFolderId()).block(WAIT);
        assertThat(before.getGid()).isNotNull();

        FolderInfoView replaced = createViaApi(body(original.getFolderId(), null, "overwritten-a"));

        assertThat(replaced.getFolderId()).isEqualTo(original.getFolderId());
        Folder after = folderService.findById(original.getFolderId()).block(WAIT);
        System.out.println("[FolderCreateKeepsClientIdPersistenceTest] (a) before " + before.getName() + " gid " + before.getGid()
                + " | after " + after.getName() + " gid " + after.getGid() + " createdAt " + after.getCreatedAt());
        assertThat(after.getName()).isEqualTo("overwritten-a-" + run);
        assertThat(after.getGid()).as("the replacing entity had no gid").isNull();
        assertThat(after.getOrganizationId()).isEqualTo(CALLER_ORG);
        assertThat(folderService.findByOrganizationId(CALLER_ORG).filter(f -> original.getFolderId().equals(f.getId())).count().block(WAIT))
                .as("still one document with that id").isEqualTo(1L);
    }

    /** (a) with the same name and parent the unique-name check rejects it (accidental protection) and nothing changes. */
    @Test
    @WithMockUser
    void create_withTheIdNameAndParentOfAnExistingFolder_isRejected_pinsClientIdRow() {
        FolderInfoView original = createViaApi(body(null, null, "victim-same"));
        Folder same = body(original.getFolderId(), null, "victim-same");

        StepVerifier.create(folderApiService.create(same))
                .expectErrorSatisfies(error -> assertThat(((BizException) error).getError()).isEqualTo(BizError.FOLDER_NAME_CONFLICT))
                .verify(WAIT);

        Folder after = folderService.findById(original.getFolderId()).block(WAIT);
        assertThat(after.getName()).isEqualTo("victim-same-" + run);
        assertThat(after.getGid()).isNotNull();
    }

    /** (b) A create carrying the id of ANOTHER org's folder takes that folder over, stamped with the caller's org. */
    @Test
    @WithMockUser
    void create_withAnotherOrgsFolderId_takesItOver_pinsClientIdRow() {
        String foreignOrg = "org-foreign-" + run;
        String foreignId = "foreignfolder" + run.replace("-", ""); // an id with a dash would be looked up as a gid
        Folder foreign = new Folder();
        foreign.setId(foreignId);
        foreign.setOrganizationId(foreignOrg);
        foreign.setCreatedBy("foreign-user");
        foreign.setGid(UUID.randomUUID().toString());
        foreign.setName("foreign-name-" + run);
        folderService.create(foreign).block(WAIT);
        createdIds.add(foreignId);
        assertThat(folderService.findByOrganizationId(foreignOrg).map(Folder::getId).collectList().block(WAIT)).containsExactly(foreignId);

        FolderInfoView result = createViaApi(body(foreignId, null, "taken-over"));

        assertThat(result.getFolderId()).isEqualTo(foreignId);
        Folder after = folderService.findById(foreignId).block(WAIT);
        System.out.println("[FolderCreateKeepsClientIdPersistenceTest] (b) foreign folder now org " + after.getOrganizationId()
                + " creator " + after.getCreatedBy() + " name " + after.getName());
        assertThat(after.getOrganizationId()).isEqualTo(CALLER_ORG);
        assertThat(after.getCreatedBy()).isEqualTo("user01");
        assertThat(after.getName()).isEqualTo("taken-over-" + run);
        assertThat(folderService.findByOrganizationId(foreignOrg).collectList().block(WAIT)).as("gone from the foreign org").isEmpty();
    }

    /**
     * Observed on top of the row, pinned with it: the replacing entity has no gid and the unique index on gid is not
     * sparse, so while one gid-less folder exists, any further create with a client id fails with a duplicate key
     * error (an unhandled DuplicateKeyException) instead of replacing or being rejected cleanly.
     */
    @Test
    @WithMockUser
    void create_withAClientSuppliedId_whileAGidlessFolderExists_failsWithDuplicateKey_pinsClientIdRow() {
        String firstId = createViaApi(body(null, null, "first")).getFolderId();
        String secondId = createViaApi(body(null, null, "second")).getFolderId();
        createViaApi(body(firstId, null, "first-replaced"));

        StepVerifier.create(folderApiService.create(body(secondId, null, "second-replaced")))
                .expectError(DuplicateKeyException.class)
                .verify(WAIT);

        Folder second = folderService.findById(secondId).block(WAIT);
        System.out.println("[FolderCreateKeepsClientIdPersistenceTest] second client-id create failed with a duplicate key, " + second.getName() + " unchanged");
        assertThat(second.getName()).isEqualTo("second-" + run);
    }

    /** (c) id equal to parentFolderId: create stores a folder that is its own parent. Only the stored data is shown. */
    @Test
    @WithMockUser
    void create_withIdEqualToParentFolderId_storesASelfParentedFolder_pinsClientIdRow() {
        FolderInfoView original = createViaApi(body(null, null, "victim-c"));
        String id = original.getFolderId();

        FolderInfoView looped = createViaApi(body(id, id, "loop-c"));

        assertThat(looped.getParentFolderId()).isEqualTo(id);
        Folder after = folderService.findById(id).block(WAIT);
        System.out.println("[FolderCreateKeepsClientIdPersistenceTest] (c) stored folder " + after.getId() + " parent " + after.getParentFolderId());
        assertThat(after.getParentFolderId()).isEqualTo(after.getId());
    }
}
