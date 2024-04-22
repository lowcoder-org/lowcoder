package org.lowcoder.domain.datasource.service.impl;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceConnectionHolder;
import org.lowcoder.domain.datasource.service.DatasourceConnectionPool;
import org.lowcoder.domain.plugin.DatasourceMetaInfo;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.lowcoder.domain.plugin.DatasourceMetaInfoConstants.REST_API;

@Primary
@RequiredArgsConstructor
@Service
@Slf4j
public class DatasourceConnectionPoolFacade implements DatasourceConnectionPool {

    private final List<DatasourceConnectionPool> pools;
    private final DatasourceMetaInfoService metaInfoService;

    private Map<Class<? extends DatasourceConnectionPool>, DatasourceConnectionPool> poolMap;

    @PostConstruct
    public void init() {
        log.info("start register connection pools...");
        poolMap = pools.stream()
                .filter(pool -> !(pool instanceof DatasourceConnectionPoolFacade))
                .collect(Collectors.toMap(DatasourceConnectionPool::getClass, Function.identity()));
        poolMap.keySet().forEach(aClass -> log.info("register connection pool:{}", aClass));
        log.info("finish register connection pools.");
    }

    @Override
    public Mono<? extends DatasourceConnectionHolder> getOrCreateConnection(Datasource datasource) {
        // for rest api, connection pool is picked based on auth type
        if (datasource.getType().equals(REST_API)) {
            DatasourceConnectionConfig detailConfig = datasource.getDetailConfig();
            if (detailConfig instanceof RestApiDatasourceConfig restApiDatasourceConfig) {
                if (restApiDatasourceConfig.getAuthType() == RestApiAuthType.NO_AUTH
                        || restApiDatasourceConfig.getAuthType() == RestApiAuthType.BASIC_AUTH
                        || restApiDatasourceConfig.getAuthType() == RestApiAuthType.DIGEST_AUTH
                        || restApiDatasourceConfig.getAuthType() == RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN) {
                    return poolMap.get(StatelessConnectionPool.class).getOrCreateConnection(datasource);
                }
                return poolMap.get(TokenBasedConnectionPool.class).getOrCreateConnection(datasource);
            }
        }

        //common
        DatasourceMetaInfo metaInfo = metaInfoService.getDatasourceMetaInfo(datasource.getType());
        Class<? extends DatasourceConnectionPool> poolClass = metaInfo.getConnectionPool();
        DatasourceConnectionPool datasourceConnectionPool = poolMap.get(poolClass);
        if (datasourceConnectionPool == null) {
            throw new BizException(BizError.INVALID_DATASOURCE_CONFIGURATION, "CANT_FIND_CONNECTION_POOL");
        }
        return datasourceConnectionPool.getOrCreateConnection(datasource);
    }

    @Override
    public Object info(String datasourceId) {
        return poolMap.get(ClientBasedConnectionPool.class).info(datasourceId);
    }
}

