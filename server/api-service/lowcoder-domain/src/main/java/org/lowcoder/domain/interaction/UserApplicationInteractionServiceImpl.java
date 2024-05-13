package org.lowcoder.domain.interaction;

import java.time.Instant;

import lombok.RequiredArgsConstructor;
import org.lowcoder.infra.birelation.BiRelation;
import org.lowcoder.infra.birelation.BiRelationBizType;
import org.lowcoder.infra.birelation.BiRelationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Service
public class UserApplicationInteractionServiceImpl implements UserApplicationInteractionService {

    private final BiRelationService biRelationService;

    @Override
    public Mono<Void> upsert(String userId, String applicationId, Instant lastViewTime) {
        BiRelation biRelation = new UserApplicationInteraction(userId, applicationId, lastViewTime).toBiRelation();

        return biRelationService.upsert(biRelation).then();
    }

    @Override
    public Flux<UserApplicationInteraction> findByUserId(String userId) {
        return biRelationService.getBySourceId(BiRelationBizType.USER_APP_INTERACTION, userId)
                .map(UserApplicationInteraction::of);
    }
}
