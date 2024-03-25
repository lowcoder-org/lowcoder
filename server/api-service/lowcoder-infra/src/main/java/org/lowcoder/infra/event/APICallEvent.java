package org.lowcoder.infra.event;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.springframework.util.MultiValueMap;

@Getter
@SuperBuilder
public class APICallEvent extends AbstractEvent {

    private final EventType type;
    private final String httpMethod;
    private final String requestUri;
    private final MultiValueMap<String, String> headers;
    private final MultiValueMap<String, String> queryParams;

    @Override
    public EventType getEventType() {
        return EventType.API_CALL_EVENT;
    }
}
