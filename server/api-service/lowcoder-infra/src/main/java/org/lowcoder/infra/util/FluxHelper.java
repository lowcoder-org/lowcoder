package org.lowcoder.infra.util;

import org.jetbrains.annotations.NotNull;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public class FluxHelper {

    public static <T> Flux<T> getAllPageByPage(PageFetcher<T> pageFetcher, Pageable first) {
        Flux<T> currentFluxPage = pageFetcher.fetch(first).cache();
        return currentFluxPage.hasElements()
                .flatMapMany(hasElement -> {
                    if (hasElement) {
                        return currentFluxPage.concatWith(getAllPageByPage(pageFetcher, first.next()));
                    }
                    return currentFluxPage;
                });
    }

    public interface PageFetcher<T> {

        Flux<T> fetch(Pageable pageable);
    }
}
