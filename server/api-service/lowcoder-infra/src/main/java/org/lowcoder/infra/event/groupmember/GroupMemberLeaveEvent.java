package org.lowcoder.infra.event.groupmember;

import lombok.experimental.SuperBuilder;

@SuperBuilder
public class GroupMemberLeaveEvent extends BaseGroupMemberEvent {

    @Override
    public EventType getEventType() {
        return EventType.GROUP_MEMBER_LEAVE;
    }
}
