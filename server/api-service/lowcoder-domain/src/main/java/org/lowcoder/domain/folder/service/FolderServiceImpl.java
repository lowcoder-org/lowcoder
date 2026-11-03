package org.lowcoder.domain.folder.service;

import static org.lowcoder.domain.organization.model.OrganizationState.ACTIVE;
import static org.lowcoder.sdk.exception.BizError.NO_RESOURCE_FOUND;

import java.util.Collection;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.repository.FolderRepository;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Service
public class FolderServiceImpl implements FolderService {

    private final FolderRepository repository;
    private final MongoUpsertHelper mongoUpsertHelper;

    @Override
    public Mono<Boolean> updateById(String id, Folder resource) {
        if (id == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", FieldName.ID));
        }

        return mongoUpsertHelper.updateById(resource, id);
    }

    @Override
    public Mono<Folder> findById(String id) {
        if (id == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", FieldName.ID));
        }

        if(FieldName.isGID(id))
            return Mono.from(repository.findByGid(id))
                    .switchIfEmpty(Mono.error(new BizException(BizError.NO_RESOURCE_FOUND, "FOLDER_NOT_FOUND", id)));
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new BizException(BizError.NO_RESOURCE_FOUND, "FOLDER_NOT_FOUND", id)));
    }

    /**
     * The folders named by the non-blank keys. A blank key (null, empty or only whitespace, as {@code StringUtils.isBlank}
     * decides) names no folder and is dropped before any query (NEW-106: a null first key failed the call with a
     * NullPointerException, and with it the whole meta answer).
     * <p>
     * Limits: a null collection fails as before; the kind of the first kept key (gid or not) is taken for every key, so a
     * list mixing kinds misses the folders of the other kind, as before; a key of invisible characters
     * {@code StringUtils.isBlank} does not count as whitespace is not blank; {@link #deleteAllById} keeps its own first-key
     * rule (its keys come from the stored folder tree).
     */
    @Override
    public Flux<Folder> findByIds(Collection<String> ids) {
        List<String> keys = ids.stream().filter(StringUtils::isNotBlank).toList();
        if (keys.isEmpty()) {
            return Flux.empty();
        }
        if (FieldName.isGID(keys.get(0)))
            return repository.findByGidIn(keys);
        return repository.findAllById(keys);
    }

    @Override
    public Mono<Folder> create(Folder folder) {
        return repository.save(folder);
    }

    @Override
    public Flux<Folder> findByOrganizationId(String organizationId) {
        return repository.findByOrganizationId(organizationId);
    }

    @Override
    public Mono<Void> deleteAllById(Collection<String> ids) {
        if(!ids.isEmpty() && FieldName.isGID(ids.stream().findFirst().get()))
            return repository.deleteAllByGid(ids);
        return repository.deleteAllById(ids);
    }

    @Override
    public Mono<Boolean> exist(String id) {
        return findById(id)
                .hasElement()
                .onErrorResume(throwable -> {
                    if (throwable instanceof BizException bizException && bizException.getError() == NO_RESOURCE_FOUND) {
                        return Mono.just(false);
                    }
                    return Mono.error(throwable);
                });
    }
}
