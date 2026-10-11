package org.lowcoder.infra.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuple3;
import reactor.util.function.Tuple4;
import reactor.util.function.Tuples;

/** {@link MonoUtils}, {@link TupleUtils} and {@link FluxHelper}. */
class ReactiveUtilsTest {

    @Test
    void emptyMonoIfEmptyListTurnsAnEmptyListIntoAnEmptyMonoAndKeepsOtherLists() {
        assertThat(MonoUtils.emptyMonoIfEmptyList(Mono.just(List.<String>of())).blockOptional()).isEmpty();
        assertThat(MonoUtils.emptyMonoIfEmptyList(Mono.just(List.of("a"))).block()).containsExactly("a");
        assertThat(MonoUtils.emptyMonoIfEmptyList(Mono.<List<String>>empty()).blockOptional()).isEmpty();
    }

    @Test
    void emptyIfNullWrapsAValueAndMapsNullToEmpty() {
        assertThat(MonoUtils.emptyIfNull("v").block()).isEqualTo("v");
        assertThat(MonoUtils.emptyIfNull(null).blockOptional()).isEmpty();
    }

    @Test
    void tupleMergeAddsTheLoneValueFirstOrLastForEveryArity() {
        Tuple2<String, String> t2 = Tuples.of("a", "b");
        Tuple3<String, String, String> t3 = Tuples.of("a", "b", "c");
        Tuple4<String, String, String, String> t4 = Tuples.of("a", "b", "c", "d");

        assertThat(TupleUtils.merge("u", t2).toArray()).containsExactly("u", "a", "b");
        assertThat(TupleUtils.merge(t2, "u").toArray()).containsExactly("a", "b", "u");
        assertThat(TupleUtils.merge("u", t3).toArray()).containsExactly("u", "a", "b", "c");
        assertThat(TupleUtils.merge(t3, "u").toArray()).containsExactly("a", "b", "c", "u");
        assertThat(TupleUtils.merge("u", t4).toArray()).containsExactly("u", "a", "b", "c", "d");
        assertThat(TupleUtils.merge(t4, "u").toArray()).containsExactly("a", "b", "c", "d", "u");
    }

    @Test
    void getAllPageByPageConcatenatesPagesUntilAnEmptyPageAndFetchesEachPageOnce() {
        List<Integer> fetchedPages = new ArrayList<>();
        FluxHelper.PageFetcher<String> fetcher = pageable -> {
            fetchedPages.add(pageable.getPageNumber());
            return switch (pageable.getPageNumber()) {
                case 0 -> Flux.just("a", "b");
                case 1 -> Flux.just("c");
                default -> Flux.empty();
            };
        };
        Pageable first = PageRequest.of(0, 2);

        List<String> all = FluxHelper.getAllPageByPage(fetcher, first).collectList().block();

        System.out.println("[ReactiveUtilsTest] items " + all + " pages fetched " + fetchedPages);
        assertThat(all).containsExactly("a", "b", "c");
        assertThat(fetchedPages).containsExactly(0, 1, 2);
    }

    @Test
    void getAllPageByPageOfAnEmptyFirstPageIsEmpty() {
        assertThat(FluxHelper.getAllPageByPage(p -> Flux.<String>empty(), PageRequest.of(0, 5)).collectList().block()).isEmpty();
    }
}
