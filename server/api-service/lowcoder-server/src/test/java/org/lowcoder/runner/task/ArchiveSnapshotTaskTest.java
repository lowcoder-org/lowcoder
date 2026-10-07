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
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.sdk.config.CommonConfig;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.mongodb.MongoClientSettings;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;

/**
 * Direct tests of {@link ArchiveSnapshotTask#archive()} with mocked driver types: the age threshold and every success and
 * failure arm of the copy. {@code archive()} is {@code @Scheduled(initialDelay = 0)}, so it runs once at each Spring
 * context start, racing the test that started it (plan §2.3); calling it here makes its coverage deterministic.
 *
 * <p>What a mock can and cannot show: that the task no longer asks the server's version and always copies with inserts
 * (BF-065) is asserted here; that a real MongoDB below 5 accepts those inserts and keeps what was archived before is
 * shown against mongo:4.0.28 by {@code ArchiveSnapshotTaskBelow5Test}.
 */
@ExtendWith(MockitoExtension.class)
class ArchiveSnapshotTaskTest {

    private static final String SOURCE_NAME = "applicationHistorySnapshot";
    private static final String TARGET_NAME = "applicationHistorySnapshotTS";
    private static final long WINDOW_MILLIS = 60_000L;

    @Mock private MongoTemplate mongoTemplate;
    @Mock private MongoDatabase database;
    @Mock private MongoCollection<Document> source;
    @Mock private MongoCollection<Document> target;
    @Mock private FindIterable<Document> findIterable;
    @Mock private MongoCursor<Document> cursor;

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
    }

    // ---------------------------------------------------------------- helpers

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

    // ---------------------------------------------------------------- one path

    /**
     * BF-065 (formerly pinned as plan §9 row "ArchiveSnapshotTask's pipeline for MongoDB &lt; 5": below 5 the code handed
     * the driver a per-document aggregate whose first element was the filter {@code {_id: id}}, not a stage, ending in
     * {@code $out}): the task no longer asks the server's version, and every snapshot is copied with an insert, never
     * with an aggregate.
     */
    @Test
    void archive_copiesWithInsertsWithoutAskingTheServerVersionBF065() {
        oldDocuments(snapshot(new ObjectId()), snapshot(new ObjectId()));

        task.archive();

        verify(target, times(2)).insertOne(any(Document.class));
        verify(source, never()).aggregate(anyList());
        verify(database, never()).runCommand(any(Bson.class));
        assertThat(deletedFilters()).hasSize(2);
        System.out.println("[ArchiveSnapshotTaskTest] two old snapshots -> two inserts, no aggregate, no buildInfo");
    }

    /** Catches fresh snapshots being archived: the task selects {@code createdAt <= now - keepDuration days}. */
    @ParameterizedTest(name = "keep {0} days")
    @ValueSource(longs = {30, 7})
    void archive_selectsDocumentsOlderThanTheKeepDuration(long keepDays) {
        commonConfig.getQuery().setAppSnapshotKeepDuration(keepDays);
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
        System.out.println("[ArchiveSnapshotTaskTest] keep=" + keepDays + " filter " + render(findFilter.getValue()));
    }

    /** Catches a scan when nothing is old enough: no write of any kind. */
    @Test
    void archive_noOldDocuments_touchesNothing() {
        oldDocuments();

        task.archive();

        verify(target, never()).insertOne(any(Document.class));
        verify(source, never()).aggregate(anyList());
        verify(source, never()).deleteOne(any(Bson.class));
        verify(cursor).close();
        System.out.println("[ArchiveSnapshotTaskTest] nothing old -> no insert, aggregate or delete");
    }

    // ---------------------------------------------------------------- copy

    /** Catches a snapshot losing its id, or being deleted before it was copied. */
    @Test
    void archive_copiesTheDocumentWithIdRenamed_thenDeletesTheSource() {
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
        System.out.println("[ArchiveSnapshotTaskTest] events " + events + ", copy has id " + inserted.get(0).get("id") + " and no _id");
    }

    /** Catches snapshot loss on a failed copy: the source of a failed insert stays, the next document is archived. */
    @Test
    void archive_failedInsert_keepsTheSource_andContinuesWithTheNextDocument() {
        ObjectId first = new ObjectId();
        ObjectId second = new ObjectId();
        oldDocuments(snapshot(first), snapshot(second));
        doThrow(new IllegalStateException("duplicate key")).doReturn(null).when(target).insertOne(any(Document.class));

        task.archive();

        verify(target, times(2)).insertOne(any(Document.class));
        assertThat(deletedFilters()).containsExactly(idFilter(second));
        System.out.println("[ArchiveSnapshotTaskTest] failed insert of " + first + " -> only " + second + " deleted");
    }

    /** Catches one failed delete aborting the whole run: the next document is still copied and deleted. */
    @Test
    void archive_failedDelete_continuesWithTheNextDocument() {
        ObjectId first = new ObjectId();
        ObjectId second = new ObjectId();
        oldDocuments(snapshot(first), snapshot(second));
        doThrow(new IllegalStateException("write concern")).doReturn(null).when(source).deleteOne(any(Bson.class));

        task.archive();

        verify(target, times(2)).insertOne(any(Document.class));
        assertThat(deletedFilters()).containsExactly(idFilter(first), idFilter(second));
        System.out.println("[ArchiveSnapshotTaskTest] failed delete of " + first + " -> " + second + " still processed");
    }

    /** Catches a cursor failure escaping the scheduled method, or a leaked cursor. */
    @Test
    void archive_cursorFailure_isSwallowed_andTheCursorIsClosed() {
        org.mockito.Mockito.when(cursor.hasNext()).thenThrow(new IllegalStateException("cursor lost"));

        task.archive();

        verify(cursor).close();
        verify(source, never()).deleteOne(any(Bson.class));
        System.out.println("[ArchiveSnapshotTaskTest] cursor failure swallowed, cursor closed");
    }
}
