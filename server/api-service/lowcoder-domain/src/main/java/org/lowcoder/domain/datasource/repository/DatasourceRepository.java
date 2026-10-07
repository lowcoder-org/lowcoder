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
import org.lowcoder.domain.util.IdOrGidLookup;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
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

    /**
     * The datasources of a list of object ids and gids, in any mix (BF-076: the kind of the whole list was taken from one
     * element, so a mixed list lost the other kind); see {@link IdOrGidLookup} for how a key's kind is told.
     */
    public Flux<Datasource> findByIds(Collection<String> datasourceIds) {
        return findAllDOByIdOrGid(datasourceIds)
                .flatMap(this::convertToDomainObjectAndDecrypt);
    }

    public Mono<Datasource> findWorkspacePredefinedDatasourceByOrgIdAndType(String organizationId, String type) {
        return repository.findByOrganizationIdAndTypeAndCreationSource(organizationId, type,
                        DatasourceCreationSource.LEGACY_WORKSPACE_PREDEFINED.getValue())
                .flatMap(this::convertToDomainObjectAndDecrypt);
    }

    public Flux<Datasource> findAllById(Iterable<String> ids) {
        List<String> keys = new ArrayList<>();
        ids.forEach(keys::add);
        return findByIds(keys);
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

    /**
     * The given datasource ids that need no use permission: those that match no datasource and those of a datasource of
     * another organization. Each entry may be an object id or a gid (a list may mix both); a datasource of the current
     * organization found by either key is left out under that key (BF-002).
     */
    public Flux<String> retainNoneExistAndNonCurrentOrgDatasourceIds(Collection<String> datasourceIds, String orgId) {
        if (CollectionUtils.isEmpty(datasourceIds)) {
            return Flux.empty();
        }
        return findAllDOByIdOrGid(datasourceIds).collectList()
                .map(existDatasources -> {
                    Set<String> result = new HashSet<>(datasourceIds);
                    existDatasources.stream()
                            .filter(datasource -> Objects.equals(orgId, datasource.getOrganizationId()))
                            .forEach(datasource -> {
                                result.remove(datasource.getId());
                                result.remove(datasource.getGid());
                            });
                    return result;
                })
                .flatMapIterable(Function.identity());
    }

    /**
     * Each given object id or gid that matches a datasource, of any organization, mapped to that datasource's object id;
     * entries that match none are not in the map (BF-002).
     */
    public Mono<Map<String, String>> findObjectIdsByIdOrGid(Collection<String> datasourceIds) {
        if (CollectionUtils.isEmpty(datasourceIds)) {
            return Mono.just(Map.of());
        }
        Set<String> keys = new HashSet<>(datasourceIds);
        return findAllDOByIdOrGid(keys)
                .collect(HashMap::new, (objectIds, datasource) -> {
                    if (keys.contains(datasource.getId())) {
                        objectIds.put(datasource.getId(), datasource.getId());
                    }
                    if (keys.contains(datasource.getGid())) {
                        objectIds.put(datasource.getGid(), datasource.getId());
                    }
                });
    }

    /** The stored datasources whose object id or gid is one of the given keys, without decrypting them. */
    private Flux<DatasourceDO> findAllDOByIdOrGid(Collection<String> datasourceIds) {
        return IdOrGidLookup.find(datasourceIds, repository::findAllById, repository::findAllByGidIn);
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
