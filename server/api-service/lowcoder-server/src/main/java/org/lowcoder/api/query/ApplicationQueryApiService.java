package org.lowcoder.api.query;

import org.lowcoder.api.query.view.QueryExecutionRequest;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

public interface ApplicationQueryApiService {
    Mono<QueryExecutionResult> executeApplicationQuery(ServerWebExchange exchange, QueryExecutionRequest queryExecutionRequest);
}
