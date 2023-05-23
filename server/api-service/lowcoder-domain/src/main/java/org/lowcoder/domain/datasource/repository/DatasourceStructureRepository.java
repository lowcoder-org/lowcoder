package org.lowcoder.domain.datasource.repository;


import org.lowcoder.domain.datasource.model.DatasourceStructureDO;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

import reactor.core.publisher.Mono;

public interface DatasourceStructureRepository extends ReactiveMongoRepository<DatasourceStructureDO, String> {

    Mono<DatasourceStructureDO> findByDatasourceId(String datasourceId);

}
