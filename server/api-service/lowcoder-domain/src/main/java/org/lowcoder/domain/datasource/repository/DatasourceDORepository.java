package org.lowcoder.domain.datasource.repository;

import org.lowcoder.domain.datasource.model.DatasourceDO;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

public interface DatasourceDORepository extends ReactiveMongoRepository<DatasourceDO, String> {

    Flux<DatasourceDO> findAllByOrganizationId(String organizationId);

    Mono<DatasourceDO> findByOrganizationIdAndTypeAndCreationSource(String organizationId, String type, int creationSource);

    Mono<Long> countByOrganizationId(String organizationId);
    Flux<DatasourceDO> findByGid(String gid);
    Flux<DatasourceDO> findAllByGidIn(Collection<String> gid);
}
