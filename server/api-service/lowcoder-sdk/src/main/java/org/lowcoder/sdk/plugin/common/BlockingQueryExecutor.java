package org.lowcoder.sdk.plugin.common;

import jakarta.annotation.Nonnull;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.query.QueryExecutionContext;
import reactor.core.publisher.Mono;

import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;
import static org.lowcoder.sdk.plugin.common.QueryExecutionUtils.querySharedScheduler;

public abstract class BlockingQueryExecutor<ConnectionConfig extends DatasourceConnectionConfig, Connection,
        QueryContext extends QueryExecutionContext>
        implements QueryExecutor<ConnectionConfig, Connection, QueryContext> {

    /**
     * NEW-16: a {@link NoClassDefFoundError} thrown by the plugin inside either lambda below used to reach nobody.
     * Reactor classifies every {@code LinkageError} as JVM-fatal and rethrows it rather than signalling it
     * ({@code Exceptions.isJvmFatal} tests {@code VirtualMachineError}, {@code ThreadDeath} and {@code LinkageError};
     * {@code throwIfFatal} logs a warning and rethrows), and because both methods subscribe on the shared plugin
     * scheduler the rethrow lands on a worker thread with no subscriber to tell - so the caller was told nothing and
     * the request ran to its timeout, which named a timeout and not the missing class.
     *
     * <p>Each catch below answers the error and the message key that the enclosing default method of
     * {@link QueryExecutor} already answers for an ordinary exception of the same method - {@code QUERY_EXECUTION_ERROR}
     * with key {@code QUERY_EXECUTION_ERROR} for a query, the same error with key
     * {@code DATASOURCE_GET_STRUCTURE_ERROR} for a structure read - so no caller is given a code or key that endpoint
     * could not already return. Note that the structure key is paired with the {@code QUERY_EXECUTION_ERROR} error and
     * not with the similarly named {@code PluginCommonError.DATASOURCE_GET_STRUCTURE_ERROR}: that is what
     * {@code doGetStructure} itself does, and this follows it deliberately rather than by oversight.
     *
     * <p>The message argument is {@code e.toString()} where those wrappers pass {@code e.getMessage()}. A
     * {@code NoClassDefFoundError} often carries only the class name and sometimes carries no message at all, which
     * would render as "Query execution error: null"; {@code toString()} always names the error's class. That matters
     * more than usual here because {@link PluginException} takes no cause, so the original error is not chained, and
     * because the catch takes the error before Reactor sees it the fatal stack trace Reactor used to log is no longer
     * logged either. The class name in the answer is what remains of the diagnosis.
     *
     * <p>Only {@code NoClassDefFoundError} is caught, deliberately and not as a shortcut: it is the one
     * {@code LinkageError} that means a class this query needed could not be loaded while the JVM itself stays usable -
     * whether because a jar is absent or because a static initialiser had already failed, which the error does not
     * distinguish and this class does not claim. Every other {@code LinkageError} still reaches nobody, including an
     * {@code ExceptionInInitializerError} from a first failing initialiser inside these same lambdas. Widening both
     * catches to {@code LinkageError} is a one-word change, and {@code BlockingQueryExecutorTest} has a test that fails
     * when it is made, so the decision is visible and reversible.
     *
     * <p>What this does not cover (finding NEW-54): the same shape is unfixed in
     * {@link BlockingDatasourceConnector}, where a missing class during connection creation, testing or destruction
     * still hangs, and in {@code QueryExecutor.doBuildQueryExecutionContextMono}, which has the shape without a
     * {@code subscribeOn} and whose behaviour was not examined.
     */
    @Override
    public final Mono<QueryExecutionResult> executeQuery(Connection connection, QueryContext queryExecutionContext) {
        return Mono.fromSupplier(() -> {
                    try {
                        return blockingExecuteQuery(connection, queryExecutionContext);
                    } catch (NoClassDefFoundError e) {
                        throw new PluginException(QUERY_EXECUTION_ERROR, "QUERY_EXECUTION_ERROR", e.toString());
                    }
                })
                .subscribeOn(querySharedScheduler());
    }

    @Override
    public final Mono<DatasourceStructure> getStructure(Connection connection, ConnectionConfig connectionConfig) {
        return Mono.fromCallable(() -> {
                    try {
                        return blockingGetStructure(connection, connectionConfig);
                    } catch (NoClassDefFoundError e) {
                        throw new PluginException(QUERY_EXECUTION_ERROR, "DATASOURCE_GET_STRUCTURE_ERROR", e.toString());
                    }
                })
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
