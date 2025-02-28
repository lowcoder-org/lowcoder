package org.lowcoder.domain.query.service;

import com.github.f4b6a3.uuid.UuidCreator;
import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.query.model.BaseQuery;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.model.LibraryQueryRecord;
import org.lowcoder.domain.query.repository.LibraryQueryRepository;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.constants.FieldName;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

import static org.lowcoder.sdk.exception.BizError.LIBRARY_QUERY_NOT_FOUND;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;

@RequiredArgsConstructor
@Service
public class LibraryQueryServiceImpl implements LibraryQueryService {

    private final LibraryQueryRepository libraryQueryRepository;
    private final LibraryQueryRecordService libraryQueryRecordService;
    private final MongoUpsertHelper mongoUpsertHelper;

    @Override
    public Mono<LibraryQuery> getById(String libraryQueryId) {
        if(FieldName.isGID(libraryQueryId))
            return Mono.from(libraryQueryRepository.findByGid(libraryQueryId))
                    .switchIfEmpty(deferredError(LIBRARY_QUERY_NOT_FOUND, "LIBRARY_QUERY_NOT_FOUND"));
        return libraryQueryRepository.findById(libraryQueryId)
                .switchIfEmpty(deferredError(LIBRARY_QUERY_NOT_FOUND, "LIBRARY_QUERY_NOT_FOUND"));
    }

    @Override
    public Flux<LibraryQuery> getByIds(Collection<String> libraryQueryIds) {
        Optional<String> first = libraryQueryIds.stream().findFirst();
        if(first.isPresent() && FieldName.isGID(first.get()))
            return libraryQueryRepository.findByGidIn(libraryQueryIds);
        return libraryQueryRepository.findAllById(libraryQueryIds);
    }

    @Override
    public Mono<LibraryQuery> getByName(String libraryQueryName) {
        return libraryQueryRepository.findByName(libraryQueryName)
                .switchIfEmpty(deferredError(LIBRARY_QUERY_NOT_FOUND, "LIBRARY_QUERY_NOT_FOUND"));
    }

    @Override
    public Flux<LibraryQuery> getByOrganizationId(String organizationId) {
        return libraryQueryRepository.findByOrganizationId(organizationId);
    }

    @Override
    public Mono<LibraryQuery> insert(LibraryQuery libraryQuery) {
        if(StringUtils.isEmpty(libraryQuery.getGid())) libraryQuery.setGid(UuidCreator.getTimeOrderedEpoch().toString());
        return libraryQueryRepository.save(libraryQuery);
    }

    @Override
    public Mono<Boolean> update(String libraryQueryId, LibraryQuery libraryQuery) {
        return mongoUpsertHelper.updateById(libraryQuery, libraryQueryId);
    }

    @Override
    public Mono<Void> delete(String libraryQueryId) {
        if(FieldName.isGID(libraryQueryId))
            return libraryQueryRepository.deleteByGid(libraryQueryId);
        return libraryQueryRepository.deleteById(libraryQueryId);
    }

    @Override
    public Mono<BaseQuery> getEditingBaseQueryByLibraryQueryId(String libraryQueryId) {
        return getById(libraryQueryId).map(LibraryQuery::getQuery);
    }

    @Override
    public Mono<BaseQuery> getLiveBaseQueryByLibraryQueryId(String libraryQueryId) {
        return libraryQueryRecordService.getLatestRecordByLibraryQueryId(libraryQueryId)
                .map(LibraryQueryRecord::getQuery)
                .switchIfEmpty(getById(libraryQueryId)
                        .map(LibraryQuery::getQuery));
    }

    @Override
    public Mono<Map<String, Object>> getLiveDSLByLibraryQueryId(String libraryQueryId) {
        return libraryQueryRecordService.getLatestRecordByLibraryQueryId(libraryQueryId)
                .map(LibraryQueryRecord::getLibraryQueryDSL)
                .switchIfEmpty(getById(libraryQueryId)
                        .map(LibraryQuery::getLibraryQueryDSL));
    }
}
