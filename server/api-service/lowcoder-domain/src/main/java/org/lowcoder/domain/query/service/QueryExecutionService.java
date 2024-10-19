package org.lowcoder.domain.query.service;

import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.query.QueryVisitorContext;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface QueryExecutionService {
    Mono<QueryExecutionResult> executeQuery(Datasource datasource, Map<String, Object> queryConfig, Map<String, Object> requestParams,
                                            String timeoutStr, QueryVisitorContext queryVisitorContext);
}
