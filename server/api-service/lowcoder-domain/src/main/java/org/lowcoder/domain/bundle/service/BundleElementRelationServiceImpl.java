package org.lowcoder.domain.bundle.service;

import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.bundle.model.BundleElement;
import org.lowcoder.infra.birelation.BiRelationService;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;
import java.util.Objects;

import static org.lowcoder.infra.birelation.BiRelationBizType.BUNDLE_ELEMENT;

@RequiredArgsConstructor
@Service
public class BundleElementRelationServiceImpl implements BundleElementRelationService {

    private final BiRelationService biRelationService;

    @Override
    public Mono<Boolean> deleteByBundleIds(List<String> bundleIds) {
        return biRelationService.removeAllBiRelations(BUNDLE_ELEMENT, bundleIds);
    }

    @Override
    public Mono<Boolean> deleteByElementId(String elementId) {
        return biRelationService.removeAllBiRelationsByTargetId(BUNDLE_ELEMENT, elementId);
    }

    @Override
    public Mono<Boolean> deleteByBundleIdAndElementId(String bundleId, String elementId) {
        return biRelationService.removeAllBiRelationsBySourceIdAndTargetId(BUNDLE_ELEMENT, bundleId, elementId);
    }

    @Override
    public Mono<Void> create(String bundleId, String elementId) {
        return biRelationService.getBySourceId(BUNDLE_ELEMENT, bundleId)
                .mapNotNull(rel -> {
                    try {
                        return Integer.parseInt(rel.getExtParam1());
                    } catch (NumberFormatException e) {
                        return null;
                    }
                })
                .reduce(Integer::max)
                .switchIfEmpty(Mono.just(0))
                .flatMap(maxVal -> biRelationService.addBiRelation(BUNDLE_ELEMENT, bundleId, elementId, null, null, String.valueOf(maxVal + 1)))
                .then();
    }

    @Override
    public Flux<BundleElement> getByElementIds(List<String> elementIds) {
        return biRelationService.getByTargetIds(BUNDLE_ELEMENT, elementIds)
                .map(biRelation -> new BundleElement(biRelation.getSourceId(), biRelation.getTargetId(), Integer.parseInt(biRelation.getExtParam1())));
    }

    @Override
    public Mono<Void> updateElementPos(String bundleId, String elementId, long position) {
        return biRelationService.getBiRelation(BUNDLE_ELEMENT, bundleId, elementId)
                .doOnNext(biRelation -> biRelation.setExtParam1(String.valueOf(position)))
                .publishOn(Schedulers.boundedElastic())
                .mapNotNull(biRelation -> biRelationService.upsert(biRelation).block())
                .then();
    }
}
