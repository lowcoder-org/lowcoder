package org.lowcoder.domain.query.service;

import org.lowcoder.domain.query.model.LibraryQueryRecord;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface LibraryQueryRecordService {
    Mono<LibraryQueryRecord> insert(LibraryQueryRecord libraryQueryRecord);

    Mono<List<LibraryQueryRecord>> getByLibraryQueryId(String libraryQueryId);

    Mono<Map<String, List<LibraryQueryRecord>>> getByLibraryQueryIdIn(List<String> libraryQueryIdList);

    Mono<LibraryQueryRecord> getById(String id);

    Mono<LibraryQueryRecord> getLatestRecordByLibraryQueryId(String libraryQueryId);

    Mono<Long> deleteAllLibraryQueryTagByLibraryQueryId(String libraryQueryId);

    Mono<Void> deleteById(String id);
}
