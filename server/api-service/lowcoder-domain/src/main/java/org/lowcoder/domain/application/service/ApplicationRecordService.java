package org.lowcoder.domain.application.service;

import org.lowcoder.domain.application.model.ApplicationRecord;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface ApplicationRecordService {
    Mono<ApplicationRecord> insert(ApplicationRecord applicationRecord);

    Mono<List<ApplicationRecord>> getByApplicationId(String applicationId);

    Mono<Map<String, List<ApplicationRecord>>> getByApplicationIdIn(List<String> applicationIdList);

    Mono<ApplicationRecord> getById(String id);

    Mono<ApplicationRecord> getLatestRecordByApplicationId(String applicationId);

    Mono<Long> deleteAllApplicationTagByApplicationId(String applicationId);

    Mono<Void> deleteById(String id);
}
