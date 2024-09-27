package org.lowcoder.domain.folder.service;

import org.lowcoder.domain.folder.model.Folder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

public interface FolderService {
    Mono<Boolean> updateById(String id, Folder resource);

    Mono<Folder> findById(String id);

    Mono<Folder> create(Folder folder);

    Flux<Folder> findByOrganizationId(String organizationId);

    Mono<Void> deleteAllById(Collection<String> ids);

    Mono<Boolean> exist(String id);
}
