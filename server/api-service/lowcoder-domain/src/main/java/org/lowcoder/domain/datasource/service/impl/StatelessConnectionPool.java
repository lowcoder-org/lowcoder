package org.lowcoder.domain.datasource.service.impl;

import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceConnectionHolder;
import org.lowcoder.domain.datasource.model.StatelessDatasourceConnectionHolder;
import org.lowcoder.domain.datasource.service.DatasourceConnectionPool;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class StatelessConnectionPool implements DatasourceConnectionPool {

    @Override
    public Mono<? extends DatasourceConnectionHolder> getOrCreateConnection(Datasource datasource) {
        return Mono.just(new StatelessDatasourceConnectionHolder());
    }

    @Override
    public Object info(String datasourceId) {
        throw new UnsupportedOperationException();
    }
}

