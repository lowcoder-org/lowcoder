package org.lowcoder.domain.interaction;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

public interface UserApplicationInteractionService {
    Mono<Void> upsert(String userId, String applicationId, Instant lastViewTime);

    Flux<UserApplicationInteraction> findByUserId(String userId);
}
