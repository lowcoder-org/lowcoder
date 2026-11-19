package org.lowcoder.domain.datasource.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.concurrent.TimeoutException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceConnectionHolder;
import org.lowcoder.domain.datasource.model.DatasourceStructureDO;
import org.lowcoder.domain.datasource.repository.DatasourceStructureRepository;
import org.lowcoder.domain.datasource.service.DatasourceConnectionPool;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.plugin.DatasourceMetaInfo;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.plugin.common.QueryExecutor;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@code DatasourceStructureServiceImpl} (unit U11, row L3-3): cache lookup versus fresh read, saving, the empty
 * fallback and the error wrapping. The service has private {@code @Autowired} fields, injected reflectively.
 */
@SuppressWarnings({"rawtypes", "unchecked"})
class DatasourceStructureServiceImplTest {

    private static final String DATASOURCE_ID = "ds-1";
    private static final String TYPE = "postgres";
    private static final long READ_STRUCTURE_TIMEOUT_MS = 5000;
    private static final String PLUGIN_EXECUTION_TIMEOUT_KEY = "PLUGIN_EXECUTION_TIMEOUT";

    private DatasourceService datasourceService;
    private DatasourceMetaInfoService metaInfoService;
    private DatasourceConnectionPool connectionPool;
    private DatasourceStructureRepository structureRepository;
    private MongoUpsertHelper mongoUpsertHelper;
    private QueryExecutor executor;
    private DatasourceConnectionHolder holder;
    private Datasource datasource;
    private DatasourceConnectionConfig config;
    private DatasourceStructureServiceImpl service;

    @BeforeEach
    void setUp() {
        datasourceService = mock(DatasourceService.class);
        metaInfoService = mock(DatasourceMetaInfoService.class);
        connectionPool = mock(DatasourceConnectionPool.class);
        structureRepository = mock(DatasourceStructureRepository.class);
        mongoUpsertHelper = mock(MongoUpsertHelper.class);
        executor = mock(QueryExecutor.class);
        holder = mock(DatasourceConnectionHolder.class);
        config = mock(DatasourceConnectionConfig.class);
        datasource = Datasource.builder().id(DATASOURCE_ID).name("pg").type(TYPE).organizationId("org").detailConfig(config).build();

        CommonConfig commonConfig = new CommonConfig();
        commonConfig.getQuery().setReadStructureTimeout(READ_STRUCTURE_TIMEOUT_MS);
        service = new DatasourceStructureServiceImpl();
        ReflectionTestUtils.setField(service, "commonConfig", commonConfig);
        ReflectionTestUtils.setField(service, "datasourceService", datasourceService);
        ReflectionTestUtils.setField(service, "datasourceMetaInfoService", metaInfoService);
        ReflectionTestUtils.setField(service, "connectionContextService", connectionPool);
        ReflectionTestUtils.setField(service, "datasourceStructureRepository", structureRepository);
        ReflectionTestUtils.setField(service, "mongoUpsertHelper", mongoUpsertHelper);

        when(structureRepository.findByDatasourceId(DATASOURCE_ID)).thenReturn(Mono.empty());
        when(datasourceService.getById(DATASOURCE_ID)).thenReturn(Mono.just(datasource));
        when(metaInfoService.getDatasourceMetaInfo(TYPE)).thenReturn(DatasourceMetaInfo.builder().type(TYPE).hasStructureInfo(true).build());
        when(metaInfoService.getQueryExecutor(TYPE)).thenReturn(executor);
        when(connectionPool.getOrCreateConnection(datasource)).thenReturn((Mono) Mono.just(holder));
        when(holder.connection()).thenReturn("connection-object");
        when(mongoUpsertHelper.upsertWithAuditingParams(any(DatasourceStructureDO.class), eq("datasourceId"), eq(DATASOURCE_ID)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
    }

    private void stubExecutorReturns(DatasourceStructure structure) {
        when(executor.doGetStructure("connection-object", config)).thenReturn(Mono.just(structure));
    }

    /** Catches a remote structure read on every call: a cached structure is returned without touching the datasource. */
    @Test
    void getStructure_cacheHit_returnsTheCachedStructureWithoutTouchingTheDatasource() {
        DatasourceStructure cached = new DatasourceStructure(java.util.List.of());
        DatasourceStructureDO row = new DatasourceStructureDO();
        row.setDatasourceId(DATASOURCE_ID);
        row.setStructure(cached);
        when(structureRepository.findByDatasourceId(DATASOURCE_ID)).thenReturn(Mono.just(row));

        StepVerifier.create(service.getStructure(DATASOURCE_ID, false)).expectNext(cached).verifyComplete();
        verifyNoInteractions(datasourceService, connectionPool, mongoUpsertHelper);
        System.out.println("[DatasourceStructureServiceImplTest] cache hit -> cached structure, no remote read");
    }

    /** Catches a stale structure being kept (:82): a cache miss reads the latest structure and upserts it by datasource id. */
    @Test
    void getStructure_cacheMiss_readsTheLatestStructureAndUpsertsIt() {
        DatasourceStructure latest = new DatasourceStructure(java.util.List.of());
        stubExecutorReturns(latest);

        StepVerifier.create(service.getStructure(DATASOURCE_ID, false)).expectNext(latest).verifyComplete();

        ArgumentCaptor<DatasourceStructureDO> saved = ArgumentCaptor.forClass(DatasourceStructureDO.class);
        verify(mongoUpsertHelper).upsertWithAuditingParams(saved.capture(), eq("datasourceId"), eq(DATASOURCE_ID));
        assertThat(saved.getValue().getDatasourceId()).isEqualTo(DATASOURCE_ID);
        assertThat(saved.getValue().getStructure()).isSameAs(latest);
        System.out.println("[DatasourceStructureServiceImplTest] cache miss -> latest structure read and upserted");
    }

    /** Catches ignoreCache still reading the cache (:63): the cache is skipped and refreshed. */
    @Test
    void getStructure_ignoreCache_skipsTheCacheAndRefreshesIt() {
        DatasourceStructure latest = new DatasourceStructure(java.util.List.of());
        stubExecutorReturns(latest);

        StepVerifier.create(service.getStructure(DATASOURCE_ID, true)).expectNext(latest).verifyComplete();
        verify(structureRepository, never()).findByDatasourceId(any());
        verify(mongoUpsertHelper).upsertWithAuditingParams(any(DatasourceStructureDO.class), eq("datasourceId"), eq(DATASOURCE_ID));
        System.out.println("[DatasourceStructureServiceImplTest] ignoreCache -> cache not read, structure refreshed");
    }

    /** Catches a structure read on a plugin without structure info (:76) and the empty fallback being lost (:51). */
    @Test
    void getStructure_pluginWithoutStructureInfo_orUnknownDatasource_returnsAnEmptyStructure() {
        when(metaInfoService.getDatasourceMetaInfo(TYPE)).thenReturn(DatasourceMetaInfo.builder().type(TYPE).hasStructureInfo(false).build());
        StepVerifier.create(service.getStructure(DATASOURCE_ID, false))
                .assertNext(structure -> assertThat(structure.getTables()).isNull())
                .verifyComplete();

        when(datasourceService.getById("missing")).thenReturn(Mono.empty());
        when(structureRepository.findByDatasourceId("missing")).thenReturn(Mono.empty());
        StepVerifier.create(service.getStructure("missing", false))
                .assertNext(structure -> assertThat(structure.getTables()).isNull())
                .verifyComplete();
        verifyNoInteractions(connectionPool, mongoUpsertHelper);
        System.out.println("[DatasourceStructureServiceImplTest] no structure info / unknown datasource -> empty structure, nothing read or saved");
    }

    /** Catches raw exceptions reaching the client (:53, :111): other errors are wrapped, a PluginException passes unchanged. */
    @Test
    void getStructure_errors_areWrappedAsStructureErrors_pluginExceptionsPassThrough() {
        when(connectionPool.getOrCreateConnection(datasource)).thenReturn(Mono.error(new IllegalStateException("pool exhausted")));
        StepVerifier.create(service.getStructure(DATASOURCE_ID, false))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(PluginException.class);
                    PluginException plugin = (PluginException) error;
                    assertThat(plugin.getError()).isEqualTo(PluginCommonError.DATASOURCE_GET_STRUCTURE_ERROR);
                    assertThat(plugin.getMessageKey()).isEqualTo("DATASOURCE_GET_STRUCTURE_ERROR");
                    assertThat(plugin.getArgs()).containsExactly("pool exhausted");
                })
                .verify();

        PluginException original = new PluginException(PluginCommonError.DATASOURCE_GET_STRUCTURE_ERROR, "DATASOURCE_GET_STRUCTURE_ERROR", "original");
        when(connectionPool.getOrCreateConnection(datasource)).thenReturn(Mono.error(original));
        StepVerifier.create(service.getStructure(DATASOURCE_ID, false))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(original))
                .verify();
        System.out.println("[DatasourceStructureServiceImplTest] errors wrapped; PluginException unchanged");
    }

    /**
     * BF-101 (was pinned as the plan section 9 row "DatasourceStructureServiceImpl: a structure read that times out ...
     * the timeout code never reaches the caller"): the timeout reaches the caller as BizException(PLUGIN_EXECUTION_TIMEOUT)
     * with the timeout in milliseconds, through both error maps (:110 and :52); both used to wrap it as
     * PluginException(DATASOURCE_GET_STRUCTURE_ERROR). The holder is told about the timeout (doOnError, :106).
     */
    @Test
    void getStructure_executorTimeout_notifiesTheHolderAndSurfacesTheTimeoutErrorBF101() {
        when(executor.doGetStructure("connection-object", config)).thenReturn(Mono.never());

        StepVerifier.withVirtualTime(() -> service.getStructure(DATASOURCE_ID, true))
                .expectSubscription()
                .expectNoEvent(Duration.ofMillis(READ_STRUCTURE_TIMEOUT_MS - 1))
                .thenAwait(Duration.ofMillis(1))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(BizException.class);
                    BizException biz = (BizException) error;
                    assertThat(biz.getError()).isEqualTo(BizError.PLUGIN_EXECUTION_TIMEOUT);
                    assertThat(biz.getMessageKey()).isEqualTo(PLUGIN_EXECUTION_TIMEOUT_KEY);
                    assertThat(biz.getArgs()).containsExactly(READ_STRUCTURE_TIMEOUT_MS);
                })
                .verify(Duration.ofSeconds(5));

        ArgumentCaptor<Throwable> reported = ArgumentCaptor.forClass(Throwable.class);
        verify(holder).onQueryError(reported.capture());
        assertThat(reported.getValue()).isInstanceOf(TimeoutException.class);
        System.out.println("[DatasourceStructureServiceImplTest] timeout surfaces as PLUGIN_EXECUTION_TIMEOUT (BF-101)");
    }

    /** BF-101, what does not change: a BizException other than the read timeout is still wrapped as the structure error. */
    @Test
    void getStructure_anotherBizException_isStillWrappedAsTheStructureErrorBF101() {
        BizException other = new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER");
        when(connectionPool.getOrCreateConnection(datasource)).thenReturn(Mono.error(other));

        StepVerifier.create(service.getStructure(DATASOURCE_ID, true))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(PluginException.class);
                    PluginException plugin = (PluginException) error;
                    assertThat(plugin.getError()).isEqualTo(PluginCommonError.DATASOURCE_GET_STRUCTURE_ERROR);
                    assertThat(plugin.getArgs()).containsExactly(other.getMessage());
                })
                .verify();
        System.out.println("[DatasourceStructureServiceImplTest] other BizException -> DATASOURCE_GET_STRUCTURE_ERROR");
    }
}
