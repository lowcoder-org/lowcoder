package org.lowcoder.domain.datasource.model;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

import com.querydsl.core.annotations.QueryExclude;

import lombok.Getter;
import lombok.Setter;

@QueryExclude
@Document(collection = "datasource")
@Getter
@Setter
@Jacksonized
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class DatasourceDO extends HasIdAndAuditing {

    private String name;
    private String type;
    private String organizationId;
    private int creationSource;
    private DatasourceStatus datasourceStatus;
    private Map<String, Object> detailConfig;

}
