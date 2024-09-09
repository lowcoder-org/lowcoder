package org.lowcoder.api.service;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.api.home.FolderApiService;
import org.lowcoder.api.permission.view.PermissionItemView;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.service.FolderService;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.sdk.constants.FieldName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
//@RunWith(SpringRunner.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class FolderApiServiceTest {

    @Autowired
    private FolderApiService folderApiService;
    @Autowired
    private FolderService folderService;
    @Autowired
    private InitData initData;

    @BeforeAll
    public void beforeAll() {
        initData.init();
    }

    @Test
    @WithMockUser
    public void create() {
        Folder folder = new Folder();
        folder.setParentFolderId(null);
        folder.setName("root");
        StepVerifier.create(folderApiService.create(folder))
                .assertNext(f -> {
                    assertNotNull(f.getFolderId());
                    assertTrue(FieldName.isGID(f.getFolderGid()));
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser
    public void delete() {

        String id = "folder03";

        StepVerifier.create(folderService.exist(id))
                .expectNext(true)
                .verifyComplete();

        StepVerifier.create(folderApiService.delete(id))
                .assertNext(folder -> Assertions.assertEquals(id, folder.getId()))
                .verifyComplete();

        StepVerifier.create(folderService.exist(id))
                .expectNext(false)
                .verifyComplete();
    }

    @Test
    @WithMockUser
    public void checkExistingByGid() {

        String id = "01905d61-5c7e-788a-b650-82c983f04968";
        String id2 = "01905d61-5c7e-788a-b650-82c983f04969";

        StepVerifier.create(folderService.exist(id))
                .expectNext(true)
                .verifyComplete();

        StepVerifier.create(folderService.exist(id2))
                .expectNext(false)
                .verifyComplete();
    }

    @Test
    @WithMockUser
    public void update() {
        String id = "folder02";

        StepVerifier.create(folderService.findById(id))
                .assertNext(folder -> Assertions.assertEquals("folder02", folder.getName()))
                .verifyComplete();

        Folder newFolder = new Folder();
        newFolder.setId(id);
        newFolder.setName("test_update");
        StepVerifier.create(folderApiService.update(newFolder))
                .assertNext(Assertions::assertNotNull)
                .verifyComplete();

        StepVerifier.create(folderService.findById(id))
                .assertNext(folder -> Assertions.assertEquals("test_update", folder.getName()))
                .verifyComplete();
    }

    @Test
    @WithMockUser
    public void updateByGid() {
        String id = "019053a3-f968-7a57-91fd-36f50d43713c";

        Folder newFolder = new Folder();
        newFolder.setId(id);
        newFolder.setName("test_update");
        StepVerifier.create(folderApiService.update(newFolder))
                .assertNext(Assertions::assertNotNull)
                .verifyComplete();

        StepVerifier.create(folderService.findById(id))
                .assertNext(folder -> Assertions.assertEquals("test_update", folder.getName()))
                .verifyComplete();
    }

    @Test
    @WithMockUser
    public void move() {

        Mono<? extends List<?>> mono = folderApiService.move("app01", "folder02")
                .then(folderApiService.getElements("folder02", null).collectList());

        StepVerifier.create(mono)
                .assertNext(list -> {
                    Assertions.assertEquals(1, list.size());
                    ApplicationInfoView applicationInfoView = (ApplicationInfoView) list.get(0);
                    Assertions.assertEquals("app01", applicationInfoView.getApplicationId());
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser
    public void grantPermission() {

        Mono<ApplicationPermissionView> mono =
                folderApiService.grantPermission("folder02", Set.of("user02"), Set.of("group01"), ResourceRole.OWNER)
                        .then(folderApiService.getPermissions("folder02"));

        StepVerifier.create(mono)
                .assertNext(applicationPermissionView -> {
                    Assertions.assertEquals(2, applicationPermissionView.getPermissions().size());
                    Set<String> ids = applicationPermissionView.getPermissions().stream()
                            .map(PermissionItemView::getId)
                            .collect(Collectors.toSet());
                    Assertions.assertEquals(Set.of("user02", "group01"), ids);
                })
                .verifyComplete();
    }
}