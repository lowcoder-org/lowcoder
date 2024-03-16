package org.lowcoder.infra.event.group;

import lombok.experimental.SuperBuilder;

@SuperBuilder
public class GroupDeleteEvent extends BaseGroupEvent {

    @Override
    public EventType getEventType() {
        return EventType.GROUP_DELETE;
    }
}
