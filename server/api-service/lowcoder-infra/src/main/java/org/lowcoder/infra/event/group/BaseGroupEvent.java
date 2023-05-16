package org.lowcoder.infra.event.group;

import org.lowcoder.infra.event.AbstractEvent;

import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public abstract class BaseGroupEvent extends AbstractEvent {

    private final String groupId;
    private final String groupName;
}
