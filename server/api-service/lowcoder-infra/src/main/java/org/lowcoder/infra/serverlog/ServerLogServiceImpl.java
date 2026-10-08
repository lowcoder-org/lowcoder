package org.lowcoder.infra.serverlog;

import io.micrometer.core.instrument.Tags;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.lowcoder.infra.event.SystemCommonEvent;
import org.lowcoder.infra.perf.PerfHelper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Range;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.TimeUnit;

import static org.lowcoder.infra.perf.PerfEvent.SERVER_LOG_BATCH_INSERT;

@Slf4j
@RequiredArgsConstructor
@Service
public class ServerLogServiceImpl implements ServerLogService {

    /**
     * The most server logs kept for a retry while saving fails (a database outage); beyond it the oldest are dropped, so the
     * memory they take stays bounded. A log is a few short strings, so this is some tens of MB at most.
     */
    static final int MAX_PENDING_LOGS = 100_000;

    private final ServerLogRepository serverLogRepository;
    private final PerfHelper perfHelper;
    private final ApplicationEventPublisher applicationEventPublisher;

    private volatile Queue<ServerLog> serverLogs = new ConcurrentLinkedQueue<>();

    @Override
    public void record(ServerLog serverLog) {
        serverLogs.add(serverLog);
    }

    /**
     * Saves the logs recorded since the last run, then publishes their count ({@code apiCalls}). A batch whose save fails is
     * put back for the next run (BF-066: the subscribe had no error handler, so the batch was lost and never counted).
     */
    @Scheduled(initialDelay = 1, fixedRate = 1, timeUnit = TimeUnit.SECONDS)
    private void scheduledInsert() {
        if (CollectionUtils.isEmpty(serverLogs)) {
            return;
        }
        var tmp = serverLogs;
        serverLogs = new ConcurrentLinkedQueue<>();
        serverLogRepository.saveAll(tmp)
                .collectList()
                .subscribe(result -> {
                    int count = result.size();
                    perfHelper.count(SERVER_LOG_BATCH_INSERT, Tags.of("size", String.valueOf(result.size())));
                    applicationEventPublisher.publishEvent(SystemCommonEvent.builder()
                    		.apiCalls(count)
                    		.detail("apiCalls", Integer.toString(count))
                    		.build()
                    );
                }, error -> requeue(tmp, error));
    }

    /**
     * Puts a batch whose save failed back into the queue, so the next run saves it with the logs recorded since; if the queue
     * would then hold more than {@link #MAX_PENDING_LOGS}, the oldest logs of the batch are dropped.
     * <p>
     * Limits: a save that failed after part of the batch was written writes that part again (the logs carry no id), so
     * those logs are stored twice and {@link #getApiUsageCount} counts them twice; the published {@code apiCalls} count,
     * sent only after a save succeeds, counts them once. A log put back while the next run swaps the queue can be missed,
     * the same window {@link #record} has.
     */
    private void requeue(Queue<ServerLog> batch, Throwable error) {
        Queue<ServerLog> queue = serverLogs;
        int dropped = Math.max(0, Math.min(batch.size(), batch.size() + queue.size() - MAX_PENDING_LOGS));
        batch.stream().skip(dropped).forEach(queue::add);
        log.error("Failed to save {} server logs, kept for the next run, {} dropped", batch.size(), dropped, error);
    }

    @Override
    public Mono<Long> getApiUsageCount(String orgId, Boolean lastMonthOnly) {
        if(lastMonthOnly != null && lastMonthOnly) {
            return serverLogRepository.countByOrgIdAndCreateTimeBetween(orgId, previousMonth(LocalDate.now(ZoneOffset.UTC)));
        }
        return serverLogRepository.countByOrgId(orgId);
    }

    /**
     * The calendar month before {@code today}'s, in UTC epoch milliseconds: from 00:00 of its first day, inclusive, to
     * 00:00 of the first day of {@code today}'s month, exclusive (BF-104: the window ran from the first to the last day of
     * that month at the current time of day, both ends exclusive, so the logs of the first hours of the first day and of
     * the last hours of the last day were left out, depending on when it was asked).
     */
    static Range<Long> previousMonth(LocalDate today) {
        YearMonth month = YearMonth.from(today).minusMonths(1);
        return Range.rightOpen(startOfDayMillis(month.atDay(1)), startOfDayMillis(month.plusMonths(1).atDay(1)));
    }

    private static long startOfDayMillis(LocalDate day) {
        return day.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli();
    }

}
