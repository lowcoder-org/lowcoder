package org.lowcoder.domain.datasource.service;

import javax.annotation.Nullable;

import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceConnectionHolder;

import reactor.core.publisher.Mono;

public interface DatasourceConnectionPool {

    Mono<? extends DatasourceConnectionHolder> getOrCreateConnection(Datasource datasource);

    Object info(@Nullable String datasourceId);
}
