package org.lowcoder.domain.bundle.service;

import org.lowcoder.domain.bundle.model.BundleElement;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface BundleElementRelationService {
    Mono<Boolean> deleteByBundleIds(List<String> bundleIds);

    Mono<Boolean> deleteByElementId(String elementId);

    Mono<Void> create(String bundleId, String elementId);

    Flux<BundleElement> getByElementIds(List<String> elementIds);
}
