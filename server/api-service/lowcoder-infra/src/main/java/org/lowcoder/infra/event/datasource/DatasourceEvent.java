package org.lowcoder.infra.event.datasource;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.infra.event.AbstractEvent;

@Getter
@SuperBuilder
public class DatasourceEvent extends AbstractEvent {

    private final String datasourceId;
    private final String name;
    private final String type;

    private final EventType eventType;
}
