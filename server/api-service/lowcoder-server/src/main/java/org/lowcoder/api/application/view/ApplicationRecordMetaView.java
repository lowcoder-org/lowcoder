package org.lowcoder.api.application.view;

import org.lowcoder.domain.application.model.ApplicationVersion;
import org.lowcoder.domain.user.model.User;

public record ApplicationRecordMetaView(String id,
                                        String applicationId,
                                        String tag,
                                        String commitMessage,
                                        long createTime,
                                        String creatorName) {

    public static ApplicationRecordMetaView from(ApplicationVersion applicationRecord) {
        return new ApplicationRecordMetaView(applicationRecord.getId(),
                applicationRecord.getApplicationId(),
                applicationRecord.getTag(),
                applicationRecord.getCommitMessage(),
                applicationRecord.getCreatedAt().toEpochMilli(),
                null);
    }

    public static ApplicationRecordMetaView from(ApplicationVersion applicationRecord, User applicationRecordCreator) {
        return new ApplicationRecordMetaView(applicationRecord.getId(),
                applicationRecord.getApplicationId(),
                applicationRecord.getTag(),
                applicationRecord.getCommitMessage(),
                applicationRecord.getCreatedAt().toEpochMilli(),
                applicationRecordCreator.getName());
    }
}
