package org.lowcoder.domain.folder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.meta.MetaController;
import org.lowcoder.api.meta.MetaEndpoints.GetMetaDataRequest;
import org.lowcoder.api.meta.view.FolderMetaView;
import org.lowcoder.api.meta.view.MetaView;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.service.FolderService;
import org.lowcoder.sdk.constants.FieldName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.ActiveProfiles;

/**
 * NEW-106: {@code FolderServiceImpl.findByIds} and {@code POST /api[/v1]/meta/} against the MongoDB test container (shared
 * {@code test} context): a null first key used to throw at the call, and with it the whole meta answer failed. Each case
 * stores one folder through the Mongo template (a fresh organization id, name and gid) and removes it again (one removal
 * query by the stored gid, the removed count asserted, a removal failure attached to the case's failure as suppressed).
 * Every call and its {@code block} run inside {@code catchThrowable}, and the throwable is asserted null before the answer, so
 * a throw at the call is a failed assertion, never a test error. Limits: {@code MetaController} is called as a bean (no HTTP,
 * no security chain, no exception handler); the blank-key cases M2 are pins that pass at HEAD.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
class FolderServiceImplBlankKeyMongoTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final String LOG_PREFIX = "[FolderServiceImplBlankKeyMongoTest] ";
    private static final String FOLDER_NAME_PREFIX = "blank-key-folder-";
    private static final String EMPTY_KEY = "";
    private static final String WHITESPACE_KEY = " ";

    @Autowired
    private FolderService folderService;
    @Autowired
    private MetaController metaController;
    @Autowired
    private ReactiveMongoTemplate mongo;

    static Stream<String> blankKeys() {
        return Stream.of(EMPTY_KEY, WHITESPACE_KEY);
    }

    private Folder saveFolder(List<String> storedGids) {
        String gid = UUID.randomUUID().toString();
        storedGids.add(gid);
        Folder folder = new Folder();
        folder.setName(FOLDER_NAME_PREFIX + gid);
        folder.setGid(gid);
        folder.setOrganizationId(new ObjectId().toHexString());
        return mongo.save(folder).block(TIMEOUT);
    }

    private void runThenRemove(List<String> storedGids, Runnable body) {
        try {
            body.run();
        } catch (RuntimeException | Error failure) {
            try {
                removeStored(storedGids);
            } catch (RuntimeException | Error removal) {
                failure.addSuppressed(removal);
            }
            throw failure;
        }
        removeStored(storedGids);
    }

    private void removeStored(List<String> storedGids) {
        long removed = mongo.remove(Query.query(Criteria.where(FieldName.GID).in(storedGids)), Folder.class).block(TIMEOUT)
                .getDeletedCount();
        System.out.println(LOG_PREFIX + "removed " + removed + " of the " + storedGids.size() + " folder(s) the case stored");
        assertThat(removed).as("folders removed").isEqualTo(storedGids.size());
    }

    /** M1: a null first key does not fail the call; the answer is the folder of the other key. */
    @Test
    void aNullFirstKeyInFindByIdsDoesNotFailNEW106() {
        List<String> storedGids = new ArrayList<>();
        runThenRemove(storedGids, () -> {
            Folder f = saveFolder(storedGids);
            List<?>[] answer = new List<?>[1];

            Throwable failure = catchThrowable(() -> answer[0] = folderService.findByIds(Arrays.asList(null, f.getId()))
                    .map(Folder::getId).collectList().block(TIMEOUT));

            System.out.println(LOG_PREFIX + "findByIds([null, " + f.getId() + "]) -> failure " + failure + ", answer " + answer[0]);
            assertThat(failure).as("failure of findByIds").isNull();
            assertThat(answer[0]).as("ids answered").isEqualTo(List.of(f.getId()));
        });
    }

    /** M2 (a pin, passes at HEAD): an empty or whitespace key names no folder next to a real key. */
    @ParameterizedTest(name = "key=[{0}]")
    @MethodSource("blankKeys")
    void aBlankKeyInFindByIdsNamesNoFolderNEW106(String blankKey) {
        List<String> storedGids = new ArrayList<>();
        runThenRemove(storedGids, () -> {
            Folder f = saveFolder(storedGids);
            List<?>[] answer = new List<?>[1];

            Throwable failure = catchThrowable(() -> answer[0] = folderService.findByIds(Arrays.asList(blankKey, f.getId()))
                    .map(Folder::getId).collectList().block(TIMEOUT));

            System.out.println(LOG_PREFIX + "findByIds([[" + blankKey + "], " + f.getId() + "]) -> failure " + failure + ", answer " + answer[0]);
            assertThat(failure).as("failure of findByIds").isNull();
            assertThat(answer[0]).as("ids answered").isEqualTo(List.of(f.getId()));
        });
    }

    /** M3: {@code folderIds=[null, F]} does not fail the whole meta answer; the folders hold exactly F. */
    @Test
    void aNullFolderKeyDoesNotFailTheMetaAnswerNEW106() {
        List<String> storedGids = new ArrayList<>();
        runThenRemove(storedGids, () -> {
            Folder f = saveFolder(storedGids);
            GetMetaDataRequest request = new GetMetaDataRequest(List.of(), List.of(), List.of(), List.of(), List.of(), List.of(),
                    Arrays.asList(null, f.getId()), List.of());
            ResponseView<MetaView>[] answer = new ResponseView[1];

            Throwable failure = catchThrowable(() -> answer[0] = metaController.getMetaData(request).block(TIMEOUT));

            List<String> folderIds = answer[0] == null ? null
                    : answer[0].getData().getFolders().stream().map(FolderMetaView::getId).toList();
            System.out.println(LOG_PREFIX + "getMetaData(folderIds=[null, " + f.getId() + "]) -> failure " + failure + ", folders " + folderIds);
            assertThat(failure).as("failure of getMetaData").isNull();
            assertThat(folderIds).as("folder ids in the meta answer").isEqualTo(List.of(f.getId()));
        });
    }
}
