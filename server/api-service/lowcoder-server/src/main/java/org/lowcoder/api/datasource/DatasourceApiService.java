package org.lowcoder.api.datasource;

import jakarta.annotation.Nullable;
import org.lowcoder.api.permission.view.CommonPermissionView;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.plugin.client.dto.GetPluginDynamicConfigRequestDTO;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface DatasourceApiService {
    Mono<Datasource> create(Datasource datasource);

    Flux<Datasource> listJsDatasourcePlugins(String applicationId, String name, String type);

    Flux<DatasourceView> listAppDataSources(String appId, String name, String type);

    Flux<DatasourceView> listOrgDataSources(String orgId, String name, String type);

    Mono<Datasource> update(String datasourceId, Datasource updatedDatasource);

    Mono<Datasource> findByIdWithPermission(String datasourceId);

    Mono<DatasourceTestResult> testDatasource(Datasource testDatasource);

    Mono<Boolean> delete(String datasourceId);

    Object info(@Nullable String datasourceId);

    Mono<List<Object>> getPluginDynamicConfig(List<GetPluginDynamicConfigRequestDTO> getPluginDynamicConfigRequestDTOS);

    Mono<CommonPermissionView> getPermissions(String datasourceId);

    Mono<Boolean> grantPermission(String datasourceId, @Nullable Set<String> userIds, @Nullable Set<String> groupIds, ResourceRole role);

    Mono<Boolean> updatePermission(String permissionId, ResourceRole role);

    Mono<Boolean> deletePermission(String permissionId);
}
