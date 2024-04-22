package org.lowcoder.domain.query.service;

import org.lowcoder.domain.query.model.BaseQuery;
import org.lowcoder.domain.query.model.LibraryQuery;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface LibraryQueryService {
    Mono<LibraryQuery> getById(String libraryQueryId);

    Mono<LibraryQuery> getByName(String libraryQueryName);

    Flux<LibraryQuery> getByOrganizationId(String organizationId);

    Mono<LibraryQuery> insert(LibraryQuery libraryQuery);

    Mono<Boolean> update(String libraryQueryId, LibraryQuery libraryQuery);

    Mono<Void> delete(String libraryQueryId);

    Mono<BaseQuery> getEditingBaseQueryByLibraryQueryId(String libraryQueryId);

    Mono<BaseQuery> getLiveBaseQueryByLibraryQueryId(String libraryQueryId);

    Mono<Map<String, Object>> getLiveDSLByLibraryQueryId(String libraryQueryId);
}
