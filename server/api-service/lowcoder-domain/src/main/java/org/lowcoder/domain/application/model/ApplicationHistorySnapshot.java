package org.lowcoder.domain.application.model;

import java.util.Map;

import lombok.NoArgsConstructor;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@ToString(callSuper = true)
@Document
@Getter
@Setter
@NoArgsConstructor
public class ApplicationHistorySnapshot extends HasIdAndAuditing {

    private String applicationId;
    private Map<String, Object> dsl;
    private Map<String, Object> context;

}
