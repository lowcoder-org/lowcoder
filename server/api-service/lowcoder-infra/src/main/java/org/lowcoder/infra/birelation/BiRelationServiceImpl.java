package org.lowcoder.infra.birelation;

import com.google.common.base.Preconditions;
import lombok.RequiredArgsConstructor;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.List;

import static com.google.common.base.Strings.nullToEmpty;
import static org.apache.commons.lang3.StringUtils.isNotBlank;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Service
@RequiredArgsConstructor
public class BiRelationServiceImpl implements BiRelationService {

    private static final String BIZ_TYPE = "bizType";
    private static final String SOURCE_ID = "sourceId";
    private static final String TARGET_ID = "targetId";
    private static final String RELATION = "relation";

    private final BiRelationRepository biRelationRepository;
    private final MongoUpsertHelper mongoUpsertHelper;

    @Override
    public Mono<BiRelation> addBiRelation(BiRelation biRelation) {
        return biRelationRepository.save(biRelation);
    }

    @Override
    public Mono<List<BiRelation>> batchAddBiRelation(Collection<BiRelation> biRelations) {
        return biRelationRepository.saveAll(biRelations)
                .collectList();
    }

    @Override
    public Mono<BiRelation> addBiRelation(BiRelationBizType bizType, String sourceId, String targetId,
                                          String relation, String state) {
        return addBiRelation(bizType, sourceId, targetId, relation, state, null, null, null);
    }

    @Override
    public Mono<BiRelation> addBiRelation(BiRelationBizType bizType, String sourceId, String targetId,
                                          String relation, String state, String extParam1) {
        return addBiRelation(bizType, sourceId, targetId, relation, state, extParam1, null, null);
    }

    @Override
    public Mono<BiRelation> addBiRelation(BiRelationBizType bizType, String sourceId, String targetId,
                                          String relation, String state, String extParam1, String extParam2) {
        return addBiRelation(bizType, sourceId, targetId, relation, state, extParam1, extParam2, null);
    }

    @Override
    public Mono<BiRelation> addBiRelation(BiRelationBizType bizType, String sourceId, String targetId,
                                          String relation, String state, String extParam1, String extParam2, String extParam3) {
        BiRelation biRelation = BiRelation.builder()
                .bizType(bizType)
                .sourceId(sourceId)
                .targetId(targetId)
                .relation(relation)
                .state(state)
                .extParam1(nullToEmpty(extParam1))
                .extParam2(nullToEmpty(extParam2))
                .extParam3(nullToEmpty(extParam3))
                .build();
        return biRelationRepository.save(biRelation);
    }

    @Override
    public Mono<Boolean> upsert(BiRelation biRelation) {
        // bizType sourceId targetId compose the unique key, so these fields are checked
        Preconditions.checkArgument(isNotBlank(biRelation.getSourceId()));
        Preconditions.checkArgument(isNotBlank(biRelation.getTargetId()));
        Preconditions.checkArgument(biRelation.getBizType() != null);

        Criteria criteria = buildCriteria(biRelation.getSourceId(), biRelation.getTargetId(), biRelation.getBizType());
        return mongoUpsertHelper.upsert(biRelation, criteria);
    }

    @Override
    public Flux<BiRelation> getBySourceIds(BiRelationBizType bizType, Collection<String> sourceIds) {
        return biRelationRepository.findByBizTypeAndSourceIdIn(bizType, sourceIds);
    }

    @Override
    public Flux<BiRelation> getBySourceId(BiRelationBizType bizType, String sourceId) {
        return biRelationRepository.findByBizTypeAndSourceId(bizType, sourceId);
    }

    @Override
    public Flux<BiRelation> getBySourceId(BiRelationBizType bizType, String sourceId, Pageable pageable) {
        return biRelationRepository.findByBizTypeAndSourceId(bizType, sourceId, pageable);
    }

    @Override
    public Flux<BiRelation> getByTargetIds(BiRelationBizType bizType, Collection<String> targetId) {
        return biRelationRepository.findByBizTypeAndTargetIdIn(bizType, targetId);
    }

    @Override
    public Flux<BiRelation> getByTargetId(BiRelationBizType bizType, String targetId) {
        return biRelationRepository.findByBizTypeAndTargetId(bizType, targetId);
    }

    @Override
    public Mono<Boolean> updateRelation(BiRelationBizType bizType, String sourceId, String targetId,
                                        String newRelation) {
        Query query = buildQuery(sourceId, targetId, bizType);
        return mongoUpsertHelper.update(BiRelation
                        .builder()
                        .relation(newRelation)
                        .build(),
                query);
    }

    @Override
    public Mono<Boolean> removeBiRelation(BiRelationBizType bizType, String sourceId, String targetId) {
        Query query = buildQuery(sourceId, targetId, bizType);
        return mongoUpsertHelper.remove(query, BiRelation.class);
    }

    @Override
    public Mono<Boolean> removeAllBiRelations(BiRelationBizType bizType, String sourceId) {
        Query query = new Query();
        query.addCriteria(where(BIZ_TYPE).is(bizType));
        query.addCriteria(where(SOURCE_ID).is(sourceId));
        return mongoUpsertHelper.remove(query, BiRelation.class);
    }

    @Override
    public Mono<Boolean> removeAllBiRelationsByTargetId(BiRelationBizType bizType, String targetId) {
        Query query = new Query();
        query.addCriteria(where(BIZ_TYPE).is(bizType));
        query.addCriteria(where(TARGET_ID).is(targetId));
        return mongoUpsertHelper.remove(query, BiRelation.class);
    }

    @Override
    public Mono<Boolean> removeAllBiRelationsBySourceIdAndTargetId(BiRelationBizType bizType, String sourceId, String targetId) {
        Query query = new Query();
        query.addCriteria(where(BIZ_TYPE).is(bizType));
        query.addCriteria(where(SOURCE_ID).is(sourceId));
        query.addCriteria(where(TARGET_ID).is(targetId));
        return mongoUpsertHelper.remove(query, BiRelation.class);
    }

    @Override
    public Mono<Boolean> removeAllBiRelations(BiRelationBizType bizType, List<String> sourceIds) {
        Query query = new Query();
        query.addCriteria(where(BIZ_TYPE).is(bizType));
        query.addCriteria(where(SOURCE_ID).in(sourceIds));
        return mongoUpsertHelper.remove(query, BiRelation.class);
    }

    @Override
    public Mono<BiRelation> getBiRelation(BiRelationBizType bizType, String sourceId, String targetId) {
        return biRelationRepository.findByBizTypeAndSourceIdAndTargetId(bizType, sourceId, targetId);
    }

    @Override
    public Flux<BiRelation> getByTargetIdAndSourceIds(BiRelationBizType bizType, String targetId,
                                                      Collection<String> sourceIds) {
        return biRelationRepository.findByBizTypeAndTargetIdAndSourceIdIn(bizType, targetId,
                sourceIds);
    }

    @Override
    public Mono<Boolean> updateState(BiRelationBizType bizType, String sourceId, String targetId,
                                     String newState) {
        Query query = buildQuery(sourceId, targetId, bizType);
        return mongoUpsertHelper.update(BiRelation.builder()
                        .state(newState)
                        .build(),
                query);
    }

    @Override
    public Flux<BiRelation> getBySourceIdAndRelation(BiRelationBizType bizType, String sourceId, String relation) {
        Query query = new Query();
        query.addCriteria(where(BIZ_TYPE).is(bizType));
        query.addCriteria(where(SOURCE_ID).is(sourceId));
        query.addCriteria(where(RELATION).is(relation));

        return biRelationRepository.findByBizTypeAndSourceIdAndRelation(bizType, sourceId, relation);
    }

    @Override
    public Mono<Long> countByRelation(BiRelationBizType bizType, String relation) {
        return biRelationRepository.countByBizTypeAndRelation(bizType, relation);
    }

    @Override
    public Mono<Long> countBySourceId(BiRelationBizType bizType, String sourceId) {
        return biRelationRepository.countByBizTypeAndSourceId(bizType, sourceId);
    }

    @Override
    public Mono<Long> countByTargetId(BiRelationBizType bizType, String targetId) {
        return biRelationRepository.countByBizTypeAndTargetId(bizType, targetId);
    }

    private Criteria buildCriteria(String sourceId, String targetId, BiRelationBizType bizType) {
        return where(BIZ_TYPE).is(bizType)
                .and(SOURCE_ID).is(sourceId)
                .and(TARGET_ID).is(targetId);
    }

    private Query buildQuery(String sourceId, String targetId, BiRelationBizType bizType) {
        return new Query(buildCriteria(sourceId, targetId, bizType));
    }

    @Override
    public Mono<BiRelation> getById(String id) {
        return biRelationRepository.findById(id);
    }

    @Override
    public Mono<Boolean> removeBiRelationById(String id) {
        return biRelationRepository.deleteById(id)
                .thenReturn(true)
                .onErrorReturn(false);
    }
}
