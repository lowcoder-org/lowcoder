package org.lowcoder.api.framework;

import lombok.RequiredArgsConstructor;
import org.lowcoder.api.framework.view.ResponseView;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@RestController
public class IndexController {

    @GetMapping(value = "/", consumes = {MediaType.ALL_VALUE})
    public Mono<ResponseView<Void>> index() {
        return Mono.just(ResponseView.error(ResponseView.SUCCESS, "Lowcoder API is up and runnig"));
    }
}
