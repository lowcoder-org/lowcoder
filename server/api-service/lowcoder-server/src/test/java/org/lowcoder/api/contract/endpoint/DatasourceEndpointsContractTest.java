package org.lowcoder.api.contract.endpoint;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.DatasourceSamples;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.datasource.DatasourceApiService;
import org.lowcoder.api.datasource.DatasourceController;
import org.lowcoder.api.datasource.DatasourceEndpoints;
import org.lowcoder.api.datasource.DatasourceEndpoints.BatchAddPermissionRequest;
import org.lowcoder.api.datasource.DatasourceEndpoints.UpdatePermissionRequest;
import org.lowcoder.api.datasource.DatasourceView;
import org.lowcoder.api.datasource.UpsertDatasourceRequest;
import org.lowcoder.api.datasource.UpsertDatasourceRequestMapper;
import org.lowcoder.api.permission.view.CommonPermissionView;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.application.repository.ApplicationRepository;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.datasource.service.DatasourceStructureService;
import org.lowcoder.domain.datasource.service.impl.ClientBasedConnectionPool;
import org.lowcoder.domain.datasource.service.impl.ClientBasedConnectionPool.ClientBasedDatasourceCacheKey;
import org.lowcoder.domain.datasource.service.impl.DatasourceConnectionPoolFacade;
import org.lowcoder.domain.organization.repository.OrganizationRepository;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.plugin.client.dto.GetPluginDynamicConfigRequestDTO;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.infra.perf.PerfHelper;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;
import org.lowcoder.sdk.util.JsonUtils;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;

/**
 * Codec-level tests of the 15 {@link DatasourceEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, §5.5, task T5.1),
 * through the production {@link DatasourceController} in the {@link ContractTestClient} harness, with its
 * collaborators mocked, except {@link GidService}, which is the production one over mocked repositories: its id
 * conversion decides what {@code info} answers without a datasource id (plan §9 O40).
 *
 * <p>Request: JSON bodies are the D1 goldens; the request the controller hands to {@link UpsertDatasourceRequestMapper}
 * (mocked here; the {@code upsert-datasource} group runs the real one, {@code UpsertDatasourceContractTest}) or to the
 * service is captured and compared with D1's rules ({@link PayloadAssertions#assertBindsTo}).
 * Response: the service mocks return the samples, so the body must be the envelope golden around their goldens. The
 * five endpoints declared with {@code @JsonView(Public)} answer the {@code S1Public} golden, which drops the
 * {@code Internal} member of the test-only connection config (§5.5); the others answer S1, all members. One test per
 * registry response branch, named as the branch.
 *
 * <p>Stubbing groups (registry column {@code group}): {@code assembling} for the three list endpoints, whose page the
 * controller cuts from the service's {@code Flux} (Appendix A: {@code Datasource} and {@link DatasourceView} elements),
 * and for {@code testDatasource}, which builds its answer from a {@link DatasourceTestResult}; {@code pass-through} for
 * the others. Untyped roots without a type (Appendix A, {@code ContractRegistry.DYNAMIC_ROOTS}): the node service's
 * {@code List<Object>} of {@code getPluginDynamicConfig}, pinned with the §4.6 representative fixtures, and the pool
 * statistics of {@code info}, built by the production {@link ClientBasedConnectionPool} behind the production
 * {@link DatasourceConnectionPoolFacade} and pinned in {@value #INFO_OUTPUT}. Limits: the business events are mocks
 * that complete empty, and what they publish is not part of the JSON contract.
 */
class DatasourceEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(DatasourceEndpoints.class);
    static final String DATASOURCE_ID = "DatasourceEndpointsContractTest.datasourceId";
    static final String UNKNOWN_DATASOURCE_ID = "DatasourceEndpointsContractTest.unknownDatasourceId";
    static final String APPLICATION_ID = "DatasourceEndpointsContractTest.applicationId";
    static final String ORG_ID = "DatasourceEndpointsContractTest.orgId";
    static final String PERMISSION_ID = "DatasourceEndpointsContractTest.permissionId";
    static final String NAME_FILTER = "DatasourceEndpointsContractTest.name";
    static final String TYPE_FILTER = "DatasourceEndpointsContractTest.type";
    static final String UNKNOWN_ROLE = "DatasourceEndpointsContractTest.unknownRole";
    static final String TEST_FAILURE = "DatasourceEndpointsContractTest.testFailure";
    static final String BLANK = " ";
    static final String TRUE = "true";
    static final String EMPTY_ARRAY = "[]";
    static final String DATASOURCE_ID_PARAMETER = "datasourceId";
    static final String APP_ID_PARAMETER = "appId";
    static final String ORG_ID_PARAMETER = "orgId";
    static final String NAME_PARAMETER = "name";
    static final String TYPE_PARAMETER = "type";
    static final String PAGE_NUM_PARAMETER = "pageNum";
    static final String PAGE_SIZE_PARAMETER = "pageSize";
    static final String IGNORE_CACHE_PARAMETER = "ignoreCache";
    static final int PAGE_NUM = 2;
    static final int PAGE_SIZE = 1;
    static final int ELEMENTS = 3;
    /** The list endpoints' defaults ({@code DatasourceEndpoints}): the first page, and {@code 0}, all elements. */
    static final int DEFAULT_PAGE_NUM = 1;
    static final int DEFAULT_PAGE_SIZE = 0;
    /** {@code @ResponseStatus(HttpStatus.CREATED)} on the declaration of {@code create}. */
    static final HttpStatus CREATED = HttpStatus.CREATED;
    static final String S1_PUBLIC = "S1Public";
    /** The pool statistics {@code info} answers for {@link #DATASOURCE_ID} (Appendix A). */
    static final String INFO_OUTPUT = "dynamic/DatasourceEndpoints.info.output.json";
    /** The pool statistics: {@code int}s above {@code Short.MAX_VALUE}, and {@code Properties} holding strings (C9-A5). */
    static final int TOTAL_CONNECTIONS = 40_601;
    static final int IDLE_CONNECTIONS = 40_602;
    static final int ACTIVE_CONNECTIONS = 40_603;
    static final int WAITING_CONNECTIONS = 40_604;
    static final Map<String, String> DATASOURCE_PROPERTIES = Map.of("jdbcUrl", "DatasourceEndpointsContractTest.jdbcUrl",
            "maximumPoolSize", "40605");
    static final Map<String, String> HEALTH_CHECK_PROPERTIES = Map.of("connectivityCheckTimeoutMs", "40606",
            "expected99thPercentileMs", "DatasourceEndpointsContractTest.expected99thPercentileMs");
    static final String HIKARI_PERF_WRAPPER_MAP = "HIKARI_PERF_WRAPPER_MAP";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private ContractTestClient.Builder builder;
    private DatasourceApiService datasourceApiService;
    private DatasourceService datasourceService;
    private DatasourceStructureService datasourceStructureService;
    private UpsertDatasourceRequestMapper requestMapper;
    private ResourcePermissionService resourcePermissionService;

    @BeforeEach
    void mocks() {
        builder = ContractTestClient.builder();
        datasourceApiService = builder.mock(DatasourceApiService.class);
        datasourceStructureService = builder.mock(DatasourceStructureService.class);
        requestMapper = builder.mock(UpsertDatasourceRequestMapper.class);
        resourcePermissionService = builder.mock(ResourcePermissionService.class);
        datasourceService = Mockito.mock(DatasourceService.class, ApplicationEndpointsContractTest.EMPTY_MONO);
        builder.singleton("datasourceService", datasourceService);
        builder.singleton("businessEventPublisher", Mockito.mock(BusinessEventPublisher.class, ApplicationEndpointsContractTest.EMPTY_MONO));
        builder.singleton("gidService", gidService());
    }

    /**
     * The production {@link GidService}: the test ids hold no {@code -}, so they are not gids and the datasource ids
     * are used as they are; application and organization ids are looked up as slugs first, which find nothing.
     */
    private static GidService gidService() {
        GidService gidService = new GidService();
        ApplicationRepository applications = Mockito.mock(ApplicationRepository.class);
        Mockito.when(applications.findBySlug(anyString())).thenReturn(Flux.empty());
        OrganizationRepository organizations = Mockito.mock(OrganizationRepository.class);
        Mockito.when(organizations.findBySlug(anyString())).thenReturn(Flux.empty());
        ReflectionTestUtils.setField(gidService, "applicationRepository", applications);
        ReflectionTestUtils.setField(gidService, "organizationRepository", organizations);
        return gidService;
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(DatasourceEndpointsContractTest.class);
    }

    /** The bound request goes to the mapper; the created datasource has its password keys removed before it is written. */
    @Test
    void create() {
        Datasource resolved = DatasourceSamples.datasource();
        Mockito.when(requestMapper.resolve(any())).thenReturn(resolved);
        Mockito.when(datasourceApiService.create(resolved)).thenReturn(Mono.just(DatasourceSamples.datasource()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "create", Map.of(), EndpointContract.d1(UpsertDatasourceRequest.class));
            EndpointContract.assertResponse(result, CREATED, EndpointContract.success(datasourcePublic()));
            assertMapperReceivedTheD1Request();
            Mockito.verify(datasourceService).removePasswordTypeKeysFromJsDatasourcePluginConfig(any());
        }
    }

    @Test
    void getById() {
        Mockito.when(datasourceApiService.findByIdWithPermission(DATASOURCE_ID)).thenReturn(Mono.just(DatasourceSamples.datasource()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getById", Map.of(), null, DATASOURCE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(datasourcePublic()));
        }
    }

    /** The original datasource is read for the event; the resolved request is the update. */
    @Test
    void update() {
        Datasource resolved = DatasourceSamples.datasource();
        Mockito.when(requestMapper.resolve(any())).thenReturn(resolved);
        Mockito.when(datasourceService.getById(DATASOURCE_ID)).thenReturn(Mono.just(DatasourceSamples.datasource()));
        Mockito.when(datasourceApiService.update(DATASOURCE_ID, resolved)).thenReturn(Mono.just(DatasourceSamples.datasource()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "update", Map.of(), EndpointContract.d1(UpsertDatasourceRequest.class),
                    DATASOURCE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(datasourcePublic()));
            assertMapperReceivedTheD1Request();
        }
    }

    @Test
    void delete() {
        Mockito.when(datasourceService.getById(DATASOURCE_ID)).thenReturn(Mono.just(DatasourceSamples.datasource()));
        Mockito.when(datasourceApiService.delete(DATASOURCE_ID)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "delete", Map.of(), null, DATASOURCE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
        }
    }

    @Test
    void testDatasource() {
        Datasource resolved = DatasourceSamples.datasource();
        Mockito.when(requestMapper.resolve(any())).thenReturn(resolved);
        Mockito.when(datasourceApiService.testDatasource(resolved)).thenReturn(Mono.just(DatasourceTestResult.testSuccess()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "testDatasource", Map.of(), EndpointContract.d1(UpsertDatasourceRequest.class));
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            assertMapperReceivedTheD1Request();
        }
    }

    /**
     * A failed test is an answer, not an exception: HTTP 200 with the error envelope, code {@code 500}, and the
     * result's message for the request's locale.
     */
    @Test
    void testDatasourceFailing() {
        DatasourceTestResult failure = DatasourceTestResult.testFail(TEST_FAILURE);
        Mockito.when(requestMapper.resolve(any())).thenReturn(DatasourceSamples.datasource());
        Mockito.when(datasourceApiService.testDatasource(any())).thenReturn(Mono.just(failure));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "testDatasource", Map.of(), EndpointContract.d1(UpsertDatasourceRequest.class));
            EndpointContract.assertResponse(result, HttpStatus.OK,
                    EndpointContract.error(HttpStatus.INTERNAL_SERVER_ERROR.value(), failure.getInvalidMessage(EndpointContract.REQUEST_LOCALE)));
        }
    }

    @Test
    void getStructure() {
        Mockito.when(datasourceStructureService.getStructure(DATASOURCE_ID, true)).thenReturn(Mono.just(DatasourceSamples.datasourceStructure()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getStructure", Map.of(IGNORE_CACHE_PARAMETER, TRUE), null, DATASOURCE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(DatasourceStructure.class)));
        }
    }

    /** {@code ignoreCache} defaults to {@code false}. */
    @Test
    void getStructureUsesTheCacheByDefault() {
        Mockito.when(datasourceStructureService.getStructure(DATASOURCE_ID, false)).thenReturn(Mono.just(DatasourceSamples.datasourceStructure()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getStructure", Map.of(), null, DATASOURCE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(DatasourceStructure.class)));
        }
    }

    /**
     * Page 2 of size 1 out of three {@link Datasource}s (Appendix A). The endpoint has no {@code @JsonView}, so the
     * config's {@code Internal} member is written; the production service sets the config to {@code null} first
     * ({@code DatasourceApiServiceImpl#listJsDatasourcePlugins}), which the S1 sample does not.
     */
    @Test
    void listJsDatasourcePlugins() {
        Mockito.when(datasourceApiService.listJsDatasourcePlugins(APPLICATION_ID, NAME_FILTER, TYPE_FILTER))
                .thenReturn(Flux.fromIterable(IntStream.range(0, ELEMENTS).mapToObj(i -> DatasourceSamples.datasource()).toList()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "listJsDatasourcePlugins",
                    listQuery(APP_ID_PARAMETER, APPLICATION_ID), null);
            EndpointContract.assertResponse(result, HttpStatus.OK,
                    EndpointContract.page(EndpointContract.array(EndpointContract.s1(Datasource.class)), PAGE_NUM, PAGE_SIZE, ELEMENTS));
        }
    }

    /** The node service's list (Appendix A) is passed through: the §4.6 representative input, as one element. */
    @Test
    void getPluginDynamicConfig() {
        Mockito.when(datasourceApiService.getPluginDynamicConfig(any())).thenReturn(Mono.just(representativeList()));
        String d1 = EndpointContract.d1(GetPluginDynamicConfigRequestDTO.class);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getPluginDynamicConfig", Map.of(), EndpointContract.array(d1, d1));
            EndpointContract.assertResponse(result, HttpStatus.OK,
                    EndpointContract.success(EndpointContract.array(GOLDEN.read(PayloadSamples.REPRESENTATIVE_OUTPUT))));
            @SuppressWarnings("unchecked")
            ArgumentCaptor<List<GetPluginDynamicConfigRequestDTO>> requests = ArgumentCaptor.forClass(List.class);
            Mockito.verify(datasourceApiService).getPluginDynamicConfig(requests.capture());
            assertThat(requests.getValue()).hasSize(2);
            requests.getValue().forEach(request -> PayloadAssertions.assertBindsTo(PayloadSamples.of(GetPluginDynamicConfigRequestDTO.class), request));
        }
    }

    /** An empty request list answers an empty list without asking the node service. */
    @Test
    void getPluginDynamicConfigWithoutRequests() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getPluginDynamicConfig", Map.of(), EMPTY_ARRAY);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EMPTY_ARRAY));
            Mockito.verify(datasourceApiService, Mockito.never()).getPluginDynamicConfig(any());
        }
    }

    @Test
    void listOrgDataSources() {
        Mockito.when(datasourceApiService.listOrgDataSources(ORG_ID, NAME_FILTER, TYPE_FILTER)).thenReturn(datasourceViews());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "listOrgDataSources", listQuery(ORG_ID_PARAMETER, ORG_ID), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, datasourceViewPage(PAGE_NUM, PAGE_SIZE));
        }
    }

    /**
     * The declaration requires {@code name} and {@code type}; the implementation's {@code required = false} is what
     * Spring applies (plan §9 O41): without them, the service gets {@code null}s, with the default paging.
     */
    @Test
    void listOrgDataSourcesWithoutFilters() {
        Mockito.when(datasourceApiService.listOrgDataSources(ORG_ID, null, null)).thenReturn(datasourceViews());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "listOrgDataSources", Map.of(ORG_ID_PARAMETER, ORG_ID), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.page(
                    EndpointContract.array(datasourceViewPublic(), datasourceViewPublic(), datasourceViewPublic()), DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE, ELEMENTS));
            Mockito.verify(datasourceApiService).listOrgDataSources(ORG_ID, null, null);
        }
    }

    @Test
    void listOrgDataSourcesWithBlankOrgId() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "listOrgDataSources", listQuery(ORG_ID_PARAMETER, BLANK), null);
            EndpointContract.assertBizError(result, BizError.INVALID_PARAMETER, "ORG_ID_EMPTY");
            Mockito.verifyNoInteractions(datasourceApiService);
        }
    }

    @Test
    void listAppDataSources() {
        Mockito.when(datasourceApiService.listAppDataSources(APPLICATION_ID, NAME_FILTER, TYPE_FILTER)).thenReturn(datasourceViews());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "listAppDataSources", listQuery(APP_ID_PARAMETER, APPLICATION_ID), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, datasourceViewPage(PAGE_NUM, PAGE_SIZE));
        }
    }

    /** As {@link #listOrgDataSourcesWithoutFilters}: the implementation's {@code required = false} applies (O41). */
    @Test
    void listAppDataSourcesWithoutFilters() {
        Mockito.when(datasourceApiService.listAppDataSources(APPLICATION_ID, null, null)).thenReturn(datasourceViews());
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "listAppDataSources", Map.of(APP_ID_PARAMETER, APPLICATION_ID), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.page(
                    EndpointContract.array(datasourceViewPublic(), datasourceViewPublic(), datasourceViewPublic()), DEFAULT_PAGE_NUM, DEFAULT_PAGE_SIZE, ELEMENTS));
            Mockito.verify(datasourceApiService).listAppDataSources(APPLICATION_ID, null, null);
        }
    }

    @Test
    void listAppDataSourcesWithBlankAppId() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "listAppDataSources", listQuery(APP_ID_PARAMETER, BLANK), null);
            EndpointContract.assertBizError(result, BizError.INVALID_PARAMETER, "INVALID_APP_ID");
            Mockito.verifyNoInteractions(datasourceApiService);
        }
    }

    @Test
    void getPermissions() {
        Mockito.when(datasourceApiService.getPermissions(DATASOURCE_ID)).thenReturn(Mono.just(DatasourceSamples.commonPermissionView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getPermissions", Map.of(), null, DATASOURCE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(CommonPermissionView.class)));
        }
    }

    /** The permissions are read before and after the grant, for the event. */
    @Test
    void grantPermission() {
        BatchAddPermissionRequest request = (BatchAddPermissionRequest) PayloadSamples.of(BatchAddPermissionRequest.class).value();
        Mockito.when(datasourceApiService.getPermissions(DATASOURCE_ID)).thenReturn(Mono.just(DatasourceSamples.commonPermissionView()));
        Mockito.when(datasourceApiService.grantPermission(DATASOURCE_ID, request.userIds(), request.groupIds(), ResourceRole.EDITOR))
                .thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "grantPermission", Map.of(), EndpointContract.d1(BatchAddPermissionRequest.class),
                    DATASOURCE_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            Mockito.verify(datasourceApiService).grantPermission(DATASOURCE_ID, request.userIds(), request.groupIds(), ResourceRole.EDITOR);
        }
    }

    @Test
    void grantPermissionWithUnknownRole() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "grantPermission", Map.of(),
                    EndpointContract.d1(BatchAddPermissionRequest.class).replace(ResourceRole.EDITOR.getValue(), UNKNOWN_ROLE), DATASOURCE_ID);
            EndpointContract.assertInvalidParameter(result, UNKNOWN_ROLE);
            Mockito.verifyNoInteractions(datasourceApiService);
        }
    }

    /** The permission is read before and after the update, for the event. */
    @Test
    void updatePermission() {
        Mockito.when(resourcePermissionService.getById(PERMISSION_ID)).thenReturn(Mono.just(resourcePermission()));
        Mockito.when(datasourceApiService.updatePermission(PERMISSION_ID, ResourceRole.VIEWER)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "updatePermission", Map.of(), EndpointContract.d1(UpdatePermissionRequest.class),
                    PERMISSION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            Mockito.verify(datasourceApiService).updatePermission(PERMISSION_ID, ResourceRole.VIEWER);
        }
    }

    @Test
    void updatePermissionWithUnknownRole() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "updatePermission", Map.of(),
                    EndpointContract.d1(UpdatePermissionRequest.class).replace(ResourceRole.VIEWER.getValue(), UNKNOWN_ROLE), PERMISSION_ID);
            EndpointContract.assertInvalidParameter(result, UNKNOWN_ROLE);
            Mockito.verifyNoInteractions(datasourceApiService);
        }
    }

    @Test
    void deletePermission() {
        Mockito.when(resourcePermissionService.getById(PERMISSION_ID)).thenReturn(Mono.just(resourcePermission()));
        Mockito.when(datasourceApiService.deletePermission(PERMISSION_ID)).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "deletePermission", Map.of(), null, PERMISSION_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
        }
    }

    /** One pool matches the datasource id: its statistics, as {@code ClientBasedConnectionPool#info} builds them. */
    @Test
    void info() {
        assertInfo(Map.of(DATASOURCE_ID_PARAMETER, DATASOURCE_ID), HttpStatus.OK, EndpointContract.success(GOLDEN.read(INFO_OUTPUT)));
    }

    /** No pool matches: an empty list (Appendix A). */
    @Test
    void infoOfAnUnknownDatasource() {
        assertInfo(Map.of(DATASOURCE_ID_PARAMETER, UNKNOWN_DATASOURCE_ID), HttpStatus.OK, EndpointContract.success(EMPTY_ARRAY));
    }

    /**
     * {@code datasourceId} is optional, and {@code ClientBasedConnectionPool#info} answers every pool for a blank one,
     * but {@code GidService#convertDatasourceIdToObjectId} makes {@code Mono.just(null)} of a missing id, so the request
     * fails before: the global handler's 500 (plan §9 O40).
     */
    @Test
    void infoWithoutDatasourceId() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "info", Map.of(), null);
            EndpointContract.assertBizError(result, BizError.INTERNAL_SERVER_ERROR, BizError.INTERNAL_SERVER_ERROR.name());
            Mockito.verify(datasourceApiService, Mockito.never()).info(isNull());
        }
    }

    /**
     * {@code info} through the production pools: a {@link HikariPerfWrapper} registered for {@link #DATASOURCE_ID} in
     * {@link ClientBasedConnectionPool}'s static map (as its connection cache does when it creates a Hikari pool), and
     * removed again afterwards.
     */
    private void assertInfo(Map<String, ?> query, HttpStatus status, String expectedJson) {
        ClientBasedConnectionPool pool = new ClientBasedConnectionPool(Mockito.mock(DatasourceMetaInfoService.class), Mockito.mock(PerfHelper.class));
        DatasourceConnectionPoolFacade facade = new DatasourceConnectionPoolFacade(List.of(pool), Mockito.mock(DatasourceMetaInfoService.class));
        facade.init();
        Mockito.when(datasourceApiService.info(anyString())).thenAnswer(invocation -> facade.info(invocation.getArgument(0)));
        Map<ClientBasedDatasourceCacheKey, HikariPerfWrapper> wrappers = hikariPerfWrappers();
        Datasource datasource = DatasourceSamples.datasource();
        ClientBasedDatasourceCacheKey key = new ClientBasedDatasourceCacheKey(DATASOURCE_ID, Instant.EPOCH, datasource);
        wrappers.put(key, HikariPerfWrapper.wrap(datasource, () -> TOTAL_CONNECTIONS, () -> IDLE_CONNECTIONS, () -> ACTIVE_CONNECTIONS,
                () -> WAITING_CONNECTIONS, () -> properties(DATASOURCE_PROPERTIES), () -> properties(HEALTH_CHECK_PROPERTIES)));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "info", query, null);
            EndpointContract.assertResponse(result, status, expectedJson);
        } finally {
            wrappers.remove(key);
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<ClientBasedDatasourceCacheKey, HikariPerfWrapper> hikariPerfWrappers() {
        return (Map<ClientBasedDatasourceCacheKey, HikariPerfWrapper>) ReflectionTestUtils.getField(ClientBasedConnectionPool.class, HIKARI_PERF_WRAPPER_MAP);
    }

    private static Properties properties(Map<String, String> values) {
        Properties properties = new Properties();
        properties.putAll(values);
        return properties;
    }

    private void assertMapperReceivedTheD1Request() {
        ArgumentCaptor<UpsertDatasourceRequest> request = ArgumentCaptor.forClass(UpsertDatasourceRequest.class);
        Mockito.verify(requestMapper).resolve(request.capture());
        PayloadAssertions.assertBindsTo(PayloadSamples.of(UpsertDatasourceRequest.class), request.getValue());
    }

    private static Map<String, Object> listQuery(String idParameter, String id) {
        Map<String, Object> query = new LinkedHashMap<>();
        query.put(idParameter, id);
        query.put(NAME_PARAMETER, NAME_FILTER);
        query.put(TYPE_PARAMETER, TYPE_FILTER);
        query.put(PAGE_NUM_PARAMETER, PAGE_NUM);
        query.put(PAGE_SIZE_PARAMETER, PAGE_SIZE);
        return query;
    }

    private static Flux<DatasourceView> datasourceViews() {
        return Flux.fromIterable(IntStream.range(0, ELEMENTS).mapToObj(i -> DatasourceSamples.datasourceView()).toList());
    }

    private static String datasourceViewPage(int pageNum, int pageSize) {
        return EndpointContract.page(EndpointContract.array(datasourceViewPublic()), pageNum, pageSize, ELEMENTS);
    }

    private static String datasourcePublic() {
        return EndpointContract.fixture(Datasource.class, S1_PUBLIC);
    }

    private static String datasourceViewPublic() {
        return EndpointContract.fixture(DatasourceView.class, S1_PUBLIC);
    }

    /** The node service's answer: the representative input as the one element of a {@code List<Object>}, as Jackson binds it. */
    private static List<Object> representativeList() {
        return new ArrayList<>(List.of(PayloadSamples.representativeObject()));
    }

    private static ResourcePermission resourcePermission() {
        return ResourcePermission.builder().id(PERMISSION_ID).build();
    }

    private ContractTestClient client() {
        return builder.controllerWithMockedDependencies(DatasourceController.class).build();
    }
}
