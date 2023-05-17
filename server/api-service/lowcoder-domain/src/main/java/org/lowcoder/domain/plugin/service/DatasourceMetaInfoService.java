package org.lowcoder.domain.plugin.service;

import java.util.List;
import java.util.Map;

import org.lowcoder.domain.plugin.DatasourceMetaInfo;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.plugin.common.DatasourceConnector;
import org.lowcoder.sdk.plugin.common.QueryExecutor;
import org.lowcoder.sdk.query.QueryExecutionContext;

import reactor.core.publisher.Flux;

public interface DatasourceMetaInfoService {

    DatasourceMetaInfo getDatasourceMetaInfo(String datasourceType);

    /**
     * java based data sources only
     */
    List<DatasourceMetaInfo> getJavaBasedSupportedDatasourceMetaInfos();

    boolean isJavaDatasourcePlugin(String type);

    boolean isJsDatasourcePlugin(String type);

    /**
     * all data sources, include java based, js based...
     */
    Flux<DatasourceMetaInfo> getAllSupportedDatasourceMetaInfos();

    DatasourceConnector<Object, ? extends DatasourceConnectionConfig> getDatasourceConnector(String datasourceType);

    QueryExecutor<? extends DatasourceConnectionConfig, Object, ? extends QueryExecutionContext> getQueryExecutor(String datasourceType);

    DatasourceConnectionConfig resolveDetailConfig(Map<String, Object> datasourceDetailMap, String datasourceType);
}
