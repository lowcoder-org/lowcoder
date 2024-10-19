package org.lowcoder.api.usermanagement;

import org.lowcoder.domain.user.model.UserDetail;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface UserApiService {
    Mono<UserDetail> getUserDetailById(String userId);

    Mono<String> resetPassword(String userId);

    Mono<Boolean> lostPassword(String userEmail);

    Mono<Boolean> resetLostPassword(String userEmail, String token, String newPassword);

    Mono<Void> saveToken(String userId, String source, String token);

    Mono<Void> removeToken(String userId, String token);

    Flux<String> getTokensByAuthId(String userId, String authId);

    Mono<Void> removeInvalidTokens(String userId);
}
