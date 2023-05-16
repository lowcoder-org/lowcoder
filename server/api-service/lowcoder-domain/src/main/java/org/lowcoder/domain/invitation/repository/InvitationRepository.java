package org.lowcoder.domain.invitation.repository;

import org.lowcoder.domain.invitation.model.Invitation;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

public interface InvitationRepository extends ReactiveMongoRepository<Invitation, String>, CustomInvitationRepository {

}
