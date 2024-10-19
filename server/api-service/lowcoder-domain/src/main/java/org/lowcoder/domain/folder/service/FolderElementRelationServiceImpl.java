package org.lowcoder.domain.folder.service;

import static org.lowcoder.infra.birelation.BiRelationBizType.FOLDER_ELEMENT;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.folder.model.FolderElement;
import org.lowcoder.infra.birelation.BiRelationBizType;
import org.lowcoder.infra.birelation.BiRelationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Service
public class FolderElementRelationServiceImpl implements FolderElementRelationService {

    private final BiRelationService biRelationService;

    @Override
    public Mono<Boolean> deleteByFolderIds(List<String> folderIds) {
        return biRelationService.removeAllBiRelations(FOLDER_ELEMENT, folderIds);
    }

    @Override
    public Mono<Boolean> deleteByElementId(String elementId) {
        return biRelationService.removeAllBiRelationsByTargetId(FOLDER_ELEMENT, elementId);
    }

    @Override
    public Mono<Void> create(String folderId, String elementId) {
        return biRelationService.addBiRelation(BiRelationBizType.FOLDER_ELEMENT, folderId, elementId, null, null)
                .then();
    }

    @Override
    public Flux<FolderElement> getByElementIds(List<String> elementIds) {
        return biRelationService.getByTargetIds(BiRelationBizType.FOLDER_ELEMENT, elementIds)
                .map(biRelation -> new FolderElement(biRelation.getSourceId(), biRelation.getTargetId()));
    }
}
