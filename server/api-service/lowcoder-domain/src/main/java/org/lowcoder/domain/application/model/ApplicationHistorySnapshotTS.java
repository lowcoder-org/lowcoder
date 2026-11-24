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
    /**
     * TRUE when {@link #applicationId} was written as the object id the create route resolved the request's key to and
     * checked EDIT on (D-31); null on a snapshot stored before, whose applicationId is whatever key its caller sent.
     */
    private Boolean applicationIdResolved;
    private Map<String, Object> dsl;
    private Map<String, Object> context;

}
