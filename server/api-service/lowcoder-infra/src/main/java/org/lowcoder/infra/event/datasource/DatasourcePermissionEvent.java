package org.lowcoder.infra.event.datasource;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.infra.event.AbstractEvent;

import java.util.Collection;
import java.util.List;

@Getter
@SuperBuilder
public class DatasourcePermissionEvent extends AbstractEvent {

    private final String datasourceId;
    private final String name;
    private final String type;

    private final Collection<String> userIds;
    private final Collection<String> groupIds;
    private final String role;

    private final List<?> oldPermissions;
    private final List<?> newPermissions;

    private final EventType eventType;
}
