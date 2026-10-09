package org.lowcoder.api.application;



import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
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
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.application.repository.ApplicationRepository;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.solutions.TemplateSolutionService;
import org.lowcoder.domain.template.model.Template;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;


import java.time.Instant;
import java.util.Map;
import java.util.Set;

@SuppressWarnings({"OptionalGetWithoutIsPresent"})
@SpringBootTest
@ActiveProfiles("ApplicationApiServiceIntegrationTest")
//@RunWith(SpringRunner.class)
@Slf4j(topic = "ApplicationApiServiceIntegrationTest")
public class ApplicationApiServiceIntegrationTest {

    @Autowired
    private ApplicationApiService applicationApiService;
    @Autowired
    private DatasourceApiService datasourceApiService;
    @Autowired
    private ApplicationService applicationService;
    @Autowired
    private InitData initData;
    @Autowired
    private ApplicationRepository applicationRepository;
    @Autowired
    private ResourcePermissionService resourcePermissionService;
    @Autowired
    private TemplateSolutionService templateSolutionService;
    @Autowired
    private ReactiveMongoTemplate mongoTemplate;

    private static final String EDITING_USER_ID = "user01";

    /** Seed users and org ({@code common/json/user.json}, {@code org_member.json}): user01 admin and user02 member of org01, user04 in no org. */
    private static final String ADMIN_USER_ID = "user01";
    private static final String MEMBER_USER_ID = "user02";
    private static final String NON_MEMBER_USER_ID = "user04";
    private static final String SEED_ORG_ID = "org01";
    private static final String INSUFFICIENT_PERMISSION_KEY = "INSUFFICIENT_PERMISSION";
    private static final String NO_PERMISSION_TO_EDIT_KEY = "NO_PERMISSION_TO_EDIT";
    private static final String CREATED_BY_FIELD = "createdBy";
    private static final String MONGO_ID_FIELD = "_id";
    private static final String TEMPLATE_NAME = "NEW-4 template";

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
                        "org01", null,
                        "app05",
                        ApplicationType.APPLICATION.getValue(),
                        Map.of("comp", "list", "queries", Set.of(Map.of("datasourceId", datasource.getId()))),
                        null, null, null))
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
                        "org01", null,
                        "app03",
                        ApplicationType.APPLICATION.getValue(),
                        Map.of("comp", "list", "queries", Set.of(Map.of("datasourceId", datasource.getId()))),
                        null, null, null))
                .delayUntil(__ -> deleteMono)
                .flatMap(createApplicationRequest -> applicationApiService.create(createApplicationRequest))
                .flatMap(applicationView -> {
                    Application application = Application.builder()
                            .editingApplicationDSL(applicationView.getApplicationDSL())
                            .name("app03")
                            .build();
                    return applicationApiService.update(applicationView.getApplicationInfoView().getApplicationId(), application, false);
                });

        StepVerifier.create(applicationViewMono)
                .expectErrorMatches(throwable -> throwable instanceof BizException bizException
                        && bizException.getError() == BizError.NOT_AUTHORIZED
                        && bizException.getMessageKey().equals("APPLICATION_EDIT_ERROR_LACK_OF_DATASOURCE_PERMISSIONS"))
                .verify();
    }

    /**
     * The editing user is set when an editor saves a history snapshot ({@code ApplicationHistorySnapshotController} calls
     * {@link ApplicationService#updateLastEditedAt}) and cleared by {@code updateEditState} with {@code editingFinished =
     * true}; {@code editingFinished = false} leaves it.
     */
    @Test
    @WithMockUser
    public void testUpdateEditingStateSuccess() {
        Mono<String> applicationIdMono = applicationApiService.create(new CreateApplicationRequest("org01", null, "app1", ApplicationType.APPLICATION.getValue(), Map.of("comp", "list"), null, null, null))
                .map(applicationView -> applicationView.getApplicationInfoView().getApplicationId())
                .delayUntil(applicationId -> applicationService.updateLastEditedAt(applicationId, Instant.now(), EDITING_USER_ID))
                .cache();

        StepVerifier.create(applicationIdMono
                        .delayUntil(applicationId -> applicationApiService.updateEditState(applicationId, new ApplicationEndpoints.UpdateEditStateRequest(false)))
                        .flatMap(applicationId -> applicationApiService.getEditingApplication(applicationId, false)))
                .assertNext(application -> Assertions.assertEquals(EDITING_USER_ID, application.getApplicationInfoView().getEditingUserId(),
                        "editing not finished: the editing user stays"))
                .verifyComplete();

        StepVerifier.create(applicationIdMono
                        .delayUntil(applicationId -> applicationApiService.updateEditState(applicationId, new ApplicationEndpoints.UpdateEditStateRequest(true)))
                        .flatMap(applicationId -> applicationApiService.getEditingApplication(applicationId, false)))
                .assertNext(application -> Assertions.assertEquals("", application.getApplicationInfoView().getEditingUserId(),
                        "editing finished: the editing user is cleared"))
                .verifyComplete();
    }

    /**
     * NEW-4 (fixed): the creator of an application who is no member of its org got the anonymous VIEWER row from the
     * creator lookup for the EDIT check of the editing view and read the editing DSL. The application is saved through
     * the domain {@code ApplicationService.create} (no membership check, unlike the API {@code create}); its OWNER row
     * does not count because the org lookup finds no membership.
     */
    @Test
    @WithMockUser(id = NON_MEMBER_USER_ID)
    public void getEditingApplication_creatorOutsideTheOrg_isRefusedNEW4() {
        String applicationId = applicationService.create(newApplication("NEW-4 creator outside the org"), NON_MEMBER_USER_ID)
                .map(Application::getId).block();
        try {
            Assertions.assertEquals(NON_MEMBER_USER_ID, storedCreatedBy(applicationId), "precondition: the visitor is the creator");

            StepVerifier.create(applicationApiService.getEditingApplication(applicationId, false))
                    .expectErrorMatches(throwable -> isBizError(throwable, BizError.NO_PERMISSION_TO_REQUEST_APP, INSUFFICIENT_PERMISSION_KEY))
                    .verify();
            System.out.println("[ApplicationApiServiceIntegrationTest] NEW-4 creator " + NON_MEMBER_USER_ID + " outside " + SEED_ORG_ID
                    + " -> NO_PERMISSION_TO_REQUEST_APP " + INSUFFICIENT_PERMISSION_KEY);
        } finally {
            resourcePermissionService.removeUserApplicationPermission(applicationId, NON_MEMBER_USER_ID).block();
            applicationRepository.deleteById(applicationId).block();
        }
    }

    /**
     * NEW-4 (fixed): a template application gave every signed-in user the anonymous VIEWER row for the EDIT check. The
     * application's creator is moved to the org admin by a plain update (no auditing), so only the template can grant;
     * the template is built and inserted the way {@link InitData} inserts the seed entities.
     */
    @Test
    @WithMockUser(id = NON_MEMBER_USER_ID)
    public void getEditingApplication_templateApplication_isRefusedToANonMemberNEW4() {
        String applicationId = applicationService.create(newApplication("NEW-4 template application"), NON_MEMBER_USER_ID)
                .map(Application::getId).block();
        Template template = null;
        try {
            mongoTemplate.updateFirst(Query.query(Criteria.where(MONGO_ID_FIELD).is(applicationId)),
                    new Update().set(CREATED_BY_FIELD, ADMIN_USER_ID), Application.class).block();
            template = mongoTemplate.insert(JsonUtils.fromJson(JsonUtils.toJson(Map.of("name", TEMPLATE_NAME, "applicationId", applicationId)),
                    Template.class)).block();
            Assertions.assertEquals(ADMIN_USER_ID, storedCreatedBy(applicationId), "precondition: the visitor is not the creator");
            Assertions.assertEquals(Set.of(applicationId), templateSolutionService.getTemplateApplicationIds(Set.of(applicationId)).block(),
                    "precondition: the application is a template application");

            StepVerifier.create(applicationApiService.getEditingApplication(applicationId, false))
                    .expectErrorMatches(throwable -> isBizError(throwable, BizError.NO_PERMISSION_TO_REQUEST_APP, INSUFFICIENT_PERMISSION_KEY))
                    .verify();
            System.out.println("[ApplicationApiServiceIntegrationTest] NEW-4 template application, visitor " + NON_MEMBER_USER_ID
                    + " outside " + SEED_ORG_ID + " -> NO_PERMISSION_TO_REQUEST_APP " + INSUFFICIENT_PERMISSION_KEY);
        } finally {
            if (template != null) {
                mongoTemplate.remove(template).block();
            }
            resourcePermissionService.removeUserApplicationPermission(applicationId, NON_MEMBER_USER_ID).block();
            applicationRepository.deleteById(applicationId).block();
        }
    }

    /**
     * NEW-4 (fixed): an org member who created an application and has no permission row on it got the VIEWER row for the
     * EDIT check. Saved through the repository, so no OWNER row is added; the auditor sets the creator.
     */
    @Test
    @WithMockUser(id = MEMBER_USER_ID)
    public void getEditingApplication_memberCreatorWithoutPermissionRow_isRefusedNEW4() {
        String applicationId = applicationRepository.save(newApplication("NEW-4 member creator without a row"))
                .map(Application::getId).block();
        try {
            Assertions.assertEquals(MEMBER_USER_ID, storedCreatedBy(applicationId), "precondition: the visitor is the creator");

            StepVerifier.create(applicationApiService.getEditingApplication(applicationId, false))
                    .expectErrorMatches(throwable -> isBizError(throwable, BizError.NO_PERMISSION_TO_REQUEST_APP, NO_PERMISSION_TO_EDIT_KEY))
                    .verify();
            System.out.println("[ApplicationApiServiceIntegrationTest] NEW-4 member creator " + MEMBER_USER_ID
                    + " without a row -> NO_PERMISSION_TO_REQUEST_APP " + NO_PERMISSION_TO_EDIT_KEY);
        } finally {
            applicationRepository.deleteById(applicationId).block();
        }
    }

    private static Application newApplication(String name) {
        return Application.builder()
                .organizationId(SEED_ORG_ID)
                .name(name)
                .applicationType(ApplicationType.APPLICATION.getValue())
                .applicationStatus(ApplicationStatus.NORMAL)
                .editingApplicationDSL(Map.of("comp", "list"))
                .build();
    }

    private String storedCreatedBy(String applicationId) {
        return applicationService.findById(applicationId).map(Application::getCreatedBy).block();
    }

    private static boolean isBizError(Throwable throwable, BizError error, String messageKey) {
        return throwable instanceof BizException bizException
                && bizException.getError() == error
                && bizException.getMessageKey().equals(messageKey);
    }
}
