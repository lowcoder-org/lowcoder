package org.lowcoder.domain.template.model;

import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;

@Document
@Getter
public class Template extends HasIdAndAuditing {

    private String name;
    private String applicationId; // id of application referenced by this template
}
