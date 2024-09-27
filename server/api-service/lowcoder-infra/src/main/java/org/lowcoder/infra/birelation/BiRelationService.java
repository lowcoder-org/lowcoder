package org.lowcoder.infra.birelation;

import org.springframework.data.domain.Pageable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.List;

public interface BiRelationService {
    Mono<BiRelation> addBiRelation(BiRelation biRelation);

    Mono<List<BiRelation>> batchAddBiRelation(Collection<BiRelation> biRelations);

    Mono<BiRelation> addBiRelation(BiRelationBizType bizType, String sourceId, String targetId,
                                   String relation, String state);

    Mono<BiRelation> addBiRelation(BiRelationBizType bizType, String sourceId, String targetId,
                                   String relation, String state, String extParam1);

    Mono<BiRelation> addBiRelation(BiRelationBizType bizType, String sourceId, String targetId,
                                   String relation, String state, String extParam1, String extParam2);

    Mono<BiRelation> addBiRelation(BiRelationBizType bizType, String sourceId, String targetId,
                                   String relation, String state, String extParam1, String extParam2, String extParam3);

    Mono<Boolean> upsert(BiRelation biRelation);

    Flux<BiRelation> getBySourceIds(BiRelationBizType bizType, Collection<String> sourceIds);

    Flux<BiRelation> getBySourceId(BiRelationBizType bizType, String sourceId);

    Flux<BiRelation> getBySourceId(BiRelationBizType bizType, String sourceId, Pageable pageable);

    Flux<BiRelation> getByTargetIds(BiRelationBizType bizType, Collection<String> targetId);

    Flux<BiRelation> getByTargetId(BiRelationBizType bizType, String targetId);

    Mono<Boolean> updateRelation(BiRelationBizType bizType, String sourceId, String targetId,
                                 String newRelation);

    Mono<Boolean> removeBiRelation(BiRelationBizType bizType, String sourceId, String targetId);

    Mono<Boolean> removeAllBiRelations(BiRelationBizType bizType, String sourceId);

    Mono<Boolean> removeAllBiRelationsByTargetId(BiRelationBizType bizType, String targetId);

    Mono<Boolean> removeAllBiRelationsBySourceIdAndTargetId(BiRelationBizType bizType, String sourceId, String targetId);

    Mono<Boolean> removeAllBiRelations(BiRelationBizType bizType, List<String> sourceIds);

    Mono<BiRelation> getBiRelation(BiRelationBizType bizType, String sourceId, String targetId);

    Flux<BiRelation> getByTargetIdAndSourceIds(BiRelationBizType bizType, String targetId,
                                               Collection<String> sourceIds);

    Mono<Boolean> updateState(BiRelationBizType bizType, String sourceId, String targetId,
                              String newState);

    Flux<BiRelation> getBySourceIdAndRelation(BiRelationBizType bizType, String sourceId, String relation);

    Mono<Long> countByRelation(BiRelationBizType bizType, String relation);

    Mono<Long> countBySourceId(BiRelationBizType bizType, String sourceId);

    Mono<Long> countByTargetId(BiRelationBizType bizType, String targetId);

    Mono<BiRelation> getById(String id);

    Mono<Boolean> removeBiRelationById(String id);
}
