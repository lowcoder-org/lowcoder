package org.lowcoder.api.query;

import static org.lowcoder.infra.constant.NewUrl.LIBRARY_QUERY_URL;

import java.util.List;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.query.view.LibraryQueryAggregateView;
import org.lowcoder.api.query.view.LibraryQueryPublishRequest;
import org.lowcoder.api.query.view.LibraryQueryRecordMetaView;
import org.lowcoder.api.query.view.LibraryQueryView;
import org.lowcoder.api.query.view.UpsertLibraryQueryRequest;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.domain.query.service.LibraryQueryService;
import org.lowcoder.infra.event.EventType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = LIBRARY_QUERY_URL)
public class LibraryQueryController {

    @Autowired
    private LibraryQueryService libraryQueryService;
    @Autowired
    private LibraryQueryApiService libraryQueryApiService;
    @Autowired
    private BusinessEventPublisher businessEventPublisher;

    @GetMapping("/dropDownList")
    public Mono<ResponseView<List<LibraryQueryAggregateView>>> dropDownList() {
        return libraryQueryApiService.dropDownList()
                .map(ResponseView::success);
    }

    @GetMapping("/listByOrg")
    public Mono<ResponseView<List<LibraryQueryView>>> list() {
        return libraryQueryApiService.listLibraryQueries()
                .map(ResponseView::success);
    }

    @PostMapping
    public Mono<ResponseView<LibraryQueryView>> create(@RequestBody LibraryQuery libraryQuery) {
        return libraryQueryApiService.create(libraryQuery)
                .delayUntil(libraryQueryView ->
                        businessEventPublisher.publishLibraryQueryEvent(libraryQueryView.id(), libraryQueryView.name(),
                                EventType.LIBRARY_QUERY_CREATE))
                .map(ResponseView::success);
    }

    @PutMapping("/{libraryQueryId}")
    public Mono<ResponseView<Boolean>> update(@PathVariable String libraryQueryId,
            @RequestBody UpsertLibraryQueryRequest upsertLibraryQueryRequest) {
        return libraryQueryApiService.update(libraryQueryId, upsertLibraryQueryRequest)
                .map(ResponseView::success);
    }

    @DeleteMapping("/{libraryQueryId}")
    public Mono<ResponseView<Boolean>> delete(@PathVariable String libraryQueryId) {
        return libraryQueryService.getById(libraryQueryId)
                .delayUntil(__ -> libraryQueryApiService.delete(libraryQueryId))
                .delayUntil(libraryQuery -> businessEventPublisher.publishLibraryQueryEvent(libraryQuery.getId(), libraryQuery.getName(),
                        EventType.LIBRARY_QUERY_DELETE))
                .thenReturn(ResponseView.success(true));
    }

    @PostMapping("/{libraryQueryId}/publish")
    public Mono<ResponseView<LibraryQueryRecordMetaView>> publish(@PathVariable String libraryQueryId,
            @RequestBody LibraryQueryPublishRequest libraryQueryPublishRequest) {
        return libraryQueryApiService.publish(libraryQueryId, libraryQueryPublishRequest)
                .delayUntil(__ -> libraryQueryService.getById(libraryQueryId)
                        .flatMap(libraryQuery -> businessEventPublisher.publishLibraryQuery(libraryQuery, EventType.LIBRARY_QUERY_PUBLISH)))
                .map(ResponseView::success);
    }

}
