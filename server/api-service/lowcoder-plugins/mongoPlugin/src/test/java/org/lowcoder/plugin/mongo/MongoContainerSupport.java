package org.lowcoder.plugin.mongo;

import org.bson.Document;
import org.lowcoder.plugin.mongo.model.MongoConnection;
import org.lowcoder.plugin.mongo.model.MongoDatasourceConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.ContainerImages;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.util.Map;

/**
 * The shared MongoDB 7.0 container of the L5-8d tests (default build, not heavy-container: one per test JVM, started on first
 * use, removed by Testcontainers' reaper when the JVM exits; the port is the one Docker assigns). A generic container, not the
 * module's MongoDBContainer: the module classes need commons-lang3 3.18 and this module's classpath resolves 3.13.0 (see
 * log-L5.md). Start is robust in two steps: a log wait with a bounded startup timeout, then a bounded ping loop, so a server
 * that logged readiness but does not answer yet cannot fail a test. No Docker guard on purpose (owner decision D-7). Not a test.
 */
final class MongoContainerSupport {

    static final String DATABASE = "mg6";
    static final int MONGO_PORT = 27017;
    private static final String READY_PATTERN = ".*[Ww]aiting for connections.*";
    private static final Duration START_TIMEOUT = Duration.ofMinutes(2);
    private static final Duration PING_TIMEOUT = Duration.ofSeconds(10);
    private static final int PING_ATTEMPTS = 30;
    private static final long PING_PAUSE_MILLIS = 500;
    static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(30);

    private static final GenericContainer<?> MONGO = new GenericContainer<>(DockerImageName.parse(ContainerImages.MONGO_7_0))
            .withExposedPorts(MONGO_PORT)
            .waitingFor(Wait.forLogMessage(READY_PATTERN, 1).withStartupTimeout(START_TIMEOUT));

    static final MongoPlugin.MongoEngine ENGINE = new MongoPlugin.MongoEngine(new ConfigCenterForTest());

    static {
        long start = System.nanoTime();
        MONGO.start();
        System.out.println("[MongoContainerSupport] " + ContainerImages.MONGO_7_0 + " started in "
                + (System.nanoTime() - start) / 1_000_000 + " ms on " + MONGO.getHost() + ":" + MONGO.getMappedPort(MONGO_PORT));
        awaitPing();
    }

    private MongoContainerSupport() {
    }

    static String host() {
        return MONGO.getHost();
    }

    static int port() {
        return MONGO.getMappedPort(MONGO_PORT);
    }

    static MongoDatasourceConfig hostConfig() {
        return MongoDatasourceConfig.buildFrom(Map.of("host", host(), "port", port(), "database", DATABASE));
    }

    static MongoDatasourceConfig uriConfig(String uri) {
        return MongoDatasourceConfig.buildFrom(Map.of("usingUri", true, "uri", uri));
    }

    private static void awaitPing() {
        RuntimeException last = null;
        for (int attempt = 1; attempt <= PING_ATTEMPTS; attempt++) {
            MongoConnection connection = null;
            try {
                connection = ENGINE.createConnection(hostConfig()).block(BLOCK_TIMEOUT);
                Document pong = connection.ping().block(PING_TIMEOUT);
                System.out.println("[MongoContainerSupport] ping answered on attempt " + attempt + ": " + pong.toJson());
                return;
            } catch (RuntimeException e) {
                last = e;
                try {
                    Thread.sleep(PING_PAUSE_MILLIS);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("interrupted while waiting for MongoDB", interrupted);
                }
            } finally {
                if (connection != null) {
                    connection.close().block(BLOCK_TIMEOUT);
                }
            }
        }
        throw new IllegalStateException("MongoDB did not answer a ping after " + PING_ATTEMPTS + " attempts", last);
    }
}
