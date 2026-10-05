package org.lowcoder.runner.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.Iterator;
import java.util.List;

import org.bson.BsonDocument;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.sdk.config.CommonConfig;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.mongodb.MongoClientSettings;
import com.mongodb.client.AggregateIterable;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;

/**
 * Direct tests of {@link ArchiveSnapshotTask#archive()} with mocked driver types: the dispatch on the server's major
 * version, the age threshold, and every success and failure arm of both archival paths. {@code archive()} is
 * {@code @Scheduled(initialDelay = 0)}, so it runs once at each Spring context start, racing the test that started
 * it (plan §2.3); calling it here makes its coverage deterministic.
 *
 * <p>What a mock can and cannot show: for MongoDB &lt; 5 the pipeline the code hands to the driver is asserted
 * (plan §9 row "ArchiveSnapshotTask's pipeline for MongoDB &lt; 5"); that a real server rejects the first stage, and that
 * {@code $out} replaces the target on each call, cannot be shown with mocks and stays with K2a.
 */
@ExtendWith(MockitoExtension.class)
class ArchiveSnapshotTaskTest {

    private static final String SOURCE_NAME = "applicationHistorySnapshot";
    private static final String TARGET_NAME = "applicationHistorySnapshotTS";
    private static final long WINDOW_MILLIS = 60_000L;
    private static final String VERSION_BELOW_5 = "4.0.2";
    private static final String VERSION_5 = "5.0.3";

    @Mock private MongoTemplate mongoTemplate;
    @Mock private MongoDatabase database;
    @Mock private MongoCollection<Document> source;
    @Mock private MongoCollection<Document> target;
    @Mock private FindIterable<Document> findIterable;
    @Mock private MongoCursor<Document> cursor;
    @Mock private AggregateIterable<Document> aggregateIterable;

    private CommonConfig commonConfig;
    private ArchiveSnapshotTask task;
    private final List<String> events = new ArrayList<>();

    @BeforeEach
    void setUp() {
        commonConfig = new CommonConfig();
        task = new ArchiveSnapshotTask(commonConfig, mongoTemplate);
        lenient().when(mongoTemplate.getDb()).thenReturn(database);
        lenient().when(database.getCollection(SOURCE_NAME)).thenReturn(source);
        lenient().when(database.getCollection(TARGET_NAME)).thenReturn(target);
        lenient().when(source.find(any(Bson.class))).thenReturn(findIterable);
        lenient().when(findIterable.iterator()).thenReturn(cursor);
        lenient().when(source.aggregate(anyList())).thenReturn(aggregateIterable);
    }

    // ---------------------------------------------------------------- helpers

    private void serverVersion(String version) {
        lenient().when(database.runCommand(any(Bson.class))).thenReturn(new Document("version", version));
    }

    private void oldDocuments(Document... documents) {
        Iterator<Document> iterator = Arrays.asList(documents).iterator();
        lenient().when(cursor.hasNext()).thenAnswer(invocation -> iterator.hasNext());
        lenient().when(cursor.next()).thenAnswer(invocation -> iterator.next());
    }

    private static Document snapshot(ObjectId id) {
        return new Document("_id", id)
                .append("applicationId", "app-" + id.toHexString())
                .append("dsl", new Document("k", "v"))
                .append("context", new Document("c", 1))
                .append("createdAt", new Date(0L))
                .append("createdBy", "creator")
                .append("modifiedBy", "modifier")
                .append("updatedAt", new Date(1L));
    }

    private static BsonDocument render(Bson bson) {
        return bson.toBsonDocument(BsonDocument.class, MongoClientSettings.getDefaultCodecRegistry());
    }

    private static BsonDocument idFilter(ObjectId id) {
        return new BsonDocument("_id", new org.bson.BsonObjectId(id));
    }

    private List<BsonDocument> deletedFilters() {
        ArgumentCaptor<Bson> captor = ArgumentCaptor.forClass(Bson.class);
        verify(source, org.mockito.Mockito.atLeast(0)).deleteOne(captor.capture());
        return captor.getAllValues().stream().map(ArchiveSnapshotTaskTest::render).toList();
    }

    // ---------------------------------------------------------------- dispatch

    /** Catches the wrong archival pipeline running for a server version: &gt;= 5 copies, &lt; 5 aggregates. */
    @ParameterizedTest(name = "version {0} -> copy path: {1}")
    @CsvSource({"3.6.23,false", "4.0.2,false", "5.0.0,true", "5.0.3,true", "6.0.14,true", "10.0.0,true"})
    void archive_dispatchesOnTheMajorVersion(String version, boolean copyPath) {
        serverVersion(version);
        oldDocuments(snapshot(new ObjectId()));

        task.archive();

        if (copyPath) {
            verify(target).insertOne(any(Document.class));
            verify(source, never()).aggregate(anyList());
        } else {
            verify(source).aggregate(anyList());
            verify(target, never()).insertOne(any(Document.class));
        }
        System.out.println("[ArchiveSnapshotTaskTest] version " + version + " -> " + (copyPath ? "insertOne copy path" : "aggregate path"));
    }

    /** Catches fresh snapshots being archived: both paths select {@code createdAt <= now - keepDuration days}. */
    @ParameterizedTest(name = "version {0}, keep {1} days")
    @CsvSource({"5.0.3,30", "5.0.3,7", "4.0.2,30", "4.0.2,7"})
    void archive_selectsDocumentsOlderThanTheKeepDuration(String version, long keepDays) {
        commonConfig.getQuery().setAppSnapshotKeepDuration(keepDays);
        serverVersion(version);
        oldDocuments();
        long expected = Instant.now().minus(keepDays, ChronoUnit.DAYS).toEpochMilli();

        task.archive();

        ArgumentCaptor<Bson> countFilter = ArgumentCaptor.forClass(Bson.class);
        ArgumentCaptor<Bson> findFilter = ArgumentCaptor.forClass(Bson.class);
        verify(source).countDocuments(countFilter.capture());
        verify(source).find(findFilter.capture());
        for (Bson filter : List.of(countFilter.getValue(), findFilter.getValue())) {
            long threshold = render(filter).getDocument("createdAt").getDateTime("$lte").getValue();
            assertThat(threshold).isBetween(expected - WINDOW_MILLIS, expected + WINDOW_MILLIS);
        }
        System.out.println("[ArchiveSnapshotTaskTest] " + version + " keep=" + keepDays + " filter " + render(findFilter.getValue()));
    }

    /** Catches a scan when nothing is old enough: no write of any kind, on both paths. */
    @ParameterizedTest
    @ValueSource(strings = {VERSION_5, VERSION_BELOW_5})
    void archive_noOldDocuments_touchesNothing(String version) {
        serverVersion(version);
        oldDocuments();

        task.archive();

        verify(target, never()).insertOne(any(Document.class));
        verify(source, never()).aggregate(anyList());
        verify(source, never()).deleteOne(any(Bson.class));
        verify(cursor).close();
        System.out.println("[ArchiveSnapshotTaskTest] " + version + ": nothing old -> no insert, aggregate or delete");
    }

    // ------------------------------------------------------ MongoDB >= 5 path

    /** Catches a snapshot losing its id, or being deleted before it was copied. */
    @Test
    void archive_v5_copiesTheDocumentWithIdRenamed_thenDeletesTheSource() {
        serverVersion(VERSION_5);
        ObjectId id = new ObjectId();
        oldDocuments(snapshot(id));
        List<Document> inserted = new ArrayList<>();
        org.mockito.Mockito.doAnswer(invocation -> {
            events.add("insert");
            inserted.add(invocation.getArgument(0));
            return null;
        }).when(target).insertOne(any(Document.class));
        org.mockito.Mockito.doAnswer(invocation -> {
            events.add("delete");
            return null;
        }).when(source).deleteOne(any(Bson.class));

        task.archive();

        assertThat(events).containsExactly("insert", "delete");
        assertThat(inserted).hasSize(1);
        assertThat(inserted.get(0).containsKey("_id")).isFalse();
        assertThat(inserted.get(0).get("id")).isEqualTo(id);
        assertThat(inserted.get(0).get("applicationId")).isEqualTo("app-" + id.toHexString());
        assertThat(deletedFilters()).containsExactly(idFilter(id));
        System.out.println("[ArchiveSnapshotTaskTest] v5 events " + events + ", copy has id " + inserted.get(0).get("id") + " and no _id");
    }

    /** Catches snapshot loss on a failed copy: the source of a failed insert stays, the next document is archived. */
    @Test
    void archive_v5_failedInsert_keepsTheSource_andContinuesWithTheNextDocument() {
        serverVersion(VERSION_5);
        ObjectId first = new ObjectId();
        ObjectId second = new ObjectId();
        oldDocuments(snapshot(first), snapshot(second));
        doThrow(new IllegalStateException("duplicate key")).doReturn(null).when(target).insertOne(any(Document.class));

        task.archive();

        verify(target, times(2)).insertOne(any(Document.class));
        assertThat(deletedFilters()).containsExactly(idFilter(second));
        System.out.println("[ArchiveSnapshotTaskTest] v5 failed insert of " + first + " -> only " + second + " deleted");
    }

    /** Catches one failed delete aborting the whole run: the next document is still copied and deleted. */
    @Test
    void archive_v5_failedDelete_continuesWithTheNextDocument() {
        serverVersion(VERSION_5);
        ObjectId first = new ObjectId();
        ObjectId second = new ObjectId();
        oldDocuments(snapshot(first), snapshot(second));
        doThrow(new IllegalStateException("write concern")).doReturn(null).when(source).deleteOne(any(Bson.class));

        task.archive();

        verify(target, times(2)).insertOne(any(Document.class));
        assertThat(deletedFilters()).containsExactly(idFilter(first), idFilter(second));
        System.out.println("[ArchiveSnapshotTaskTest] v5 failed delete of " + first + " -> " + second + " still processed");
    }

    /** Catches a cursor failure escaping the scheduled method, or a leaked cursor. */
    @ParameterizedTest
    @ValueSource(strings = {VERSION_5, VERSION_BELOW_5})
    void archive_cursorFailure_isSwallowed_andTheCursorIsClosed(String version) {
        serverVersion(version);
        org.mockito.Mockito.when(cursor.hasNext()).thenThrow(new IllegalStateException("cursor lost"));

        task.archive();

        verify(cursor).close();
        verify(source, never()).deleteOne(any(Bson.class));
        System.out.println("[ArchiveSnapshotTaskTest] " + version + ": cursor failure swallowed, cursor closed");
    }

    // ------------------------------------------------------ MongoDB < 5 path

    /**
     * Pins the plan §9 row "ArchiveSnapshotTask's pipeline for MongoDB &lt; 5" as far as a mock can show it: per
     * document the code hands the driver three stages, the first of which is the filter document {@code {_id: id}}
     * (not a {@code $match} stage) and the last {@code $out} to the same target for every document, then deletes the
     * source. A fix changes this test on purpose. That a real server rejects the first stage and that {@code $out}
     * replaces the target on each call is not shown here (K2a).
     */
    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void archive_below5_pinsThePipelineHandedToTheDriver_pinsMongoDbBelow5Defect() {
        serverVersion(VERSION_BELOW_5);
        ObjectId first = new ObjectId();
        ObjectId second = new ObjectId();
        oldDocuments(snapshot(first), snapshot(second));
        ArgumentCaptor<List> pipelines = ArgumentCaptor.forClass(List.class);

        task.archive();

        verify(source, times(2)).aggregate(pipelines.capture());
        verify(aggregateIterable, times(2)).first();
        ObjectId[] ids = {first, second};
        for (int i = 0; i < 2; i++) {
            List<Bson> stages = pipelines.getAllValues().get(i);
            assertThat(stages).hasSize(3);
            BsonDocument stage0 = render(stages.get(0));
            assertThat(stage0).isEqualTo(idFilter(ids[i]));
            assertThat(stage0.containsKey("$match")).as("first stage is not a $match stage").isFalse();
            BsonDocument project = render(stages.get(1)).getDocument("$project");
            assertThat(project.keySet()).containsExactlyInAnyOrder("applicationId", "dsl", "context", "createdAt",
                    "createdBy", "modifiedBy", "updatedAt", "id");
            assertThat(project.getObjectId("id").getValue()).isEqualTo(ids[i]);
            assertThat(render(stages.get(2)).getString("$out").getValue()).isEqualTo(TARGET_NAME);
        }
        assertThat(deletedFilters()).containsExactly(idFilter(first), idFilter(second));
        System.out.println("[ArchiveSnapshotTaskTest] below-5 pipeline stage0=" + render((Bson) pipelines.getValue().get(0))
                + " stage2=" + render((Bson) pipelines.getValue().get(2)) + " (two documents -> two $out to " + TARGET_NAME + ")");
    }

    /** Catches a failed aggregate deleting its source (snapshot loss), and aborting the run. */
    @Test
    void archive_below5_failedAggregate_keepsTheSource_andContinuesWithTheNextDocument() {
        serverVersion(VERSION_BELOW_5);
        ObjectId first = new ObjectId();
        ObjectId second = new ObjectId();
        oldDocuments(snapshot(first), snapshot(second));
        org.mockito.Mockito.when(source.aggregate(anyList())).thenThrow(new IllegalStateException("bad stage")).thenReturn(aggregateIterable);

        task.archive();

        verify(source, times(2)).aggregate(anyList());
        assertThat(deletedFilters()).containsExactly(idFilter(second));
        System.out.println("[ArchiveSnapshotTaskTest] below-5 failed aggregate of " + first + " -> only " + second + " deleted");
    }

    /** Catches one failed delete aborting the below-5 run. */
    @Test
    void archive_below5_failedDelete_continuesWithTheNextDocument() {
        serverVersion(VERSION_BELOW_5);
        ObjectId first = new ObjectId();
        ObjectId second = new ObjectId();
        oldDocuments(snapshot(first), snapshot(second));
        doThrow(new IllegalStateException("write concern")).doReturn(null).when(source).deleteOne(any(Bson.class));

        task.archive();

        verify(source, times(2)).aggregate(anyList());
        assertThat(deletedFilters()).containsExactly(idFilter(first), idFilter(second));
        System.out.println("[ArchiveSnapshotTaskTest] below-5 failed delete of " + first + " -> " + second + " still processed");
    }
}
