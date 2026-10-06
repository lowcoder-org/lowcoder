package org.lowcoder.api.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lowcoder.api.bizthreshold.AbstractBizThresholdChecker;
import org.lowcoder.api.home.FolderApiService;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.home.UserHomeApiService;
import org.lowcoder.api.permission.PermissionHelper;
import org.lowcoder.api.usermanagement.GroupApiService;
import org.lowcoder.api.usermanagement.OrgApiService;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.application.service.ApplicationHistorySnapshotService;
import org.lowcoder.domain.application.service.ApplicationRecordService;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.datasource.model.DatasourceDO;
import org.lowcoder.domain.datasource.repository.DatasourceDORepository;
import org.lowcoder.domain.datasource.repository.DatasourceRepository;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.datasource.service.impl.DatasourceServiceImpl;
import org.lowcoder.domain.folder.service.FolderElementRelationService;
import org.lowcoder.domain.interaction.UserApplicationInteractionService;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.permission.solution.SuggestAppAdminSolutionService;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.domain.solutions.TemplateSolutionService;
import org.lowcoder.domain.template.service.TemplateService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * The application edit check for datasources referenced by GID, at the {@code ApplicationApiServiceImpl.update} level (BF-002,
 * formerly the section 9 row "retainNoneExistAndNonCurrentOrgDatasourceIds with gids reports existing current-org datasources
 * as missing; the application edit check treats missing as allowed").
 *
 * <p>What runs for real: {@code ApplicationApiServiceImpl.checkDatasourcePermissions} (:779-812), the real
 * {@code DatasourceServiceImpl} and the real {@code DatasourceRepository} methods {@code findObjectIdsByIdOrGid} and
 * {@code retainNoneExistAndNonCurrentOrgDatasourceIds}. What is a stub: the Mongo repository {@code DatasourceDORepository},
 * whose {@code findAllById} / {@code findAllByGidIn} answer by the key kind exactly as the Mongo queries do (an id matches only
 * the document's id, a gid only its gid); {@code DatasourceRepositoryMongoTest} measures the same repository methods against a
 * real Mongo. The permission service is a mock: the visitor holds the USE_DATASOURCES permission on the given keys only.
 *
 * <p>Limits: they cannot show the effect on a stored application beyond {@code updateById} being called with the edit, nor
 * that the editor UI ever writes a gid into a query (an API client can).
 */
@ExtendWith(MockitoExtension.class)
class ApplicationApiServiceImplDatasourceGidTest {

    private static final String APP_ID = "app-1";
    private static final String ORG_ID = "org-1";
    private static final String VISITOR_ID = "visitor-1";
    private static final String DATASOURCE_ID = "ds1objectid";
    private static final String DATASOURCE_GID = "ds-1-gid";
    private static final String FOREIGN_ORG_ID = "org-2";
    private static final String MSG_LACK_OF_DATASOURCE = "APPLICATION_EDIT_ERROR_LACK_OF_DATASOURCE_PERMISSIONS";

    @Mock private ApplicationService applicationService;
    @Mock private ResourcePermissionService resourcePermissionService;
    @Mock private SessionUserService sessionUserService;
    @Mock private OrgMemberService orgMemberService;
    @Mock private OrganizationService organizationService;
    @Mock private AbstractBizThresholdChecker bizThresholdChecker;
    @Mock private OrgDevChecker orgDevChecker;
    @Mock private TemplateSolutionService templateSolutionService;
    @Mock private SuggestAppAdminSolutionService suggestAppAdminSolutionService;
    @Mock private FolderApiService folderApiService;
    @Mock private UserHomeApiService userHomeApiService;
    @Mock private UserApplicationInteractionService userApplicationInteractionService;
    @Mock private DatasourceMetaInfoService datasourceMetaInfoService;
    @Mock private CompoundApplicationDslFilter compoundApplicationDslFilter;
    @Mock private TemplateService templateService;
    @Mock private PermissionHelper permissionHelper;
    @Mock private ApplicationHistorySnapshotService applicationHistorySnapshotService;
    @Mock private ApplicationRecordService applicationRecordService;
    @Mock private FolderElementRelationService folderElementRelationService;
    @Mock private GroupApiService groupApiService;
    @Mock private OrgApiService orgApiService;

    private final DatasourceDORepository datasourceDORepository = mock(DatasourceDORepository.class);
    private final DatasourceRepository datasourceRepository = realDatasourceRepository();
    @Spy
    private DatasourceService datasourceService = new DatasourceServiceImpl(null, null, null, datasourceRepository, null, null);

    @InjectMocks
    private ApplicationApiServiceImpl service;

    private DatasourceRepository realDatasourceRepository() {
        DatasourceRepository repository = new DatasourceRepository();
        ReflectionTestUtils.setField(repository, "repository", datasourceDORepository);
        return repository;
    }

    private static Application app() {
        return Application.builder()
                .id(APP_ID)
                .gid("gid-" + APP_ID)
                .organizationId(ORG_ID)
                .name("App")
                .applicationType(ApplicationType.APPLICATION.getValue())
                .applicationStatus(ApplicationStatus.NORMAL)
                .editingApplicationDSL(new HashMap<>())
                .createdAt(java.time.Instant.ofEpochMilli(1_000L))
                .build();
    }

    private static Application requestUsing(String datasourceId) {
        List<Object> queries = new ArrayList<>();
        Map<String, Object> query = new HashMap<>();
        query.put("id", "q0");
        query.put("datasourceId", datasourceId);
        queries.add(query);
        Map<String, Object> dsl = new HashMap<>();
        dsl.put("queries", queries);
        return Application.builder().name("renamed").editingApplicationDSL(dsl)
                .applicationStatus(ApplicationStatus.NORMAL).organizationId(ORG_ID).build();
    }

    /** The stored datasource, as the Mongo repository holds it: one document with an id and a gid in the application's org. */
    private void stubMongo(String datasourceOrgId) {
        DatasourceDO stored = DatasourceDO.builder().id(DATASOURCE_ID).gid(DATASOURCE_GID).organizationId(datasourceOrgId).build();
        lenient().when(datasourceDORepository.findAllById(ArgumentMatchers.<Iterable<String>>any())).thenAnswer(invocation -> {
            Iterable<String> keys = invocation.getArgument(0);
            for (String key : keys) {
                if (DATASOURCE_ID.equals(key)) {
                    return Flux.just(stored);
                }
            }
            return Flux.<DatasourceDO>empty();
        });
        lenient().when(datasourceDORepository.findAllByGidIn(anyCollection())).thenAnswer(invocation -> {
            java.util.Collection<String> keys = invocation.getArgument(0);
            return keys.contains(DATASOURCE_GID) ? Flux.just(stored) : Flux.<DatasourceDO>empty();
        });
    }

    private void stubUpdate(Set<String> permittedKeys) {
        Application stored = app();
        lenient().when(sessionUserService.getVisitorId()).thenReturn(Mono.just(VISITOR_ID));
        lenient().when(applicationRecordService.getLatestRecordByApplicationId(any())).thenReturn(Mono.empty());
        lenient().when(folderElementRelationService.getByElementIds(any())).thenReturn(Flux.empty());
        lenient().when(templateService.getByApplicationId(any())).thenReturn(Mono.empty());
        lenient().when(organizationService.getOrgCommonSettings(ORG_ID)).thenReturn(Mono.just(new OrganizationCommonSettings()));
        lenient().when(applicationService.findByIdWithoutDsl(APP_ID)).thenReturn(Mono.just(stored));
        lenient().when(resourcePermissionService.checkAndReturnMaxPermission(VISITOR_ID, APP_ID, ResourceAction.EDIT_APPLICATIONS))
                .thenReturn(Mono.just(ResourcePermission.builder().resourceRole(ResourceRole.EDITOR).build()));
        lenient().when(applicationService.findById(APP_ID)).thenReturn(Mono.just(stored));
        lenient().when(applicationService.updateById(eq(APP_ID), any(Application.class))).thenReturn(Mono.just(true));
        Map<String, ResourcePermission> permitted = new HashMap<>();
        permittedKeys.forEach(key -> permitted.put(key, ResourcePermission.builder().resourceRole(ResourceRole.VIEWER).build()));
        lenient().when(resourcePermissionService.getMaxMatchingPermission(eq(VISITOR_ID), anyCollection(), eq(ResourceAction.USE_DATASOURCES)))
                .thenReturn(Mono.just(permitted));
    }

    private static void assertLackOfDatasourcePermission(Throwable error) {
        assertThat(error).isInstanceOf(BizException.class);
        BizException biz = (BizException) error;
        assertThat(biz.getError()).isEqualTo(BizError.NOT_AUTHORIZED);
        assertThat(biz.getMessageKey()).isEqualTo(MSG_LACK_OF_DATASOURCE);
    }

    /** The "Fixed" row stays fixed for the object id: an existing datasource of the org that the user may not use is refused. */
    @Test
    void objectIdReference_ofADatasourceTheUserMayNotUse_isRefused() {
        stubMongo(ORG_ID);
        stubUpdate(Set.of());

        StepVerifier.create(service.update(APP_ID, requestUsing(DATASOURCE_ID), false))
                .expectErrorSatisfies(ApplicationApiServiceImplDatasourceGidTest::assertLackOfDatasourcePermission)
                .verify();

        verify(applicationService, never()).updateById(any(), any());
        System.out.println("[ApplicationApiServiceImplDatasourceGidTest] by object id, no USE permission -> NOT_AUTHORIZED, nothing written");
    }

    /** Control: the same object id passes when the user may use the datasource, so the refusal above is about the permission. */
    @Test
    void objectIdReference_ofADatasourceTheUserMayUse_passes() {
        stubMongo(ORG_ID);
        stubUpdate(Set.of(DATASOURCE_ID));

        StepVerifier.create(service.update(APP_ID, requestUsing(DATASOURCE_ID), false)).expectNextCount(1).verifyComplete();

        verify(applicationService).updateById(eq(APP_ID), any(Application.class));
    }

    /**
     * BF-002 (was the pin of the section 9 row "retainNoneExistAndNonCurrentOrgDatasourceIds ... gids ... permission
     * bypass"): the same existing datasource of the same org, referenced by its GID instead of its object id, is refused for a
     * user without the use-datasource permission, as the object id is. Nothing is written.
     */
    @Test
    void gidReference_ofADatasourceTheUserMayNotUse_isRefused() {
        stubMongo(ORG_ID);
        stubUpdate(Set.of());

        StepVerifier.create(service.update(APP_ID, requestUsing(DATASOURCE_GID), false))
                .expectErrorSatisfies(ApplicationApiServiceImplDatasourceGidTest::assertLackOfDatasourcePermission)
                .verify();

        verify(applicationService, never()).updateById(any(), any());
        System.out.println("[ApplicationApiServiceImplDatasourceGidTest] by gid, no USE permission -> NOT_AUTHORIZED, nothing written");
    }

    /**
     * BF-002: the use permission is stored under the datasource's object id, so a gid reference is checked under that id: a
     * user who may use the datasource passes by gid as by object id, and the permission service is asked about the object id.
     */
    @Test
    void gidReference_ofADatasourceTheUserMayUse_passes_checkedUnderTheObjectId() {
        stubMongo(ORG_ID);
        stubUpdate(Set.of(DATASOURCE_ID));

        StepVerifier.create(service.update(APP_ID, requestUsing(DATASOURCE_GID), false)).expectNextCount(1).verifyComplete();

        verify(resourcePermissionService).getMaxMatchingPermission(VISITOR_ID, Set.of(DATASOURCE_ID), ResourceAction.USE_DATASOURCES);
        verify(applicationService).updateById(eq(APP_ID), any(Application.class));
        System.out.println("[ApplicationApiServiceImplDatasourceGidTest] by gid, USE permission on the object id -> edit written");
    }

    /** Behaviour (the intended exemption): a gid that exists only in another organization also passes, as an object id would. */
    @Test
    void gidReference_ofADatasourceInAnotherOrg_passes_asAnObjectIdWould() {
        stubMongo(FOREIGN_ORG_ID);
        stubUpdate(Set.of());

        StepVerifier.create(service.update(APP_ID, requestUsing(DATASOURCE_GID), false)).expectNextCount(1).verifyComplete();
        StepVerifier.create(service.update(APP_ID, requestUsing(DATASOURCE_ID), false)).expectNextCount(1).verifyComplete();
    }
}
