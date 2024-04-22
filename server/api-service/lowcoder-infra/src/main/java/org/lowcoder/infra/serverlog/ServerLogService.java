package org.lowcoder.infra.serverlog;

import reactor.core.publisher.Mono;

public interface ServerLogService {
    void record(ServerLog serverLog);

    Mono<Long> getApiUsageCount(String orgId, Boolean lastMonthOnly);
}
