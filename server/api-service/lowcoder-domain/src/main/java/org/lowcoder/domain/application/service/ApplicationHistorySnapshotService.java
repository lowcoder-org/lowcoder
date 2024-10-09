package org.lowcoder.domain.application.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.lowcoder.domain.application.model.ApplicationHistorySnapshot;
import org.springframework.data.domain.PageRequest;

import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Mono;

public interface ApplicationHistorySnapshotService {

    Mono<Boolean> createHistorySnapshot(String applicationId, Map<String, Object> dsl, Map<String, Object> context, String userId);

    Mono<List<ApplicationHistorySnapshot>> listAllHistorySnapshotBriefInfo(String applicationId, String compName, String theme, Instant from, Instant to, PageRequest pageRequest);

    Mono<Long> countByApplicationId(String applicationId);

    Mono<ApplicationHistorySnapshot> getHistorySnapshotDetail(String historySnapshotId);
}
