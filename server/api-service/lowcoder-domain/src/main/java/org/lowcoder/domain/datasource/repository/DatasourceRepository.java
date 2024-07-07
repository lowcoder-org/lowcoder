package org.lowcoder.domain.datasource.repository;

import static org.lowcoder.sdk.util.JsonUtils.fromJsonMap;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

import java.util.*;
import java.util.function.Function;

import org.apache.commons.collections4.CollectionUtils;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceCreationSource;
import org.lowcoder.domain.datasource.model.DatasourceDO;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.datasource.service.JsDatasourceHelper;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.plugin.client.DatasourcePluginClient;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * all find operation must do data decryption
 * for update operations that try to save whole datasource object, data encryption is required
 */
@Slf4j
@Repository
public class DatasourceRepository {

    @Autowired
    private DatasourceDORepository repository;

    @Autowired
    private DatasourceMetaInfoService datasourceMetaInfoService;

    @Autowired
    private EncryptionService encryptionService;

    @Autowired
    private MongoUpsertHelper mongoUpsertHelper;

    @Autowired
    private DatasourcePluginClient datasourcePluginClient;

    @Autowired
    private JsDatasourceHelper jsDatasourceHelper;

    public Mono<Datasource> findById(String datasourceId) {
        if(FieldName.isGID(datasourceId))
            return Mono.from(repository.findByGid(datasourceId))
                    .flatMap(this::convertToDomainObjectAndDecrypt);
        return repository.findById(datasourceId)
                .flatMap(this::convertToDomainObjectAndDecrypt);
    }

    public Mono<Datasource> findWorkspacePredefinedDatasourceByOrgIdAndType(String organizationId, String type) {
        return repository.findByOrganizationIdAndTypeAndCreationSource(organizationId, type,
                        DatasourceCreationSource.LEGACY_WORKSPACE_PREDEFINED.getValue())
                .flatMap(this::convertToDomainObjectAndDecrypt);
    }

    public Flux<Datasource> findAllById(Iterable<String> ids) {
        List<String> idList = new ArrayList<>();
        List<String> gidList = new ArrayList<>();

        for (String id : ids) {
            if (FieldName.isGID(id)) {
                gidList.add(id);
            } else {
                idList.add(id);
            }
        }

        Flux<Datasource> idFlux = idList.isEmpty() ? Flux.empty() : repository.findAllById(idList)
                .flatMap(this::convertToDomainObjectAndDecrypt);

        Flux<Datasource> gidFlux = gidList.isEmpty() ? Flux.empty() : repository.findAllByGidIn(gidList)
                .flatMap(this::convertToDomainObjectAndDecrypt);

        return Flux.merge(idFlux, gidFlux);
    }

    public Flux<Datasource> findAllByOrganizationId(String orgId) {
        return repository.findAllByOrganizationId(orgId)
                .flatMap(this::convertToDomainObjectAndDecrypt);
    }

    public Mono<Datasource> save(Datasource datasource) {
        return encryptDataAndConvertToDataObject(datasource)
                .flatMap(repository::save)
                .flatMap(this::convertToDomainObjectAndDecrypt);
    }

    public Mono<Boolean> markDatasourceAsDeleted(String datasourceId) {
        Datasource datasource = new Datasource();
        datasource.setDatasourceStatus(DatasourceStatus.DELETED);
        return mongoUpsertHelper.updateById(datasource, datasourceId);
    }

    public Flux<String> retainNoneExistAndNonCurrentOrgDatasourceIds(Collection<String> datasourceIds, String orgId) {
        if (CollectionUtils.isEmpty(datasourceIds)) {
            return Flux.empty();
        }
        Flux<DatasourceDO> mixedMono;
        if(FieldName.isGID(datasourceIds.stream().findFirst().orElseThrow()))
            mixedMono = repository.findAllByGidIn(new HashSet<>(datasourceIds));
        else
            mixedMono = repository.findAllById(new HashSet<>(datasourceIds));
        return mixedMono.collectList()
                .map(existDatasources -> {
                    Set<String> result = new HashSet<>(datasourceIds);
                    existDatasources.stream()
                            .filter(datasource -> datasource.getOrganizationId().equals(orgId))
                            .map(HasIdAndAuditing::getId)
                            .forEach(result::remove);
                    return result;
                })
                .flatMapIterable(Function.identity());
    }

    public Mono<Long> countByOrganizationId(String orgId) {
        return repository.countByOrganizationId(orgId);
    }

    @SuppressWarnings("DuplicatedCode")
    private Mono<Datasource> convertToDomainObjectAndDecrypt(DatasourceDO datasourceDO) {

        Mono<Datasource> datasourceMono = Mono.fromSupplier(() -> {
                    Datasource result = new Datasource();
                    result.setGid(datasourceDO.getGid());
                    result.setName(datasourceDO.getName());
                    result.setType(datasourceDO.getType());
                    result.setOrganizationId(datasourceDO.getOrganizationId());
                    result.setCreationSource(datasourceDO.getCreationSource());
                    result.setDatasourceStatus(datasourceDO.getDatasourceStatus());
                    result.setId(datasourceDO.getId());
                    result.setCreatedAt(datasourceDO.getCreatedAt());
                    result.setUpdatedAt(datasourceDO.getUpdatedAt());
                    result.setCreatedBy(datasourceDO.getCreatedBy());
                    result.setModifiedBy(datasourceDO.getModifiedBy());
                    return result;
                })
                .cache();

        return datasourceMono
                .doOnNext(datasource -> {
                    if (datasourceMetaInfoService.isJsDatasourcePlugin(datasource.getType())) {
                        JsDatasourceConnectionConfig jsDatasourceConnectionConfig = new JsDatasourceConnectionConfig();
                        jsDatasourceConnectionConfig.putAll(datasourceDO.getDetailConfig());
                        datasource.setDetailConfig(jsDatasourceConnectionConfig);
                    } else {
                        DatasourceConnectionConfig detailConfig =
                                datasourceMetaInfoService.resolveDetailConfig(datasourceDO.getDetailConfig(), datasource.getType());
                        datasource.setDetailConfig(detailConfig);
                    }
                })
                .delayUntil(jsDatasourceHelper::fillPluginDefinition)
                .doOnNext(datasource -> {
                    DatasourceConnectionConfig decryptedDetailConfig = datasource.getDetailConfig().doDecrypt(encryptionService::decryptString);
                    // override
                    datasource.setDetailConfig(decryptedDetailConfig);
                })
                .doOnError(throwable -> log.error("resolve detail config error.{},{}", datasourceDO.getType(),
                        JsonUtils.toJson(datasourceDO.getDetailConfig()), throwable))
                .onErrorResume(__ -> datasourceMono);
    }

    @SuppressWarnings("DuplicatedCode")
    private Mono<DatasourceDO> encryptDataAndConvertToDataObject(Datasource datasource) {

        return Mono.fromSupplier(() -> {
                    DatasourceDO result = new DatasourceDO();
                    result.setGid(datasource.getGid());
                    result.setName(datasource.getName());
                    result.setType(datasource.getType());
                    result.setOrganizationId(datasource.getOrganizationId());
                    result.setCreationSource(datasource.getCreationSource());
                    result.setDatasourceStatus(datasource.getDatasourceStatus());
                    result.setId(datasource.getId());
                    result.setCreatedAt(datasource.getCreatedAt());
                    result.setUpdatedAt(datasource.getUpdatedAt());
                    result.setCreatedBy(datasource.getCreatedBy());
                    result.setModifiedBy(datasource.getModifiedBy());
                    return result;
                })
                .delayUntil(__ -> jsDatasourceHelper.fillPluginDefinition(datasource))
                .doOnNext(datasourceDO -> {
                    DatasourceConnectionConfig detailConfig = datasource.getDetailConfig();
                    DatasourceConnectionConfig encryptedConfig = detailConfig.doEncrypt(encryptionService::encryptString);
                    // override
                    datasourceDO.setDetailConfig(fromJsonMap(toJson(encryptedConfig)));
                });
    }
}
