package org.lowcoder.domain.interaction;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

public interface UserFolderInteractionService {
    Mono<Void> upsert(String userId, String folderId, Instant lastViewTime);

    Flux<UserFolderInteraction> findByUserId(String userId);
}
