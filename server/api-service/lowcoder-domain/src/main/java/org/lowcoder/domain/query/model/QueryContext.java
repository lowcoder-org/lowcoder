package org.lowcoder.domain.query.model;

import org.lowcoder.domain.datasource.model.Datasource;

import lombok.Getter;
import reactor.core.publisher.Mono;

@Getter
public class QueryContext {

    private final Mono<BaseQuery> baseQueryMono;

    private final Mono<Datasource> datasourceMono;

    public QueryContext(Mono<BaseQuery> baseQueryMono, Mono<Datasource> datasourceMono) {
        this.baseQueryMono = baseQueryMono;
        this.datasourceMono = datasourceMono;
    }
}
