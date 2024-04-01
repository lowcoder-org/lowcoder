package org.lowcoder.domain.query.model;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Builder;
import lombok.Getter;
import lombok.extern.jackson.Jacksonized;

@Getter
@Builder
@Jacksonized
public class BaseQuery {

    private final String datasourceId;

    @JsonProperty(value = "comp")
    private final Map<String, Object> queryConfig;

    private final String compType;

    @JsonProperty(value = "timeout")
    private final String timeoutStr;

}
