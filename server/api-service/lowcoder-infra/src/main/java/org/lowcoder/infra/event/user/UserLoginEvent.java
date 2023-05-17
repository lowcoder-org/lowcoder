package org.lowcoder.infra.event.user;

import org.lowcoder.infra.event.AbstractEvent;
import org.lowcoder.infra.event.EventType;

import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public class UserLoginEvent extends AbstractEvent {

    private final String source;

    @Override
    public EventType getEventType() {
        return EventType.USER_LOGIN;
    }
}
