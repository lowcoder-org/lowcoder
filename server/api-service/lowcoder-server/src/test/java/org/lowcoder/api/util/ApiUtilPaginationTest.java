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
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
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
    /** {@code pageOf}: five items, pages of two. */
    static final List<String> FIVE = List.of("a", "b", "c", "d", "e");
    static final int TWO = 2;
    /** A page and size whose {@code int} bounds wrap to 0 and 65536 (2^32 and 2^32 + 2^16), a valid first page in int arithmetic. */
    static final int WRAPPING_PAGE = 65_537;
    static final int WRAPPING_SIZE = 65_536;
    /** BF-153: page numbers before the first. */
    static final int[] NON_POSITIVE_PAGES = {0, -1, -5, Integer.MIN_VALUE};

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

    /** Asserts the {@code check()} error: INVALID_PARAMETER, ILLEGAL_PAGE_NUMBER, the page number as its argument. */
    private static void assertIllegalPageNumber(Throwable error, int page) {
        System.out.println(TAG + "page " + page + " -> " + error);
        BizException biz = assertInstanceOf(BizException.class, error, "page " + page);
        assertEquals(BizError.INVALID_PARAMETER, biz.getError());
        assertEquals(ILLEGAL_PAGE_KEY, biz.getMessageKey());
        assertEquals(page, biz.getArgs()[0]);
    }

    /**
     * BF-153: a page number of 0 or less is the error {@code check()} gives, as a failed Mono, and the flux is not subscribed.
     * Catches: the page passed on to {@code Flux.skip} unchecked again (an {@code IllegalArgumentException} thrown to the
     * caller, a raw HTTP 500), or the check made after counting the flux.
     */
    @Test
    public void aPageNumberOfZeroOrLessIsTheIllegalPageNumberErrorBF153() {
        for (int bad : NON_POSITIVE_PAGES) {
            AtomicInteger subscriptions = new AtomicInteger();
            Flux<Integer> counting = Flux.range(1, 5).doOnSubscribe(s -> subscriptions.incrementAndGet());
            StepVerifier.create(Pagination.fluxToPageResponseView(bad, 10, counting))
                    .expectErrorSatisfies(error -> assertIllegalPageNumber(error, bad))
                    .verify(TIMEOUT);
            assertEquals(0, subscriptions.get(), "page " + bad + ": the flux is not subscribed");
        }
    }

    /** BF-153: a negative page size from page 2 on is the whole flux, as size 0 is, where the negative skip count threw. */
    @Test
    public void aNegativePageSizeAfterTheFirstPageReturnsEverythingBF153() {
        PageResponseView<?> negative = view(2, -3, Flux.range(1, 7));
        assertEquals(7, negative.getData().size());
        assertEquals(7, negative.getTotal());
        assertEquals(-3, negative.getPageSize());
    }

    /** {@code pageOf(Flux)} gives the requested slice; the last page may be short and a page past the end is empty. */
    @Test
    public void pageOfAFluxGivesTheRequestedSlice() {
        Flux<String> five = Flux.fromIterable(FIVE);
        StepVerifier.create(Pagination.pageOf(five, 1, TWO)).expectNext("a", "b").verifyComplete();
        StepVerifier.create(Pagination.pageOf(five, 2, TWO)).expectNext("c", "d").verifyComplete();
        StepVerifier.create(Pagination.pageOf(five, 3, TWO)).expectNext("e").verifyComplete();
        StepVerifier.create(Pagination.pageOf(five, 4, TWO)).verifyComplete();
        System.out.println(TAG + "pageOf(Flux) over " + FIVE + ", size " + TWO + ": " + Pagination.pageOf(five, 2, TWO).collectList().block(TIMEOUT));
    }

    /** BF-153: {@code pageOf(Flux)} with a page of 0 or less is the {@code check()} error, a failed flux, not a thrown exception. */
    @Test
    public void pageOfAFluxWithAPageOfZeroOrLessIsTheIllegalPageNumberErrorBF153() {
        for (int bad : NON_POSITIVE_PAGES) {
            Flux<String> page = Pagination.pageOf(Flux.fromIterable(FIVE), bad, TWO);
            StepVerifier.create(page).expectErrorSatisfies(error -> assertIllegalPageNumber(error, bad)).verify(TIMEOUT);
        }
    }

    /** BF-153: {@code pageOf(Flux)} with a page size of 0 or less is the whole flux, whatever the (valid) page. */
    @Test
    public void pageOfAFluxWithASizeOfZeroOrLessIsTheWholeFluxBF153() {
        for (int size : new int[] {0, -1, -3}) {
            for (int page : new int[] {1, 2, 7}) {
                List<String> all = Pagination.pageOf(Flux.fromIterable(FIVE), page, size).collectList().block(TIMEOUT);
                assertEquals(FIVE, all, "page " + page + " size " + size);
            }
        }
    }

    /** The skip count is computed in long: a page whose int skip count wraps to 0 is past the end, not the first page. */
    @Test
    public void pageOfAFluxDoesNotWrapALargePageIntoTheFlux() {
        assertEquals(0, (WRAPPING_PAGE - 1) * WRAPPING_SIZE, "the int skip count wraps to 0");
        StepVerifier.create(Pagination.pageOf(Flux.fromIterable(FIVE), WRAPPING_PAGE, WRAPPING_SIZE)).verifyComplete();
    }

    /** Observation (reported): the flux is subscribed twice, once to count it and once to take the slice. */
    @Test
    public void theFluxIsSubscribedTwice() {
        AtomicInteger subscriptions = new AtomicInteger();
        Flux<Integer> counting = Flux.range(1, 12).doOnSubscribe(s -> subscriptions.incrementAndGet());
        StepVerifier.create(Pagination.fluxToPageResponseView(1, 5, counting)).expectNextCount(1).verifyComplete();
        assertEquals(2, subscriptions.get());
    }

    /** BF-086: {@code pageOf} gives the requested slice; the last page may be short. */
    @Test
    public void pageOfGivesTheRequestedSlice() {
        assertEquals(List.of("a", "b"), Pagination.pageOf(FIVE, 1, TWO));
        assertEquals(List.of("c", "d"), Pagination.pageOf(FIVE, 2, TWO));
        assertEquals(List.of("e"), Pagination.pageOf(FIVE, 3, TWO), "the last page is short");
        System.out.println(TAG + "pageOf over " + FIVE + ", size " + TWO + ": " + Pagination.pageOf(FIVE, 1, TWO) + " "
                + Pagination.pageOf(FIVE, 2, TWO) + " " + Pagination.pageOf(FIVE, 3, TWO));
    }

    /** BF-086: a page before the first (0 or less) or after the last is empty, where an unchecked subList threw. */
    @Test
    public void pageOfIsEmptyOutsideThePages() {
        for (int page : new int[] {0, -1, 4, 5, Integer.MAX_VALUE, Integer.MIN_VALUE}) {
            assertEquals(List.of(), Pagination.pageOf(FIVE, page, TWO), "page " + page);
        }
        assertEquals(List.of(), Pagination.pageOf(List.of(), 1, TWO), "the first page of an empty list");
        System.out.println(TAG + "pageOf outside the pages of " + FIVE + " -> empty");
    }

    /** A page size of 0 or less is the whole list, whatever the page (the meaning 0 had at the call sites). */
    @Test
    public void pageOfWithASizeOfZeroOrLessIsTheWholeList() {
        for (int size : new int[] {0, -1}) {
            for (int page : new int[] {0, 1, 7}) {
                assertSame(FIVE, Pagination.pageOf(FIVE, page, size), "page " + page + " size " + size);
            }
        }
    }

    /** The bounds are computed in long: a page whose int bounds wrap into the list is empty, not the first page. */
    @Test
    public void pageOfDoesNotWrapALargePageIntoTheList() {
        int wrappedFrom = (WRAPPING_PAGE - 1) * WRAPPING_SIZE;
        int wrappedTo = WRAPPING_PAGE * WRAPPING_SIZE;
        System.out.println(TAG + "page " + WRAPPING_PAGE + " size " + WRAPPING_SIZE + ": int bounds " + wrappedFrom + ".." + wrappedTo
                + " -> " + Pagination.pageOf(FIVE, WRAPPING_PAGE, WRAPPING_SIZE));
        assertEquals(0, wrappedFrom, "the int start wraps to 0");
        assertEquals(List.of(), Pagination.pageOf(FIVE, WRAPPING_PAGE, WRAPPING_SIZE));
    }
}
