package org.lowcoder.infra.event;

import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public class DatasourceResourcePermissionEvent extends AbstractEvent {

    private final String datasourceId;
    private final String name;
    private final String type;

    private final Object oldPermission;
    private final Object newPermission;

    private final EventType eventType;
}
