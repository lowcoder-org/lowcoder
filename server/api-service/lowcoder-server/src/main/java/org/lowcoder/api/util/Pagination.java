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
    /** The message key of the page-number error ({@code locale_en.properties}: "Invalid page number."). */
    private static final String ILLEGAL_PAGE_NUMBER = "ILLEGAL_PAGE_NUMBER";
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
            throw illegalPageNumber(page);
        }
        return this;
    }

    private static BizException illegalPageNumber(int page) {
        return new BizException(INVALID_PARAMETER, ILLEGAL_PAGE_NUMBER, page);
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

    /**
     * The page {@code pageNum} (counted from 1) of {@code flux}, {@code pageSize} items long; a page size of 0 or less is the
     * whole flux, whatever the page, as for {@link #pageOf(List, int, int)}. A page number below 1 is the error that
     * {@link #check()} gives, INVALID_PARAMETER with ILLEGAL_PAGE_NUMBER (BF-153: {@code Flux.skip} threw for the negative
     * count, a raw HTTP 500, and a page size below 0 did the same from page 2 on). The skip count is computed in
     * {@code long}.
     * <p>
     * Limits: the error is the returned flux's, so a caller that also counts {@code flux} (for the total) still subscribes
     * to it; {@link #fluxToPageResponseView} checks the page first and subscribes to nothing.
     */
    public static <T> Flux<T> pageOf(Flux<T> flux, int pageNum, int pageSize) {
        if (pageNum < MIN_PAGE) {
            return Flux.error(illegalPageNumber(pageNum));
        }
        if (pageSize <= 0) {
            return flux;
        }
        return flux.skip((long) (pageNum - 1) * pageSize).take(pageSize);
    }

    /** The page of {@code flux} as {@link #pageOf(Flux, int, int)} gives it, with the total; a page number below 1 is refused before {@code flux} is subscribed. */
    @NotNull
    public static Mono<PageResponseView<?>> fluxToPageResponseView(Integer pageNum, Integer pageSize, Flux<?> flux) {
        if (pageNum < MIN_PAGE) {
            return Mono.error(illegalPageNumber(pageNum));
        }
        var countMono = flux.count();
        return pageOf(flux, pageNum, pageSize).collectList().zipWith(countMono)
                .map(tuple -> PageResponseView.success(tuple.getT1(), pageNum, pageSize, Math.toIntExact(tuple.getT2())));
    }
}
