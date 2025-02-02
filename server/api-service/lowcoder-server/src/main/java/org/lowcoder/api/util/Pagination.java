package org.lowcoder.api.util;

import static org.lowcoder.sdk.exception.BizError.INVALID_PARAMETER;

import org.jetbrains.annotations.NotNull;
import org.lowcoder.api.framework.view.PageResponseView;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public class Pagination {

    private static final int MIN_PAGE = 1;
    private static final int MIN_SIZE = 5;
    private final int page;
    private final int size;
    private int maxSize = 100;
    private int maxPage = -1;

    public static Pagination of(int page, int size) {
        return new Pagination(page, size);
    }

    private Pagination(int page, int size) {
        this.page = page;
        this.size = size;
    }

    public Pagination withMaxSize(int maxSize) {
        this.maxSize = maxSize;
        return this;
    }

    public Pagination withMaxPage(int maxPage) {
        this.maxPage = maxPage;
        return this;
    }

    public Pagination check() {
        if ((maxPage > 0 && page > maxPage) || page <= 0) {
            throw new BizException(INVALID_PARAMETER, "ILLEGAL_PAGE_NUMBER", page);
        }
        return this;
    }

    public PageRequest toPageRequest() {
        return PageRequest.of(page() - 1, size()); // PageRequest start with page 0
    }

    public int page() {
        if (maxPage <= 0) {
            return Math.max(MIN_PAGE, page);
        }

        return Math.min(Math.max(MIN_PAGE, page), maxPage);
    }

    public int size() {
        return Math.min(Math.max(MIN_SIZE, size), maxSize);
    }

    @NotNull
    public static Mono<PageResponseView<?>> fluxToPageResponseView(Integer pageNum, Integer pageSize, Flux<?> flux) {
        var countMono = flux.count();
        var flux1 = flux.skip((long) (pageNum - 1) * pageSize);
        if(pageSize > 0) flux1 = flux1.take(pageSize);
        return flux1.collectList().zipWith(countMono)
                .map(tuple -> PageResponseView.success(tuple.getT1(), pageNum, pageSize, Math.toIntExact(tuple.getT2())));
    }
}
