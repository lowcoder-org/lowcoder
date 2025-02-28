package org.lowcoder.domain.folder.service;

import static org.lowcoder.domain.organization.model.OrganizationState.ACTIVE;
import static org.lowcoder.sdk.exception.BizError.NO_RESOURCE_FOUND;

import java.util.Collection;

import lombok.RequiredArgsConstructor;
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

    @Override
    public Flux<Folder> findByIds(Collection<String> ids) {
        if(!ids.isEmpty() && FieldName.isGID(ids.stream().findFirst().get()))
            return repository.findByGidIn(ids);
        return repository.findAllById(ids);
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
