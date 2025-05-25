package org.lowcoder.infra.event;

import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public class LibraryQueryPublishEvent extends AbstractEvent {

    private  String id;
    private  String oldVersion;
    private  String newVersion;
    private EventType eventType;

    @Override
    public EventType getEventType() {
        return eventType;
    }
}
