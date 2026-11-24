package org.lowcoder.domain.user.repository;

import static org.lowcoder.domain.util.QueryDslUtils.fieldName;

import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.user.model.QUser;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.sdk.constants.FieldName;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import com.mongodb.client.result.UpdateResult;

import reactor.core.publisher.Mono;

@Repository
@RequiredArgsConstructor
public class CustomUserRepositoryImpl implements CustomUserRepository {

    /** A stored password counts as absent when the field is missing, null, or only whitespace. */
    static final String BLANK_PATTERN = "^\\s*$";

    private final ReactiveMongoTemplate mongoTemplate;

    /**
     * One atomic single-document update (D-49): the filter (absent password) and the {@code $set} of the new hash
     * are evaluated together by MongoDB, so a concurrent call can never pass the filter after another call has
     * already written a password; exactly one of two concurrent calls on the same account matches. Limits: like
     * {@link org.lowcoder.infra.mongo.MongoUpsertHelper#updatePurely}, this bypasses {@code User.beforeMongodbWrite}
     * (only re-encrypts API keys) and does not touch {@code updatedAt} or {@code modifiedBy}.
     */
    @Override
    public Mono<UpdateResult> setPasswordIfAbsent(String userId, String encryptedPassword) {
        String password = fieldName(QUser.user.password);
        Query query = Query.query(Criteria.where(FieldName.ID).is(userId)
                .orOperator(Criteria.where(password).is(null), Criteria.where(password).regex(BLANK_PATTERN)));
        return mongoTemplate.updateFirst(query, new Update().set(password, encryptedPassword), User.class);
    }
}
