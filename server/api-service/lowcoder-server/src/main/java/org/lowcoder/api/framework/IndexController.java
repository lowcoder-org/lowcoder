package org.lowcoder.api.framework;

import lombok.RequiredArgsConstructor;
import org.lowcoder.api.framework.view.ResponseView;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@RestController
public class IndexController {

    public static final String TAG_ROOT = "API Root Endpoint";

    @Operation(
        tags = TAG_ROOT,
        operationId = "getHelloWorld",
        summary = "Get the hello world Message from Lowcoder API",
        description = "Retrieve the Hello World Message. If the API Service operates normal, the response is: {\"code\":1,\"message\":\"Lowcoder API is up and runnig\",\"success\":true}"
	)
    @GetMapping(value = "/", consumes = {MediaType.ALL_VALUE})
    public Mono<ResponseView<Void>> index() {
        return Mono.just(ResponseView.error(ResponseView.SUCCESS, "Lowcoder API is up and runnig"));
    }
}
