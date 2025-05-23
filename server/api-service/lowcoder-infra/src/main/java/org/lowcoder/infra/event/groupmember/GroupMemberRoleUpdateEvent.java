package org.lowcoder.infra.event.groupmember;

import lombok.experimental.SuperBuilder;

@SuperBuilder
public class GroupMemberRoleUpdateEvent extends BaseGroupMemberEvent {

    private final String groupId;
    private final String groupName;
    private final String memberId;
    private final String memberName;
    private final String memberRole;
    private final String oldMemberRole;

    @Override
    public EventType getEventType() {
        return EventType.GROUP_MEMBER_ROLE_UPDATE;
    }
}
