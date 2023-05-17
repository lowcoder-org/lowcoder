package org.lowcoder.domain.datasource.service;

import java.util.Collection;

import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.sdk.models.DatasourceTestResult;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface DatasourceService {

    Mono<Datasource> create(Datasource datasource, String creatorId);

    Mono<Datasource> update(String id, Datasource resource);

    Mono<Datasource> getById(String id);

    Mono<Boolean> delete(String id);

    Mono<DatasourceTestResult> testDatasource(Datasource datasource);

    Mono<Void> removePasswordTypeKeysFromJsDatasourcePluginConfig(Datasource datasource);

    Flux<Datasource> getByOrgId(String orgId);

    Mono<Long> countByOrganizationId(String orgId);

    Mono<Datasource> findWorkspacePredefinedDatasource(String organizationId, String datasourceType);

    Flux<String> retainNoneExistAndNonCurrentOrgDatasourceIds(Collection<String> datasourceIds, String organizationId);
}
