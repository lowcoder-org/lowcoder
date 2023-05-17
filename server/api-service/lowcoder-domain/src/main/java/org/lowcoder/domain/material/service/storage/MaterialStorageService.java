package org.lowcoder.domain.material.service.storage;

import org.lowcoder.domain.material.model.MaterialMeta;
import org.reactivestreams.Publisher;
import org.springframework.core.io.buffer.DataBuffer;

import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

public interface MaterialStorageService {
    Scheduler SCHEDULER = Schedulers.newBoundedElastic(50,
            1000
            , "material-transport");

    Mono<Boolean> save(MaterialMeta materialMeta, byte[] content);

    Publisher<? extends DataBuffer> download(MaterialMeta materialMeta);

    Mono<Void> delete(MaterialMeta materialMeta);
}
