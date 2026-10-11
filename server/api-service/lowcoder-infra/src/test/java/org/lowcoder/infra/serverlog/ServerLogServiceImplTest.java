package org.lowcoder.infra.serverlog;

import static org.assertj.core.api.Assertions.assertThat;

import io.micrometer.core.instrument.Tag;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Supplier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.infra.event.SystemCommonEvent;
import org.lowcoder.infra.perf.PerfHelper;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * {@link ServerLogServiceImpl}: the batched, scheduled write of the recorded server logs and the API usage counts.
 * The scheduled method is private and is invoked by reflection, so the result no longer depends on the scheduler.
 * The repository is a {@link Proxy} fake that records its calls; the publisher is a lambda.
 */
class ServerLogServiceImplTest {

    private static final String ORG_ID = "org-1";
    private static final long ALL_TIME_COUNT = 42L;
    private static final long LAST_MONTH_COUNT = 7L;
    private static final long MILLIS_PER_SECOND = 1000L;

    private final List<List<ServerLog>> savedBatches = new ArrayList<>();
    private final List<Object> calls = new ArrayList<>();
    private final List<Object> publishedEvents = new CopyOnWriteArrayList<>();
    private Supplier<Flux<ServerLog>> saveOverride;
    private Runnable duringSave = () -> { };
    private SimpleMeterRegistry meterRegistry;
    private ServerLogServiceImpl service;

    private static ServerLog log(String path) {
        return ServerLog.builder().userId("u").orgId(ORG_ID).urlPath(path).httpMethod("GET").createTime(1L).build();
    }

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUp() throws ReflectiveOperationException {
        ServerLogRepository repository = (ServerLogRepository) Proxy.newProxyInstance(getClass().getClassLoader(),
                new Class<?>[]{ServerLogRepository.class}, (proxy, method, args) -> {
                    switch (method.getName()) {
                        case "saveAll" -> {
                            duringSave.run();
                            List<ServerLog> batch = new ArrayList<>();
                            ((Iterable<ServerLog>) args[0]).forEach(batch::add);
                            savedBatches.add(batch);
                            return saveOverride != null ? saveOverride.get() : Flux.fromIterable(batch);
                        }
                        case "countByOrgId" -> {
                            calls.add("countByOrgId:" + args[0]);
                            return Mono.just(ALL_TIME_COUNT);
                        }
                        case "countByOrgIdAndCreateTimeBetween" -> {
                            calls.add(List.of(args[0], args[1], args[2]));
                            return Mono.just(LAST_MONTH_COUNT);
                        }
                        default -> throw new UnsupportedOperationException(method.getName());
                    }
                });
        meterRegistry = new SimpleMeterRegistry();
        PerfHelper perfHelper = new PerfHelper();
        Field field = PerfHelper.class.getDeclaredField("meterRegistry");
        field.setAccessible(true);
        field.set(perfHelper, meterRegistry);
        service = new ServerLogServiceImpl(repository, perfHelper, publishedEvents::add);
    }

    private void flush() throws ReflectiveOperationException {
        Method method = ServerLogServiceImpl.class.getDeclaredMethod("scheduledInsert");
        method.setAccessible(true);
        method.invoke(service);
    }

    @Test
    void flushSavesTheRecordedLogsOnceInOrderAndEmptiesTheQueue() throws Exception {
        ServerLog first = log("/a");
        ServerLog second = log("/b");
        ServerLog third = log("/c");
        service.record(first);
        service.record(second);
        service.record(third);

        flush();
        flush();

        assertThat(savedBatches).as("one batch, saved once; the second flush finds an empty queue").hasSize(1);
        assertThat(savedBatches.get(0)).containsExactly(first, second, third);
        System.out.println("[ServerLogServiceImplTest] saved batch of " + savedBatches.get(0).size());
    }

    @Test
    void flushPublishesTheCountAndCountsTheBatch() throws Exception {
        service.record(log("/a"));
        service.record(log("/b"));
        service.record(log("/c"));

        flush();

        assertThat(publishedEvents).hasSize(1);
        SystemCommonEvent event = (SystemCommonEvent) publishedEvents.get(0);
        assertThat(event.getApiCalls()).isEqualTo(3);
        assertThat(event.getEventType().name()).isEqualTo("SERVER_INFO");
        assertThat(event.details()).containsEntry("apiCalls", "3");
        assertThat(meterRegistry.get("server_log_batch_insert").tags(List.of(Tag.of("size", "3"))).counter().count()).isEqualTo(1.0);
        System.out.println("[ServerLogServiceImplTest] event apiCalls=" + event.getApiCalls() + " details=" + event.details());
    }

    @Test
    void flushOfAnEmptyQueueDoesNothing() throws Exception {
        flush();

        assertThat(savedBatches).isEmpty();
        assertThat(publishedEvents).isEmpty();
        assertThat(meterRegistry.getMeters()).isEmpty();
    }

    @Test
    void logsRecordedWhileTheBatchIsBeingSavedAreKeptForTheNextFlush() throws Exception {
        ServerLog early = log("/early");
        ServerLog late = log("/late");
        service.record(early);
        duringSave = () -> {
            duringSave = () -> { };
            service.record(late);
        };

        flush();
        flush();

        assertThat(savedBatches).hasSize(2);
        assertThat(savedBatches.get(0)).as("the batch being saved does not receive the late log").containsExactly(early);
        assertThat(savedBatches.get(1)).as("the late log is saved by the next flush, not lost").containsExactly(late);
    }

    /**
     * Pins the plan section 9 candidate "scheduledInsert subscribes without an error handler" (reproduced by L4-6): the
     * queue is swapped before the save, so when the save fails the batch is gone, nothing is published or counted, the
     * next flush has nothing to retry, and no exception reaches the scheduler. A fix (re-queue or an error handler)
     * changes this test on purpose.
     */
    @Test
    void aFailingSaveLosesTheBatchWithoutRetryOrEvent() throws Exception {
        service.record(log("/lost"));
        saveOverride = () -> Flux.error(new IllegalStateException("db down"));

        Throwable thrownToScheduler = null;
        try {
            flush();
        } catch (Throwable t) {
            thrownToScheduler = t;
        }
        saveOverride = null;
        flush();

        System.out.println("[ServerLogServiceImplTest] failing save: thrown to the scheduler = " + thrownToScheduler);
        assertThat(thrownToScheduler).as("the error does not reach the scheduler").isNull();
        assertThat(savedBatches).as("the failed batch is not retried").hasSize(1);
        assertThat(publishedEvents).isEmpty();
        assertThat(meterRegistry.getMeters()).isEmpty();
    }

    @Test
    void apiUsageCountOfAllTimeUsesTheOrgOnly() {
        assertThat(service.getApiUsageCount(ORG_ID, false).block()).isEqualTo(ALL_TIME_COUNT);
        assertThat(service.getApiUsageCount(ORG_ID, null).block()).isEqualTo(ALL_TIME_COUNT);

        assertThat(calls).containsExactly("countByOrgId:" + ORG_ID, "countByOrgId:" + ORG_ID);
    }

    private static long startOfWindow(LocalDateTime now) {
        return now.minusMonths(1).with(TemporalAdjusters.firstDayOfMonth()).truncatedTo(ChronoUnit.SECONDS).toEpochSecond(ZoneOffset.UTC) * MILLIS_PER_SECOND;
    }

    private static long endOfWindow(LocalDateTime now) {
        return now.minusMonths(1).with(TemporalAdjusters.lastDayOfMonth()).truncatedTo(ChronoUnit.SECONDS).toEpochSecond(ZoneOffset.UTC) * MILLIS_PER_SECOND;
    }

    /**
     * Pins the plan section 9 row "ServerLogServiceImpl month window" (D-6, fix deferred): the last-month window is
     * the first and the last day of the previous month at the CURRENT time of day (in whole seconds, UTC), not from
     * 00:00:00 of the first day to the end of the last day, so entries from the first hours of the first day and the
     * last hours of the last day are excluded depending on when the question is asked. The expected bounds are computed
     * from the clock read before and after the call; the call is repeated if the date changed in between. A fix
     * changes this test on purpose.
     */
    @Test
    void apiUsageCountOfLastMonthUsesThePreviousMonthWindowAtTheCurrentTimeOfDay() {
        LocalDateTime before = null;
        LocalDateTime after = null;
        Long result = null;
        for (int attempt = 0; attempt < 3; attempt++) {
            calls.clear();
            before = LocalDateTime.now();
            result = service.getApiUsageCount(ORG_ID, true).block();
            after = LocalDateTime.now();
            if (before.toLocalDate().equals(after.toLocalDate())) {
                break;
            }
        }

        assertThat(result).isEqualTo(LAST_MONTH_COUNT);
        assertThat(calls).hasSize(1);
        @SuppressWarnings("unchecked")
        List<Object> call = (List<Object>) calls.get(0);
        long start = (Long) call.get(1);
        long end = (Long) call.get(2);
        System.out.println("[ServerLogServiceImplTest] window start=" + start + " end=" + end + " asked between " + before + " and " + after
                + " (plan section 9 month-window row, pinned)");
        assertThat(call.get(0)).isEqualTo(ORG_ID);
        assertThat(start).as("first day of the previous month, at the current time of day")
                .isBetween(startOfWindow(before), startOfWindow(after));
        assertThat(end).as("last day of the previous month, at the current time of day")
                .isBetween(endOfWindow(before), endOfWindow(after));
        assertThat(start).isLessThan(end);
    }
}
