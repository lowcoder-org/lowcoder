package org.lowcoder.api.application;

import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;

public abstract class AbstractIntegrationTest {

    protected static final MongoDBContainer mongoDBContainer =
            new MongoDBContainer(DockerImageName.parse("mongo:4.4.6"))
                    .withExposedPorts(27017)
                    .waitingFor(Wait.forListeningPort());

    @BeforeClass
    public static void setUp() {
        mongoDBContainer.start();
        System.setProperty("MONGODB_PROPERTIES", "classpath:mongodb.properties");
        System.out.println("MongoDB container started successfully.");
    }


    @AfterClass
    public static void tearDown() {
        mongoDBContainer.stop();
    }
}
