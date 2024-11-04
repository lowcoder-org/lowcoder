package org.lowcoder.domain.application.service;

import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.application.model.ApplicationRecord;
import org.lowcoder.domain.application.repository.ApplicationRecordRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.lowcoder.sdk.exception.BizError.APPLICATION_NOT_FOUND;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;

@RequiredArgsConstructor
@Service
public class ApplicationRecordServiceImpl implements ApplicationRecordService {

    private final ApplicationRecordRepository applicationRecordRepository;

    @Override
    public Mono<ApplicationRecord> insert(ApplicationRecord applicationRecord) {
        return applicationRecordRepository.save(applicationRecord);
    }

    /**
     * get all published versions
     */
    @Override
    public Mono<List<ApplicationRecord>> getByApplicationId(String applicationId) {
        return applicationRecordRepository.findByApplicationId(applicationId)
                .sort(Comparator.comparing(ApplicationRecord::getCreatedAt).reversed())
                .collectList();
    }

    @Override
    public Mono<Map<String, List<ApplicationRecord>>> getByApplicationIdIn(List<String> applicationIdList) {
        return applicationRecordRepository.findByApplicationIdIn(applicationIdList)
                .sort(Comparator.comparing(ApplicationRecord::getCreatedAt).reversed())
                .collectList()
                .map(applicationRecords -> applicationRecords.stream()
                        .collect(Collectors.groupingBy(ApplicationRecord::getApplicationId)));
    }

    @Override
    public Mono<ApplicationRecord> getById(String id) {
        return applicationRecordRepository.findById(id)
                .switchIfEmpty(deferredError(APPLICATION_NOT_FOUND, "APPLICATION_NOT_FOUND"));
    }

    /**
     * get the latest published version
     */
    @Override
    public Mono<ApplicationRecord> getLatestRecordByApplicationId(String applicationId) {
        return applicationRecordRepository.findTop1ByApplicationIdOrderByCreatedAtDesc(applicationId);
    }

    @Override
    public Mono<Long> deleteAllApplicationTagByApplicationId(String applicationId) {
        return applicationRecordRepository.deleteByApplicationId(applicationId);
    }

    @Override
    public Mono<Void> deleteById(String id) {
        return applicationRecordRepository.deleteById(id);
    }


}
