package org.lowcoder.domain.datasource.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.after;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.ToDoubleFunction;
import java.util.stream.StreamSupport;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.domain.datasource.model.ClientBasedDatasourceConnectionHolder;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.service.impl.ClientBasedConnectionPool.ClientBasedDatasourceCacheKey;
import org.lowcoder.domain.plugin.DatasourceMetaInfo;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.infra.perf.PerfEvent;
import org.lowcoder.infra.perf.PerfHelper;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.exception.InvalidHikariDatasourceException;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.plugin.common.DatasourceConnector;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;

import io.micrometer.core.instrument.Tag;
import reactor.core.publisher.Hooks;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;
import reactor.test.StepVerifier;

/**
 * {@code ClientBasedConnectionPool} (unit U5, task L3-5): the behaviours the existing
 * {@code org.lowcoder.impl.ClientBasedConnectionPoolTest} does not cover: gauges, error mapping, perf counters,
 * destruction on update, {@code info}, key equality and two failure behaviours. Mockito connector and
 * {@link PerfHelper}; datasource ids are unique to this class and the shared static Hikari map is cleaned after every
 * test (invalidating the cache removes the entries).
 */
@SuppressWarnings({"rawtypes", "unchecked"})
class ClientBasedConnectionPoolBehaviourTest {

    private static final String TYPE_A = "L3-5-cb-type-a";
    private static final String TYPE_B = "L3-5-cb-type-b";
    private static final String ID_PREFIX = "L3-5-cb-";
    private static final Instant V1 = Instant.parse("2026-02-01T00:00:00Z");
    private static final Instant V2 = V1.plusSeconds(60);
    private static final String DATABASE_DOWN = "database down";
    private static final String RECOVERED = "connection-after-recovery";
    private static final String STALE_DATASOURCE = "stale datasource";
    /** {@code ClientBasedConnectionPool.DEFAULT_RETRIEVE_CONNECTION_TIMES}: the retries of a stale connection. */
    private static final int STALE_RETRIES = 5;
    /** How long a test waits to see that the asynchronous removal listener destroys nothing. */
    private static final long NO_DESTRUCTION_WAIT_MS = 500;
    private static final Duration WAIT = Duration.ofSeconds(5);
    private static final long POLL_MS = 10;

    private DatasourceMetaInfoService metaInfoService;
    private PerfHelper perf;
    private DatasourceConnector connector;
    private ClientBasedConnectionPool pool;
    private final AtomicInteger sequence = new AtomicInteger();

    @BeforeEach
    void setUp() {
        metaInfoService = mock(DatasourceMetaInfoService.class);
        perf = mock(PerfHelper.class);
        connector = mock(DatasourceConnector.class);
        when(metaInfoService.getDatasourceConnector(any())).thenReturn(connector);
        when(connector.doCreateConnection(any())).thenAnswer(invocation -> Mono.just("connection-" + sequence.incrementAndGet()));
        when(connector.destroyConnection(any())).thenReturn(Mono.empty());
        pool = new ClientBasedConnectionPool(metaInfoService, perf);
    }

    @AfterEach
    void releaseConnectionsAndCheckTheSharedMap() {
        cache().invalidateAll();
        Map<ClientBasedDatasourceCacheKey, HikariPerfWrapper> shared = hikariMap();
        assertThat(shared.keySet()).as("Hikari wrappers left behind by this class")
                .noneMatch(key -> key.id() != null && key.id().startsWith(ID_PREFIX));
    }

    private LoadingCache cache() {
        return (LoadingCache) ReflectionTestUtils.getField(pool, "cache");
    }

    private static Map<ClientBasedDatasourceCacheKey, HikariPerfWrapper> hikariMap() {
        return (Map<ClientBasedDatasourceCacheKey, HikariPerfWrapper>) ReflectionTestUtils.getField(ClientBasedConnectionPool.class, "HIKARI_PERF_WRAPPER_MAP");
    }

    private Datasource datasource(String idSuffix, String type, Instant version) {
        Datasource datasource = new Datasource();
        datasource.setId(ID_PREFIX + idSuffix);
        datasource.setType(type);
        datasource.setUpdatedAt(version);
        datasource.setDetailConfig(mock(DatasourceConnectionConfig.class));
        return datasource;
    }

    private ClientBasedDatasourceConnectionHolder connection(Datasource datasource) {
        return (ClientBasedDatasourceConnectionHolder) pool.getOrCreateConnection(datasource).block(Duration.ofSeconds(5));
    }

    private static HikariPerfWrapper wrapper(int active, int idle, int waiting, int total) {
        HikariPerfWrapper wrapper = mock(HikariPerfWrapper.class);
        when(wrapper.getActiveConnections()).thenReturn(active);
        when(wrapper.getIdleConnections()).thenReturn(idle);
        when(wrapper.getWaitingConnections()).thenReturn(waiting);
        when(wrapper.getTotalConnections()).thenReturn(total);
        Properties datasourceProperties = new Properties();
        datasourceProperties.setProperty("jdbcUrl", "jdbc:test");
        when(wrapper.getDatasourceProperties()).thenReturn(datasourceProperties);
        when(wrapper.getHealthCheckProperties()).thenReturn(new Properties());
        return wrapper;
    }

    private static Map<String, String> tags(Iterable<?> tags) {
        Map<String, String> map = new HashMap<>();
        StreamSupport.stream(tags.spliterator(), false).map(Tag.class::cast).forEach(tag -> map.put(tag.getKey(), tag.getValue()));
        return map;
    }

    // ---------------------------------------------------------------- init gauges

    /**
     * Catches gauges registered for the wrong pool type (:74), a size gauge counting other types (:79), and Hikari
     * gauges reading the wrong counter or type (:89, :92-95): the captured gauge functions are applied to real data.
     */
    @Test
    void init_registersTheGaugesAndTheirFunctionsCountPerType() {
        DatasourceMetaInfo clientBased = DatasourceMetaInfo.builder().type(TYPE_A).connectionPool(ClientBasedConnectionPool.class).build();
        DatasourceMetaInfo tokenBased = DatasourceMetaInfo.builder().type(TYPE_B).connectionPool(TokenBasedConnectionPool.class).build();
        when(metaInfoService.getJavaBasedSupportedDatasourceMetaInfos()).thenReturn(List.of(clientBased, tokenBased));

        pool.init();

        ArgumentCaptor<PerfEvent> events = ArgumentCaptor.forClass(PerfEvent.class);
        ArgumentCaptor<Iterable> tagCaptor = ArgumentCaptor.forClass(Iterable.class);
        ArgumentCaptor<Object> targets = ArgumentCaptor.forClass(Object.class);
        ArgumentCaptor<ToDoubleFunction> functions = ArgumentCaptor.forClass(ToDoubleFunction.class);
        verify(perf, times(9)).gaugeSafely(events.capture(), tagCaptor.capture(), targets.capture(), functions.capture());

        // exactly one size gauge, for the client based type only
        List<Integer> sizeCalls = new ArrayList<>();
        for (int i = 0; i < 9; i++) {
            if (events.getAllValues().get(i) == PerfEvent.CLIENT_BASED_CONNECTION_SIZE) {
                sizeCalls.add(i);
            }
        }
        assertThat(sizeCalls).hasSize(1);
        int sizeCall = sizeCalls.get(0);
        assertThat(tags(tagCaptor.getAllValues().get(sizeCall))).containsEntry("type", TYPE_A);
        connection(datasource("size-1", TYPE_A, V1));
        connection(datasource("size-2", TYPE_A, V1));
        connection(datasource("size-3", TYPE_B, V1));
        assertThat(functions.getAllValues().get(sizeCall).applyAsDouble(targets.getAllValues().get(sizeCall)))
                .as("cached connections of the type only").isEqualTo(2.0);

        // four Hikari gauges per supported type, each summing its own counter over the wrappers of that type
        Map<ClientBasedDatasourceCacheKey, HikariPerfWrapper> fake = new HashMap<>();
        fake.put(ClientBasedDatasourceCacheKey.of(datasource("fake-a1", TYPE_A, V1)), wrapper(1, 10, 100, 1000));
        fake.put(ClientBasedDatasourceCacheKey.of(datasource("fake-a2", TYPE_A, V1)), wrapper(3, 30, 300, 3000));
        fake.put(ClientBasedDatasourceCacheKey.of(datasource("fake-b1", TYPE_B, V1)), wrapper(2, 20, 200, 2000));
        Map<String, Map<PerfEvent, Double>> expected = Map.of(
                TYPE_A, Map.of(PerfEvent.HIKARI_POOL_ACTIVE_CONNECTIONS, 4.0, PerfEvent.HIKARI_POOL_IDLE_CONNECTIONS, 40.0,
                        PerfEvent.HIKARI_POOL_WAITING_CONNECTIONS, 400.0, PerfEvent.HIKARI_POOL_TOTAL_CONNECTIONS, 4000.0),
                TYPE_B, Map.of(PerfEvent.HIKARI_POOL_ACTIVE_CONNECTIONS, 2.0, PerfEvent.HIKARI_POOL_IDLE_CONNECTIONS, 20.0,
                        PerfEvent.HIKARI_POOL_WAITING_CONNECTIONS, 200.0, PerfEvent.HIKARI_POOL_TOTAL_CONNECTIONS, 2000.0));
        int checked = 0;
        for (int i = 0; i < 9; i++) {
            PerfEvent event = events.getAllValues().get(i);
            if (event == PerfEvent.CLIENT_BASED_CONNECTION_SIZE) {
                continue;
            }
            String type = tags(tagCaptor.getAllValues().get(i)).get("datasourceType");
            assertThat(functions.getAllValues().get(i).applyAsDouble(fake)).as(event + " of " + type).isEqualTo(expected.get(type).get(event));
            checked++;
        }
        assertThat(checked).isEqualTo(8);
        System.out.println("[ClientBasedConnectionPoolBehaviourTest] gauges: 1 size gauge (client based type), 8 hikari gauges, functions verified");
    }

    // ---------------------------------------------------------------- errors

    /** Catches raw exceptions reaching callers (:184-190), while exceptions that already are BaseExceptions pass through (:185). */
    @Test
    void connectorFailure_isMappedToPluginCreateConnectionFailed_butPluginExceptionsPassThrough() {
        when(connector.doCreateConnection(any())).thenReturn(Mono.error(new IllegalStateException("boom")));
        StepVerifier.create(pool.getOrCreateConnection(datasource("error-mapped", TYPE_A, V1)))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(BizException.class);
                    BizException biz = (BizException) error;
                    assertThat(biz.getError()).isEqualTo(BizError.PLUGIN_CREATE_CONNECTION_FAILED);
                    assertThat(biz.getArgs()).containsExactly("boom");
                })
                .verify();

        PluginException plugin = new PluginException(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, "DATASOURCE_TYPE_ERROR", "bad config");
        when(connector.doCreateConnection(any())).thenReturn(Mono.error(plugin));
        StepVerifier.create(pool.getOrCreateConnection(datasource("error-plugin", TYPE_A, V1)))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(plugin))
                .verify();
        System.out.println("[ClientBasedConnectionPoolBehaviourTest] raw error -> PLUGIN_CREATE_CONNECTION_FAILED; PluginException unchanged");
    }

    // ---------------------------------------------------------------- perf counters, destruction

    /** Catches missing create (:129) or removal (:114) counters: counted once per version, removal with its cause and type. */
    @Test
    void perfCounters_createOncePerLoad_andTheRemovalCountsItsCause() {
        connection(datasource("perf", TYPE_A, V1));
        ArgumentCaptor<Iterable> createTags = ArgumentCaptor.forClass(Iterable.class);
        verify(perf, times(1)).count(eq(PerfEvent.CLIENT_BASED_CONNECTION_CREATE), createTags.capture());
        assertThat(tags(createTags.getValue())).containsOnly(Map.entry("type", TYPE_A));
        verify(perf, never()).count(eq(PerfEvent.CLIENT_BASED_CONNECTION_REMOVE), any(Iterable.class));

        connection(datasource("perf", TYPE_A, V2)); // the update releases the previous version

        verify(perf, times(2)).count(eq(PerfEvent.CLIENT_BASED_CONNECTION_CREATE), any(Iterable.class));
        ArgumentCaptor<Iterable> removeTags = ArgumentCaptor.forClass(Iterable.class);
        verify(perf, times(1)).count(eq(PerfEvent.CLIENT_BASED_CONNECTION_REMOVE), removeTags.capture());
        assertThat(tags(removeTags.getValue())).containsOnly(Map.entry("type", TYPE_A), Map.entry("cause", "EXPLICIT"));
        System.out.println("[ClientBasedConnectionPoolBehaviourTest] create counted per load, removal counted with EXPLICIT");
    }

    /**
     * Catches a connection leak after a datasource edit (:118-120) and collateral invalidation (:164): the old version's
     * connection is destroyed on the connector, another datasource's connection is neither destroyed nor replaced.
     */
    @Test
    void update_destroysThePreviousConnectionOnTheConnector_andLeavesOtherDatasourcesAlone() {
        ClientBasedDatasourceConnectionHolder edited = connection(datasource("edited", TYPE_A, V1));
        Datasource other = datasource("other", TYPE_A, V1);
        ClientBasedDatasourceConnectionHolder otherHolder = connection(other);

        ClientBasedDatasourceConnectionHolder replaced = connection(datasource("edited", TYPE_A, V2));

        assertThat(replaced).isNotSameAs(edited);
        verify(connector, timeout(5000)).destroyConnection(edited.connection());
        assertThat(connection(other)).as("the other datasource keeps its holder").isSameAs(otherHolder);
        verify(connector, never()).destroyConnection(otherHolder.connection());
        verify(connector, never()).destroyConnection(replaced.connection());
        System.out.println("[ClientBasedConnectionPoolBehaviourTest] old version destroyed, other datasource untouched");
    }

    // ---------------------------------------------------------------- info

    /**
     * Catches info() listing other datasources for an id (:202), more than 100 entries (:204), and wrappers outliving
     * their datasource version (:116): after an update only the new wrapper is listed.
     */
    @Test
    void info_listsHikariWrappersById_limitedTo100_andDropsReplacedVersions() {
        when(connector.doCreateConnection(any())).thenAnswer(invocation -> Mono.just(wrapper(1, 2, 3, 11)));
        connection(datasource("info-a", TYPE_A, V1));
        connection(datasource("info-b", TYPE_A, V1));

        List<Map<String, Object>> forA = (List<Map<String, Object>>) pool.info(ID_PREFIX + "info-a");
        assertThat(forA).hasSize(1);
        Map<String, Integer> connections = (Map<String, Integer>) forA.get(0).get("connections");
        assertThat(connections).containsOnly(Map.entry("total", 11), Map.entry("idle", 2), Map.entry("active", 1), Map.entry("waiting", 3));
        assertThat((Properties) forA.get(0).get("datasource")).containsEntry("jdbcUrl", "jdbc:test");
        assertThat(forA.get(0)).containsKeys("healthCheck");

        for (String blank : new String[] {null, "", "  "}) {
            assertThat((List<?>) pool.info(blank)).as("all wrappers for blank id '" + blank + "'").hasSizeGreaterThanOrEqualTo(2);
        }

        when(connector.doCreateConnection(any())).thenAnswer(invocation -> Mono.just(wrapper(5, 6, 7, 22)));
        connection(datasource("info-a", TYPE_A, V2));
        List<Map<String, Object>> afterUpdate = (List<Map<String, Object>>) pool.info(ID_PREFIX + "info-a");
        assertThat(afterUpdate).as("old wrapper removed with its datasource version").hasSize(1);
        assertThat(((Map<String, Integer>) afterUpdate.get(0).get("connections")).get("total")).isEqualTo(22);

        for (int i = 0; i < 105; i++) {
            connection(datasource("info-many-" + i, TYPE_A, V1));
        }
        assertThat((List<?>) pool.info(null)).as("never more than 100 entries").hasSize(100);
        System.out.println("[ClientBasedConnectionPoolBehaviourTest] info: filtered by id, limit 100, replaced versions removed");
    }

    // ---------------------------------------------------------------- cache key

    /** Catches the cache key comparing the datasource object (:258): only id and update time count. */
    @Test
    void cacheKey_equalsOnIdAndUpdateTimeOnly() {
        ClientBasedDatasourceCacheKey key = ClientBasedDatasourceCacheKey.of(datasource("key", TYPE_A, V1));
        ClientBasedDatasourceCacheKey sameIdAndTime = ClientBasedDatasourceCacheKey.of(datasource("key", TYPE_B, V1));

        assertThat(key).isEqualTo(key).isEqualTo(sameIdAndTime).hasSameHashCodeAs(sameIdAndTime);
        assertThat(key).isNotEqualTo(ClientBasedDatasourceCacheKey.of(datasource("key", TYPE_A, V2)));
        assertThat(key).isNotEqualTo(ClientBasedDatasourceCacheKey.of(datasource("key-other", TYPE_A, V1)));
        assertThat(key).isNotEqualTo(null).isNotEqualTo("a string");
        System.out.println("[ClientBasedConnectionPoolBehaviourTest] cache key equality on id + update time");
    }

    // ---------------------------------------------------------------- section 9 candidates

    /**
     * BF-033 fixed: a failed creation was cached with the connection Mono, so every later query got the same failure until
     * the datasource was edited or an hour passed without access. Now the failed entry is dropped: the connector runs once
     * for the failing call (a failure is not retried), the next call creates the connection, which is then cached, and the
     * dropped entry destroys nothing and drops no error (Reactor's dropped-error hook sees nothing; it is global, so it is
     * reset afterwards).
     */
    @Test
    void failedConnectionCreation_isNotCached_theNextCallCreatesTheConnectionBF033() {
        List<Throwable> dropped = new CopyOnWriteArrayList<>();
        Hooks.onErrorDropped(dropped::add);
        try {
            createsTheConnectionAfterAFailure();
        } finally {
            Hooks.resetOnErrorDropped();
        }
        assertThat(dropped).as("errors dropped by the removal of the failed entry").isEmpty();
    }

    private void createsTheConnectionAfterAFailure() {
        AtomicInteger subscriptions = new AtomicInteger();
        when(connector.doCreateConnection(any())).thenAnswer(invocation -> Mono.defer(() -> subscriptions.incrementAndGet() == 1
                ? Mono.<Object>error(new IllegalStateException(DATABASE_DOWN))
                : Mono.just(RECOVERED)));
        Datasource datasource = datasource("cached-failure", TYPE_A, V1);

        StepVerifier.create(pool.getOrCreateConnection(datasource))
                .expectErrorSatisfies(error -> assertThat(error).isInstanceOf(BizException.class).hasMessageContaining(DATABASE_DOWN))
                .verify();
        assertThat(subscriptions.get()).as("the failing call ran the connector once, no retry").isEqualTo(1);

        ClientBasedDatasourceConnectionHolder recovered = connection(datasource);
        System.out.println("[ClientBasedConnectionPoolBehaviourTest] after a failure the next call got " + recovered.connection()
                + ", connector subscriptions " + subscriptions.get());
        assertThat(recovered.connection()).isEqualTo(RECOVERED);
        assertThat(connection(datasource)).as("the created connection is cached").isSameAs(recovered);
        assertThat(subscriptions.get()).isEqualTo(2);
        verify(connector, after(NO_DESTRUCTION_WAIT_MS).never()).destroyConnection(any());
    }

    /**
     * A connection that stays stale is retried {@value #STALE_RETRIES} times, then fails with its own message, as the plain
     * {@code retry} did before BF-033 limited the retries to stale connections. The cache is replaced by one whose every load
     * is a stale holder.
     */
    @Test
    void aConnectionThatStaysStale_isRetriedFiveTimes_thenFailsAsStale() {
        ClientBasedDatasourceConnectionHolder stale = new ClientBasedDatasourceConnectionHolder("stale-connection");
        stale.onQueryError(new InvalidHikariDatasourceException());
        AtomicInteger loads = new AtomicInteger();
        ReflectionTestUtils.setField(pool, "cache", CacheBuilder.newBuilder().build(new CacheLoader<ClientBasedDatasourceCacheKey, Mono<ClientBasedDatasourceConnectionHolder>>() {
            @Override
            public Mono<ClientBasedDatasourceConnectionHolder> load(ClientBasedDatasourceCacheKey key) {
                loads.incrementAndGet();
                return Mono.just(stale);
            }
        }));

        StepVerifier.create(pool.getOrCreateConnection(datasource("always-stale", TYPE_A, V1)))
                .expectErrorSatisfies(error -> {
                    System.out.println("[ClientBasedConnectionPoolBehaviourTest] always stale: " + error + " after " + loads.get() + " loads");
                    assertThat(error).isInstanceOf(BizException.class).hasMessageContaining(STALE_DATASOURCE);
                })
                .verify();
        assertThat(loads.get()).as("the first load and one per retry").isEqualTo(1 + STALE_RETRIES);
    }

    /**
     * A failing creation removes only its own cache entry: an entry loaded for the same key while the creation was still
     * running (here put in directly) stays and answers the next call.
     */
    @Test
    void aFailedCreation_removesOnlyItsOwnEntry_notOneLoadedAfterIt() throws Exception {
        Sinks.One<Object> creation = Sinks.one();
        when(connector.doCreateConnection(any())).thenReturn(creation.asMono());
        Datasource datasource = datasource("own-entry", TYPE_A, V1);
        ClientBasedDatasourceCacheKey key = ClientBasedDatasourceCacheKey.of(datasource);
        CompletableFuture<Throwable> failure = new CompletableFuture<>();
        pool.getOrCreateConnection(datasource).subscribe(holder -> failure.complete(null), failure::complete);
        awaitSubscriber(creation); // the failing entry is loaded and its creation is running
        ClientBasedDatasourceConnectionHolder newer = new ClientBasedDatasourceConnectionHolder("newer-connection");

        cache().asMap().put(key, Mono.just(newer));
        creation.tryEmitError(new IllegalStateException(DATABASE_DOWN));

        assertThat(failure.get(WAIT.toMillis(), TimeUnit.MILLISECONDS)).isInstanceOf(BizException.class);
        System.out.println("[ClientBasedConnectionPoolBehaviourTest] after the failure the key holds " + cache().asMap().get(key));
        assertThat(connection(datasource)).as("the entry loaded after the failing one is kept").isSameAs(newer);
    }

    private static void awaitSubscriber(Sinks.One<Object> creation) throws InterruptedException {
        long deadline = System.nanoTime() + WAIT.toNanos();
        while (creation.currentSubscriberCount() == 0) {
            assertThat(System.nanoTime()).as("the connector's creation was never subscribed").isLessThan(deadline);
            Thread.sleep(POLL_MS);
        }
    }

    /**
     * BF-081 (fixed; was pinned as the plan section 9 row "a client based connector that returns no connection completes
     * empty without an error"): the creation fails with PLUGIN_CREATE_CONNECTION_FAILED, as in TokenBasedConnectionPool,
     * and the failure is not cached, so the next call asks the connector again.
     */
    @Test
    void connectorWithoutAConnection_failsWithPluginCreateConnectionFailedAndIsNotCachedBF081() {
        when(connector.doCreateConnection(any())).thenReturn(Mono.empty());
        Datasource datasource = datasource("empty-connection", TYPE_A, V1);

        for (int call = 1; call <= 2; call++) {
            StepVerifier.create(pool.getOrCreateConnection(datasource))
                    .expectErrorSatisfies(error -> {
                        System.out.println("[ClientBasedConnectionPoolBehaviourTest] no connection -> " + error);
                        assertThat(error).isInstanceOf(BizException.class);
                        BizException biz = (BizException) error;
                        assertThat(biz.getError()).isEqualTo(BizError.PLUGIN_CREATE_CONNECTION_FAILED);
                        assertThat(biz.getArgs()).containsExactly(ClientBasedConnectionPool.NO_CONNECTION_CREATED);
                    })
                    .verify(WAIT);
            assertThat(cache().asMap()).as("cache after call " + call).isEmpty();
        }
        verify(connector, times(2)).doCreateConnection(any());
    }
}
