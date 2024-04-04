package org.lowcoder.api.query;

import org.lowcoder.api.query.view.LibraryQueryRecordMetaView;
import org.lowcoder.domain.query.model.LibraryQueryCombineId;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface LibraryQueryRecordApiService {
    Mono<Map<String, Object>> getRecordDSLFromLibraryQueryCombineId(LibraryQueryCombineId libraryQueryCombineId);

    Mono<Void> delete(String id);

    Mono<List<LibraryQueryRecordMetaView>> getByLibraryQueryId(String libraryQueryId);
}
