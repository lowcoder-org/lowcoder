package org.lowcoder.api.query.view;

import org.lowcoder.domain.query.model.LibraryQueryRecord;
import org.lowcoder.domain.user.model.User;

public record LibraryQueryRecordMetaView(String id,
                                         String libraryQueryId,
                                         String datasourceType,
                                         String tag,
                                         String commitMessage,
                                         long createTime,
                                         String creatorName) {

    public static LibraryQueryRecordMetaView from(LibraryQueryRecord libraryQueryRecord) {
        return new LibraryQueryRecordMetaView(libraryQueryRecord.getId(),
                libraryQueryRecord.getLibraryQueryId(),
                libraryQueryRecord.getQuery().getCompType(),
                libraryQueryRecord.getTag(),
                libraryQueryRecord.getCommitMessage(),
                libraryQueryRecord.getCreatedAt().toEpochMilli(),
                null);
    }

    public static LibraryQueryRecordMetaView from(LibraryQueryRecord libraryQueryRecord, User libraryQueryRecordCreator) {
        return new LibraryQueryRecordMetaView(libraryQueryRecord.getId(),
                libraryQueryRecord.getLibraryQueryId(),
                libraryQueryRecord.getQuery().getCompType(),
                libraryQueryRecord.getTag(),
                libraryQueryRecord.getCommitMessage(),
                libraryQueryRecord.getCreatedAt().toEpochMilli(),
                libraryQueryRecordCreator.getName());
    }
}
