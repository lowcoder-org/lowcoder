package org.lowcoder.runner.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicBoolean;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.infra.perf.PerfEvent;
import org.lowcoder.infra.perf.PerfHelper;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import reactor.core.publisher.Mono;

/**
 * Direct tests of {@link IoHeartBeatTask#ping()}, the scheduled Redis heartbeat. The schedule (first run after one
 * minute) makes its coverage depend on how long the test JVM lives (plan §2.3); calling {@code ping()} here makes
 * that coverage deterministic. A real {@link PerfHelper} over a {@link SimpleMeterRegistry} is used so the
 * {@code PerfHelper.count} lines the task calls are covered too, and the counter can be read back.
 */
@ExtendWith(MockitoExtension.class)
class IoHeartBeatTaskTest {

    private static final String WARMUP_KEY = "#warmup";
    private static final String WARMUP_VALUE = "1";
    private static final Duration WARMUP_TTL = Duration.ofSeconds(1);
    private static final String REDIS_TAG = "redis";

    @Mock private ReactiveRedisTemplate<String, String> reactiveRedisTemplate;
    @Mock private ReactiveValueOperations<String, String> ops;

    private SimpleMeterRegistry registry;
    private IoHeartBeatTask task;

    @BeforeEach
    void setUp() {
        registry = new SimpleMeterRegistry();
        PerfHelper perfHelper = new PerfHelper();
        ReflectionTestUtils.setField(perfHelper, "meterRegistry", registry);
        task = new IoHeartBeatTask(reactiveRedisTemplate, perfHelper);
        when(reactiveRedisTemplate.opsForValue()).thenReturn(ops);
    }

    private Counter heartBeatCounter(boolean redisResult) {
        return registry.find(PerfEvent.IO_HEART_BEAT.perfKey()).tag(REDIS_TAG, String.valueOf(redisResult)).counter();
    }

    /** Catches a heartbeat that never reaches Redis: the key/value/TTL are fixed and the Mono must be subscribed. */
    @Test
    void ping_writesTheWarmupKeyWithAOneSecondTtl_andSubscribes() {
        AtomicBoolean subscribed = new AtomicBoolean();
        when(ops.set(WARMUP_KEY, WARMUP_VALUE, WARMUP_TTL)).thenReturn(Mono.fromSupplier(() -> {
            subscribed.set(true);
            return true;
        }));

        task.ping();

        verify(ops).set(WARMUP_KEY, WARMUP_VALUE, WARMUP_TTL);
        assertThat(subscribed).isTrue();
        System.out.println("[IoHeartBeatTaskTest] set(" + WARMUP_KEY + ", " + WARMUP_VALUE + ", " + WARMUP_TTL + ") subscribed=" + subscribed.get());
    }

    /** Catches the Redis result not being recorded: the counter carries the result as its {@code redis} tag. */
    @ParameterizedTest(name = "redis result {0}")
    @ValueSource(booleans = {true, false})
    void ping_countsTheHeartBeatWithTheRedisResultTag(boolean redisResult) {
        when(ops.set(WARMUP_KEY, WARMUP_VALUE, WARMUP_TTL)).thenReturn(Mono.just(redisResult));

        task.ping();

        Counter counter = heartBeatCounter(redisResult);
        assertThat(counter).as("counter for redis=" + redisResult).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
        assertThat(heartBeatCounter(!redisResult)).as("counter for the other result").isNull();
        System.out.println("[IoHeartBeatTaskTest] " + PerfEvent.IO_HEART_BEAT.perfKey() + "{redis=" + redisResult + "} = " + counter.count());
    }

    /**
     * {@code subscribe(consumer)} has no error consumer, so a failing Redis write goes to Reactor's default
     * onErrorDropped hook (logged as "Operator called default onErrorDropped") and does not reach the caller of the
     * scheduled method; nothing is counted. Pinned as today's behaviour.
     */
    @Test
    void ping_redisError_isNotThrown_andNothingIsCounted() {
        when(ops.set(WARMUP_KEY, WARMUP_VALUE, WARMUP_TTL)).thenReturn(Mono.error(new IllegalStateException("redis down")));

        org.junit.jupiter.api.Assertions.assertDoesNotThrow(() -> task.ping());

        assertThat(registry.getMeters()).isEmpty();
        System.out.println("[IoHeartBeatTaskTest] redis error -> ping() returned normally, no counter");
    }
}
