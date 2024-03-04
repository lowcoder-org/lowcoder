package org.lowcoder.infra.serverlog;

import static org.lowcoder.infra.perf.PerfEvent.SERVER_LOG_BATCH_INSERT;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.TimeUnit;

import org.apache.commons.collections4.CollectionUtils;
import org.lowcoder.infra.perf.PerfHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import io.micrometer.core.instrument.Tags;
import reactor.core.publisher.Mono;

@Service
public class ServerLogService {

    @Autowired
    private ServerLogRepository serverLogRepository;

    @Autowired
    private PerfHelper perfHelper;

    private volatile Queue<ServerLog> serverLogs = new ConcurrentLinkedQueue<>();

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
                    perfHelper.count(SERVER_LOG_BATCH_INSERT, Tags.of("size", String.valueOf(result.size())));
                });
    }

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
