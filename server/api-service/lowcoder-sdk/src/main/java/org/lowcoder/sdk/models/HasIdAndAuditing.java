package org.lowcoder.sdk.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.*;
import org.springframework.data.domain.Persistable;
import org.springframework.data.mongodb.core.index.Indexed;

import java.io.Serializable;
import java.time.Instant;

/**
 *
 */
@Getter
@Setter
@ToString
@SuperBuilder
@JsonIgnoreProperties(ignoreUnknown = true)
@NoArgsConstructor
public abstract class HasIdAndAuditing implements Persistable<String>, VersionedModel, Serializable {

    private static final long serialVersionUID = 7459916000501322717L;

    @Id
    @JsonProperty(index = 1)
    private String id;

    @CreatedDate
    @JsonIgnore
    protected Instant createdAt;

    @Indexed
    @JsonIgnore
    @LastModifiedDate
    protected Instant updatedAt;

    @CreatedBy
    protected String createdBy;

    @JsonIgnore
    @LastModifiedBy
    protected String modifiedBy;

    @JsonIgnore
    @Override
    public boolean isNew() {
        return this.getId() == null;
    }


}
