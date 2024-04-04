package org.lowcoder.domain.folder.service;

import org.lowcoder.domain.folder.model.FolderElement;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface FolderElementRelationService {
    Mono<Boolean> deleteByFolderIds(List<String> folderIds);

    Mono<Boolean> deleteByElementId(String elementId);

    Mono<Void> create(String folderId, String elementId);

    Flux<FolderElement> getByElementIds(List<String> elementIds);
}
