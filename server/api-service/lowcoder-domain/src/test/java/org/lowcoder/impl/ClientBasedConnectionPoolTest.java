package org.lowcoder.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.BooleanSupplier;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.domain.datasource.model.ClientBasedDatasourceConnectionHolder;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.service.impl.ClientBasedConnectionPool;
import org.lowcoder.impl.mock.MockConnection;
import org.lowcoder.impl.mock.MockDatasourceConnectionConfig;
import org.lowcoder.impl.mock.MockDatasourceConnector;
import org.lowcoder.impl.mock.MockDatasourceMetaInfoService;
import org.lowcoder.infra.perf.PerfEvent;
import org.lowcoder.infra.perf.PerfHelper;
import org.lowcoder.sdk.exception.InvalidHikariDatasourceException;

import io.micrometer.core.instrument.Tag;

/**
 * {@link ClientBasedConnectionPool} with a connector that hands out {@link MockConnection}s and counts how often it
 * creates one per datasource version ({@link MockDatasourceConnector#getCreateTimes}). Each test uses datasource ids of its
 * own, since the pool and the connector's counts are shared by the class.
 *
 * <p>Limits: metrics are stubbed out (the pool's gauges and counters are not checked); the pool closes a replaced
 * connection asynchronously on the query scheduler, so closing is awaited up to {@link #CLOSE_TIMEOUT}.
 */
class ClientBasedConnectionPoolTest {

    private static final String DATASOURCE_TYPE = "es";
    private static final Instant FIRST_VERSION = Instant.parse("2026-01-01T00:00:00Z");
    private static final Instant SECOND_VERSION = FIRST_VERSION.plusSeconds(60);
    private static final int CONCURRENT_CALLERS = 100;
    private static final int THREADS = 50;
    private static final Duration CLOSE_TIMEOUT = Duration.ofSeconds(5);
    private static final Duration POLL_INTERVAL = Duration.ofMillis(20);

    private static final MockDatasourceMetaInfoService META_INFO_SERVICE = new MockDatasourceMetaInfoService();
    private static final MockDatasourceConnector CONNECTOR =
            (MockDatasourceConnector) (Object) META_INFO_SERVICE.getDatasourceConnector(DATASOURCE_TYPE);
    private static final ClientBasedConnectionPool POOL = new ClientBasedConnectionPool(META_INFO_SERVICE, new NoMetrics());
    private static final ExecutorService EXECUTOR = Executors.newFixedThreadPool(THREADS);

    @AfterAll
    static void shutDown() {
        EXECUTOR.shutdownNow();
    }

    @Test
    void secondRequestForTheSameDatasourceVersionReusesTheConnection() {
        Datasource datasource = datasource("reuse", FIRST_VERSION);

        ClientBasedDatasourceConnectionHolder first = connection(datasource);
        ClientBasedDatasourceConnectionHolder again = connection(datasource);
        System.out.println("[pool] reuse: first " + first.connection() + ", again " + again.connection());

        assertSame(first, again);
        assertEquals(1, CONNECTOR.getCreateTimes(datasource.getDetailConfig()));
    }

    @Test
    void updatedDatasourceGetsANewConnectionAndThePreviousOneIsClosed() {
        ClientBasedDatasourceConnectionHolder previous = connection(datasource("updated", FIRST_VERSION));
        Datasource updated = datasource("updated", SECOND_VERSION);

        ClientBasedDatasourceConnectionHolder current = connection(updated);
        System.out.println("[pool] update: previous " + previous.connection() + ", current " + current.connection());

        assertNotSame(previous, current);
        assertSame(current, connection(updated));
        awaitClosed(previous, "the connection of the previous datasource version");
        assertFalse(((MockConnection) current.connection()).isClose(), "the current connection must stay open");
    }

    @Test
    void connectionMarkedStaleByAHikariErrorIsReplacedAndClosed() {
        Datasource datasource = datasource("stale", FIRST_VERSION);
        ClientBasedDatasourceConnectionHolder stale = connection(datasource);

        stale.onQueryError(new InvalidHikariDatasourceException());
        ClientBasedDatasourceConnectionHolder replacement = connection(datasource);
        System.out.println("[pool] stale: stale " + stale.connection() + ", replacement " + replacement.connection());

        assertTrue(stale.isStale());
        assertNotSame(stale, replacement);
        assertFalse(replacement.isStale());
        awaitClosed(stale, "the stale connection");
    }

    @Test
    void otherQueryErrorsKeepTheConnection() {
        Datasource datasource = datasource("other-error", FIRST_VERSION);
        ClientBasedDatasourceConnectionHolder holder = connection(datasource);

        holder.onQueryError(new IllegalStateException("query failed"));

        assertFalse(holder.isStale());
        assertSame(holder, connection(datasource));
    }

    @Test
    void concurrentFirstRequestsCreateOneConnection() throws Exception {
        Datasource datasource = datasource("concurrent", FIRST_VERSION);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<ClientBasedDatasourceConnectionHolder>> futures = new ArrayList<>();
        for (int i = 0; i < CONCURRENT_CALLERS; i++) {
            futures.add(EXECUTOR.submit(() -> {
                start.await();
                return connection(datasource);
            }));
        }
        start.countDown();

        List<ClientBasedDatasourceConnectionHolder> holders = new ArrayList<>();
        for (Future<ClientBasedDatasourceConnectionHolder> future : futures) {
            holders.add(future.get(CLOSE_TIMEOUT.toMillis(), TimeUnit.MILLISECONDS));
        }
        long distinct = holders.stream().distinct().count();
        System.out.println("[pool] concurrent: " + CONCURRENT_CALLERS + " callers, " + distinct + " distinct connection(s), "
                + CONNECTOR.getCreateTimes(datasource.getDetailConfig()) + " created");

        assertEquals(1, distinct);
        assertEquals(1, CONNECTOR.getCreateTimes(datasource.getDetailConfig()));
    }

    private static ClientBasedDatasourceConnectionHolder connection(Datasource datasource) {
        return (ClientBasedDatasourceConnectionHolder) POOL.getOrCreateConnection(datasource).block(CLOSE_TIMEOUT);
    }

    private static Datasource datasource(String id, Instant version) {
        Datasource datasource = new Datasource();
        datasource.setId(id);
        datasource.setUpdatedAt(version);
        datasource.setType(DATASOURCE_TYPE);
        datasource.setDetailConfig(new MockDatasourceConnectionConfig(datasource));
        return datasource;
    }

    private static void awaitClosed(ClientBasedDatasourceConnectionHolder holder, String what) {
        MockConnection connection = (MockConnection) holder.connection();
        assertTrue(poll(connection::isClose), what + " was not closed within " + CLOSE_TIMEOUT);
    }

    private static boolean poll(BooleanSupplier condition) {
        long deadline = System.nanoTime() + CLOSE_TIMEOUT.toNanos();
        while (System.nanoTime() < deadline) {
            if (condition.getAsBoolean()) {
                return true;
            }
            try {
                Thread.sleep(POLL_INTERVAL.toMillis());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return condition.getAsBoolean();
    }

    /** {@link PerfHelper} without a meter registry: the pool's counters are not under test. */
    private static final class NoMetrics extends PerfHelper {
        @Override
        public void count(PerfEvent event, Iterable<Tag> tags) {
        }

        @Override
        public void count(PerfEvent event, Iterable<Tag> tags, int count) {
        }
    }
}
