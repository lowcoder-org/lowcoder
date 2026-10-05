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
import org.springframework.test.context.ActiveProfiles;

import reactor.test.StepVerifier;

/**
 * Real persistence (Spring + MongoDB container) of BF-004, the plan §9 row "FolderApiServiceImpl.create keeps a
 * client-supplied id ... overwrites that folder (with the caller's org id)" these tests pinned: {@code POST} body = the
 * {@code Folder} entity and {@code FolderServiceImpl.create} is {@code repository.save}, a replace by {@code _id} when the
 * entity has one. Fixed: {@code create} drops a client id and always generates the gid, so every create inserts a new
 * folder and the folder with that id is left as it was.
 *
 * <p>The three cases: (a) the id of a folder of the caller's org, (b) the id of ANOTHER org's folder, (c) id equal to
 * {@code parentFolderId}; and the gid-less duplicate key the replacing entity used to cause.
 *
 * <p>Isolation: the profile {@code folderCreateClientId} is this class's own (its own context and database); the seed
 * data is loaded by {@code InitData} (not profile-specific) and read only; every folder written here has a generated
 * unique id or name and is deleted again in {@code @AfterAll}; seed folders are never touched.
 */
@SpringBootTest
@ActiveProfiles("folderCreateClientId")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class FolderCreateIgnoresClientIdPersistenceTest {

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

    /** Deletes the folders this test wrote right after it, so the shared seed data is left as it was. */
    @AfterEach
    void cleanUp() {
        if (!createdIds.isEmpty()) {
            folderService.deleteAllById(createdIds).block(WAIT);
        }
        System.out.println("[FolderCreateIgnoresClientIdPersistenceTest] deleted own folders " + createdIds);
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

    /** (a) A create carrying the id of an existing folder of the caller's org makes a new folder; that one is unchanged. */
    @Test
    @WithMockUser
    void create_withTheIdOfAnExistingFolder_createsANewFolder_andLeavesThatOneUnchanged() {
        FolderInfoView original = createViaApi(body(null, null, "victim-a"));
        Folder before = folderService.findById(original.getFolderId()).block(WAIT);
        assertThat(before.getGid()).isNotNull();

        FolderInfoView created = createViaApi(body(original.getFolderId(), null, "overwritten-a"));

        Folder after = folderService.findById(original.getFolderId()).block(WAIT);
        Folder fresh = folderService.findById(created.getFolderId()).block(WAIT);
        System.out.println("[FolderCreateIgnoresClientIdPersistenceTest] (a) existing " + after.getName() + " gid " + after.getGid()
                + " | new " + fresh.getId() + " " + fresh.getName() + " gid " + fresh.getGid() + " createdAt " + fresh.getCreatedAt());
        assertThat(created.getFolderId()).as("a new id").isNotEqualTo(original.getFolderId());
        assertThat(after.getName()).isEqualTo("victim-a-" + run);
        assertThat(after.getGid()).isEqualTo(before.getGid());
        assertThat(fresh.getName()).isEqualTo("overwritten-a-" + run);
        assertThat(fresh.getGid()).isNotBlank();
        assertThat(fresh.getCreatedAt()).as("inserted, so auditing set it").isNotNull();
    }

    /** (a) with the same name and parent the unique-name check rejects it, and nothing changes. */
    @Test
    @WithMockUser
    void create_withTheIdNameAndParentOfAnExistingFolder_isRejectedByTheNameCheck() {
        FolderInfoView original = createViaApi(body(null, null, "victim-same"));
        Folder same = body(original.getFolderId(), null, "victim-same");

        StepVerifier.create(folderApiService.create(same))
                .expectErrorSatisfies(error -> assertThat(((BizException) error).getError()).isEqualTo(BizError.FOLDER_NAME_CONFLICT))
                .verify(WAIT);

        Folder after = folderService.findById(original.getFolderId()).block(WAIT);
        assertThat(after.getName()).isEqualTo("victim-same-" + run);
        assertThat(after.getGid()).isNotNull();
    }

    /** (b) A create carrying the id of ANOTHER org's folder makes a new folder of the caller's org; the other one is untouched. */
    @Test
    @WithMockUser
    void create_withAnotherOrgsFolderId_leavesThatFolderAlone() {
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

        Folder after = folderService.findById(foreignId).block(WAIT);
        Folder fresh = folderService.findById(result.getFolderId()).block(WAIT);
        System.out.println("[FolderCreateIgnoresClientIdPersistenceTest] (b) foreign folder org " + after.getOrganizationId()
                + " creator " + after.getCreatedBy() + " name " + after.getName() + " | new folder " + fresh.getId() + " org " + fresh.getOrganizationId());
        assertThat(result.getFolderId()).isNotEqualTo(foreignId);
        assertThat(after.getOrganizationId()).isEqualTo(foreignOrg);
        assertThat(after.getCreatedBy()).isEqualTo("foreign-user");
        assertThat(after.getName()).isEqualTo("foreign-name-" + run);
        assertThat(fresh.getOrganizationId()).isEqualTo(CALLER_ORG);
        assertThat(fresh.getCreatedBy()).isEqualTo("user01");
        assertThat(folderService.findByOrganizationId(foreignOrg).map(Folder::getId).collectList().block(WAIT))
                .as("still in the foreign org").containsExactly(foreignId);
    }

    /**
     * The side effect the old behaviour had: a replacing entity without gid, and a non-sparse unique index on gid, made a
     * second client-id create fail with an unhandled DuplicateKeyException. Every create now has a gid, so repeated
     * client-id creates each make a new folder and the folders named by those ids stay as they were.
     */
    @Test
    @WithMockUser
    void create_withClientSuppliedIds_repeatedly_eachMakesANewFolderWithAGid() {
        String firstId = createViaApi(body(null, null, "first")).getFolderId();
        String secondId = createViaApi(body(null, null, "second")).getFolderId();

        Folder firstNew = folderService.findById(createViaApi(body(firstId, null, "first-replaced")).getFolderId()).block(WAIT);
        Folder secondNew = folderService.findById(createViaApi(body(secondId, null, "second-replaced")).getFolderId()).block(WAIT);

        System.out.println("[FolderCreateIgnoresClientIdPersistenceTest] repeated client-id creates: new gids " + firstNew.getGid() + ", " + secondNew.getGid());
        assertThat(firstNew.getGid()).isNotBlank();
        assertThat(secondNew.getGid()).isNotBlank().isNotEqualTo(firstNew.getGid());
        assertThat(folderService.findById(firstId).block(WAIT).getName()).isEqualTo("first-" + run);
        assertThat(folderService.findById(secondId).block(WAIT).getName()).isEqualTo("second-" + run);
    }

    /** (c) id equal to parentFolderId: create stores a new child of that folder, never a folder that is its own parent. */
    @Test
    @WithMockUser
    void create_withIdEqualToParentFolderId_storesANewChildOfThatFolder() {
        FolderInfoView original = createViaApi(body(null, null, "victim-c"));
        String id = original.getFolderId();

        FolderInfoView child = createViaApi(body(id, id, "loop-c"));

        Folder stored = folderService.findById(child.getFolderId()).block(WAIT);
        Folder parent = folderService.findById(id).block(WAIT);
        System.out.println("[FolderCreateIgnoresClientIdPersistenceTest] (c) new folder " + stored.getId() + " parent " + stored.getParentFolderId()
                + "; folder " + parent.getId() + " parent " + parent.getParentFolderId());
        assertThat(stored.getId()).isNotEqualTo(id);
        assertThat(stored.getParentFolderId()).isEqualTo(id);
        assertThat(parent.getParentFolderId()).as("the named folder is not made its own parent").isNull();
    }
}
