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

    Mono<List<ApplicationHistorySnapshotTS>> listAllHistorySnapshotBriefInfo(String applicationId, String compName, String theme, Instant from, Instant to, PageRequest pageRequest);
    Mono<List<ApplicationHistorySnapshot>> listAllHistorySnapshotBriefInfoArchived(String applicationId, String compName, String theme, Instant from, Instant to, PageRequest pageRequest);

    Mono<Long> countByApplicationId(String applicationId);

    Mono<ApplicationHistorySnapshotTS> getHistorySnapshotDetail(String historySnapshotId);

    Mono<ApplicationHistorySnapshot> getHistorySnapshotDetailArchived(String historySnapshotId);
}
