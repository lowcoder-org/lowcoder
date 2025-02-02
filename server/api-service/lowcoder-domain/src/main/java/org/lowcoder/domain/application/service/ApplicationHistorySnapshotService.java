package org.lowcoder.domain.application.service;

import org.lowcoder.domain.application.model.ApplicationHistorySnapshot;
import org.lowcoder.domain.application.model.ApplicationHistorySnapshotTS;
import org.springframework.data.domain.PageRequest;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public interface ApplicationHistorySnapshotService {

    Mono<Boolean> createHistorySnapshot(String applicationId, Map<String, Object> dsl, Map<String, Object> context, String userId);

    Mono<List<ApplicationHistorySnapshot>> listAllHistorySnapshotBriefInfo(String applicationId, String compName, String theme, Instant from, Instant to, PageRequest pageRequest);
    Mono<List<ApplicationHistorySnapshotTS>> listAllHistorySnapshotBriefInfoArchived(String applicationId, String compName, String theme, Instant from, Instant to, PageRequest pageRequest);

    Mono<Long> countByApplicationId(String applicationId);
    Mono<Long> countByApplicationIdArchived(String applicationId);

    Mono<ApplicationHistorySnapshot> getHistorySnapshotDetail(String historySnapshotId);

    Mono<ApplicationHistorySnapshotTS> getHistorySnapshotDetailArchived(String historySnapshotId);
}
