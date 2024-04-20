package org.lowcoder.plugin.graphql;

import jakarta.annotation.Nonnull;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.plugin.common.DatasourceConnector;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.pf4j.Extension;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Set;

import static java.util.Collections.emptySet;

@Extension
public class GraphQLConnector implements DatasourceConnector<Object, GraphQLDatasourceConfig> {
    @Nonnull
    @Override
    public GraphQLDatasourceConfig resolveConfig(Map<String, Object> configMap) {
        return GraphQLDatasourceConfig.buildFrom(configMap);
    }

    @Override
    public Set<String> validateConfig(GraphQLDatasourceConfig config) {
        return emptySet();
    }

    @Override
    public Mono<DatasourceTestResult> testConnection(GraphQLDatasourceConfig config) {
        return Mono.just(DatasourceTestResult.testSuccess());
    }

    @Override
    public Mono<Object> createConnection(GraphQLDatasourceConfig connectionConfig) {
        return Mono.just(new Object());
    }

    @Override
    public Mono<Void> destroyConnection(Object o) {
        return Mono.empty();
    }
}
