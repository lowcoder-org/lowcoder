package org.lowcoder.domain.datasource.service.impl;

import com.google.common.base.Joiner;
import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.repository.ApplicationRepository;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.repository.DatasourceRepository;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.datasource.service.JsDatasourceHelper;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.plugin.client.DatasourcePluginClient;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.lowcoder.sdk.util.LocaleUtils;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Collection;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import static org.apache.commons.collections4.CollectionUtils.isNotEmpty;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;
import static org.lowcoder.sdk.util.LocaleUtils.getLocale;

@Slf4j
@Service
@RequiredArgsConstructor
public class DatasourceServiceImpl implements DatasourceService {

    private static final Duration DEFAULT_TEST_CONNECTION_TIMEOUT = Duration.ofSeconds(10);
    private static final String INVALID_PARAMETER_CODE = "INVALID_PARAMETER";

    private final DatasourceMetaInfoService datasourceMetaInfoService;
    private final ApplicationRepository applicationRepository;
    @Lazy
    private final ResourcePermissionService resourcePermissionService;
    private final DatasourceRepository repository;
    private final DatasourcePluginClient datasourcePluginClient;
    private final JsDatasourceHelper jsDatasourceHelper;

    @Override
    public Mono<Datasource> create(Datasource datasource, String creatorId) {
        if (datasource.getId() != null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, INVALID_PARAMETER_CODE, FieldName.ID));
        }

        return Mono.just(datasource)
                .flatMap(this::validateDatasource)
                .flatMap(this::trySaveDatasource)
                .delayUntil(savedDatasource -> resourcePermissionService.addDataSourcePermissionToUser(savedDatasource.getId(), creatorId,
                        ResourceRole.OWNER));
    }

    @Override
    public Mono<Datasource> update(String datasourceId, Datasource updatedDatasource) {

        if (datasourceId == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, INVALID_PARAMETER_CODE, FieldName.ID));
        }

        return repository.findById(datasourceId)
                .delayUntil(jsDatasourceHelper::fillPluginDefinition)
                .map(currentDatasource -> currentDatasource.mergeWith(updatedDatasource))
                .flatMap(this::validateDatasource)
                .flatMap(this::trySaveDatasource);
    }

    @Override
    public Mono<Datasource> getById(String id) {

        if (StringUtils.equals(id, Datasource.QUICK_REST_API_ID)) {
            return Mono.just(Datasource.QUICK_REST_API);
        }

        if (StringUtils.equals(id, Datasource.QUICK_GRAPHQL_ID)) {
            return Mono.just(Datasource.QUICK_GRAPHQL_API);
        }

        if (StringUtils.equals(id, Datasource.LOWCODER_API_ID)) {
            return Mono.just(Datasource.LOWCODER_API);
        }

        return repository.findById(id);
    }

    private Mono<Datasource> validateDatasource(Datasource datasource) {

        if (datasource.getOrganizationId() == null) {
            throw new BizException(BizError.INVALID_PARAMETER, INVALID_PARAMETER_CODE, FieldName.ORGANIZATION_ID);
        }

        if (StringUtils.isBlank(datasource.getName())) {
            throw new BizException(BizError.INVALID_PARAMETER, INVALID_PARAMETER_CODE, FieldName.NAME);
        }

        if (datasource.getType() == null) {
            throw new BizException(BizError.DATASOURCE_PLUGIN_ID_NOT_GIVEN, "DATASOURCE_PLUGIN_ID_NOT_GIVEN");
        }

        if (datasourceMetaInfoService.isJsDatasourcePlugin(datasource.getType())) {
            return Mono.just(datasource);
        }

        return Mono.deferContextual(ctx -> {
            Locale locale = getLocale(ctx);
            return Mono.just(datasourceMetaInfoService.getDatasourceConnector(datasource.getType()))
                    .flatMap(datasourceConnector -> {
                        DatasourceConnectionConfig detailConfig = datasource.getDetailConfig();
                        Set<String> errorMsgKeySet = datasourceConnector.doValidateConfig(detailConfig);
                        Set<String> errorMsgSet = errorMsgKeySet.stream()
                                .map(key -> LocaleUtils.getMessage(locale, key))
                                .collect(Collectors.toSet());
                        if (isNotEmpty(errorMsgKeySet)) {
                            return ofError(BizError.INVALID_DATASOURCE_CONFIGURATION, "INVALID_DATASOURCE_CONFIGURATION",
                                    Joiner.on('\n').join(errorMsgSet));
                        }

                        return Mono.just(datasource);
                    });
        });
    }

    @Nonnull
    private Mono<Datasource> trySaveDatasource(Datasource datasource) {
        return repository.save(datasource)
                .onErrorMap(error -> {
                    if (error instanceof DuplicateKeyException) {
                        return new BizException(BizError.DUPLICATE_DATABASE_NAME, "DUPLICATE_DATABASE_NAME", datasource.getName());
                    }
                    return error;
                });
    }

    @Override
    public Mono<DatasourceTestResult> testDatasource(Datasource testDatasource) {
        Mono<Datasource> datasourceMono = Mono.just(testDatasource);

        if (testDatasource.getId() != null) {
            datasourceMono = getById(testDatasource.getId())
                    .switchIfEmpty(deferredError(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                    .delayUntil(jsDatasourceHelper::fillPluginDefinition)
                    .map(datasource -> datasource.mergeWith(testDatasource));
        }

        return datasourceMono
                .flatMap(this::validateDatasource)
                .flatMap(datasource -> {
                    if (datasourceMetaInfoService.isJsDatasourcePlugin(datasource.getType())) {
                        return testDatasourceByNodeJs(datasource);
                    }
                    return testDatasourceLocally(datasource);
                });
    }

    private Mono<DatasourceTestResult> testDatasourceLocally(Datasource datasource) {
        return datasourceMetaInfoService.getDatasourceConnector(datasource.getType())
                .doTestConnection(datasource.getDetailConfig())
                .timeout(DEFAULT_TEST_CONNECTION_TIMEOUT)
                .onErrorResume(error -> Mono.just(DatasourceTestResult.testFail(error)));
    }

    private Mono<DatasourceTestResult> testDatasourceByNodeJs(Datasource datasource) {
        return datasourcePluginClient.test(datasource.getType(), datasource.getDetailConfig());
    }

    @Override
    public Mono<Void> removePasswordTypeKeysFromJsDatasourcePluginConfig(Datasource datasource) {
        return jsDatasourceHelper.fillPluginDefinition(datasource)
                .doFinally(__ -> {
                    if (datasourceMetaInfoService.isJsDatasourcePlugin(datasource.getType())
                            && datasource.getDetailConfig() instanceof JsDatasourceConnectionConfig jsDatasourceConnectionConfig) {
                        jsDatasourceConnectionConfig.removePasswords();
                    }
                });
    }

    @Override
    public Flux<Datasource> getByOrgId(String orgId) {
        return repository.findAllByOrganizationId(orgId);
    }

    @Override
    public Mono<Long> countByOrganizationId(String orgId) {
        return repository.countByOrganizationId(orgId);
    }

    @Override
    public Mono<Datasource> findWorkspacePredefinedDatasource(String organizationId, String type) {
        return repository.findWorkspacePredefinedDatasourceByOrgIdAndType(organizationId, type);
    }

    @Override
    public Flux<String> retainNoneExistAndNonCurrentOrgDatasourceIds(Collection<String> datasourceIds, String orgId) {
        if (CollectionUtils.isEmpty(datasourceIds)) {
            return Flux.empty();
        }
        return repository.retainNoneExistAndNonCurrentOrgDatasourceIds(datasourceIds, orgId);
    }

    @Override
    public Mono<Boolean> delete(String datasourceId) {
        return stillUsedInApplications(datasourceId)
                .flatMap(stillUsedInApplications -> {
                    if (Boolean.TRUE.equals(stillUsedInApplications)) {
                        return Mono.error(new BizException(BizError.DATASOURCE_DELETE_FAIL_DUE_TO_REMAINING_QUERIES,
                                "DATASOURCE_DELETE_FAIL_DUE_TO_REMAINING_QUERIES"));
                    }
                    return Mono.empty();
                })
                .then(repository.markDatasourceAsDeleted(datasourceId));
    }

    @Nonnull
    private Mono<Boolean> stillUsedInApplications(String datasourceId) {
        return applicationRepository.findByDatasourceId(datasourceId)
                .filter(application -> application.getApplicationStatus() != ApplicationStatus.DELETED)
                .hasElements();
    }
}

