package org.lowcoder.api.util;

import static java.util.Collections.emptyList;
import static org.lowcoder.sdk.exception.BizError.INVALID_PARAMETER;

import java.util.List;

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

    /**
     * The page {@code pageNum} (counted from 1) of {@code list}, {@code pageSize} items long; a page size of 0 or less is the
     * whole list, whatever the page. A page before the first (0 or less) or after the last is empty (BF-086: the member
     * lists sliced with an unchecked {@code subList}, which threw for them, a raw HTTP 500). The bounds are computed in
     * {@code long}, so a large page number cannot overflow into a valid page.
     * <p>
     * Limits: the page is a view of {@code list}, as {@code subList} gives; a page number of 0 or less is not reported as an
     * error here ({@link #check()} is the rule for the paged queries).
     */
    public static <T> List<T> pageOf(List<T> list, int pageNum, int pageSize) {
        if (pageSize <= 0) {
            return list;
        }
        long fromIndex = Math.max(0L, (long) (pageNum - 1) * pageSize);
        long toIndex = Math.min((long) pageNum * pageSize, list.size());
        return fromIndex < toIndex ? list.subList((int) fromIndex, (int) toIndex) : emptyList();
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
