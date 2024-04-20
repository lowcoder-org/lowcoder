package org.lowcoder.domain.query.service;

import static org.lowcoder.sdk.exception.BizError.LIBRARY_QUERY_NOT_FOUND;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.query.model.LibraryQueryRecord;
import org.lowcoder.domain.query.repository.LibraryQueryRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Service
public class LibraryQueryRecordServiceImpl implements LibraryQueryRecordService {

    private final LibraryQueryRecordRepository libraryQueryRecordRepository;

    @Override
    public Mono<LibraryQueryRecord> insert(LibraryQueryRecord libraryQueryRecord) {
        return libraryQueryRecordRepository.save(libraryQueryRecord);
    }

    /**
     * get all published versions
     */
    @Override
    public Mono<List<LibraryQueryRecord>> getByLibraryQueryId(String libraryQueryId) {
        return libraryQueryRecordRepository.findByLibraryQueryId(libraryQueryId)
                .sort(Comparator.comparing(LibraryQueryRecord::getCreatedAt).reversed())
                .collectList();
    }

    @Override
    public Mono<Map<String, List<LibraryQueryRecord>>> getByLibraryQueryIdIn(List<String> libraryQueryIdList) {
        return libraryQueryRecordRepository.findByLibraryQueryIdIn(libraryQueryIdList)
                .sort(Comparator.comparing(LibraryQueryRecord::getCreatedAt).reversed())
                .collectList()
                .map(libraryQueryRecords -> libraryQueryRecords.stream()
                        .collect(Collectors.groupingBy(LibraryQueryRecord::getLibraryQueryId)));
    }

    @Override
    public Mono<LibraryQueryRecord> getById(String id) {
        return libraryQueryRecordRepository.findById(id)
                .switchIfEmpty(deferredError(LIBRARY_QUERY_NOT_FOUND, "LIBRARY_QUERY_NOT_FOUND"));
    }

    /**
     * get the latest published version
     */
    @Override
    public Mono<LibraryQueryRecord> getLatestRecordByLibraryQueryId(String libraryQueryId) {
        return libraryQueryRecordRepository.findTop1ByLibraryQueryIdOrderByCreatedAtDesc(libraryQueryId);
    }

    @Override
    public Mono<Long> deleteAllLibraryQueryTagByLibraryQueryId(String libraryQueryId) {
        return libraryQueryRecordRepository.deleteByLibraryQueryId(libraryQueryId);
    }

    @Override
    public Mono<Void> deleteById(String id) {
        return libraryQueryRecordRepository.deleteById(id);
    }


}
