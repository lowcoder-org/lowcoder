package org.lowcoder.infra.perf;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.Tag;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.lang.reflect.Field;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.ToDoubleFunction;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

/**
 * {@link PerfHelper} with a {@link SimpleMeterRegistry} injected into its private registry field (it is a Spring
 * {@code @Autowired} field). The helper is fire-and-forget: a failing metrics backend must never fail the caller.
 */
class PerfHelperTest {

    private static final PerfEvent EVENT = PerfEvent.SERVER_LOG_BATCH_INSERT;
    private static final String EVENT_NAME = "server_log_batch_insert";
    private static final List<Tag> TAGS = List.of(Tag.of("size", "3"));
    private static final String TIMER_NAME = "test.timer";

    private SimpleMeterRegistry registry;
    private PerfHelper helper;
    private Logger logger;
    private ListAppender<ILoggingEvent> appender;

    private static void inject(PerfHelper helper, Object registry) {
        try {
            Field field = PerfHelper.class.getDeclaredField("meterRegistry");
            field.setAccessible(true);
            field.set(helper, registry);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }

    @BeforeEach
    void setUp() {
        registry = new SimpleMeterRegistry();
        helper = new PerfHelper();
        inject(helper, registry);
        logger = (Logger) LoggerFactory.getLogger(PerfHelper.class);
        appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
    }

    @AfterEach
    void tearDown() {
        logger.detachAppender(appender);
    }

    private Counter counter(List<Tag> tags) {
        return registry.get(EVENT_NAME).tags(tags).counter();
    }

    @Test
    void countIncrementsTheCounterNamedAfterTheEventByOneWithItsTags() {
        helper.count(EVENT, TAGS);
        assertThat(counter(TAGS).count()).isEqualTo(1.0);

        helper.count(EVENT, TAGS);
        assertThat(counter(TAGS).count()).isEqualTo(2.0);
        System.out.println("[PerfHelperTest] counter " + EVENT_NAME + " " + TAGS + " = " + counter(TAGS).count());
    }

    @Test
    void countWithAnAmountAddsThatAmountAndKeepsTagSetsApart() {
        List<Tag> other = List.of(Tag.of("size", "9"));

        helper.count(EVENT, TAGS, 5);
        helper.count(EVENT, TAGS, 2);
        helper.count(EVENT, other, 1);

        assertThat(counter(TAGS).count()).isEqualTo(7.0);
        assertThat(counter(other).count()).isEqualTo(1.0);
    }

    @Test
    void countSwallowsRegistryFailuresAndLogsAWarning() {
        inject(helper, new SimpleMeterRegistry() {
            @Override
            public Counter counter(String name, Iterable<Tag> tags) {
                throw new IllegalStateException("registry down");
            }
        });

        helper.count(EVENT, TAGS);
        helper.count(EVENT, TAGS, 4);

        assertThat(appender.list).hasSize(2).allSatisfy(event -> {
            assertThat(event.getLevel()).isEqualTo(Level.WARN);
            assertThat(event.getFormattedMessage()).startsWith("count error.").contains(EVENT_NAME);
        });
        System.out.println("[PerfHelperTest] failing registry: " + appender.list.get(0).getFormattedMessage());
    }

    @Test
    void gaugeSafelyRegistersAGaugeThatReadsTheGivenObject() {
        AtomicInteger source = new AtomicInteger(4);

        helper.gaugeSafely(PerfEvent.CLIENT_BASED_CONNECTION_SIZE, TAGS, source, AtomicInteger::doubleValue);

        Gauge gauge = registry.get("client_based_connection_size").tags(TAGS).gauge();
        assertThat(gauge.value()).isEqualTo(4.0);
        source.set(9);
        assertThat(gauge.value()).as("the gauge follows the object it was given").isEqualTo(9.0);
    }

    @Test
    void gaugeSafelyAndGaugeIntSwallowRegistryFailuresAndLogAWarning() {
        inject(helper, new SimpleMeterRegistry() {
            @Override
            public <T> T gauge(String name, Iterable<Tag> tags, T obj, ToDoubleFunction<T> valueFunction) {
                throw new IllegalStateException("registry down");
            }
        });

        helper.gaugeSafely(PerfEvent.CLIENT_BASED_CONNECTION_SIZE, TAGS, new AtomicInteger(1), AtomicInteger::doubleValue);
        helper.gaugeInt(PerfEvent.HIKARI_POOL_ACTIVE_CONNECTIONS, TAGS, 1);

        assertThat(appender.list).hasSize(2).allSatisfy(event -> {
            assertThat(event.getLevel()).isEqualTo(Level.WARN);
            assertThat(event.getFormattedMessage()).startsWith("gauge error.");
        });
    }

    /**
     * Pins the plan section 9 row "PerfHelper.gaugeInt keeps the AtomicInteger it registered first" (D-6, fix
     * deferred): {@code MeterRegistry.gauge(name, tags, number)} returns the object it was given, so the later
     * {@code gauge.set(number)} updates a fresh AtomicInteger the registry does not know, while the registry holds
     * only a weak reference to the first one. The registered gauge therefore never shows the second value: it stays at
     * the first value (3.0) or, once the first AtomicInteger has been garbage collected, reads NaN. Both are accepted
     * here because the test must not depend on the garbage collector (and does not call System.gc()). A fix changes
     * this test on purpose.
     */
    @Test
    void gaugeIntRegistersAGaugeButNeverShowsTheSecondValue() {
        helper.gaugeInt(PerfEvent.HIKARI_POOL_ACTIVE_CONNECTIONS, TAGS, 3);
        Gauge gauge = registry.get("hikari_pool_active_connections").tags(TAGS).gauge();

        helper.gaugeInt(PerfEvent.HIKARI_POOL_ACTIVE_CONNECTIONS, TAGS, 7);

        double value = gauge.value();
        System.out.println("[PerfHelperTest] gauge after gaugeInt(3) then gaugeInt(7) reads " + value + " (plan section 9 row, pinned: 3.0 or NaN, never 7.0)");
        assertThat(value).isNotEqualTo(7.0);
        assertThat(value == 3.0 || Double.isNaN(value)).isTrue();
        assertThat(appender.list).isEmpty();
    }

    @Test
    void recordRunnableTimeRunsTheRunnableAndRegistersATimerWithTagsAndTheNinetyFifthPercentile() {
        AtomicInteger runs = new AtomicInteger();

        helper.recordRunnableTime(TIMER_NAME, TAGS, runs::incrementAndGet);

        assertThat(runs).hasValue(1);
        Timer timer = registry.get(TIMER_NAME).tags(TAGS).timer();
        assertThat(timer.count()).isEqualTo(1);
        assertThat(registry.get(TIMER_NAME + ".percentile").tags(TAGS).tag("phi", "0.95").gauge()).isNotNull();
    }

    @Test
    void recordTimeAddsTheDurationToTheTimer() {
        helper.recordTime(TIMER_NAME, TAGS, Duration.ofMillis(250));
        helper.recordTime(TIMER_NAME, TAGS, Duration.ofMillis(750));

        Timer timer = registry.get(TIMER_NAME).tags(TAGS).timer();
        assertThat(timer.count()).isEqualTo(2);
        assertThat(timer.totalTime(TimeUnit.MILLISECONDS)).isEqualTo(1000.0);
        assertThat(registry.get(TIMER_NAME + ".percentile").tags(TAGS).tag("phi", "0.95").gauge()).isNotNull();
    }

    @Test
    void recordCallableTimeReturnsTheResultAndPropagatesTheCallablesException() throws Exception {
        String result = helper.recordCallableTime(TIMER_NAME, TAGS, () -> "value");
        assertThat(result).isEqualTo("value");

        Exception failure = new Exception("callable failed");
        assertThatThrownBy(() -> helper.<String>recordCallableTime(TIMER_NAME, TAGS, () -> {
            throw failure;
        })).isSameAs(failure);

        assertThat(registry.get(TIMER_NAME).tags(TAGS).timer().count()).as("both runs were timed").isEqualTo(2);
        assertThat(registry.get(TIMER_NAME + ".percentile").tags(TAGS).tag("phi", "0.95").gauge()).isNotNull();
    }
}
