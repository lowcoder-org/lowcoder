package org.lowcoder.domain.application.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

@ToString(callSuper = true)
@Document
@Getter
@Setter
@NoArgsConstructor
public class ApplicationHistorySnapshotTS extends HasIdAndAuditing {

    private String applicationId;
    private Map<String, Object> dsl;
    private Map<String, Object> context;

}
