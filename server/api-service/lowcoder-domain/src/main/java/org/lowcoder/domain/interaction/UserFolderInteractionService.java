package org.lowcoder.domain.interaction;

import java.time.Instant;

import org.lowcoder.infra.birelation.BiRelation;
import org.lowcoder.infra.birelation.BiRelationBizType;
import org.lowcoder.infra.birelation.BiRelationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * relation service of user-folder
 */
@Service
public class UserFolderInteractionService {

    @Autowired
    private BiRelationService biRelationService;

    public Mono<Void> upsert(String userId, String folderId, Instant lastViewTime) {
        BiRelation biRelation = new UserFolderInteraction(userId, folderId, lastViewTime).toBiRelation();
        return biRelationService.upsert(biRelation).then();
    }

    public Flux<UserFolderInteraction> findByUserId(String userId) {
        return biRelationService.getBySourceId(BiRelationBizType.USER_FOLDER_INTERACTION, userId)
                .map(UserFolderInteraction::of);
    }
}
