package org.lowcoder.sdk.plugin.common;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.function.Supplier;

import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.query.QueryExecutionContext;
import org.lowcoder.sdk.query.QueryVisitorContext;

import reactor.core.publisher.Mono;

/**
 * Minimal plugin types for the contract tests of {@link QueryExecutor}, {@link DatasourceConnector} and
 * {@link BlockingDatasourceConnector}: a config, a second config of another type, a query context, and implementations
 * whose behaviour the test sets through public fields.
 */
final class ConnectorTestTypes {

    private ConnectorTestTypes() {
    }

    /** The config type the test plugin works with; its Jackson binding is the default one (fields by name). */
    public static class TestConfig implements DatasourceConnectionConfig {
        public String host;

        public TestConfig() {
        }

        TestConfig(String host) {
            this.host = host;
        }

        @Override
        public DatasourceConnectionConfig mergeWithUpdatedConfig(DatasourceConnectionConfig detailConfig) {
            return detailConfig;
        }
    }

    /** A config of another datasource type. */
    static final class OtherConfig implements DatasourceConnectionConfig {
        @Override
        public DatasourceConnectionConfig mergeWithUpdatedConfig(DatasourceConnectionConfig detailConfig) {
            return detailConfig;
        }
    }

    static final class TestContext extends QueryExecutionContext {
        final String sql;

        TestContext(String sql) {
            this.sql = sql;
        }
    }

    /** A query context of a type this executor does not work with. */
    static final class OtherContext extends QueryExecutionContext {
    }

    static final class TestExecutor implements QueryExecutor<TestConfig, String, TestContext> {
        Supplier<TestContext> build = () -> new TestContext("select 1");
        Function<TestContext, Mono<QueryExecutionResult>> execute = context -> Mono.just(QueryExecutionResult.success(context.sql));
        Mono<DatasourceStructure> structure = null;

        @Override
        public TestContext buildQueryExecutionContext(TestConfig datasourceConfig, Map<String, Object> queryConfig, Map<String, Object> requestParams,
                QueryVisitorContext queryVisitorContext) {
            return build.get();
        }

        @Override
        public Mono<QueryExecutionResult> executeQuery(String connection, TestContext queryExecutionContext) {
            return execute.apply(queryExecutionContext);
        }

        @Override
        public Mono<DatasourceStructure> getStructure(String connection, TestConfig connectionConfig) {
            return structure != null ? structure : QueryExecutor.super.getStructure(connection, connectionConfig);
        }
    }

    static class TestConnector implements DatasourceConnector<String, TestConfig> {
        Mono<String> create = Mono.just("connection");
        Set<String> invalid = Set.of();
        Mono<DatasourceTestResult> test = Mono.just(DatasourceTestResult.testSuccess());

        @Override
        public Set<String> validateConfig(TestConfig config) {
            return invalid;
        }

        @Override
        public Mono<DatasourceTestResult> testConnection(TestConfig config) {
            return test;
        }

        @Override
        public Mono<String> createConnection(TestConfig connectionConfig) {
            return create;
        }

        @Override
        public Mono<Void> destroyConnection(String connection) {
            return Mono.empty();
        }
    }

    /** Records on which thread each blocking method ran, and what it was given. */
    static final class TestBlockingConnector extends BlockingDatasourceConnector<String, TestConfig> {
        final Map<String, String> threads = new HashMap<>();
        final Map<String, Object> given = new HashMap<>();
        RuntimeException failure;

        @Override
        public Set<String> validateConfig(TestConfig config) {
            return Set.of();
        }

        @Override
        protected DatasourceTestResult blockingTestConnection(String connection) {
            threads.put("test", Thread.currentThread().getName());
            given.put("test", connection);
            if (failure != null) {
                throw failure;
            }
            return DatasourceTestResult.testSuccess();
        }

        @Override
        protected void blockingDestroyConnection(String connection) {
            threads.put("destroy", Thread.currentThread().getName());
            given.put("destroy", connection);
            if (failure != null) {
                throw failure;
            }
        }

        @Override
        protected String blockingCreateConnection(TestConfig connectionConfig) {
            threads.put("create", Thread.currentThread().getName());
            if (failure != null) {
                throw failure;
            }
            return "blocking:" + connectionConfig.host;
        }
    }
}
