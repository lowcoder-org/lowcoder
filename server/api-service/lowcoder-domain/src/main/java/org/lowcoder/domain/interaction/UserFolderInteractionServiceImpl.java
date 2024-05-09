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

/**
 * relation service of user-folder
 */
@RequiredArgsConstructor
@Service
public class UserFolderInteractionServiceImpl implements UserFolderInteractionService {

    private final BiRelationService biRelationService;

    @Override
    public Mono<Void> upsert(String userId, String folderId, Instant lastViewTime) {
        BiRelation biRelation = new UserFolderInteraction(userId, folderId, lastViewTime).toBiRelation();
        return biRelationService.upsert(biRelation).then();
    }

    @Override
    public Flux<UserFolderInteraction> findByUserId(String userId) {
        return biRelationService.getBySourceId(BiRelationBizType.USER_FOLDER_INTERACTION, userId)
                .map(UserFolderInteraction::of);
    }
}
