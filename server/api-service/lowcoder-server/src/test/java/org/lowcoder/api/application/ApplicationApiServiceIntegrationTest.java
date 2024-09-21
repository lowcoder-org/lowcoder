package org.lowcoder.api.application;


import jakarta.persistence.Tuple;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.application.ApplicationEndpoints.CreateApplicationRequest;
import org.lowcoder.api.application.view.ApplicationView;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.api.datasource.DatasourceApiService;
import org.lowcoder.api.datasource.DatasourceApiServiceIntegrationTest;
import org.lowcoder.api.permission.view.CommonPermissionView;
import org.lowcoder.api.permission.view.PermissionItemView;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.Map;
import java.util.Set;

@SuppressWarnings({"OptionalGetWithoutIsPresent"})
@SpringBootTest
@ActiveProfiles("ApplicationApiServiceIntegrationTest")
//@RunWith(SpringRunner.class)
@Slf4j(topic = "ApplicationApiServiceIntegrationTest")
@Disabled("Enable after all plugins are loaded in test mode")
public class ApplicationApiServiceIntegrationTest {

    @Autowired
    private ApplicationApiService applicationApiService;
    @Autowired
    private DatasourceApiService datasourceApiService;
    @Autowired
    private InitData initData;

    @BeforeEach
    public void beforeEach() {
        initData.init();
    }

    @SuppressWarnings("ConstantConditions")
    @Test
    @WithMockUser(id = "user02")
    public void testCreateApplicationSuccess() {

        Mono<Datasource> datasourceMono = datasourceApiService.create(DatasourceApiServiceIntegrationTest.buildMysqlDatasource("mysql07")).cache();
        Mono<CommonPermissionView> commonPermissionViewMono =
                datasourceMono.flatMap(datasource -> datasourceApiService.getPermissions(datasource.getId()));
        Mono<Boolean> deleteMono = commonPermissionViewMono.flatMap(commonPermissionView -> {
            String permissionId = commonPermissionView.getUserPermissions().stream()
                    .filter(permissionItemView -> permissionItemView.getId().equals("user02"))
                    .findFirst()
                    .map(PermissionItemView::getPermissionId)
                    .get();
            return datasourceApiService.updatePermission(permissionId, ResourceRole.VIEWER);
        });
        //
        Mono<ApplicationView> applicationViewMono = datasourceMono.map(datasource -> new CreateApplicationRequest(
                        "org01",
                        "app05",
                        ApplicationType.APPLICATION.getValue(),
                        Map.of("comp", "table"),
                        Map.of("comp", "list", "queries", Set.of(Map.of("datasourceId", datasource.getId()))),
                        null))
                .delayUntil(__ -> deleteMono)
                .flatMap(createApplicationRequest -> applicationApiService.create(createApplicationRequest));

        StepVerifier.create(applicationViewMono)
                .assertNext(applicationView -> {
                    Assertions.assertNotNull(applicationView.getApplicationInfoView().getApplicationId());
                    Assertions.assertTrue(FieldName.isGID(applicationView.getApplicationInfoView().getApplicationGid()));
                })
                .verifyComplete();
    }

    @SuppressWarnings("ConstantConditions")
    @Test
    @WithMockUser(id = "user02")
    public void testUpdateApplicationFailedDueToLackOfDatasourcePermissions() {

        Mono<Datasource> datasourceMono = datasourceApiService.create(DatasourceApiServiceIntegrationTest.buildMysqlDatasource("mysql08")).cache();
        Mono<CommonPermissionView> commonPermissionViewMono =
                datasourceMono.flatMap(datasource -> datasourceApiService.getPermissions(datasource.getId()));
        Mono<Boolean> deleteMono = commonPermissionViewMono.flatMap(commonPermissionView -> {
            String permissionId = commonPermissionView.getUserPermissions().stream()
                    .filter(permissionItemView -> permissionItemView.getId().equals("user02"))
                    .findFirst()
                    .map(PermissionItemView::getPermissionId)
                    .get();
            return datasourceApiService.deletePermission(permissionId);
        });
        //
        Mono<ApplicationView> applicationViewMono = datasourceMono.map(datasource -> new CreateApplicationRequest(
                        "org01",
                        "app03",
                        ApplicationType.APPLICATION.getValue(),
                        Map.of("comp", "table"),
                        Map.of("comp", "list", "queries", Set.of(Map.of("datasourceId", datasource.getId()))),
                        null))
                .delayUntil(__ -> deleteMono)
                .flatMap(createApplicationRequest -> applicationApiService.create(createApplicationRequest))
                .flatMap(applicationView -> {
                    Application application = Application.builder()
                            .editingApplicationDSL(applicationView.getApplicationDSL())
                            .name("app03")
                            .build();
                    return applicationApiService.update(applicationView.getApplicationInfoView().getApplicationId(), application);
                });

        StepVerifier.create(applicationViewMono)
                .expectErrorMatches(throwable -> throwable instanceof BizException bizException
                        && bizException.getError() == BizError.NOT_AUTHORIZED
                        && bizException.getMessageKey().equals("APPLICATION_EDIT_ERROR_LACK_OF_DATASOURCE_PERMISSIONS"))
                .verify();
    }

    @Test
    @WithMockUser
    public void testUpdateEditingStateSuccess() {
        Mono<ApplicationView> applicationViewMono = applicationApiService.create(new CreateApplicationRequest("org01", "app1", ApplicationType.APPLICATION.getValue(), Map.of("comp", "table"), Map.of("comp", "list"), null));
        Mono<ApplicationView> updateEditStateMono = applicationViewMono.delayUntil(app -> applicationApiService.updateEditState(app.getApplicationInfoView().getApplicationId(), new ApplicationEndpoints.UpdateEditStateRequest(true)));
        Mono<ApplicationView> app = updateEditStateMono.flatMap(applicationView -> applicationApiService.getEditingApplication(applicationView.getApplicationInfoView().getApplicationId()));
        StepVerifier.create(app)
                .assertNext(application -> {
                    Assertions.assertEquals("user01", application.getApplicationInfoView().getEditingUserId());
                })
                .verifyComplete();
    }
}