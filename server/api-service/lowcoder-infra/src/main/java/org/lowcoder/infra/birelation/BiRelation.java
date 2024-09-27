package org.lowcoder.infra.birelation;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.google.common.base.MoreObjects;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

@SuperBuilder
@Jacksonized
@Document
@NoArgsConstructor
@AllArgsConstructor(onConstructor_ = { @JsonCreator(mode = JsonCreator.Mode.PROPERTIES) })
public class BiRelation extends HasIdAndAuditing {

    private BiRelationBizType bizType;
    private String sourceId;
    private String targetId;
    private String relation;
    private String state;

    @Setter
    private String extParam1;
    @Setter
    private String extParam2;
    @Setter
    private String extParam3;

    public BiRelationBizType getBizType() {
        return bizType;
    }

    public String getSourceId() {
        return sourceId;
    }

    public String getTargetId() {
        return targetId;
    }

    public String getRelation() {
        return relation;
    }

    public String getState() {
        return state;
    }

    public String getExtParam1() {
        return extParam1;
    }

    public String getExtParam2() {
        return extParam2;
    }

    public String getExtParam3() {
        return extParam3;
    }

    @Override
    public String toString() {
        return MoreObjects.toStringHelper(this)
                .add("bizType", bizType)
                .add("sourceId", sourceId)
                .add("targetId", targetId)
                .add("relation", relation)
                .add("state", state)
                .add("extParam1", extParam1)
                .add("extParam2", extParam2)
                .add("extParam3", extParam3)
                .toString();
    }

    public long getCreateTime() {
        return createdAt != null ? createdAt.toEpochMilli() : 0;
    }
}
