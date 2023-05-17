package org.lowcoder.domain.invitation.repository;

import static org.lowcoder.domain.util.QueryDslUtils.fieldName;

import org.lowcoder.domain.invitation.model.Invitation;
import org.lowcoder.domain.invitation.model.QInvitation;
import org.lowcoder.sdk.constants.FieldName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import com.mongodb.client.result.UpdateResult;

import reactor.core.publisher.Mono;

@Repository
public class CustomInvitationRepositoryImpl implements CustomInvitationRepository {

    @Autowired
    private ReactiveMongoTemplate mongoTemplate;

    @Override
    public Mono<UpdateResult> addInvitedUser(String invitationId, String userId) {
        final String reactionsField = fieldName(QInvitation.invitation.invitedUserIds);

        Query query = Query.query(Criteria.where(FieldName.ID).is(invitationId));
        return mongoTemplate.updateFirst(query, new Update().addToSet(reactionsField, userId), Invitation.class);
    }
}
