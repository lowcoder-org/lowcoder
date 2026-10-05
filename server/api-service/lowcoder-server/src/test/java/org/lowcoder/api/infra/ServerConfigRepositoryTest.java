package org.lowcoder.api.infra;

import com.google.common.collect.ImmutableList;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.lowcoder.infra.config.model.ServerConfig;
import org.lowcoder.infra.config.repository.ServerConfigRepository;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * A config saved to the repository reaches {@link ConfigInstance} through the reloading cache of
 * {@code AutoReloadConfigFactory}, which reloads every {@link #RELOAD_INTERVAL}. Catches a reload that stops, or that
 * drops or misreads a key (an integer, a list, a JSON object).
 *
 * <p>The values are polled until they change, up to {@link #RELOAD_TIMEOUT}: the test used to sleep exactly one reload
 * interval and then assert, a race it lost in a full build on 2026-10-04 (key3 still held its previous value).
 */
@SpringBootTest
@Slf4j
public class ServerConfigRepositoryTest {

    /** {@code AutoReloadConfigFactory}'s interval. */
    private static final Duration RELOAD_INTERVAL = Duration.ofSeconds(3);
    /** Five reload intervals: enough for a reload to run after the write even on a loaded machine. */
    private static final Duration RELOAD_TIMEOUT = RELOAD_INTERVAL.multipliedBy(5);
    private static final Duration POLL_INTERVAL = Duration.ofMillis(100);

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

        awaitValue("key1", 123, () -> test1.get().intValue());
        awaitValue("key2", ImmutableList.of(1, 2), test2::get);
        awaitValue("key3", new SomeClass(22, 33), test3::get);

        configRepository.upsert("key1", "12345").block();
        configRepository.upsert("key2", List.of(1, 2, 3)).block();
        configRepository.upsert("key3", Map.of("x", 33, "y", 44)).block();

        awaitValue("key1", 12345, () -> test1.get().intValue());
        awaitValue("key2", ImmutableList.of(1, 2, 3), test2::get);
        awaitValue("key3", new SomeClass(33, 44), test3::get);
    }

    /** Polls {@code actual} until it equals {@code expected} or {@link #RELOAD_TIMEOUT} passes, then asserts. */
    private static <T> void awaitValue(String key, T expected, Supplier<T> actual) throws InterruptedException {
        long start = System.nanoTime();
        long deadline = start + RELOAD_TIMEOUT.toNanos();
        while (!Objects.equals(expected, actual.get()) && System.nanoTime() < deadline) {
            Thread.sleep(POLL_INTERVAL.toMillis());
        }
        T last = actual.get();
        System.out.println("[ServerConfigRepositoryTest] " + key + " = " + last + " after "
                + Duration.ofNanos(System.nanoTime() - start).toMillis() + " ms (expected " + expected + ")");
        assertEquals(expected, last, key + " reloaded within " + RELOAD_TIMEOUT);
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