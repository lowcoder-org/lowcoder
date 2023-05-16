package org.lowcoder.domain.material.model;

import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Document
public class MaterialMeta extends HasIdAndAuditing {

    private String filename;
    private String orgId;
    private long size;// in bytes
    private MaterialType type;
}
