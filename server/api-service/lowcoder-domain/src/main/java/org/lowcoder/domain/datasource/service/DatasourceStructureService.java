package org.lowcoder.domain.datasource.service;

import org.lowcoder.sdk.models.DatasourceStructure;

import reactor.core.publisher.Mono;

public interface DatasourceStructureService {

    Mono<DatasourceStructure> getStructure(String datasourceId, boolean ignoreCache);

}

