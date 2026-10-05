package org.lowcoder.domain.query.service;

import org.lowcoder.domain.query.model.BaseQuery;
import org.lowcoder.domain.query.model.LibraryQuery;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.Map;

public interface LibraryQueryService {
    Mono<LibraryQuery> getById(String libraryQueryId);
    Flux<LibraryQuery> getByIds(Collection<String> libraryQueryIds);

    /**
     * The library query of that name in that organization; LIBRARY_QUERY_NOT_FOUND when the organization has none. A query of
     * the same name in another organization is never answered.
     * <p>Limits: names are not unique within an organization (create and update do not check), and the lookup expects one
     * result, so two queries of the same name in one organization fail it (IncorrectResultSizeDataAccessException).
     */
    Mono<LibraryQuery> getByOrganizationIdAndName(String organizationId, String libraryQueryName);

    Flux<LibraryQuery> getByOrganizationId(String organizationId);

    Mono<LibraryQuery> insert(LibraryQuery libraryQuery);

    Mono<Boolean> update(String libraryQueryId, LibraryQuery libraryQuery);

    Mono<Void> delete(String libraryQueryId);

    Mono<BaseQuery> getEditingBaseQueryByLibraryQueryId(String libraryQueryId);

    Mono<BaseQuery> getLiveBaseQueryByLibraryQueryId(String libraryQueryId);

    Mono<Map<String, Object>> getLiveDSLByLibraryQueryId(String libraryQueryId);
}
