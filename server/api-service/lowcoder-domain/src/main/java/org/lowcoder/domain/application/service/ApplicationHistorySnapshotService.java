package org.lowcoder.domain.application.service;

import java.util.List;
import java.util.Map;

import org.lowcoder.domain.application.model.ApplicationHistorySnapshot;
import org.springframework.data.domain.PageRequest;

import reactor.core.publisher.Mono;

public interface ApplicationHistorySnapshotService {

    Mono<Boolean> createHistorySnapshot(String applicationId, Map<String, Object> dsl, Map<String, Object> context, String userId);

    Mono<List<ApplicationHistorySnapshot>> listAllHistorySnapshotBriefInfo(String applicationId, PageRequest pageRequest);

    Mono<Long> countByApplicationId(String applicationId);

    Mono<ApplicationHistorySnapshot> getHistorySnapshotDetail(String historySnapshotId);

}
