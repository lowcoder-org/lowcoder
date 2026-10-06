package org.lowcoder.domain.material.service.storage;

import org.bson.Document;
import org.lowcoder.domain.material.model.MaterialMeta;
import org.reactivestreams.Publisher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.ReactiveGridFsResource;
import org.springframework.data.mongodb.gridfs.ReactiveGridFsTemplate;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Mono;

/**
 * Material files in GridFS, named org + filename. Several material rows can share that name (a material replaced by one
 * of the same name keeps its row until the new file is stored, BF-028), so each file also carries the id of its row in
 * its metadata, and download and delete address the file of that row. Files stored before the id was recorded have no
 * such metadata; they are still found by name.
 * <p>
 * Limit: a file without the row id is matched by name only, so if two rows share the name of such a file, both reach it
 * (as every file did before the id was recorded).
 */
@Service
public class GridFsStorageServiceImpl implements MaterialStorageService {

    private static final String FILENAME = "filename";
    private static final String MATERIAL_ID = "materialId";
    private static final String METADATA_MATERIAL_ID = "metadata." + MATERIAL_ID;

    @Autowired
    @Qualifier("materialGridFsTemplate")
    private ReactiveGridFsTemplate reactiveGridFsTemplate;

    @Override
    public Mono<Boolean> save(MaterialMeta materialMeta, byte[] content) {
        return reactiveGridFsTemplate.store(Mono.just(new DefaultDataBufferFactory().wrap(content)), buildFilename(materialMeta),
                        new Document(MATERIAL_ID, materialMeta.getId()))
                .thenReturn(true);
    }

    /** The file stored for this row; for a row stored before the id was recorded, the file of its name without an id. */
    @Override
    public Publisher<? extends DataBuffer> download(MaterialMeta materialMeta) {
        return reactiveGridFsTemplate.findFirst(queryOwnFile(materialMeta))
                .switchIfEmpty(Mono.defer(() -> reactiveGridFsTemplate.findFirst(queryFileWithoutId(materialMeta))))
                .flatMap(reactiveGridFsTemplate::getResource)
                .flatMapMany(ReactiveGridFsResource::getContent);
    }

    /** Deletes the file of this row and a file of its name stored before the id was recorded; files of other rows stay. */
    @Override
    public Mono<Void> delete(MaterialMeta materialMeta) {
        return reactiveGridFsTemplate.delete(queryOwnFile(materialMeta))
                .then(reactiveGridFsTemplate.delete(queryFileWithoutId(materialMeta)));
    }

    private Query queryOwnFile(MaterialMeta materialMeta) {
        return new Query(Criteria.where(FILENAME).is(buildFilename(materialMeta)).and(METADATA_MATERIAL_ID).is(materialMeta.getId()));
    }

    private Query queryFileWithoutId(MaterialMeta materialMeta) {
        return new Query(Criteria.where(FILENAME).is(buildFilename(materialMeta)).and(METADATA_MATERIAL_ID).exists(false));
    }

    private String buildFilename(MaterialMeta materialMeta) {
        return materialMeta.getOrgId() + "/" + materialMeta.getFilename();
    }
}
