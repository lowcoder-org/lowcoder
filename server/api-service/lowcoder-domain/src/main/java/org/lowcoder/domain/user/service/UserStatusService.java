package org.lowcoder.domain.user.service;

import org.lowcoder.domain.user.constant.UserStatusType;
import org.lowcoder.domain.user.model.UserStatus;
import reactor.core.publisher.Mono;

public interface UserStatusService {
    Mono<UserStatus> findByUserId(String userId);

    Mono<Boolean> markNewUserGuidanceShown(String userId);

    Mono<Boolean> mark(String userId, UserStatusType statusType, Object value);
}
