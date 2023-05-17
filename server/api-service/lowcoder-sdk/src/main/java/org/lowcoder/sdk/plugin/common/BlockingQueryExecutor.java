package org.lowcoder.sdk.plugin.common;

import static org.lowcoder.sdk.plugin.common.QueryExecutionUtils.querySharedScheduler;

import javax.annotation.Nonnull;

import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.query.QueryExecutionContext;

import reactor.core.publisher.Mono;

public abstract class BlockingQueryExecutor<ConnectionConfig extends DatasourceConnectionConfig, Connection,
        QueryContext extends QueryExecutionContext>
        implements QueryExecutor<ConnectionConfig, Connection, QueryContext> {

    @Override
    public final Mono<QueryExecutionResult> executeQuery(Connection connection, QueryContext queryExecutionContext) {
        return Mono.fromSupplier(() -> blockingExecuteQuery(connection, queryExecutionContext))
                .subscribeOn(querySharedScheduler());
    }

    @Override
    public final Mono<DatasourceStructure> getStructure(Connection connection, ConnectionConfig connectionConfig) {
        return Mono.fromCallable(() -> blockingGetStructure(connection, connectionConfig))
                .subscribeOn(querySharedScheduler());
    }

    @Nonnull
    protected abstract QueryExecutionResult blockingExecuteQuery(Connection connection, QueryContext context);

    @SuppressWarnings("unused")
    @Nonnull
    protected DatasourceStructure blockingGetStructure(Connection connection,
            ConnectionConfig connectionConfig) {
        return new DatasourceStructure(); // dummy result
    }


}
