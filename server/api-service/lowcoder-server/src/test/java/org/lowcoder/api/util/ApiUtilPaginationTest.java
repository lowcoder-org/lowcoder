package org.lowcoder.api.util;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.framework.view.PageResponseView;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.data.domain.PageRequest;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Unit I2 (task L1-13, lane L5): {@code Pagination}: the clamping of page and size, the page check, the zero-based page request,
 * and {@code fluxToPageResponseView}, which slices an in-memory flux for the endpoints that page after loading everything.
 *
 * <p>Limits: no Spring; the flux is a plain Reactor source.
 */
public class ApiUtilPaginationTest {

    static final String TAG = "[ApiUtilPaginationTest] ";
    static final Duration TIMEOUT = Duration.ofSeconds(10);
    static final int MIN_SIZE = 5;
    static final int DEFAULT_MAX_SIZE = 100;
    static final String ILLEGAL_PAGE_KEY = "ILLEGAL_PAGE_NUMBER";

    @Test
    public void sizeIsClampedBetweenTheMinimumAndTheMaximum() {
        assertEquals(MIN_SIZE, Pagination.of(1, 0).size());
        assertEquals(MIN_SIZE, Pagination.of(1, -7).size());
        assertEquals(MIN_SIZE, Pagination.of(1, 4).size());
        assertEquals(5, Pagination.of(1, 5).size());
        assertEquals(37, Pagination.of(1, 37).size());
        assertEquals(DEFAULT_MAX_SIZE, Pagination.of(1, 100).size());
        assertEquals(DEFAULT_MAX_SIZE, Pagination.of(1, 5000).size());
        assertEquals(20, Pagination.of(1, 5000).withMaxSize(20).size());
        assertEquals(1000, Pagination.of(1, 5000).withMaxSize(1000).size());
        assertEquals(20, Pagination.of(1, 20).withMaxSize(1000).size());
    }

    @Test
    public void pageHasAMinimumOfOneAndAMaximumOnlyWhenOneIsSet() {
        assertEquals(1, Pagination.of(0, 10).page());
        assertEquals(1, Pagination.of(-3, 10).page());
        assertEquals(7, Pagination.of(7, 10).page());
        assertEquals(100000, Pagination.of(100000, 10).page(), "no maximum by default");
        assertEquals(3, Pagination.of(9, 10).withMaxPage(3).page());
        assertEquals(2, Pagination.of(2, 10).withMaxPage(3).page());
        assertEquals(9, Pagination.of(9, 10).withMaxPage(0).page(), "a maximum of zero means none");
        assertEquals(9, Pagination.of(9, 10).withMaxPage(-1).page());
        assertEquals(1, Pagination.of(-4, 10).withMaxPage(3).page());
    }

    @Test
    public void checkRejectsANonPositivePageOrOneAboveTheMaximumAndReturnsTheSameObjectOtherwise() {
        Pagination valid = Pagination.of(2, 10);
        assertSame(valid, valid.check());
        assertSame(valid.withMaxPage(5), valid.withMaxPage(5).check().withMaxPage(5));
        for (int bad : new int[] {0, -1, -100}) {
            BizException thrown = assertThrows(BizException.class, () -> Pagination.of(bad, 10).check(), "page " + bad);
            assertEquals(BizError.INVALID_PARAMETER, thrown.getError());
            assertEquals(ILLEGAL_PAGE_KEY, thrown.getMessageKey());
            assertEquals(bad, thrown.getArgs()[0]);
        }
        BizException above = assertThrows(BizException.class, () -> Pagination.of(6, 10).withMaxPage(5).check());
        assertEquals(ILLEGAL_PAGE_KEY, above.getMessageKey());
        assertEquals(6, above.getArgs()[0]);
        assertEquals(1, Pagination.of(1, 10).withMaxPage(0).check().page(), "a maximum of zero means no maximum, so no page is above it");
        assertEquals(4000, Pagination.of(4000, 10).withMaxPage(-1).check().page());
        assertSame(Pagination.class, Pagination.of(5, 10).withMaxPage(5).check().getClass());
        assertEquals(5, Pagination.of(5, 10).withMaxPage(5).check().page(), "the maximum page itself is valid");
    }

    @Test
    public void pageRequestIsZeroBasedAndUsesTheClampedValues() {
        assertEquals(PageRequest.of(2, 20), Pagination.of(3, 20).toPageRequest());
        assertEquals(PageRequest.of(0, MIN_SIZE), Pagination.of(0, 1).toPageRequest());
        assertEquals(PageRequest.of(0, DEFAULT_MAX_SIZE), Pagination.of(1, 999).toPageRequest());
        assertEquals(PageRequest.of(1, 20), Pagination.of(9, 999).withMaxPage(2).withMaxSize(20).toPageRequest());
    }

    @Test
    public void ofReturnsIndependentObjects() {
        Pagination first = Pagination.of(1, 10);
        Pagination second = Pagination.of(1, 10);
        assertNotSame(first, second);
        first.withMaxSize(5);
        assertEquals(10, second.size());
    }

    // ---- fluxToPageResponseView

    private static PageResponseView<?> view(Integer pageNum, Integer pageSize, Flux<?> flux) {
        PageResponseView<?> view = Pagination.fluxToPageResponseView(pageNum, pageSize, flux).block(TIMEOUT);
        System.out.println(TAG + "page " + pageNum + " size " + pageSize + " -> " + view.getData() + " pageNum=" + view.getPageNum() + " pageSize=" + view.getPageSize() + " total=" + view.getTotal());
        return view;
    }

    @Test
    public void aPageIsASliceOfTheFlux() {
        Flux<Integer> numbers = Flux.range(1, 25);
        PageResponseView<?> first = view(1, 10, numbers);
        assertEquals(List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10), first.getData());
        assertEquals(1, first.getPageNum());
        assertEquals(10, first.getPageSize());
        assertEquals(25, first.getTotal());
        assertEquals(List.of(11, 12, 13, 14, 15, 16, 17, 18, 19, 20), view(2, 10, numbers).getData());
        assertEquals(List.of(21, 22, 23, 24, 25), view(3, 10, numbers).getData(), "the last page is short");
        assertEquals(0, PageResponseView.success(List.of(), 1, 1, 0).getTotal());
    }

    @Test
    public void aPagePastTheEndIsEmptyWithTheRightTotal() {
        PageResponseView<?> past = view(9, 10, Flux.range(1, 25));
        assertEquals(List.of(), past.getData());
        assertEquals(25, past.getTotal());
        assertEquals(9, past.getPageNum());
        PageResponseView<?> empty = view(1, 10, Flux.empty());
        assertEquals(List.of(), empty.getData());
        assertEquals(0, empty.getTotal());
    }

    /** Observation: a page size of 0 or less takes no limit: every item from the skipped start, with the size echoed as given. */
    @Test
    public void aPageSizeOfZeroOrLessReturnsEverything() {
        PageResponseView<?> zero = view(1, 0, Flux.range(1, 7));
        assertEquals(7, zero.getData().size());
        assertEquals(0, zero.getPageSize());
        assertEquals(7, zero.getTotal());
        PageResponseView<?> negative = view(1, -3, Flux.range(1, 7));
        assertEquals(7, negative.getData().size());
        assertEquals(-3, negative.getPageSize());
        assertEquals(7, view(4, 0, Flux.range(1, 7)).getData().size(), "with size 0 the skip is 0 whatever the page");
    }

    /**
     * Observation: {@code fluxToPageResponseView} does not check its arguments. A page number of 0 or less makes the skip count negative,
     * and {@code Flux.skip} refuses that while the pipeline is being assembled, so the call throws an
     * {@code IllegalArgumentException} to its caller (not a failed Mono, and not the {@code BizException} that {@code check()} gives).
     */
    @Test
    public void aPageNumberOfZeroOrLessThrowsAnIllegalArgumentExceptionFromSkip() {
        for (int bad : new int[] {0, -1, -5}) {
            IllegalArgumentException thrown = assertThrows(IllegalArgumentException.class, () -> Pagination.fluxToPageResponseView(bad, 10, Flux.range(1, 5)), "page " + bad);
            System.out.println(TAG + "page " + bad + " -> " + thrown.getMessage());
        }
    }

    /** Observation (reported): the flux is subscribed twice, once to count it and once to take the slice. */
    @Test
    public void theFluxIsSubscribedTwice() {
        AtomicInteger subscriptions = new AtomicInteger();
        Flux<Integer> counting = Flux.range(1, 12).doOnSubscribe(s -> subscriptions.incrementAndGet());
        StepVerifier.create(Pagination.fluxToPageResponseView(1, 5, counting)).expectNextCount(1).verifyComplete();
        assertEquals(2, subscriptions.get());
    }
}
