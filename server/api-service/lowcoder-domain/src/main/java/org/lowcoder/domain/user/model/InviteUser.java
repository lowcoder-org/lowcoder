package org.lowcoder.domain.user.model;

import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@SuperBuilder
@Document
public class InviteUser extends User {

    String inviterUserId;

    String token;

}
