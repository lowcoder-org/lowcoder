package org.lowcoder.domain.interaction;

import java.time.Instant;

import org.lowcoder.infra.birelation.BiRelation;
import org.lowcoder.infra.birelation.BiRelationBizType;
import org.lowcoder.infra.birelation.BiRelationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class UserApplicationInteractionService {

    @Autowired
    private BiRelationService biRelationService;

    public Mono<Void> upsert(String userId, String applicationId, Instant lastViewTime) {
        BiRelation biRelation = new UserApplicationInteraction(userId, applicationId, lastViewTime).toBiRelation();

        return biRelationService.upsert(biRelation).then();
    }

    public Flux<UserApplicationInteraction> findByUserId(String userId) {
        return biRelationService.getBySourceId(BiRelationBizType.USER_APP_INTERACTION, userId)
                .map(UserApplicationInteraction::of);
    }
}
