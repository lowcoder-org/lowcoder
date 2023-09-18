package org.lowcoder.api.infra;

import com.google.common.collect.ImmutableList;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.runner.RunWith;
import org.lowcoder.infra.config.model.ServerConfig;
import org.lowcoder.infra.config.repository.ServerConfigRepository;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;

import java.util.List;
import java.util.Map;

import static org.junit.Assert.assertEquals;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
public class ServerConfigRepositoryTest {
    @Container
    private static final MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:4.4.6")
            .withExposedPorts(27017);

    @BeforeAll
    static void beforeAll() {
        mongoDBContainer.start();
        System.setProperty("MONGODB_PROPERTIES", "classpath:mongodb.properties");
    }

    @AfterAll
    static void afterAll() {
        mongoDBContainer.stop();
    }


    @Autowired
    ServerConfigRepository configRepository;

    @Autowired
    private ConfigInstance configInstance;

    @Test
    public void test() throws InterruptedException {

        Conf<Integer> test1 = configInstance.ofInteger("key1", 0);
        Conf<List<Integer>> test2 = configInstance.ofList("key2", ImmutableList.of(1), Integer.class);
        Conf<SomeClass> test3 = configInstance.ofJson("key3", SomeClass.class, new SomeClass(11, 22));

        assertEquals(0, test1.get().intValue());
        assertEquals(ImmutableList.of(1), test2.get());
        assertEquals(new SomeClass(11, 22), test3.get());

        configRepository.save(getNewConfig("key1", "123")).block();
        configRepository.save(getNewConfig("key2", List.of(1, 2))).block();
        configRepository.save(getNewConfig("key3", Map.of("x", 22, "y", 33))).block();
        Thread.sleep(3000);

        assertEquals(123, test1.get().intValue());
        assertEquals(ImmutableList.of(1, 2), test2.get());
        assertEquals(new SomeClass(22, 33), test3.get());

        configRepository.upsert("key1", "12345").block();
        configRepository.upsert("key2", List.of(1, 2, 3)).block();
        configRepository.upsert("key3", Map.of("x", 33, "y", 44)).block();

        Thread.sleep(3000);

        assertEquals(12345, test1.get().intValue());
        assertEquals(ImmutableList.of(1, 2, 3), test2.get());
        assertEquals(new SomeClass(33, 44), test3.get());

    }

    private ServerConfig getNewConfig(String key, Object value) {
        return ServerConfig.builder()
                .key(key)
                .value(value)
                .build();
    }

    private record SomeClass(int x, int y) {
    }
}