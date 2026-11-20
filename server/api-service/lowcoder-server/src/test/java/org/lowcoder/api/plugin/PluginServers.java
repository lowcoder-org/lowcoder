package org.lowcoder.api.plugin;

import org.lowcoder.sdk.contract.ContainerImages;
import org.testcontainers.containers.Container.ExecResult;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.lifecycle.Startables;
import org.testcontainers.utility.DockerImageName;

import java.io.IOException;
import java.time.Duration;

/**
 * The database servers of {@link ShadedPluginJarsIntegrationTest}: PostgreSQL, MySQL, ClickHouse, MongoDB with authentication and a
 * password-protected Redis, all pinned images of {@link ContainerImages}, started once per test JVM, in parallel, on first use, and removed by
 * Testcontainers' reaper when the JVM exits (the shared-container pattern of {@code TestContainers}). Generic containers, as in
 * the plugins' own tests; nothing is copied into a container. No Docker guard on purpose: without a Docker daemon the first use fails.
 * Not a test.
 */
final class PluginServers {

    static final String DATABASE = "app";
    static final String USER = "appuser";
    static final String PASSWORD = "apppass";
    static final String WRONG_PASSWORD = "not-the-password";
    static final String MONGO_ROOT_USER = "root";
    static final String MONGO_ROOT_PASSWORD = "root-pw";
    static final String REDIS_PASSWORD = "s3cret-pass";

    static final int POSTGRES_PORT = 5432;
    static final int MYSQL_PORT = 3306;
    static final int CLICKHOUSE_HTTP_PORT = 8123;
    static final int MONGO_PORT = 27017;
    static final int REDIS_PORT = 6379;

    private static final Duration START_TIMEOUT = Duration.ofMinutes(3);
    private static final int POSTGRES_READY_MESSAGES = 2;
    private static final int MONGO_READY_MESSAGES = 2;
    private static final int MONGOSH_ATTEMPTS = 20;
    private static final long MONGOSH_PAUSE_MILLIS = 500;

    private static final GenericContainer<?> POSTGRES = new GenericContainer<>(DockerImageName.parse(ContainerImages.POSTGRES_16))
            .withEnv("POSTGRES_DB", DATABASE).withEnv("POSTGRES_USER", USER).withEnv("POSTGRES_PASSWORD", PASSWORD)
            .withExposedPorts(POSTGRES_PORT)
            .waitingFor(Wait.forLogMessage(".*database system is ready to accept connections.*", POSTGRES_READY_MESSAGES).withStartupTimeout(START_TIMEOUT));

    private static final GenericContainer<?> MYSQL = new GenericContainer<>(DockerImageName.parse(ContainerImages.MYSQL_8_0))
            .withEnv("MYSQL_DATABASE", DATABASE).withEnv("MYSQL_USER", USER).withEnv("MYSQL_PASSWORD", PASSWORD)
            .withEnv("MYSQL_ROOT_PASSWORD", PASSWORD)
            .withExposedPorts(MYSQL_PORT)
            .waitingFor(Wait.forLogMessage(".*ready for connections.*port: 3306.*", 1).withStartupTimeout(START_TIMEOUT));

    private static final GenericContainer<?> CLICKHOUSE = new GenericContainer<>(DockerImageName.parse(ContainerImages.CLICKHOUSE_24_8))
            .withEnv("CLICKHOUSE_DB", DATABASE).withEnv("CLICKHOUSE_USER", USER).withEnv("CLICKHOUSE_PASSWORD", PASSWORD)
            .withExposedPorts(CLICKHOUSE_HTTP_PORT)
            .waitingFor(Wait.forHttp("/ping").forStatusCode(200).withStartupTimeout(START_TIMEOUT));

    /** The image's init phase starts a temporary server, so readiness is the second "Waiting for connections" line. */
    private static final GenericContainer<?> MONGO = new GenericContainer<>(DockerImageName.parse(ContainerImages.MONGO_7_0))
            .withEnv("MONGO_INITDB_ROOT_USERNAME", MONGO_ROOT_USER).withEnv("MONGO_INITDB_ROOT_PASSWORD", MONGO_ROOT_PASSWORD)
            .withExposedPorts(MONGO_PORT)
            .waitingFor(Wait.forLogMessage(".*[Ww]aiting for connections.*", MONGO_READY_MESSAGES).withStartupTimeout(START_TIMEOUT));

    private static final GenericContainer<?> REDIS = new GenericContainer<>(DockerImageName.parse(ContainerImages.REDIS_7_2))
            .withExposedPorts(REDIS_PORT).withCommand("redis-server", "--requirepass", REDIS_PASSWORD)
            .waitingFor(Wait.forLogMessage(".*Ready to accept connections.*", 1).withStartupTimeout(START_TIMEOUT));

    static {
        long start = System.nanoTime();
        Startables.deepStart(POSTGRES, MYSQL, CLICKHOUSE, MONGO, REDIS).join();
        createMongoAppUser();
        System.out.println("[PluginServers] postgres " + postgresPort() + ", mysql " + mysqlPort() + ", clickhouse " + clickhousePort()
                + ", mongo " + mongoPort() + ", redis " + redisPort() + " started in " + (System.nanoTime() - start) / 1_000_000 + " ms");
    }

    private PluginServers() {
    }

    static String host() {
        return POSTGRES.getHost();
    }

    static int postgresPort() {
        return POSTGRES.getMappedPort(POSTGRES_PORT);
    }

    static int mysqlPort() {
        return MYSQL.getMappedPort(MYSQL_PORT);
    }

    static int clickhousePort() {
        return CLICKHOUSE.getMappedPort(CLICKHOUSE_HTTP_PORT);
    }

    static int mongoPort() {
        return MONGO.getMappedPort(MONGO_PORT);
    }

    static int redisPort() {
        return REDIS.getMappedPort(REDIS_PORT);
    }

    /** The user of database {@link #DATABASE}, created with {@code mongosh} run in the container (an exec; the root user lives in {@code admin}). */
    private static void createMongoAppUser() {
        String script = "db.getSiblingDB('" + DATABASE + "').createUser({user: '" + USER + "', pwd: '" + PASSWORD
                + "', roles: [{role: 'readWrite', db: '" + DATABASE + "'}]})";
        RuntimeException last = null;
        for (int attempt = 1; attempt <= MONGOSH_ATTEMPTS; attempt++) {
            try {
                ExecResult result = MONGO.execInContainer("mongosh", "--quiet", "-u", MONGO_ROOT_USER, "-p", MONGO_ROOT_PASSWORD,
                        "--authenticationDatabase", "admin", "--eval", script);
                if (result.getExitCode() == 0) {
                    System.out.println("[PluginServers] mongo user " + USER + " created on attempt " + attempt + ": " + result.getStdout().trim());
                    return;
                }
                last = new IllegalStateException("mongosh exit " + result.getExitCode() + ": " + result.getStdout() + result.getStderr());
            } catch (IOException e) {
                last = new IllegalStateException("cannot run mongosh in the container", e);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("interrupted while creating the mongo user", e);
            }
            try {
                Thread.sleep(MONGOSH_PAUSE_MILLIS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("interrupted while creating the mongo user", e);
            }
        }
        throw new IllegalStateException("cannot create the mongo user " + USER + " after " + MONGOSH_ATTEMPTS + " attempts", last);
    }
}
