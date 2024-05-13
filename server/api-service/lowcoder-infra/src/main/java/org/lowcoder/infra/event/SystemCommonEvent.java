package org.lowcoder.infra.event;

import org.checkerframework.checker.units.qual.C;

import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public class SystemCommonEvent extends AbstractEvent
{
	private final long apiCalls;

	@Override
	public EventType getEventType() {
		return EventType.SERVER_INFO;
	}
}
