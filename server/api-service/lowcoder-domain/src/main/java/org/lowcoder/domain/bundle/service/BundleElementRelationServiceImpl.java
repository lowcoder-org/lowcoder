package org.lowcoder.domain.bundle.service;

import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.bundle.model.BundleElement;
import org.lowcoder.infra.birelation.BiRelationService;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

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
    public Mono<Void> create(String bundleId, String elementId) {
        return biRelationService.addBiRelation(BUNDLE_ELEMENT, bundleId, elementId, null, null)
                .then();
    }

    @Override
    public Flux<BundleElement> getByElementIds(List<String> elementIds) {
        return biRelationService.getByTargetIds(BUNDLE_ELEMENT, elementIds)
                .map(biRelation -> new BundleElement(biRelation.getSourceId(), biRelation.getTargetId(), Integer.parseInt(biRelation.getExtParam1())));
    }
}
