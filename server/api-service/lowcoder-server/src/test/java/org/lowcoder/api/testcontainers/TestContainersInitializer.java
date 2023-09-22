package org.lowcoder.api.testcontainers;

import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.lifecycle.Startables;
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.utility.MountableFile;

public class TestContainersInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        private static final String MONGO_IMAGE_NAME = "mongo";
        private static final String MONGO_IMAGE_VERSION = "4.4";
        private static final long MONGO_SHARED_MEMORY = 256 * 1024 * 1024;
        private static final String DB_DATABASE = "lowcoder";
        private static final String DB_USERNAME = "lowcoder";
        private static final String DB_PASSWORD = "secret123";

        /** Initialize mongodb container **/
        private static GenericContainer<?> mongodb = new GenericContainer<>(DockerImageName.parse(MONGO_IMAGE_NAME).withTag(MONGO_IMAGE_VERSION))
                .withEnv("MONGO_INITDB_DATABASE", DB_DATABASE)
                .withEnv("MONGO_INIT_ROOT_USERNAME", DB_USERNAME)
                .withEnv("MONGO_INIT_ROOT_PASSWORD", DB_PASSWORD)
                .withSharedMemorySize(MONGO_SHARED_MEMORY)
                .withExposedPorts(27017)
                .waitingFor(Wait.forLogMessage("(?i).*Waiting for connections*.*", 1))
                .withCopyFileToContainer(MountableFile.forClasspathResource("/init-database.sh", 0755), "/docker-entrypoint-initdb.d/init.sh");

        /** Start containers in parallel **/
        static {
            Startables.deepStart(
                    mongodb
            ).join();
        }

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        String mongoUri = "mongodb://" + DB_USERNAME + ":" + DB_PASSWORD
                + "@" + mongodb.getHost() + ":" + mongodb.getFirstMappedPort()
                + "/" + DB_DATABASE + "?authSource=admin";
        System.out.println("MongoDB URI: " + mongoUri);
        TestPropertyValues.of(
                "spring.data.mongodb.uri=" + mongoUri,
                "MONGO_URI=" + mongoUri // Set the property for test overrides
        ).applyTo(applicationContext.getEnvironment());

    }

}
