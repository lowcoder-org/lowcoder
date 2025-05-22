package org.lowcoder.api.datasource;

import java.util.Map;

import org.lowcoder.domain.datasource.model.DatasourceStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpsertDatasourceRequest {

    private String id;
    private String gid;
    private String name;
    private String type;
    private String organizationId;
    private DatasourceStatus status;

    private Map<String, Object> datasourceConfig;
}
