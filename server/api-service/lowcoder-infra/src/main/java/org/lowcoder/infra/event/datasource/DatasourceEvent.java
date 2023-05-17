package org.lowcoder.infra.event.datasource;

import org.lowcoder.infra.event.AbstractEvent;
import org.lowcoder.infra.event.EventType;

import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public class DatasourceEvent extends AbstractEvent {

    private final String datasourceId;
    private final String name;
    private final String type;

    private final EventType eventType;
}
