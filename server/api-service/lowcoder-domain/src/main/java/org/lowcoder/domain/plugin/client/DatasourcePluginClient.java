package org.lowcoder.domain.plugin.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.plugin.client.dto.DatasourcePluginDefinition;
import org.lowcoder.domain.plugin.client.dto.GetPluginDynamicConfigRequestDTO;
import org.lowcoder.infra.js.NodeServerClient;
import org.lowcoder.infra.js.NodeServerHelper;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.CommonConfigHelper;
import org.lowcoder.sdk.exception.ServerException;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import static org.lowcoder.sdk.constants.GlobalContext.REQUEST;

import com.fasterxml.jackson.databind.ObjectMapper;

@Slf4j
@RequiredArgsConstructor
@Component
public class DatasourcePluginClient implements NodeServerClient {

    private static final ExchangeStrategies EXCHANGE_STRATEGIES = ExchangeStrategies
            .builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(-1))
            .build();

    private static final WebClient WEB_CLIENT = WebClient.builder()
            .exchangeStrategies(EXCHANGE_STRATEGIES)
            .build();

    private final CommonConfigHelper commonConfigHelper;
    private final CommonConfig commonConfig;
    private final NodeServerHelper nodeServerHelper;
    private final EncryptionService encryptionService;

    private static final String PLUGINS_PATH = "plugins";
    private static final String RUN_PLUGIN_QUERY = "runPluginQuery";
    private static final String VALIDATE_PLUGIN_DATA_SOURCE_CONFIG = "validatePluginDataSourceConfig";
    private static final String GET_PLUGIN_DYNAMIC_CONFIG = "getPluginDynamicConfig";

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public Mono<List<Object>> getPluginDynamicConfigSafely(List<GetPluginDynamicConfigRequestDTO> getPluginDynamicConfigRequestDTOS) {
        return getPluginDynamicConfig(getPluginDynamicConfigRequestDTOS)
                .onErrorResume(throwable -> {
                    log.error("request /getPluginDynamicConfig error.", throwable);
                    return Mono.just(Collections.emptyList());
                })
                .defaultIfEmpty(Collections.emptyList());
    }

    public Mono<List<Object>> getPluginDynamicConfig(List<GetPluginDynamicConfigRequestDTO> getPluginDynamicConfigRequestDTOS) {
        if (CollectionUtils.isEmpty(getPluginDynamicConfigRequestDTOS)) {
            return Mono.just(Collections.emptyList());
        }
        return getAcceptLanguage()
                .flatMap(language -> WEB_CLIENT
                        .post()
                        .uri(nodeServerHelper.createUri(GET_PLUGIN_DYNAMIC_CONFIG))
                        .header(HttpHeaders.ACCEPT_LANGUAGE, language)
                        .bodyValue(getPluginDynamicConfigRequestDTOS)
                        .<List<Object>> exchangeToMono(response -> {
                            if (response.statusCode().is2xxSuccessful()) {
                                return response.bodyToMono(new ParameterizedTypeReference<>() {
                                });
                            }
                            log.error("request /getPluginDynamicConfig error.{},{}", getPluginDynamicConfigRequestDTOS, response.statusCode().value());
                            return Mono.error(new ServerException("get dynamic config error"));
                        })
                        .timeout(Duration.ofSeconds(10))
                );
    }

    public Mono<DatasourcePluginDefinition> getDatasourcePluginDefinition(String type) {
        return getDatasourcePluginDefinitions()
                .filter(datasourcePluginDefinition -> datasourcePluginDefinition.getId().equals(type))
                .next();
    }

    public Flux<DatasourcePluginDefinition> getDatasourcePluginDefinitions() {
        if (StringUtils.isBlank(commonConfigHelper.getHost())) {
            return Flux.empty();
        }
        return getAcceptLanguage()
                .flatMap(language -> WEB_CLIENT
                        .get()
                        .uri(nodeServerHelper.createUri(PLUGINS_PATH))
                        .header(HttpHeaders.ACCEPT_LANGUAGE, language)
                        .exchangeToMono(response -> {
                            if (response.statusCode().is2xxSuccessful()) {
                                return response.bodyToMono(new ParameterizedTypeReference<List<DatasourcePluginDefinition>>() {
                                });
                            }
                            log.error("request /plugins error.{}", response.statusCode().value());
                            return Mono.just(Collections.emptyList());
                        })
                        .timeout(Duration.ofSeconds(10))
                )
                .onErrorResume(throwable -> {
                    log.error("request /plugins error", throwable);
                    return Mono.just(Collections.emptyList());
                })
                .defaultIfEmpty(Collections.emptyList())
                .flatMapIterable(Function.identity());
    }

    @SuppressWarnings("unchecked")
    public Mono<QueryExecutionResult> executeQuery(String pluginName, Object queryDsl, List<Map<String, Object>> context, Object datasourceConfig) {
        return getAcceptLanguage()
                .flatMap(language -> {
                    try {
                        Map<String, Object> body = Map.of(
                                "pluginName", pluginName,
                                "dsl", queryDsl,
                                "context", context,
                                "dataSourceConfig", datasourceConfig
                        );
                        String json = OBJECT_MAPPER.writeValueAsString(body);

                        boolean encryptionEnabled = !(commonConfig.getJsExecutor().getPassword().isEmpty() || commonConfig.getJsExecutor().getSalt().isEmpty());
                        Object payload;
                        WebClient.RequestBodySpec requestSpec = WEB_CLIENT
                                .post()
                                .uri(nodeServerHelper.createUri(RUN_PLUGIN_QUERY))
                                .header(HttpHeaders.ACCEPT_LANGUAGE, language);

                        if (encryptionEnabled) {
                            payload = encryptionService.encryptStringForNodeServer(json);
                            requestSpec = requestSpec.header("X-Encrypted", "true");
                        } else {
                            payload = body;
                        }

                        return requestSpec
                                .bodyValue(payload)
                                .exchangeToMono(response -> {
                                    if (response.statusCode().is2xxSuccessful()) {
                                        return response.bodyToMono(Map.class)
                                                .map(map -> map.get("result"))
                                                .map(QueryExecutionResult::success);
                                    }
                                    return response.bodyToMono(Map.class)
                                            .map(map -> MapUtils.getString(map, "message"))
                                            .map(QueryExecutionResult::errorWithMessage);
                                });
                    } catch (Exception e) {
                        log.error("Encryption error", e);
                        return Mono.error(new ServerException("Encryption error"));
                    }
                });
    }

    @SuppressWarnings("unchecked")
    public Mono<DatasourceTestResult> test(String pluginName, Object datasourceConfig) {
        return getAcceptLanguage()
                .flatMap(language -> WEB_CLIENT
                        .post()
                        .uri(nodeServerHelper.createUri(VALIDATE_PLUGIN_DATA_SOURCE_CONFIG))
                        .header(HttpHeaders.ACCEPT_LANGUAGE, language)
                        .bodyValue(Map.of("pluginName", pluginName, "dataSourceConfig", datasourceConfig))
                        .exchangeToMono(response -> {
                            if (response.statusCode().is2xxSuccessful()) {
                                return response.bodyToMono(Map.class)
                                        .map(map -> {
                                            if (MapUtils.getBoolean(map, "success", false)) {
                                                return DatasourceTestResult.testSuccess();
                                            }
                                            return DatasourceTestResult.testFail(MapUtils.getString(map, "message", ""));
                                        });
                            }
                            return response.bodyToMono(Map.class)
                                    .map(map -> DatasourceTestResult.testFail(MapUtils.getString(map, "message", "")));
                        }));
    }

    private Mono<String> getAcceptLanguage() {
        return Mono.deferContextual(contextView -> contextView.<ServerHttpRequest> getOrEmpty(REQUEST)
                .map(request -> request.getHeaders().getFirst(HttpHeaders.ACCEPT_LANGUAGE))
                .map(Mono::just)
                .orElse(Mono.just("")));
    }
}
