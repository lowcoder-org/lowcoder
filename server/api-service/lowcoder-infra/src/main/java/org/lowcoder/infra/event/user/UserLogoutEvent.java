package org.lowcoder.infra.event.user;

import org.lowcoder.infra.event.AbstractEvent;
import org.lowcoder.infra.event.EventType;

import lombok.experimental.SuperBuilder;

@SuperBuilder
public class UserLogoutEvent extends AbstractEvent {

    @Override
    public EventType getEventType() {
        return EventType.USER_LOGOUT;
    }
}
