package org.lowcoder.api.query;

import org.lowcoder.api.query.view.*;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

public interface LibraryQueryApiService {
    Mono<List<LibraryQueryView>> listLibraryQueries();

    Mono<LibraryQueryView> create(LibraryQuery libraryQuery);

    Mono<Boolean> update(String libraryQueryId, UpsertLibraryQueryRequest upsertLibraryQueryRequest);

    Mono<Void> delete(String libraryQueryId);

    Mono<LibraryQueryRecordMetaView> publish(String libraryQueryId, LibraryQueryPublishRequest libraryQueryPublishRequest);

    @SuppressWarnings("ConstantConditions")
    Mono<List<LibraryQueryAggregateView>> dropDownList();

    Mono<QueryExecutionResult> executeLibraryQueryFromJs(ServerWebExchange exchange, LibraryQueryRequestFromJs request);

    Mono<QueryExecutionResult> executeLibraryQuery(ServerWebExchange exchange, QueryExecutionRequest queryExecutionRequest);
}
