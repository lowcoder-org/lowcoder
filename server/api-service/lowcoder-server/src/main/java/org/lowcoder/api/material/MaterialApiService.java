package org.lowcoder.api.material;

import java.util.List;

import org.lowcoder.api.material.MaterialEndpoints.MaterialView;
import org.lowcoder.domain.material.model.MaterialMeta;
import org.lowcoder.domain.material.model.MaterialType;
import org.reactivestreams.Publisher;
import org.springframework.core.io.buffer.DataBuffer;

import reactor.core.publisher.Mono;

public interface MaterialApiService {

    /**
     * @param content base64
     */
    Mono<MaterialMeta> upload(String filename, String content, MaterialType type);

    Publisher<? extends DataBuffer> download(MaterialMeta materialMeta);

    Mono<List<MaterialView>> list();

    Mono<Void> delete(String id);
}
