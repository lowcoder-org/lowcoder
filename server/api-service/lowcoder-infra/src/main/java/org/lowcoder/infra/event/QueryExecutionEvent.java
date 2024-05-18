package org.lowcoder.infra.event;

import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.Map;

@Getter
@SuperBuilder
public class QueryExecutionEvent extends AbstractEvent {

    private final Map<String, Object> detail;

    @Override
    public EventType getEventType() {
        return EventType.QUERY_EXECUTION;
    }
}
