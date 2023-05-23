package org.lowcoder.api.framework;


import static org.lowcoder.sdk.exception.BizError.SERVER_NOT_READY;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.framework.warmup.WarmupHelper;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping(value = {Url.STATE_URL, NewUrl.STATE_URL})
public class StateController {

    @Autowired
    private WarmupHelper warmupHelper;

    private volatile boolean ready;

    @RequestMapping(value = "/healthCheck", method = RequestMethod.HEAD)
    public Mono<ResponseView<Boolean>> healthCheck() {
        if (!ready) {
            return warmupHelper.warmup()
                    .doOnSuccess(it -> ready = true)
                    .then(ofError(SERVER_NOT_READY, "SERVER_NOT_READY"));
        }
        return Mono.just(ResponseView.success(true));
    }

}
