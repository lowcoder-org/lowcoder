package org.lowcoder.infra.event.group;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.infra.event.AbstractEvent;

@Getter
@SuperBuilder
public abstract class BaseGroupEvent extends AbstractEvent {

    private final String groupId;
    private final String groupName;
}
