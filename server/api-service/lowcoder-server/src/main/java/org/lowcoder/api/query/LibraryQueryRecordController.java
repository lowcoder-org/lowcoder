package org.lowcoder.api.query;

import java.util.List;
import java.util.Map;

import org.lowcoder.api.framework.view.PageResponseView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.query.view.LibraryQueryRecordMetaView;
import org.lowcoder.domain.query.model.LibraryQueryCombineId;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import static org.lowcoder.api.util.Pagination.fluxToPageResponseView;

@RequiredArgsConstructor
@RestController
public class LibraryQueryRecordController implements LibraryQueryRecordEndpoints 
{
    private final LibraryQueryRecordApiService libraryQueryRecordApiService;

    @Override
    public Mono<Void> delete(@PathVariable String libraryQueryRecordId) {
        return libraryQueryRecordApiService.delete(libraryQueryRecordId);
    }

    @Override
    public Mono<PageResponseView<?>> getByLibraryQueryId(@RequestParam(name = "libraryQueryId") String libraryQueryId,
                                                         @RequestParam(required = false, defaultValue = "1") int pageNum,
                                                         @RequestParam(required = false, defaultValue = "100") int pageSize) {
        return fluxToPageResponseView(pageNum, pageSize, libraryQueryRecordApiService.getByLibraryQueryId(libraryQueryId).flatMapMany(Flux::fromIterable));
    }

    @Override
    public Mono<ResponseView<Map<String, Object>>> dslById(@RequestParam(name = "libraryQueryId") String libraryQueryId,
            @RequestParam(name = "libraryQueryRecordId") String libraryQueryRecordId) {
        LibraryQueryCombineId libraryQueryCombineId = new LibraryQueryCombineId(libraryQueryId, libraryQueryRecordId);
        return libraryQueryRecordApiService.getRecordDSLFromLibraryQueryCombineId(libraryQueryCombineId)
                .map(ResponseView::success);
    }

}
