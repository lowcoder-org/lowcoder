package org.lowcoder.domain.query.service;

import static org.lowcoder.sdk.exception.BizError.QUERY_EXECUTION_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_TIMEOUT;
import static org.lowcoder.sdk.util.ExceptionUtils.ofException;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceConnectionHolder;
import org.lowcoder.domain.datasource.service.DatasourceConnectionPool;
import org.lowcoder.domain.plugin.client.DatasourcePluginClient;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.domain.query.util.QueryTimeoutUtils;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.query.QueryExecutionContext;
import org.lowcoder.sdk.query.QueryVisitorContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class QueryExecutionService {

    @Autowired
    private DatasourceConnectionPool datasourceConnectionPool;

    @Autowired
    private DatasourceMetaInfoService datasourceMetaInfoService;

    @Autowired
    private DatasourcePluginClient datasourcePluginClient;

    public Mono<QueryExecutionResult> executeQuery(Datasource datasource, Map<String, Object> queryConfig, Map<String, Object> requestParams,
            String timeoutStr, QueryVisitorContext queryVisitorContext) {

        int timeoutMs = QueryTimeoutUtils.parseQueryTimeoutMs(timeoutStr, requestParams);

        return Mono.defer(() -> {
                    if (datasourceMetaInfoService.isJsDatasourcePlugin(datasource.getType())) {
                        return executeByNodeJs(datasource, queryConfig, requestParams);
                    }
                    return executeLocally(datasource, queryConfig, requestParams, queryVisitorContext);
                })
                .timeout(Duration.ofMillis(timeoutMs))
                .onErrorMap(TimeoutException.class, e -> new PluginException(QUERY_EXECUTION_TIMEOUT, "PLUGIN_EXECUTION_TIMEOUT", timeoutMs))
                .onErrorResume(PluginException.class, pluginException -> Mono.just(QueryExecutionResult.error(pluginException)))
                .onErrorMap(exception -> {
                    if (exception instanceof BizException) {
                        return exception;
                    }
                    log.error("query exception", exception);
                    return ofException(QUERY_EXECUTION_ERROR, "QUERY_EXECUTION_ERROR", exception.getMessage());
                });
    }

    private Mono<QueryExecutionResult> executeLocally(Datasource datasource, Map<String, Object> queryConfig, Map<String, Object> requestParams,
            QueryVisitorContext queryVisitorContext) {
        var queryExecutor = datasourceMetaInfoService.getQueryExecutor(datasource.getType());

        return queryExecutor.buildQueryExecutionContextMono(datasource.getDetailConfig(), queryConfig, requestParams, queryVisitorContext)
                .zipWhen(context -> datasourceConnectionPool.getOrCreateConnection(datasource))
                .flatMap(tuple -> {
                    QueryExecutionContext queryExecutionRequest = tuple.getT1();
                    DatasourceConnectionHolder connectionHolder = tuple.getT2();
                    return queryExecutor.doExecuteQuery(connectionHolder.connection(), queryExecutionRequest)
                            .doOnError(connectionHolder::onQueryError);
                });
    }

    private Mono<QueryExecutionResult> executeByNodeJs(Datasource datasource, Map<String, Object> queryConfig, Map<String, Object> requestParams) {
        List<Map<String, Object>> context = requestParams.entrySet()
                .stream()
                .map(entry -> Map.of("key", entry.getKey(), "value", entry.getValue()))
                .collect(Collectors.toList());
        return datasourcePluginClient.executeQuery(datasource.getType(), queryConfig, context, datasource.getDetailConfig());
    }
}
