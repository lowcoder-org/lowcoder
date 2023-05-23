package org.lowcoder.domain.user.service;

import org.lowcoder.domain.user.constant.UserStatusType;
import org.lowcoder.domain.user.model.UserStatus;
import org.lowcoder.domain.user.repository.UserStatusRepository;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Mono;

@Lazy
@Service
public class UserStatusService {

    @Autowired
    private UserStatusRepository repository;

    @Autowired
    private MongoUpsertHelper mongoUpsertHelper;

    public Mono<UserStatus> findByUserId(String userId) {
        return repository.findById(userId)
                .defaultIfEmpty(UserStatus.builder()
                        .id(userId)
                        .build()
                );
    }

    public Mono<Boolean> markNewUserGuidanceShown(String userId) {
        UserStatus userStatus = UserStatus.builder()
                .id(userId)
                .hasShowNewUserGuidance(true)
                .build();
        return mongoUpsertHelper.upsert(userStatus, "id", userId);
    }

    public Mono<Boolean> mark(String userId, UserStatusType statusType, Object value) {
        Update update = Update.update("statusMap." + statusType.getValue(), value);
        return mongoUpsertHelper.upsert(update, "id", userId, UserStatus.class);
    }
}
