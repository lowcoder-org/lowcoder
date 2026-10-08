package org.lowcoder.domain.query.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceConnectionHolder;
import org.lowcoder.domain.datasource.service.DatasourceConnectionPool;
import org.lowcoder.domain.plugin.client.DatasourcePluginClient;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.domain.query.util.QueryTimeoutUtils;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.query.QueryExecutionContext;
import org.lowcoder.sdk.query.QueryVisitorContext;
import org.lowcoder.sdk.util.MustacheHelper;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

import static org.lowcoder.sdk.exception.BizError.QUERY_EXECUTION_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_TIMEOUT;
import static org.lowcoder.sdk.util.ExceptionUtils.ofException;

@RequiredArgsConstructor
@Slf4j
@Service
public class QueryExecutionServiceImpl implements QueryExecutionService {

    static final String CONTEXT_KEY = "key";
    static final String CONTEXT_VALUE = "value";
    /** The length of {@code {{} and of {@code }}}. */
    private static final int MUSTACHE_BRACES = 2;

    private final DatasourceConnectionPool datasourceConnectionPool;
    private final DatasourceMetaInfoService datasourceMetaInfoService;
    private final DatasourcePluginClient datasourcePluginClient;
    private final CommonConfig common;
    
    @Override
    public Mono<QueryExecutionResult> executeQuery(Datasource datasource, Map<String, Object> queryConfig, Map<String, Object> requestParams,
                                                   String timeoutStr, QueryVisitorContext queryVisitorContext) {

        // BF-043: the maximum is in seconds, as configured; it was passed multiplied by 1000
        int timeoutMs = QueryTimeoutUtils.parseQueryTimeoutMs(timeoutStr, requestParams, common.getMaxQueryTimeout());
        queryConfig.putIfAbsent("timeoutMs", String.valueOf(timeoutMs));

        return Mono.defer(() -> {
                    if (datasourceMetaInfoService.isJsDatasourcePlugin(datasource.getType())) {
                        return executeByNodeJs(datasource, queryConfig, requestParams, queryVisitorContext);
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

    private Mono<QueryExecutionResult> executeByNodeJs(Datasource datasource, Map<String, Object> queryConfig, Map<String, Object> requestParams, QueryVisitorContext queryVisitorContext) {
        List<Map<String, Object>> context = requestParams.entrySet()
                .stream()
                .map(entry -> {
                    Map<String, Object> temp = new HashMap<>();
                    temp.put(CONTEXT_KEY, entry.getKey());
                    temp.put(CONTEXT_VALUE, entry.getValue()); // Allows null values
                    return temp;
                })
                .collect(Collectors.toList());

        //forward cookies to js datasource
        List<Map<String, Object>> cookies = queryVisitorContext.getCookies().entrySet()
                .stream()
                .map(entry -> Map.<String, Object>of(CONTEXT_KEY, entry.getKey(), CONTEXT_VALUE, entry.getValue()))
                .collect(Collectors.toList());
        context.addAll(cookies);

        // forward oauth2 access token in case of oauth2(inherit from login)

        if(datasource.getDetailConfig() instanceof JsDatasourceConnectionConfig jsDatasourceConnectionConfig
                && jsDatasourceConnectionConfig.isOauth2InheritFromLogin()) {
            return Mono.defer(() -> injectOauth2Token(queryVisitorContext, context))
                    .then(Mono.defer(() -> datasourcePluginClient.executeQuery(datasource.getType(), queryConfig,
                            withKeysAsWrittenInTheQuery(queryConfig, context), datasource.getDetailConfig())));
        } else {
            return datasourcePluginClient.executeQuery(datasource.getType(), queryConfig, withKeysAsWrittenInTheQuery(queryConfig, context),
                    datasource.getDetailConfig());
        }


    }

    /**
     * NEW-37 (GitHub #2036): node-service looks a {@code {{ }}} up by the text between the braces as written, spaces
     * included (node-service {@code src/services/plugin.ts}, {@code evalDynamicSegment}), but the request parameters arrive
     * with trimmed keys ({@code QueryExecutionRequest.paramMap}), so {@code {{ input.value }}} found nothing. For every token
     * of the query config whose text has surrounding spaces, the context gets the value node-service would find for the
     * trimmed key (the last entry of that key) once more, under the text as written.
     *
     * <p>Limits: the tokens are found with api-service's tokenizer ({@link MustacheHelper#tokenize}); a template that
     * node-service's tokenizer splits differently is not covered. A key already in the context is never replaced, and a
     * token whose trimmed key is not in the context gets nothing.
     */
    static List<Map<String, Object>> withKeysAsWrittenInTheQuery(Map<String, Object> queryConfig, List<Map<String, Object>> context) {
        Set<String> tokens = new LinkedHashSet<>();
        collectMustacheTokens(queryConfig, tokens);
        // node-service builds its lookup with Object.fromEntries, so of two entries with one key the later wins (a token
        // inherited from the login over a parameter of that name); the value given under the text as written is that one
        Map<Object, Object> values = new HashMap<>();
        context.forEach(entry -> values.put(entry.get(CONTEXT_KEY), entry.get(CONTEXT_VALUE)));
        for (String token : tokens) {
            String asWritten = token.substring(MUSTACHE_BRACES, token.length() - MUSTACHE_BRACES);
            String trimmed = asWritten.trim();
            // a token without surrounding spaces is its own trimmed key, already in the context
            if (values.containsKey(trimmed) && !values.containsKey(asWritten)) {
                Map<String, Object> alias = new HashMap<>();
                alias.put(CONTEXT_KEY, asWritten);
                alias.put(CONTEXT_VALUE, values.get(trimmed)); // Allows null values
                context.add(alias);
                values.put(asWritten, values.get(trimmed));
            }
        }
        return context;
    }

    private static void collectMustacheTokens(Object value, Set<String> tokens) {
        if (value instanceof String text) {
            MustacheHelper.tokenize(text).stream().filter(MustacheHelper::isMustacheToken).forEach(tokens::add);
        } else if (value instanceof Map<?, ?> map) {
            map.values().forEach(nested -> collectMustacheTokens(nested, tokens));
        } else if (value instanceof Collection<?> collection) {
            collection.forEach(nested -> collectMustacheTokens(nested, tokens));
        }
    }

    private Mono<Void> injectOauth2Token(QueryVisitorContext queryVisitorContext, List<Map<String, Object>> context) {
        return queryVisitorContext.getAuthTokenMono()
                .doOnNext(properties -> {
                    for (Property property : properties) {
                        context.add(Map.of(CONTEXT_KEY, property.getKey(), CONTEXT_VALUE, property.getValue()));
                    }
                })
                .then();
    }
}
