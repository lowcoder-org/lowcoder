package org.lowcoder.infra.event.user;

import lombok.experimental.SuperBuilder;
import org.lowcoder.infra.event.AbstractEvent;

@SuperBuilder
public class UserLogoutEvent extends AbstractEvent {

    @Override
    public EventType getEventType() {
        return EventType.USER_LOGOUT;
    }
}
