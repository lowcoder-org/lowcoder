package org.lowcoder.impl;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;
import org.lowcoder.domain.datasource.model.ClientBasedDatasourceConnectionHolder;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceConnectionHolder;
import org.lowcoder.domain.datasource.service.impl.ClientBasedConnectionPool;
import org.lowcoder.domain.datasource.service.impl.ClientBasedConnectionPool.ClientBasedDatasourceCacheKey;
import org.lowcoder.impl.mock.MockConnection;
import org.lowcoder.impl.mock.MockDatasourceConnectionConfig;
import org.lowcoder.impl.mock.MockDatasourceConnector;
import org.lowcoder.impl.mock.MockDatasourceMetaInfoService;
import org.lowcoder.infra.perf.PerfEvent;
import org.lowcoder.infra.perf.PerfHelper;
import org.lowcoder.sdk.exception.InvalidHikariDatasourceException;
import org.lowcoder.sdk.plugin.common.DatasourceConnector;

import com.google.common.cache.LoadingCache;

import io.micrometer.core.instrument.Tag;
import reactor.core.publisher.Mono;

@SuppressWarnings({"unchecked", "rawtypes"})
public class ClientBasedConnectionPoolTest {

    private static final ClientBasedConnectionPool POOL = new ClientBasedConnectionPool();

    private static LoadingCache<ClientBasedDatasourceCacheKey, Mono<ClientBasedDatasourceConnectionHolder>> POOL_CACHE;

    private static MockDatasourceMetaInfoService mockDatasourceMetaInfoService;

    @BeforeClass
    public static void init() throws NoSuchFieldException, IllegalAccessException {
        //init autowired
        Field datasourceMetaInfoService = POOL.getClass().getDeclaredField("datasourceMetaInfoService");
        datasourceMetaInfoService.setAccessible(true);
        mockDatasourceMetaInfoService = new MockDatasourceMetaInfoService();
        datasourceMetaInfoService.set(POOL, mockDatasourceMetaInfoService);
        Field perfHelper = POOL.getClass().getDeclaredField("perfHelper");
        perfHelper.setAccessible(true);
        perfHelper.set(POOL, new PerfHelper() {
            @Override
            public void count(PerfEvent event, Iterable<Tag> tags) {
            }

            @Override
            public void count(PerfEvent event, Iterable<Tag> tags, int count) {
            }
        });
        //retrieve cache field
        Field cacheField = POOL.getClass().getDeclaredField("cache");
        cacheField.setAccessible(true);
        POOL_CACHE = (LoadingCache<ClientBasedDatasourceCacheKey, Mono<ClientBasedDatasourceConnectionHolder>>) cacheField.get(POOL);
    }

    @Test
    public void testGetConnectionFirstAndAgain() {
        Datasource datasource = createDatasource(1);
        //first
        DatasourceConnectionHolder first = POOL.getOrCreateConnection(datasource).block();
        Assert.assertEquals(first, getFromCacheDirectly(datasource));
        //again
        DatasourceConnectionHolder again = POOL.getOrCreateConnection(datasource).block();
        Assert.assertEquals(again, getFromCacheDirectly(datasource));
        Assert.assertEquals(first, again);
    }

    @Test
    public void testConnectionExpired() {
        ClientBasedDatasourceConnectionHolder expired =
                (ClientBasedDatasourceConnectionHolder) POOL.getOrCreateConnection(createDatasource(2)).block();

        Datasource datasource = createDatasource(2);
        ClientBasedDatasourceConnectionHolder newConnection = (ClientBasedDatasourceConnectionHolder) POOL.getOrCreateConnection(datasource).block();
        Assert.assertNotEquals(expired, newConnection);
        Assert.assertEquals(newConnection, getFromCacheDirectly(datasource));
    }

    @Test
    public void testConnectionStale() {
        Datasource datasource = createDatasource(3);
        ClientBasedDatasourceConnectionHolder staled = (ClientBasedDatasourceConnectionHolder) POOL.getOrCreateConnection(datasource).block();
        Assert.assertNotNull(staled);
        staled.onQueryError(new InvalidHikariDatasourceException());
        //
        ClientBasedDatasourceConnectionHolder newConnection = (ClientBasedDatasourceConnectionHolder) POOL.getOrCreateConnection(datasource).block();
        Assert.assertNotEquals(staled, newConnection);
        Assert.assertEquals(newConnection, getFromCacheDirectly(datasource));
        Assert.assertTrue(((MockConnection) staled.connection()).isClose());
    }

    @Test
    public void testCreateConnectionConcurrent() {
        Datasource datasource = createDatasource(4);
        datasource.setDetailConfig(new MockDatasourceConnectionConfig(datasource));
        ExecutorService executorService = Executors.newFixedThreadPool(50);

        List<Future<ClientBasedDatasourceConnectionHolder>> futures = new ArrayList<>();
        CountDownLatch countDownLatch = new CountDownLatch(1);
        for (int i = 0; i < 100; i++) {
            Future<ClientBasedDatasourceConnectionHolder> future = executorService.submit(() -> {
                countDownLatch.await();
                return (ClientBasedDatasourceConnectionHolder) POOL.getOrCreateConnection(datasource).block();
            });
            futures.add(future);
        }
        countDownLatch.countDown();

        int size = (int) futures.stream()
                .map(clientBasedDatasourceConnectionFuture -> {
                    try {
                        return clientBasedDatasourceConnectionFuture.get();
                    } catch (InterruptedException | ExecutionException e) {
                        throw new RuntimeException(e);
                    }
                })
                .distinct()
                .count();
        Assert.assertEquals(1, size);
        DatasourceConnector datasourceConnector = mockDatasourceMetaInfoService.getDatasourceConnector(datasource.getType());
        MockDatasourceConnector mockDatasourceConnectionFactory = (MockDatasourceConnector) datasourceConnector;

        Assert.assertEquals(1, mockDatasourceConnectionFactory.getCreateTimes(datasource.getDetailConfig()));
    }

    private ClientBasedDatasourceConnectionHolder getFromCacheDirectly(Datasource datasource) {
        return POOL_CACHE.getUnchecked(ClientBasedDatasourceCacheKey.of(datasource)).block();
    }

    private Datasource createDatasource(int id) {
        Datasource datasource = new Datasource();
        datasource.setId(id + "");
        datasource.setUpdatedAt(Instant.now());
        datasource.setType("es");
        return datasource;
    }
}