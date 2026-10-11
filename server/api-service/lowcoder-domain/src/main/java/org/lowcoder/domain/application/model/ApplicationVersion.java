package org.lowcoder.domain.application.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

@Document
@Getter
@SuperBuilder
@Jacksonized
@NoArgsConstructor
public class ApplicationVersion extends HasIdAndAuditing {

    private String applicationId;
    private String tag;
    private String commitMessage;
    private Map<String, Object> applicationDSL;

    public long getCreateTime() {
        return createdAt.toEpochMilli();
    }
}
