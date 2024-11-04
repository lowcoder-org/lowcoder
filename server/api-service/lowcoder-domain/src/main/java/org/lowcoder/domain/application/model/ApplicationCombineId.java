package org.lowcoder.domain.application.model;

import org.apache.commons.lang.StringUtils;

public record ApplicationCombineId(String applicationId, String applicationRecordId) {

    public boolean isUsingLiveRecord() {
        return "latest".equals(applicationRecordId);
    }

    public boolean isUsingEditingRecord() {
        return StringUtils.isBlank(applicationRecordId) || "editing".equals(applicationRecordId);
    }
}
