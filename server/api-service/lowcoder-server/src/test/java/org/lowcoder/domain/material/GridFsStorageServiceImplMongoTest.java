package org.lowcoder.domain.material;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.material.model.MaterialMeta;
import org.lowcoder.domain.material.model.MaterialType;
import org.lowcoder.domain.material.service.storage.MaterialStorageService;
import org.lowcoder.sdk.util.IDUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.ReactiveGridFsTemplate;
import org.springframework.test.context.ActiveProfiles;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * {@code GridFsStorageServiceImpl} against the MongoDB test container (BF-028): rows of the same org and filename share a
 * GridFS name, so each file carries its row id and download and delete address the file of one row; a file stored before
 * the id was recorded (written here straight through GridFS, without metadata) is still found by name. Org ids are
 * generated per test.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
class GridFsStorageServiceImplMongoTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final String FILENAME = "file.png";
    private static final String OLD_CONTENT = "old content";
    private static final String NEW_CONTENT = "new content";
    private static final String OTHER_CONTENT = "content of a concurrent upload";

    @Autowired
    private MaterialStorageService storage;

    @Autowired
    @Qualifier("materialGridFsTemplate")
    private ReactiveGridFsTemplate gridFs;

    private static MaterialMeta meta(String orgId, String filename) {
        MaterialMeta meta = MaterialMeta.builder().orgId(orgId).filename(filename).size(1).type(MaterialType.COMMON).build();
        meta.setId(IDUtils.generate());
        return meta;
    }

    private void store(MaterialMeta meta, String content) {
        storage.save(meta, content.getBytes(StandardCharsets.UTF_8)).block(TIMEOUT);
    }

    /** A file as stored before the row id was recorded: the GridFS name only. */
    private void storeWithoutId(MaterialMeta meta, String content) {
        gridFs.store(Mono.just(new DefaultDataBufferFactory().wrap(content.getBytes(StandardCharsets.UTF_8))),
                meta.getOrgId() + "/" + meta.getFilename()).block(TIMEOUT);
    }

    private String download(MaterialMeta meta) {
        return Flux.from(storage.download(meta))
                .map(buffer -> {
                    String text = buffer.toString(StandardCharsets.UTF_8);
                    DataBufferUtils.release(buffer);
                    return text;
                })
                .collectList()
                .map(parts -> String.join("", parts))
                .block(TIMEOUT);
    }

    private List<String> storedNames(String orgId) {
        return gridFs.find(new Query(Criteria.where("filename").regex("^" + orgId + "/")))
                .map(file -> file.getFilename())
                .collectList()
                .block(TIMEOUT);
    }

    /** Catches the replacement's file going with the old one, or the old one staying, when both share the name. */
    @Test
    void deletingAReplacedRowKeepsTheSameNamedFileOfItsReplacement() {
        String orgId = IDUtils.generate();
        MaterialMeta old = meta(orgId, FILENAME);
        MaterialMeta replacement = meta(orgId, FILENAME);
        store(old, OLD_CONTENT);
        store(replacement, NEW_CONTENT);
        assertThat(download(old)).as("each row reads its own file").isEqualTo(OLD_CONTENT);
        assertThat(download(replacement)).isEqualTo(NEW_CONTENT);

        storage.delete(old).block(TIMEOUT);

        System.out.println("[GridFsStorageServiceImplMongoTest] same name: files " + storedNames(orgId) + ", replacement reads '"
                + download(replacement) + "', old reads '" + download(old) + "'");
        assertThat(storedNames(orgId)).hasSize(1);
        assertThat(download(replacement)).isEqualTo(NEW_CONTENT);
        assertThat(download(old)).isEmpty();
    }

    /**
     * The concurrent windows of the review: upload A replaces the old row while a same-named upload B stores its row and
     * file before A's; deleting the old row's file leaves both A's and B's files, each read by its own row.
     */
    @Test
    void deletingAReplacedRowKeepsTheFilesOfConcurrentSameNamedUploads() {
        String orgId = IDUtils.generate();
        MaterialMeta old = meta(orgId, FILENAME);
        store(old, OLD_CONTENT);
        MaterialMeta uploadB = meta(orgId, FILENAME);
        store(uploadB, OTHER_CONTENT);
        MaterialMeta uploadA = meta(orgId, FILENAME);
        store(uploadA, NEW_CONTENT);

        storage.delete(old).block(TIMEOUT);

        System.out.println("[GridFsStorageServiceImplMongoTest] concurrent: files " + storedNames(orgId) + ", A '" + download(uploadA)
                + "', B '" + download(uploadB) + "'");
        assertThat(storedNames(orgId)).hasSize(2);
        assertThat(download(uploadA)).isEqualTo(NEW_CONTENT);
        assertThat(download(uploadB)).isEqualTo(OTHER_CONTENT);
    }

    /** A row whose file was stored before the id was recorded is read and deleted by name; the new row's file stays. */
    @Test
    void aFileWithoutTheRowIdIsReadByNameAndDeletedWithItsRow() {
        String orgId = IDUtils.generate();
        MaterialMeta legacy = meta(orgId, FILENAME);
        storeWithoutId(legacy, OLD_CONTENT);
        assertThat(download(legacy)).isEqualTo(OLD_CONTENT);
        MaterialMeta replacement = meta(orgId, FILENAME);
        store(replacement, NEW_CONTENT);

        storage.delete(legacy).block(TIMEOUT);

        System.out.println("[GridFsStorageServiceImplMongoTest] legacy: files " + storedNames(orgId) + ", replacement '" + download(replacement) + "'");
        assertThat(storedNames(orgId)).hasSize(1);
        assertThat(download(replacement)).isEqualTo(NEW_CONTENT);
    }

    /** Catches the old file staying behind, or the new one going, when the names differ (a new logo filename). */
    @Test
    void deletingAReplacedRowOfAnotherNameDeletesOnlyItsFile() {
        String orgId = IDUtils.generate();
        MaterialMeta old = meta(orgId, "old-logo.png");
        MaterialMeta replacement = meta(orgId, "new-logo.png");
        store(old, OLD_CONTENT);
        store(replacement, NEW_CONTENT);

        storage.delete(old).block(TIMEOUT);

        List<String> names = storedNames(orgId);
        System.out.println("[GridFsStorageServiceImplMongoTest] other name: files " + names);
        assertThat(names).containsExactly(orgId + "/new-logo.png");
        assertThat(download(replacement)).isEqualTo(NEW_CONTENT);
    }
}
