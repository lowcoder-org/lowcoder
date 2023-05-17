package org.lowcoder.domain.user.repository;

import org.lowcoder.domain.user.model.UserStatus;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserStatusRepository extends ReactiveMongoRepository<UserStatus, String> {

}
