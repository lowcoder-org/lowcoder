package org.lowcoder.runner.task;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.sdk.config.CommonConfig;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.mongodb.client.MongoDatabase;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import lombok.extern.slf4j.Slf4j;

/**
 * {@link ArchiveSnapshotTask} against a real MongoDB below 5 (the test container {@code mongo:4.0.28}), where the archive
 * collection is a regular collection.
 *
 * <p>Profile {@code archiveSnapshotBelow5}: a context and database ({@code lowcoder_test_<n>}) of its own. The task is
 * scheduled with initialDelay 0 and fires once at context start (thread {@value #SCHEDULER_THREAD}); the class waits,
 * bounded, for that thread to be idle before it seeds anything, and then calls {@code archive()} itself, so the test
 * decides when the task runs. The daily re-run is a day away and cannot fire during a test.
 *
 * <p>BF-065 (formerly pinned under D-6, plan §9 row "ArchiveSnapshotTask's pipeline for MongoDB < 5": the server rejected
 * the per-document aggregate and nothing was archived): see {@link #threeOldSnapshotsAreArchivedBF065}.
 *
 * <p>Not covered: a MongoDB 5 or later with its time-series archive (the container is 4.x; the task runs the same inserts
 * there), failed inserts, failed deletes and cursor failures (covered with mocks by {@code ArchiveSnapshotTaskTest}; a real
 * server cannot be made to fail them here).
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("archiveSnapshotBelow5")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Slf4j
public class ArchiveSnapshotTaskBelow5Test {

    private static final String TAG = "[ArchiveSnapshotTaskBelow5Test] ";
    private static final String SNAPSHOT = "applicationHistorySnapshot";
    private static final String SNAPSHOT_TS = "applicationHistorySnapshotTS";
    private static final String SCHEDULER_THREAD = "scheduling-1";
    private static final Duration SCHEDULER_WAIT = Duration.ofSeconds(60);
    private static final int TIME_SERIES_MAJOR = 5;
    private static final long OLD_EXTRA_DAYS = 1;
    private static final String FAILED = "Failed";
    private static final String TO_ARCHIVE = "Total documents to archive: ";
    private static final String PROCESSED = "Processed document";
    private static final String COMPLETED = "Archival process completed. Total documents archived: ";

    @Autowired
    private ArchiveSnapshotTask task;
    @Autowired
    private MongoTemplate mongoTemplate;
    @Autowired
    private CommonConfig commonConfig;

    private MongoDatabase db;
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();
    private Logger taskLogger;

    @BeforeAll
    public void awaitSchedulerOfContextStart() throws InterruptedException {
        long deadline = System.nanoTime() + SCHEDULER_WAIT.toNanos();
        while (System.nanoTime() < deadline) {
            Thread scheduler = Thread.getAllStackTraces().keySet().stream()
                    .filter(t -> SCHEDULER_THREAD.equals(t.getName())).findFirst().orElse(null);
            if (scheduler != null && scheduler.getState() != Thread.State.RUNNABLE) {
                return;
            }
            TimeUnit.MILLISECONDS.sleep(50);
        }
        throw new AssertionError("the scheduler thread did not become idle within " + SCHEDULER_WAIT);
    }

    @BeforeEach
    public void setUp() {
        db = mongoTemplate.getDb();
        db.getCollection(SNAPSHOT).deleteMany(new Document());
        db.getCollection(SNAPSHOT_TS).deleteMany(new Document());
        taskLogger = (Logger) LoggerFactory.getLogger(ArchiveSnapshotTask.class);
        taskLogger.setLevel(Level.INFO);
        logs.list.clear();
        logs.start();
        taskLogger.addAppender(logs);
    }

    @AfterEach
    public void tearDown() {
        taskLogger.detachAppender(logs);
        logs.stop();
    }

    private Instant old() {
        return Instant.now().minus(commonConfig.getQuery().getAppSnapshotKeepDuration() + OLD_EXTRA_DAYS, ChronoUnit.DAYS);
    }

    private static Document snapshot(ObjectId id, String applicationId, Instant createdAt) {
        return new Document("_id", id).append("applicationId", applicationId)
                .append("dsl", new Document("marker", "dsl-of-" + applicationId))
                .append("context", new Document("ctx", 1)).append("createdAt", Date.from(createdAt))
                .append("createdBy", "u").append("modifiedBy", "u").append("updatedAt", Date.from(createdAt));
    }

    private List<String> messages() {
        synchronized (logs.list) {
            return logs.list.stream().map(ILoggingEvent::getFormattedMessage).collect(Collectors.toList());
        }
    }

    private List<String> applicationIds(String collection) {
        return db.getCollection(collection).find().into(new ArrayList<>()).stream()
                .map(d -> d.getString("applicationId")).collect(Collectors.toList());
    }

    private void assertBelow5() {
        Document buildInfo = db.runCommand(new Document("buildInfo", 1));
        int major = Integer.parseInt(buildInfo.getString("version").split("\\.")[0]);
        assertThat(major).as("MongoDB major version of the container (below 5: the archive is a regular collection)")
                .isLessThan(TIME_SERIES_MAJOR);
    }

    /**
     * BF-065 (formerly pinned as plan §9 row "ArchiveSnapshotTask's pipeline for MongoDB < 5": mongo:4.0.28 rejected the
     * per-document aggregate, each old snapshot failed and stayed, and nothing was archived): the three old snapshots are
     * inserted into the archive, with their {@code _id} as the field {@code id} and their content unchanged, and deleted
     * from the snapshot collection. The recent snapshot is not selected.
     */
    @Test
    public void threeOldSnapshotsAreArchivedBF065() {
        assertBelow5();
        ObjectId a = new ObjectId();
        ObjectId b = new ObjectId();
        ObjectId c = new ObjectId();
        ObjectId recent = new ObjectId();
        Document oldA = snapshot(a, "app-a", old());
        db.getCollection(SNAPSHOT).insertMany(List.of(
                oldA, snapshot(b, "app-b", old().minusSeconds(60)), snapshot(c, "app-c", old().minusSeconds(120)),
                snapshot(recent, "app-recent", Instant.now().minus(1, ChronoUnit.DAYS))));
        Document expectedA = new Document(oldA);

        task.archive();

        List<String> source = applicationIds(SNAPSHOT);
        List<String> target = applicationIds(SNAPSHOT_TS);
        Document archivedA = db.getCollection(SNAPSHOT_TS).find(new Document("id", a)).first();
        log.info("{}source={} target={} archived app-a={} log={}", TAG, source, target, archivedA, messages());
        assertThat(messages()).contains(TO_ARCHIVE + 3, COMPLETED + 3);
        assertThat(messages().stream().filter(m -> m.startsWith(PROCESSED))).hasSize(3);
        assertThat(messages().stream().filter(m -> m.startsWith(FAILED))).isEmpty();
        assertThat(source).as("only the recent snapshot stays").containsExactly("app-recent");
        assertThat(target).as("the old ones are archived").containsExactlyInAnyOrder("app-a", "app-b", "app-c");
        expectedA.remove("_id");
        archivedA.remove("_id");
        expectedA.put("id", a);
        assertThat(archivedA).as("content kept, _id kept as id").isEqualTo(expectedA);
    }

    @Test
    public void theRecentSnapshotStaysUnchanged() {
        assertBelow5();
        ObjectId recent = new ObjectId();
        Document recentDoc = snapshot(recent, "app-recent", Instant.now().minus(1, ChronoUnit.DAYS));
        db.getCollection(SNAPSHOT).insertMany(List.of(recentDoc, snapshot(new ObjectId(), "app-old", old())));

        task.archive();

        Document after = db.getCollection(SNAPSHOT).find(new Document("_id", recent)).first();
        assertThat(after).isEqualTo(recentDoc);
        assertThat(applicationIds(SNAPSHOT_TS)).containsExactly("app-old");
    }

    /**
     * The trap of BF-065: {@code $out} would replace the whole archive on each call. With inserts, a row archived earlier
     * stays and the new ones are added next to it, also on a second run.
     */
    @Test
    public void aRowAlreadyInTheTarget_isKept_andTheNewOnesAreAdded() {
        assertBelow5();
        db.getCollection(SNAPSHOT_TS).insertOne(snapshot(new ObjectId(), "archived-earlier", old()));
        db.getCollection(SNAPSHOT).insertMany(List.of(snapshot(new ObjectId(), "app-1", old()), snapshot(new ObjectId(), "app-2", old())));

        task.archive();
        db.getCollection(SNAPSHOT).insertOne(snapshot(new ObjectId(), "app-3", old()));
        task.archive();

        assertThat(applicationIds(SNAPSHOT_TS)).containsExactlyInAnyOrder("archived-earlier", "app-1", "app-2", "app-3");
        assertThat(applicationIds(SNAPSHOT)).isEmpty();
    }

    @Test
    public void emptySource_writesNothing() {
        assertBelow5();
        db.getCollection(SNAPSHOT_TS).insertOne(snapshot(new ObjectId(), "archived-earlier", old()));
        db.getCollection(SNAPSHOT).insertOne(snapshot(new ObjectId(), "app-recent", Instant.now().minus(1, ChronoUnit.DAYS)));

        task.archive();

        assertThat(messages()).contains(TO_ARCHIVE + 0, COMPLETED + 0);
        assertThat(messages().stream().filter(m -> m.startsWith(FAILED))).isEmpty();
        assertThat(applicationIds(SNAPSHOT_TS)).containsExactly("archived-earlier");
        assertThat(applicationIds(SNAPSHOT)).containsExactly("app-recent");
    }
}
