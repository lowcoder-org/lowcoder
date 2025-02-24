package org.lowcoder.api.query;

import java.util.List;

import org.lowcoder.api.framework.view.PageResponseView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.query.view.LibraryQueryAggregateView;
import org.lowcoder.api.query.view.LibraryQueryPublishRequest;
import org.lowcoder.api.query.view.LibraryQueryRecordMetaView;
import org.lowcoder.api.query.view.LibraryQueryView;
import org.lowcoder.api.query.view.UpsertLibraryQueryRequest;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.service.LibraryQueryService;
import org.lowcoder.plugin.api.event.LowcoderEvent.EventType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import static org.lowcoder.api.util.Pagination.fluxToPageResponseView;

@RestController
public class LibraryQueryController implements LibraryQueryEndpoints
{

    @Autowired
    private LibraryQueryService libraryQueryService;
    @Autowired
    private LibraryQueryApiService libraryQueryApiService;
    @Autowired
    private BusinessEventPublisher businessEventPublisher;
    @Autowired
    private GidService gidService;

    @Override
    public Mono<ResponseView<List<LibraryQueryAggregateView>>> dropDownList(@RequestParam(required = false, defaultValue = "") String name) {
        return libraryQueryApiService.dropDownList(name)
                .map(ResponseView::success);
    }

    @Override
    public Mono<PageResponseView<?>> list(@RequestParam(required = false, defaultValue = "") String name,
                                                               @RequestParam(required = false, defaultValue = "1") int pageNum,
                                                               @RequestParam(required = false, defaultValue = "100") int pageSize) {
        var flux = libraryQueryApiService.listLibraryQueries(name)
                .flatMapMany(Flux::fromIterable);
        return fluxToPageResponseView(pageNum, pageSize, flux);
    }

    @Override
    public Mono<ResponseView<LibraryQueryView>> create(@RequestBody LibraryQuery libraryQuery) {
        return libraryQueryApiService.create(libraryQuery)
                .delayUntil(libraryQueryView ->
                        businessEventPublisher.publishLibraryQueryEvent(libraryQueryView.id(), libraryQueryView.name(),
                                EventType.LIBRARY_QUERY_CREATE))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> update(@PathVariable String libraryQueryId,
            @RequestBody UpsertLibraryQueryRequest upsertLibraryQueryRequest) {
        return gidService.convertLibraryQueryIdToObjectId(libraryQueryId).flatMap(objectId ->
            libraryQueryApiService.update(objectId, upsertLibraryQueryRequest)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> delete(@PathVariable String libraryQueryId) {
        return gidService.convertLibraryQueryIdToObjectId(libraryQueryId).flatMap(objectId ->
            libraryQueryService.getById(objectId)
                .delayUntil(__ -> libraryQueryApiService.delete(objectId))
                .delayUntil(libraryQuery -> businessEventPublisher.publishLibraryQueryEvent(libraryQuery.getId(), libraryQuery.getName(),
                        EventType.LIBRARY_QUERY_DELETE))
                .thenReturn(ResponseView.success(true)));
    }

    @Override
    public Mono<ResponseView<LibraryQueryRecordMetaView>> publish(@PathVariable String libraryQueryId,
            @RequestBody LibraryQueryPublishRequest libraryQueryPublishRequest) {
        return gidService.convertLibraryQueryIdToObjectId(libraryQueryId).flatMap(objectId ->
            libraryQueryApiService.publish(objectId, libraryQueryPublishRequest)
                .delayUntil(__ -> libraryQueryService.getById(objectId)
                        .flatMap(libraryQuery -> businessEventPublisher.publishLibraryQuery(libraryQuery, EventType.LIBRARY_QUERY_PUBLISH)))
                .map(ResponseView::success));
    }

}
