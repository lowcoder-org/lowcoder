package org.lowcoder.domain.datasource.model;

import com.querydsl.core.annotations.QueryExclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

@QueryExclude
@Document(collection = "datasource")
@Getter
@Setter
@Jacksonized
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class DatasourceDO extends HasIdAndAuditing {
    private String gid;
    private String name;
    private String type;
    private String organizationId;
    private int creationSource;
    private DatasourceStatus datasourceStatus;
    private Map<String, Object> detailConfig;

}
