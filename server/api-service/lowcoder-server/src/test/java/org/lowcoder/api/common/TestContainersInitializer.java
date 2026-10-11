package org.lowcoder.api.common;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.MapPropertySource;

/**
 * Points every Spring Boot application context of this module's tests at the containers of {@link TestContainers}.
 * Registered in {@code src/test/resources/META-INF/spring.factories}, so it applies to each context that Spring Boot's
 * test support builds through {@code SpringApplication}, without an annotation on the test classes.
 *
 * <p>Each context gets a database of its own on the shared MongoDB container ({@value #DATABASE_PREFIX} plus a number),
 * so contexts stay isolated from each other as they were when each context started its own embedded mongod (tests with a
 * profile of their own rely on that, e.g. {@code EmailBackfillEndToEndTest}). Redis is shared by all contexts, as the
 * embedded redis-server was.
 *
 * <p>Limits: a context built without {@code SpringApplication} (a plain {@code @ContextConfiguration} test) does not run
 * this initializer and keeps the configured {@code spring.data.*} values.
 */
public class TestContainersInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    static final String PROPERTY_SOURCE = "testContainers";
    static final String DATABASE_PREFIX = "lowcoder_test_";
    static final String MONGO_URI_PROPERTY = "spring.data.mongodb.uri";
    static final String REDIS_URL_PROPERTY = "spring.data.redis.url";

    private static final AtomicInteger CONTEXTS = new AtomicInteger();

    @Override
    public void initialize(ConfigurableApplicationContext context) {
        String database = DATABASE_PREFIX + CONTEXTS.incrementAndGet();
        Map<String, Object> properties = Map.of(
                MONGO_URI_PROPERTY, TestContainers.mongoUri(database),
                REDIS_URL_PROPERTY, TestContainers.redisUrl());
        context.getEnvironment().getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE, properties));
    }
}
