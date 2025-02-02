package org.lowcoder.domain.application.service;

import org.lowcoder.domain.application.model.ApplicationVersion;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface ApplicationRecordService {
    Mono<ApplicationVersion> insert(ApplicationVersion applicationRecord);

    Mono<List<ApplicationVersion>> getByApplicationId(String applicationId);

    Mono<Map<String, List<ApplicationVersion>>> getByApplicationIdIn(List<String> applicationIdList);

    Mono<ApplicationVersion> getById(String id);

    Mono<ApplicationVersion> getLatestRecordByApplicationId(String applicationId);

    Mono<Long> deleteAllApplicationTagByApplicationId(String applicationId);

    Mono<Void> deleteById(String id);
}
