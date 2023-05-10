package org.lowcoder.infra.event.groupmember;

import org.lowcoder.infra.event.AbstractEvent;

import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public abstract class BaseGroupMemberEvent extends AbstractEvent {

    private final String groupId;
    private final String groupName;
    private final String memberId;
    private final String memberName;
    private final String memberRole;
}
