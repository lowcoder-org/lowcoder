package org.lowcoder.infra.event.group;

import lombok.experimental.SuperBuilder;

@SuperBuilder
public class GroupUpdateEvent extends BaseGroupEvent {

    private final String groupName;
    private final String oldGroupName;

    @Override
    public EventType getEventType() {
        return EventType.GROUP_UPDATE;
    }
}
