package org.lowcoder.domain.user.service;

import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.user.constant.UserStatusType;
import org.lowcoder.domain.user.model.UserStatus;
import org.lowcoder.domain.user.repository.UserStatusRepository;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Service
public class UserStatusServiceImpl implements UserStatusService {

    private final UserStatusRepository repository;
    private final MongoUpsertHelper mongoUpsertHelper;

    @Override
    public Mono<UserStatus> findByUserId(String userId) {
        return repository.findById(userId)
                .defaultIfEmpty(UserStatus.builder()
                        .id(userId)
                        .build()
                );
    }

    @Override
    public Mono<Boolean> markNewUserGuidanceShown(String userId) {
        UserStatus userStatus = UserStatus.builder()
                .id(userId)
                .hasShowNewUserGuidance(true)
                .build();
        return mongoUpsertHelper.upsert(userStatus, "id", userId);
    }

    @Override
    public Mono<Boolean> mark(String userId, UserStatusType statusType, Object value) {
        Update update = Update.update("statusMap." + statusType.getValue(), value);
        return mongoUpsertHelper.upsert(update, "id", userId, UserStatus.class);
    }
}
