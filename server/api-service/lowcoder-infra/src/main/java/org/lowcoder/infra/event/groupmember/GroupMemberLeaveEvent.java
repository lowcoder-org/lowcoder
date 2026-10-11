package org.lowcoder.infra.event.groupmember;

import lombok.experimental.SuperBuilder;

@SuperBuilder
public class GroupMemberLeaveEvent extends BaseGroupMemberEvent {

    private final String groupId;
    private final String groupName;
    private final String memberId;
    private final String memberName;
    private final String memberRole;

    @Override
    public EventType getEventType() {
        return EventType.GROUP_MEMBER_LEAVE;
    }
}
