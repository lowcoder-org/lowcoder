package org.lowcoder.domain.user.repository;

import com.mongodb.client.result.UpdateResult;

import reactor.core.publisher.Mono;

public interface CustomUserRepository {

    Mono<UpdateResult> setPasswordIfAbsent(String userId, String encryptedPassword);
}
