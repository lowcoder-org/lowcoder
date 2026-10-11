package org.lowcoder.api.common;

import com.github.dockerjava.api.command.CreateContainerCmd;
import com.github.dockerjava.api.model.Ulimit;
import org.lowcoder.sdk.contract.ContainerImages;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.mongodb.MongoDBContainer;
import org.testcontainers.lifecycle.Startables;
import org.testcontainers.utility.DockerImageName;

/**
 * The MongoDB and Redis servers of this module's Spring Boot tests: one container of each per test JVM, started on first
 * use (the first application context, through {@link TestContainersInitializer}) and shared by every context of the JVM.
 * They replace the embedded servers the tests used before (flapdoodle's mongod and it.ozimov's redis-server).
 *
 * <p>Ports are mapped by Docker to free host ports, so builds running at the same time on one machine do not collide.
 *
 * <p>Lifecycle: the containers are never stopped by the tests. Testcontainers' reaper (Ryuk) removes them when the JVM
 * exits, which is the shared-container pattern Testcontainers documents; stopping them from one context would break the
 * other contexts cached by the Spring test framework.
 *
 * <p>Limits: the tests need a running Docker daemon; without one the first context fails to start with Testcontainers'
 * "Could not find a valid Docker environment". MongoDB runs as a single-node replica set (how {@link MongoDBContainer}
 * starts it), where the embedded mongod was standalone; the module's whole suite passed against it (1117 unit and 93
 * integration tests, 2026-10-04), which shows no test depends on the difference, not that none ever could.
 */
public final class TestContainers {

    /** MongoDB 4.0, the line of the embedded mongod the tests ran against before (4.0.2); pinned by digest. */
    static final DockerImageName MONGO_IMAGE =
            DockerImageName.parse(ContainerImages.MONGO_4_0).asCompatibleSubstituteFor("mongo");
    static final DockerImageName REDIS_IMAGE = DockerImageName.parse(ContainerImages.REDIS_7_2);
    static final int REDIS_PORT = 6379;

    /**
     * The open-file limit of the MongoDB container. The image's default soft limit is 1024, and every context opens a
     * connection pool and a database of its own whose collections and indexes are files mongod keeps open: the merged
     * suite of the coverage-gate work (2026-10-05) reached it, mongod logged "Too many open files" and aborted (exit 14),
     * and every later MongoDB test failed. 65536 is the limit MongoDB's production notes recommend (64000 or more).
     * Limit: it raises the ceiling, it does not bound the number of contexts or databases a suite creates.
     */
    static final long MONGO_OPEN_FILES = 65536L;

    private static final MongoDBContainer MONGO = new MongoDBContainer(MONGO_IMAGE)
            .withCreateContainerCmdModifier(MongoOpenFiles::raise);
    private static final GenericContainer<?> REDIS = new GenericContainer<>(REDIS_IMAGE).withExposedPorts(REDIS_PORT);

    static {
        Startables.deepStart(MONGO, REDIS).join();
    }

    private TestContainers() {
    }

    /**
     * The modifier lives in a class of its own: a lambda written in {@code TestContainers} is a method of this class, and
     * Testcontainers calls it on its own thread while this class's static initializer waits for the start (the first
     * build with it hung in class initialization, 2026-10-05).
     */
    static final class MongoOpenFiles {

        private MongoOpenFiles() {
        }

        static void raise(CreateContainerCmd cmd) {
            cmd.getHostConfig().withUlimits(new Ulimit[] {new Ulimit("nofile", MONGO_OPEN_FILES, MONGO_OPEN_FILES)});
        }
    }

    /** The connection string of database {@code database} on the shared MongoDB container. */
    public static String mongoUri(String database) {
        return MONGO.getReplicaSetUrl(database);
    }

    public static String redisHost() {
        return REDIS.getHost();
    }

    public static int redisPort() {
        return REDIS.getMappedPort(REDIS_PORT);
    }

    public static String redisUrl() {
        return "redis://" + redisHost() + ":" + redisPort();
    }
}
