package org.lowcoder.plugin.mongo;

import org.lowcoder.plugin.mongo.model.MongoConnection;
import org.lowcoder.plugin.mongo.model.MongoDatasourceConfig;
import org.lowcoder.plugin.mongo.utils.MongoQueryUtils;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.ContainerImages;
import org.testcontainers.containers.Container.ExecResult;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;

import java.io.IOException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The shared MongoDB 7.0 container with authentication of the Mongo authentication tests (default build, not
 * heavy-container: one per test JVM, started on first use, removed by Testcontainers' reaper when the JVM exits). The image's
 * {@code MONGO_INITDB_ROOT_USERNAME} and {@code MONGO_INITDB_ROOT_PASSWORD} create the root user in the {@code admin}
 * database, and the server then runs with authentication on; this class adds the user {@link #APP_USER} in database
 * {@link #DATABASE} with {@code mongosh} run in the container (an exec, no file is copied in). A generic container, as in
 * {@link MongoContainerSupport}. The image's init phase starts a temporary server, so readiness is the second "Waiting for
 * connections" line, then a bounded loop until the root user can ping. No Docker guard on purpose (owner decision D-7).
 * Not a test.
 */
final class MongoAuthContainerSupport {

    static final String DATABASE = "app";
    static final String ADMIN_DATABASE = "admin";
    static final String ROOT_USER = "root";
    static final String ROOT_PASSWORD = "root-pw";
    static final String APP_USER = "appuser";
    static final String APP_PASSWORD = "app:p@ss/w#rd%1";
    static final String WRONG_PASSWORD = "not-the-password";
    static final int MONGO_PORT = 27017;
    private static final String READY_PATTERN = ".*[Ww]aiting for connections.*";
    private static final int READY_MESSAGES = 2;
    private static final Duration START_TIMEOUT = Duration.ofMinutes(2);
    private static final Duration PING_TIMEOUT = Duration.ofSeconds(10);
    private static final int PING_ATTEMPTS = 30;
    private static final long PING_PAUSE_MILLIS = 500;
    static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(30);

    private static final GenericContainer<?> MONGO = new GenericContainer<>(DockerImageName.parse(ContainerImages.MONGO_7_0))
            .withEnv("MONGO_INITDB_ROOT_USERNAME", ROOT_USER).withEnv("MONGO_INITDB_ROOT_PASSWORD", ROOT_PASSWORD)
            .withExposedPorts(MONGO_PORT)
            .waitingFor(Wait.forLogMessage(READY_PATTERN, READY_MESSAGES).withStartupTimeout(START_TIMEOUT));

    static final MongoPlugin.MongoEngine ENGINE = new MongoPlugin.MongoEngine(new ConfigCenterForTest());

    static {
        long start = System.nanoTime();
        MONGO.start();
        System.out.println("[MongoAuthContainerSupport] " + ContainerImages.MONGO_7_0 + " with authentication started in "
                + (System.nanoTime() - start) / 1_000_000 + " ms on " + MONGO.getHost() + ":" + MONGO.getMappedPort(MONGO_PORT));
        awaitRootPing();
        createAppUser();
    }

    private MongoAuthContainerSupport() {
    }

    static String host() {
        return MONGO.getHost();
    }

    static int port() {
        return MONGO.getMappedPort(MONGO_PORT);
    }

    /** A host-mode config ({@code usingUri} false); the authentication database is {@code database}, there is no field for another one. */
    static MongoDatasourceConfig hostConfig(String database, String username, String password, String authMechanism) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("host", host());
        values.put("port", port());
        values.put("database", database);
        if (username != null) {
            values.put("username", username);
        }
        if (password != null) {
            values.put("password", password);
        }
        if (authMechanism != null) {
            values.put("authMechanism", authMechanism);
        }
        return MongoDatasourceConfig.buildFrom(values);
    }

    static MongoDatasourceConfig uriConfig(String uri) {
        return MongoDatasourceConfig.buildFrom(Map.of("usingUri", true, "uri", uri));
    }

    /** {@code mongodb://<user>:<password>@host:port/<database>} plus {@code query} (with its leading {@code ?}, or empty); user and password are percent-encoded. */
    static String uri(String user, String password, String database, String query) {
        return "mongodb://" + (user == null ? "" : MongoQueryUtils.urlEncode(user) + ":" + MongoQueryUtils.urlEncode(password) + "@") + host() + ":" + port()
                + "/" + database + query;
    }

    private static void awaitRootPing() {
        RuntimeException last = null;
        for (int attempt = 1; attempt <= PING_ATTEMPTS; attempt++) {
            MongoConnection connection = null;
            try {
                connection = ENGINE.createConnection(hostConfig(ADMIN_DATABASE, ROOT_USER, ROOT_PASSWORD, null)).block(BLOCK_TIMEOUT);
                System.out.println("[MongoAuthContainerSupport] root ping answered on attempt " + attempt + ": "
                        + connection.ping().block(PING_TIMEOUT).toJson());
                return;
            } catch (RuntimeException e) {
                last = e;
                pause();
            } finally {
                if (connection != null) {
                    connection.close().block(BLOCK_TIMEOUT);
                }
            }
        }
        throw new IllegalStateException("MongoDB with authentication did not answer a root ping after " + PING_ATTEMPTS + " attempts", last);
    }

    /** The user of {@link #DATABASE}: read and write there only, so only a login that authenticates against {@code app} reaches it. */
    private static void createAppUser() {
        String script = "db.getSiblingDB('" + DATABASE + "').createUser({user: '" + APP_USER + "', pwd: '" + APP_PASSWORD
                + "', roles: [{role: 'readWrite', db: '" + DATABASE + "'}]})";
        try {
            ExecResult result = MONGO.execInContainer("mongosh", "--quiet", "-u", ROOT_USER, "-p", ROOT_PASSWORD,
                    "--authenticationDatabase", ADMIN_DATABASE, "--eval", script);
            System.out.println("[MongoAuthContainerSupport] createUser exit " + result.getExitCode() + ": " + result.getStdout().trim()
                    + result.getStderr().trim());
            if (result.getExitCode() != 0) {
                throw new IllegalStateException("cannot create " + APP_USER + ": " + result.getStdout() + result.getStderr());
            }
        } catch (IOException e) {
            throw new IllegalStateException("cannot run mongosh in the container", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("interrupted while creating " + APP_USER, e);
        }
    }

    private static void pause() {
        try {
            Thread.sleep(PING_PAUSE_MILLIS);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("interrupted while waiting for MongoDB", interrupted);
        }
    }
}
