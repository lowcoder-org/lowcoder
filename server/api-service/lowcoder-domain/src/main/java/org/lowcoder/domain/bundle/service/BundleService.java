package org.lowcoder.domain.bundle.service;

import org.lowcoder.domain.bundle.model.Bundle;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

public interface BundleService {
    Mono<Boolean> updateById(String id, Bundle resource);

    Mono<Bundle> findById(String id);

    Mono<Bundle> create(Bundle bundle);

    Flux<Bundle> findByUserId(String bundleId);

    Mono<Void> deleteAllById(Collection<String> ids);

    Mono<Boolean> exist(String id);
}
