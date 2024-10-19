package org.lowcoder.infra.serverlog;

import io.micrometer.core.instrument.Tags;
import lombok.RequiredArgsConstructor;
import org.apache.commons.collections4.CollectionUtils;
import org.lowcoder.infra.event.SystemCommonEvent;
import org.lowcoder.infra.perf.PerfHelper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.TimeUnit;

import static org.lowcoder.infra.perf.PerfEvent.SERVER_LOG_BATCH_INSERT;

@RequiredArgsConstructor
@Service
public class ServerLogServiceImpl implements ServerLogService {

    private final ServerLogRepository serverLogRepository;
    private final PerfHelper perfHelper;
    private final ApplicationEventPublisher applicationEventPublisher;

    private volatile Queue<ServerLog> serverLogs = new ConcurrentLinkedQueue<>();

    @Override
    public void record(ServerLog serverLog) {
        serverLogs.add(serverLog);
    }

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
                });
    }

    @Override
    public Mono<Long> getApiUsageCount(String orgId, Boolean lastMonthOnly) {
        if(lastMonthOnly != null && lastMonthOnly) {
            Long startMonthEpoch = LocalDateTime.now().minusMonths(1).with(TemporalAdjusters.firstDayOfMonth()).toEpochSecond(ZoneOffset.UTC)*1000;
            Long endMonthEpoch = LocalDateTime.now().minusMonths(1).with(TemporalAdjusters.lastDayOfMonth()).toEpochSecond(ZoneOffset.UTC)*1000;
            System.out.println("startMonthEpoch is: " + startMonthEpoch);
            System.out.println("endMonthEpoch is: " + endMonthEpoch);
            return serverLogRepository.countByOrgIdAndCreateTimeBetween(orgId, startMonthEpoch, endMonthEpoch);
        }
        return serverLogRepository.countByOrgId(orgId);
    }

}
