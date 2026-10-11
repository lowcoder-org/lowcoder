package org.lowcoder.api.application;

import org.lowcoder.api.application.view.ApplicationRecordMetaView;
import org.lowcoder.domain.application.model.ApplicationCombineId;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface ApplicationRecordApiService {
    Mono<Map<String, Object>> getRecordDSLFromApplicationCombineId(ApplicationCombineId applicationCombineId);

    Mono<Void> delete(String id);

    Mono<List<ApplicationRecordMetaView>> getByApplicationId(String applicationId);
}
