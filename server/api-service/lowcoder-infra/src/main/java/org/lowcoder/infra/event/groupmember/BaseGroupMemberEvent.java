package org.lowcoder.infra.event.groupmember;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.infra.event.AbstractEvent;

@Getter
@SuperBuilder
public abstract class BaseGroupMemberEvent extends AbstractEvent {

}
