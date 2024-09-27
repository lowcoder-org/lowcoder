package org.lowcoder.domain.query.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import org.apache.commons.collections4.MapUtils;

import java.util.Map;

@Getter
public class ApplicationQuery {

    private final String id;

    private final String gid;

    private final String name;

    private final BaseQuery baseQuery;

    private final String triggerType;

    private final String timeoutStr;

    @JsonCreator
    public ApplicationQuery(@JsonProperty("id") String id,
            @JsonProperty("gid") String gid,
            @JsonProperty("name") String name,
            @JsonProperty("datasourceId") String datasourceId,
            @JsonProperty("comp") Map<String, Object> queryConfig,
            @JsonProperty("triggerType") String triggerType,
            @JsonProperty("timeout") String timeoutStr,
            @JsonProperty("compType") String compType) {
        this.id = id;
        this.gid = gid;
        this.name = name;
        this.triggerType = triggerType;
        this.timeoutStr = timeoutStr;
        this.baseQuery = BaseQuery.builder()
                .queryConfig(queryConfig)
                .datasourceId(datasourceId)
                .compType(compType)
                .timeoutStr(timeoutStr).build();
    }

    public boolean isUsingLibraryQuery() {
        return "libraryQuery".equals(baseQuery.getCompType());
    }

    public LibraryQueryCombineId getLibraryRecordQueryId() {
        String libraryQueryId = MapUtils.getString(baseQuery.getQueryConfig(), "libraryQueryId");
        String libraryQueryRecordId = MapUtils.getString(baseQuery.getQueryConfig(), "libraryQueryRecordId");
        return new LibraryQueryCombineId(libraryQueryId, libraryQueryRecordId);
    }

}
