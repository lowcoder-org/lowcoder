package org.lowcoder.plugin.clickhouse;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.clickhouse.model.ClickHouseDatasourceConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceTestResult;
import reactor.core.Disposable;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * BF-151: {@link ClickHouseConnector#createConnection}'s timeout. The blocking creation of the pool ran inside the
 * subscription, before {@code Mono.timeout} armed its timer, so the configured timeout never fired: a silent server
 * answered only when the driver gave up, about 21 s later, with DATASOURCE_ARGUMENT_ERROR instead of
 * DATASOURCE_TIMEOUT_ERROR. {@link ClickHouseConnector#createWithTimeout} now runs the creation on the shared query
 * scheduler and closes a pool that arrives after the timeout or a cancel.
 *
 * <p>Limits: the connector is called directly, not through the REST endpoints. The silent server is a local socket that
 * accepts and never answers; {@code validateConfig} refuses a loopback host, so through the API the same server would
 * have to be reached by another name. The pools of the helper tests are
 * unstarted {@link HikariDataSource}s, so no driver is involved there. The background creation of the silent-server
 * test keeps running after the test until the driver gives up.
 */
public class ClickHouseConnectorCreateConnectionTimeoutTest {

    static final String TAG = "[ClickHouseConnectorCreateConnectionTimeoutTest] ";
    static final String CREATE_CONNECTION_TIMEOUT_KEY = "createConnectionTimeout";
    static final int SHORT_TIMEOUT_MS = 500;
    /** Long enough for the pool's own initialization failure (4 s) to come first. */
    static final int LONG_TIMEOUT_MS = 15_000;
    static final Duration HELPER_TIMEOUT = Duration.ofMillis(100);
    /** The longest the timeout error may take after {@link #SHORT_TIMEOUT_MS}; HEAD took about 21 s. */
    static final Duration TIMEOUT_SLACK = Duration.ofSeconds(3);
    static final Duration BLOCK_LIMIT = Duration.ofSeconds(8);
    /** Longer than the sdk's own 10 s connection timeout, so that a run without the fix shows when that one fires. */
    static final Duration TEST_CONNECTION_BLOCK_LIMIT = Duration.ofSeconds(15);
    /** DATASOURCE_TIMEOUT_ERROR in the English bundle. */
    static final String TIMEOUT_MESSAGE = "Datasource connect timed out, please check its configuration.";
    static final Duration CLOSE_WAIT = Duration.ofSeconds(5);
    static final Duration RELEASE_WAIT = Duration.ofSeconds(10);
    static final String HOST = "127.0.0.1";
    static final String DATABASE = "app";
    static final String CREATION_FAILURE_KEY = "DATASOURCE_ARGUMENT_ERROR";

    private ServerSocket silentServer;
    private final List<Socket> heldSockets = new CopyOnWriteArrayList<>();

    @AfterEach
    void closeServer() throws IOException {
        for (Socket socket : heldSockets) {
            socket.close();
        }
        if (silentServer != null) {
            silentServer.close();
        }
    }

    /** A local server that accepts every connection and never answers. */
    private int startSilentServer() throws IOException {
        silentServer = new ServerSocket(0, 50, InetAddress.getByName(HOST));
        Thread acceptor = new Thread(() -> {
            while (!silentServer.isClosed()) {
                try {
                    heldSockets.add(silentServer.accept());
                } catch (IOException closed) {
                    return;
                }
            }
        }, "silent-clickhouse");
        acceptor.setDaemon(true);
        acceptor.start();
        return silentServer.getLocalPort();
    }

    /** A port nothing listens on: a server socket bound and closed again. */
    private static int refusedPort() throws IOException {
        try (ServerSocket socket = new ServerSocket(0, 1, InetAddress.getByName(HOST))) {
            return socket.getLocalPort();
        }
    }

    private static ClickHouseConnector connector(int createConnectionTimeoutMs) {
        return new ClickHouseConnector(new ConfigCenterForTest(Map.of(CREATE_CONNECTION_TIMEOUT_KEY, createConnectionTimeoutMs)));
    }

    private static ClickHouseDatasourceConfig datasource(int port) {
        return ClickHouseDatasourceConfig.builder().host(HOST).port((long) port).database(DATABASE).build();
    }

    /** The error {@code createConnection} ends with, waiting at most {@link #BLOCK_LIMIT}; the elapsed time is printed. */
    private static Throwable createConnectionError(ClickHouseConnector connector, ClickHouseDatasourceConfig config, String label) {
        long start = System.nanoTime();
        Throwable error = null;
        try {
            HikariDataSource dataSource = connector.createConnection(config).block(BLOCK_LIMIT);
            if (dataSource != null) {
                dataSource.close();
            }
        } catch (RuntimeException e) {
            error = e;
        }
        Duration elapsed = Duration.ofNanos(System.nanoTime() - start);
        System.out.println(TAG + label + " -> " + error + " after " + elapsed.toMillis() + " ms");
        return assertInstanceOf(Throwable.class, error, label + ": an error");
    }

    /**
     * BF-151: a silent server gives DATASOURCE_TIMEOUT_ERROR soon after the configured timeout. Catches: the creation run
     * inside the subscription again, where the block limit passes first (and the driver's own failure came after ~21 s).
     */
    @Test
    public void aSilentServerGivesTheTimeoutErrorAfterTheConfiguredTimeoutBF151() throws IOException {
        int port = startSilentServer();
        long start = System.nanoTime();
        Throwable error = createConnectionError(connector(SHORT_TIMEOUT_MS), datasource(port), "silent server, timeout " + SHORT_TIMEOUT_MS + " ms");
        Duration elapsed = Duration.ofNanos(System.nanoTime() - start);

        PluginException plugin = assertInstanceOf(PluginException.class, error);
        assertEquals(PluginCommonError.DATASOURCE_TIMEOUT_ERROR, plugin.getError());
        assertTrue(elapsed.compareTo(Duration.ofMillis(SHORT_TIMEOUT_MS).plus(TIMEOUT_SLACK)) < 0, "took " + elapsed.toMillis() + " ms");
    }

    /**
     * BF-151 at the connector's datasource test: {@code testConnection} goes through the sdk's {@code doCreateConnection},
     * which adds its own 10 s timeout. {@code POST /api/datasources/test} reaches the connector through
     * {@code DatasourceServiceImpl}, which validates the config first and then calls {@code doTestConnection}, ending here.
     * A silent server fails with the timeout message soon after the configured timeout. Catches: the configured timeout
     * ignored again, so only the sdk's 10 s one fires.
     */
    @Test
    public void testingASilentServerFailsWithTheTimeoutMessageAfterTheConfiguredTimeoutBF151() throws IOException {
        int port = startSilentServer();
        long start = System.nanoTime();
        DatasourceTestResult result = connector(SHORT_TIMEOUT_MS).testConnection(datasource(port)).block(TEST_CONNECTION_BLOCK_LIMIT);
        Duration elapsed = Duration.ofNanos(System.nanoTime() - start);
        String message = result == null ? null : result.getInvalidMessage(Locale.ENGLISH);
        System.out.println(TAG + "test of a silent server, timeout " + SHORT_TIMEOUT_MS + " ms -> " + message + " after " + elapsed.toMillis() + " ms");

        assertFalse(result.isSuccess());
        assertEquals(TIMEOUT_MESSAGE, message);
        assertTrue(elapsed.compareTo(Duration.ofMillis(SHORT_TIMEOUT_MS).plus(TIMEOUT_SLACK)) < 0, "took " + elapsed.toMillis() + " ms");
    }

    /** Control: a pool that cannot start (nothing listens) is still DATASOURCE_ARGUMENT_ERROR, before a long timeout. */
    @Test
    public void aRefusedConnectionIsStillTheArgumentError() throws IOException {
        Throwable error = createConnectionError(connector(LONG_TIMEOUT_MS), datasource(refusedPort()), "refused port, timeout " + LONG_TIMEOUT_MS + " ms");

        PluginException plugin = assertInstanceOf(PluginException.class, error);
        assertEquals(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, plugin.getError());
        assertEquals(CREATION_FAILURE_KEY, plugin.getMessageKey());
    }

    /** A creation that waits for {@code release} (at most {@link #RELEASE_WAIT}) and then gives {@code dataSource}. */
    private static Supplier<HikariDataSource> createdAfter(CountDownLatch release, HikariDataSource dataSource) {
        return () -> {
            try {
                release.await(RELEASE_WAIT.toMillis(), TimeUnit.MILLISECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return dataSource;
        };
    }

    private static void awaitClosed(HikariDataSource dataSource, String label) throws InterruptedException {
        long deadline = System.nanoTime() + CLOSE_WAIT.toNanos();
        while (!dataSource.isClosed() && System.nanoTime() < deadline) {
            Thread.sleep(10);
        }
        System.out.println(TAG + label + ": closed=" + dataSource.isClosed());
        assertTrue(dataSource.isClosed(), label + ": the late pool is closed");
    }

    /** A pool created in time is delivered, open. */
    @Test
    public void aDataSourceCreatedInTimeIsDeliveredOpen() {
        HikariDataSource dataSource = new HikariDataSource();
        StepVerifier.create(ClickHouseConnector.createWithTimeout(() -> dataSource, HELPER_TIMEOUT))
                .assertNext(delivered -> assertSame(dataSource, delivered))
                .verifyComplete();
        assertFalse(dataSource.isClosed());
        dataSource.close();
    }

    /** BF-151: a pool that arrives after the timeout is closed, not leaked; the subscriber gets the TimeoutException. */
    @Test
    public void aDataSourceCreatedAfterTheTimeoutIsClosedBF151() throws InterruptedException {
        CountDownLatch release = new CountDownLatch(1);
        HikariDataSource late = new HikariDataSource();
        StepVerifier.create(ClickHouseConnector.createWithTimeout(createdAfter(release, late), HELPER_TIMEOUT))
                .expectError(TimeoutException.class)
                .verify(BLOCK_LIMIT);
        assertFalse(late.isClosed(), "not created yet");
        release.countDown();
        awaitClosed(late, "created after the timeout");
    }

    /** A pool that arrives after the subscriber cancelled is closed as well. */
    @Test
    public void aDataSourceCreatedAfterACancelIsClosed() throws InterruptedException {
        CountDownLatch release = new CountDownLatch(1);
        HikariDataSource late = new HikariDataSource();
        Disposable subscription = ClickHouseConnector.createWithTimeout(createdAfter(release, late), RELEASE_WAIT).subscribe();
        subscription.dispose();
        release.countDown();
        awaitClosed(late, "created after a cancel");
    }

    /** The creation's own error reaches the subscriber as it was thrown, not wrapped in a CompletionException. */
    @Test
    public void aCreationErrorReachesTheSubscriberUnwrapped() {
        PluginException failure = new PluginException(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, CREATION_FAILURE_KEY, "no pool");
        StepVerifier.create(ClickHouseConnector.createWithTimeout(() -> { throw failure; }, HELPER_TIMEOUT))
                .expectErrorSatisfies(error -> assertSame(failure, error))
                .verify(BLOCK_LIMIT);
    }
}
