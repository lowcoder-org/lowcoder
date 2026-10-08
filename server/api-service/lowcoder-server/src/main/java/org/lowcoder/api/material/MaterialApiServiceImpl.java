package org.lowcoder.api.material;

import jakarta.annotation.PostConstruct;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.material.MaterialEndpoints.MaterialView;
import org.lowcoder.api.usermanagement.OrgDevChecker;
import org.lowcoder.domain.material.model.MaterialMeta;
import org.lowcoder.domain.material.model.MaterialType;
import org.lowcoder.domain.material.repository.MaterialMateRepository;
import org.lowcoder.domain.material.service.meta.MaterialMetaService;
import org.lowcoder.domain.material.service.storage.MaterialStorageService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.config.dynamic.ConfigInstanceHelper;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.reactivestreams.Publisher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Base64;
import java.util.List;

import static org.apache.commons.io.FileUtils.*;

@Service
public class MaterialApiServiceImpl implements MaterialApiService {

    private static final long DEFAULT_SINGLE_FILE_SIZE_LIMIT = 20 * ONE_MB;
    private static final long DEFAULT_TOTAL_STORAGE_SIZE_LIMIT = 2 * ONE_GB;
    private static final String MATERIAL_NOT_FOUND = "MATERIAL_NOT_FOUND";

    @Autowired
    private MaterialMetaService materialMetaService;
    @Autowired
    private MaterialStorageService materialStorageService;
    @Autowired
    private SessionUserService sessionUserService;
    @Autowired
    private OrgDevChecker orgDevChecker;
    @Autowired
    private ConfigCenter configCenter;
    @Autowired
    private MaterialMateRepository materialMateRepository;
    @Autowired
    private CommonConfig commonConfig;

    private ConfigInstanceHelper configInstance;

    @PostConstruct
    public void init() {
        configInstance = new ConfigInstanceHelper(configCenter.threshold());
    }

    /**
     * @param content base64
     */
    @Override
    public Mono<MaterialMeta> upload(String filename, String content, MaterialType type) {

        byte[] decode = Base64.getDecoder().decode(content);

        return checkSingleFileSize(decode.length)
                .then(sessionUserService.getVisitorOrgMemberCache())
                .delayUntil(__ -> orgDevChecker.checkCurrentOrgDev())
                .delayUntil(orgMember -> checkTotalSize(orgMember.getOrgId(), decode.length))
                .flatMap(orgMember -> findReplaced(orgMember.getOrgId(), filename, type).collectList()
                        .flatMap(replaced -> {
                            MaterialMeta materialMeta = MaterialMeta.builder()
                                    .orgId(orgMember.getOrgId())
                                    .filename(filename)
                                    .size(decode.length)
                                    .type(type)
                                    .build();
                            return materialMateRepository.save(materialMeta)
                                    .delayUntil(saved -> storeOrRemoveRow(saved, decode))
                                    .delayUntil(saved -> Flux.fromIterable(replaced)
                                            .concatMap(old -> materialStorageService.delete(old)
                                                    .then(materialMateRepository.deleteById(old.getId()))));
                        }));
    }

    /**
     * The materials an upload replaces: the org's logo or favicon, or for other types the org's material of the same
     * filename and type. They are removed only after the new file is stored (BF-028), each file before its row, so a
     * failure never leaves a file without a row.
     */
    private Flux<MaterialMeta> findReplaced(String orgId, String filename, MaterialType type) {
        if (type == MaterialType.LOGO || type == MaterialType.FAVICON) {
            return materialMateRepository.findByOrgIdAndType(orgId, type);
        }
        return materialMateRepository.findByOrgIdAndFilenameAndType(orgId, filename, type);
    }

    /**
     * Stores the file of a saved row; if that fails, the row is deleted again and the storage failure is the answer (a
     * failure of that clean-up is added to it as suppressed), so the replaced materials stay as they were. Limit: a failure
     * after the new file is stored, while a replaced material is removed, answers with that error; the new material is kept,
     * and the replaced material's row stays beside it, with or without its file (a logo or favicon lookup may then still
     * find that row). The next upload of the same material removes it.
     */
    private Mono<Void> storeOrRemoveRow(MaterialMeta saved, byte[] content) {
        return materialStorageService.save(saved, content)
                .then()
                .onErrorResume(storageFailure -> materialMateRepository.deleteById(saved.getId())
                        .onErrorResume(cleanupFailure -> {
                            storageFailure.addSuppressed(cleanupFailure);
                            return Mono.empty();
                        })
                        .then(Mono.error(storageFailure)));
    }

    @Override
    public Publisher<? extends DataBuffer> download(MaterialMeta materialMeta) {
        return Mono.defer(() -> {
                    if (materialMeta.getType() == MaterialType.LOGO || materialMeta.getType() == MaterialType.FAVICON) {
                        return Mono.empty();
                    }
                    return checkMaterialOrg(materialMeta.getOrgId());
                })
                .thenMany(materialStorageService.download(materialMeta));
    }

    @Override
    public Mono<List<MaterialView>> list() {
        return sessionUserService.getVisitorOrgMemberCache()
                .flatMapMany(orgMember -> materialMetaService.getByOrgId(orgMember.getOrgId()))
                .map(materialMeta -> MaterialView.builder()
                        .id(materialMeta.getId())
                        .filename(materialMeta.getFilename())
                        .build()
                )
                .collectList();
    }

    @Override
    public Mono<Void> delete(String id) {
        return materialMetaService.findById(id)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new BizException(BizError.INVALID_PARAMETER, MATERIAL_NOT_FOUND, id))))
                .delayUntil(materialMeta -> checkMaterialOrg(materialMeta.getOrgId()))
                .delayUntil(__ -> orgDevChecker.checkCurrentOrgDev())
                .delayUntil(__ -> materialMetaService.deleteById(id))
                .flatMap(materialMeta -> materialStorageService.delete(materialMeta));
    }

    private Mono<Void> checkMaterialOrg(String materialOrgId) {
        return sessionUserService.getVisitorOrgMemberCache()
                .flatMap(orgMember -> {
                    if (orgMember.getOrgId().equals(materialOrgId)) {
                        return Mono.empty();
                    }
                    return Mono.error(new BizException(BizError.INVALID_MATERIAL_REQUEST, "FILE_ORG_NOT_MATCH"));
                });
    }

    private Mono<Void> checkSingleFileSize(long size) {
        if (commonConfig.isSelfHost()) {
            return Mono.empty();
        }
        long sizeLimit = configInstance.ofLong("material.single-size-limit", DEFAULT_SINGLE_FILE_SIZE_LIMIT);
        if (size > sizeLimit) {
            return Mono.error(new BizException(BizError.INVALID_MATERIAL_REQUEST, "EXCEEDS_FILE_SIZE_LIMIT", byteCountToDisplaySize(sizeLimit)));
        }
        return Mono.empty();
    }

    private Mono<Void> checkTotalSize(String orgId, long newSize) {
        if (commonConfig.isSelfHost()) {
            return Mono.empty();
        }
        return materialMetaService.totalSize(orgId)
                .flatMap(size -> {
                    long totalSizeLimit = configInstance.ofLong("material.total-size-limit", DEFAULT_TOTAL_STORAGE_SIZE_LIMIT);
                    if ((size + newSize) > totalSizeLimit) {
                        return Mono.error(
                                new BizException(BizError.INVALID_MATERIAL_REQUEST, "EXCEEDS_ORG_SIZE_LIMIT",
                                        byteCountToDisplaySize(totalSizeLimit)));
                    }
                    return Mono.empty();
                });
    }
}
