package org.lowcoder.domain.bundle.service;

import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.repository.BundleRepository;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

import static org.lowcoder.sdk.exception.BizError.NO_RESOURCE_FOUND;

@RequiredArgsConstructor
@Service
public class BundleServiceImpl implements BundleService {

    private final BundleRepository repository;
    private final MongoUpsertHelper mongoUpsertHelper;

    @Override
    public Mono<Boolean> updateById(String id, Bundle resource) {
        if (id == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", FieldName.ID));
        }

        return mongoUpsertHelper.updateById(resource, id);
    }

    @Override
    public Mono<Bundle> findById(String id) {
        if (id == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", FieldName.ID));
        }

        return repository.findById(id)
                .switchIfEmpty(Mono.error(new BizException(BizError.NO_RESOURCE_FOUND, "FOLDER_NOT_FOUND", id)));
    }

    @Override
    public Mono<Bundle> create(Bundle folder) {
        return repository.save(folder);
    }

    @Override
    public Flux<Bundle> findByUserId(String userId) {
        return repository.findByUserId(userId);
    }

    @Override
    public Mono<Void> deleteAllById(Collection<String> ids) {
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
