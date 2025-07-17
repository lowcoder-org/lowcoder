package org.lowcoder.infra.event;

import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public class LibraryQueryEvent extends AbstractEvent {

    private String id;
    private String name;
    private EventType eventType;
    private   String oldName;

    @Override
    public EventType getEventType() {
        return eventType;
    }
}
