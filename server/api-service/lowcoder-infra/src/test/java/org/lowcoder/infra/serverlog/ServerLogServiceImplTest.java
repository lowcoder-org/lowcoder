package org.lowcoder.infra.serverlog;

import static org.assertj.core.api.Assertions.assertThat;

import io.micrometer.core.instrument.Tag;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Supplier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.lowcoder.infra.event.SystemCommonEvent;
import org.lowcoder.infra.perf.PerfHelper;
import org.springframework.data.domain.Range;
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
                            calls.add(List.of(args[0], args[1]));
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
     * BF-066 (formerly pinned as plan section 9 candidate "scheduledInsert subscribes without an error handler": the batch
     * of a failed save was gone, not retried, never published or counted): the failed batch is put back, nothing reaches
     * the scheduler, and the next flush saves it and publishes and counts it once.
     */
    @Test
    void aFailingSaveIsRetriedByTheNextFlushAndCountedOnceBF066() throws Exception {
        ServerLog kept = log("/kept");
        service.record(kept);
        saveOverride = () -> Flux.error(new IllegalStateException("db down"));

        Throwable thrownToScheduler = null;
        try {
            flush();
        } catch (Throwable t) {
            thrownToScheduler = t;
        }
        assertThat(publishedEvents).as("nothing is published for the failed save").isEmpty();
        saveOverride = null;
        flush();

        System.out.println("[ServerLogServiceImplTest] failing save: thrown to the scheduler = " + thrownToScheduler + ", batches " + savedBatches.size()
                + ", events " + publishedEvents.size());
        assertThat(thrownToScheduler).as("the error does not reach the scheduler").isNull();
        assertThat(savedBatches).as("the failed batch is saved again").hasSize(2);
        assertThat(savedBatches.get(1)).containsExactly(kept);
        assertThat(publishedEvents).hasSize(1);
        assertThat(((SystemCommonEvent) publishedEvents.get(0)).getApiCalls()).isEqualTo(1);
        assertThat(meterRegistry.get("server_log_batch_insert").tags(List.of(Tag.of("size", "1"))).counter().count()).isEqualTo(1.0);
    }

    /** BF-066: the logs recorded while a save fails are saved by the next flush together with the batch put back. */
    @Test
    void aBatchPutBackIsSavedWithTheLogsRecordedMeanwhileBF066() throws Exception {
        ServerLog failed = log("/failed");
        ServerLog meanwhile = log("/meanwhile");
        service.record(failed);
        saveOverride = () -> Flux.error(new IllegalStateException("db down"));
        duringSave = () -> {
            duringSave = () -> { };
            service.record(meanwhile);
        };

        flush();
        saveOverride = null;
        flush();

        assertThat(savedBatches).hasSize(2);
        assertThat(savedBatches.get(1)).containsExactlyInAnyOrder(failed, meanwhile);
        assertThat(((SystemCommonEvent) publishedEvents.get(0)).getApiCalls()).isEqualTo(2);
    }

    /**
     * BF-066: the logs kept for a retry are bounded by {@link ServerLogServiceImpl#MAX_PENDING_LOGS}: a failed batch two over
     * the bound keeps all but its two oldest logs.
     */
    @Test
    void aFailedBatchOverTheBoundDropsItsOldestLogsBF066() throws Exception {
        List<ServerLog> recorded = new ArrayList<>();
        for (int i = 0; i < ServerLogServiceImpl.MAX_PENDING_LOGS + 2; i++) {
            ServerLog serverLog = log("/" + i);
            recorded.add(serverLog);
            service.record(serverLog);
        }
        saveOverride = () -> Flux.error(new IllegalStateException("db down"));

        flush();
        saveOverride = null;
        flush();

        List<ServerLog> retried = savedBatches.get(1);
        System.out.println("[ServerLogServiceImplTest] bound " + ServerLogServiceImpl.MAX_PENDING_LOGS + ": recorded " + recorded.size()
                + ", retried " + retried.size() + ", first retried " + retried.get(0).getUrlPath());
        assertThat(retried).hasSize(ServerLogServiceImpl.MAX_PENDING_LOGS);
        assertThat(retried).doesNotContain(recorded.get(0), recorded.get(1));
        assertThat(retried.get(0)).isSameAs(recorded.get(2));
        assertThat(retried.get(retried.size() - 1)).isSameAs(recorded.get(recorded.size() - 1));
    }

    @Test
    void apiUsageCountOfAllTimeUsesTheOrgOnly() {
        assertThat(service.getApiUsageCount(ORG_ID, false).block()).isEqualTo(ALL_TIME_COUNT);
        assertThat(service.getApiUsageCount(ORG_ID, null).block()).isEqualTo(ALL_TIME_COUNT);

        assertThat(calls).containsExactly("countByOrgId:" + ORG_ID, "countByOrgId:" + ORG_ID);
    }

    private static long millis(String instant) {
        return Instant.parse(instant).toEpochMilli();
    }

    /**
     * BF-104 (was pinned as the plan section 9 row "ServerLogServiceImpl month window", D-6): the last-month count asks
     * the repository for the previous calendar month of today (UTC), from 00:00 of its first day, inclusive, to 00:00 of
     * the first day of this month, exclusive. It used to ask for the first to the last day of that month at the current
     * time of day, both ends exclusive. The call is repeated if the date changed while it ran.
     */
    @Test
    void apiUsageCountOfLastMonthAsksForThePreviousCalendarMonthBF104() {
        LocalDate before = null;
        LocalDate after = null;
        Long result = null;
        for (int attempt = 0; attempt < 3; attempt++) {
            calls.clear();
            before = LocalDate.now(ZoneOffset.UTC);
            result = service.getApiUsageCount(ORG_ID, true).block();
            after = LocalDate.now(ZoneOffset.UTC);
            if (before.equals(after)) {
                break;
            }
        }

        assertThat(result).isEqualTo(LAST_MONTH_COUNT);
        assertThat(calls).hasSize(1);
        @SuppressWarnings("unchecked")
        List<Object> call = (List<Object>) calls.get(0);
        System.out.println("[ServerLogServiceImplTest] asked on " + after + " for " + call.get(1) + " (BF-104)");
        assertThat(call.get(0)).isEqualTo(ORG_ID);
        assertThat(call.get(1)).isEqualTo(ServerLogServiceImpl.previousMonth(after));
    }

    /**
     * BF-104: the window is the whole previous calendar month, across a year end and a leap February: its first
     * millisecond and its last are in, the first millisecond of the next month is not.
     */
    @ParameterizedTest(name = "[{index}] {0} -> [{1}, {2})")
    @CsvSource({
            "2026-03-15, 2026-02-01T00:00:00Z, 2026-03-01T00:00:00Z",
            "2026-01-01, 2025-12-01T00:00:00Z, 2026-01-01T00:00:00Z",
            "2024-03-31, 2024-02-01T00:00:00Z, 2024-03-01T00:00:00Z",
            "2026-10-08, 2026-09-01T00:00:00Z, 2026-10-01T00:00:00Z"
    })
    void previousMonthIsTheWholeCalendarMonthBeforeTodaysBF104(String today, String start, String end) {
        Range<Long> window = ServerLogServiceImpl.previousMonth(LocalDate.parse(today));

        System.out.println("[ServerLogServiceImplTest] " + today + " -> " + window + " (BF-104)");
        assertThat(window.getLowerBound().getValue()).contains(millis(start));
        assertThat(window.getLowerBound().isInclusive()).isTrue();
        assertThat(window.getUpperBound().getValue()).contains(millis(end));
        assertThat(window.getUpperBound().isInclusive()).isFalse();
        assertThat(window.contains(millis(start))).isTrue();
        assertThat(window.contains(millis(end) - 1)).isTrue();
        assertThat(window.contains(millis(end))).isFalse();
        assertThat(window.contains(millis(start) - 1)).isFalse();
    }
}
