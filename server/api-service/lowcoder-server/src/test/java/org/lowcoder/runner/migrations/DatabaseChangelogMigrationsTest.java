package org.lowcoder.runner.migrations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Method;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.runner.task.ArchiveSnapshotTask;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.github.cloudyrock.mongock.ChangeSet;
import com.github.cloudyrock.mongock.driver.mongodb.springdata.v4.decorator.impl.MongockTemplate;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

import lombok.extern.slf4j.Slf4j;

/**
 * Drives the data changesets of {@link DatabaseChangelog} against the MongoDB test container.
 *
 * <p>Profile and isolation. The profile is {@code databaseChangelog}, not {@code test}: the class is
 * {@code @Profile("!test")} (DatabaseChangelog:68), so under {@code test} Mongock skips it, while under this profile
 * Mongock runs the whole changelog at startup. {@code TestContainersInitializer} gives this context its own database
 * ({@code lowcoder_test_<n>}); {@code mongockChangeLog}, {@code mongockLock} and every collection used here live in that
 * database, so no other context is reachable. A failing changeset at startup would stop the context from loading, and
 * that is a finding, not something to work around.
 *
 * <p>Each test seeds legacy-shaped documents into the collections the changeset reads and calls the changeset directly
 * with a {@link MongockTemplate} over the context's {@link MongoTemplate}. The collections are emptied before each test.
 * Changeset 032 ({@code normalizeEmailBackfill}) is covered by {@code EmailNormalizationBackfillTest} and
 * {@code EmailBackfillEndToEndTest} and is only checked here as part of the startup record.
 *
 * <p>Re-runs. Mongock records each changeset and runs it once, so a second run of a changeset happens only through a
 * manual re-run; the tests that run a changeset twice describe what such a re-run does, not something the application
 * does by itself.
 *
 * <p>The container is {@code mongo:4.0.28}, so {@code addTimeSeriesSnapshotHistory} takes its {@code < 5} ({@code $out})
 * branch; its {@code >= 5} branch is not reachable here and stays uncovered. {@link ArchiveSnapshotTask} runs once at
 * context start (initialDelay 0) against the same collections; the test waits for the scheduler thread to go idle before it
 * seeds anything. The task's archival itself is tested by ArchiveSnapshotTaskTest and ArchiveSnapshotTaskBelow5Test (L2-11b).
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("databaseChangelog")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Slf4j
public class DatabaseChangelogMigrationsTest {

    private static final String TAG = "[DatabaseChangelogMigrationsTest] ";

    private static final String CHANGE_LOG_COLLECTION = "mongockChangeLog";
    private static final String CHANGE_ID_FIELD = "changeId";
    private static final String MONGOCK_SYSTEM_CHANGE_PREFIX = "system-change-";
    private static final String STATE_FIELD = "state";
    private static final String STATE_EXECUTED = "EXECUTED";

    /** Number of {@code @ChangeSet} methods on DatabaseChangelog (order 001-032, with gaps); update when one is added. */
    private static final int DECLARED_CHANGE_SETS = 29;

    private static final String FOLDER = "folder";
    private static final String USER = "user";
    private static final String APPLICATION = "application";
    private static final String APPLICATION_VERSION = "applicationVersion";
    private static final String APPLICATION_RECORD = "applicationRecord";
    private static final String SNAPSHOT = "applicationHistorySnapshot";
    private static final String SNAPSHOT_TS = "applicationHistorySnapshotTS";

    private static final String EMAIL = "EMAIL";
    private static final String GOOGLE = "GOOGLE";
    private static final String FIRST_VERSION_TAG = "1.0.0";
    private static final int KEEP_DAYS_TOLERANCE_DAYS = 1;
    private static final int MONGO_TIME_SERIES_MAJOR = 5;
    private static final String SCHEDULER_THREAD = "scheduling-1";
    private static final Duration ARCHIVE_WAIT = Duration.ofSeconds(60);

    @Autowired
    private MongoTemplate mongoTemplate;
    @Autowired
    private CommonConfig commonConfig;

    private MongoDatabase db;
    private MongockTemplate mongock;
    private final DatabaseChangelog changelog = new DatabaseChangelog();

    /**
     * The scheduler of the application runs the archive task on its thread {@value #SCHEDULER_THREAD} (the task is
     * scheduled with initialDelay 0 and fires when the context is refreshed, before the Mongock runner and so before
     * the test instance exists). Wait, bounded, until that thread exists and is no longer runnable, i.e. the start-up
     * run has finished. Console capture of the task's completion message was tried and does not work: the message is
     * not in the captured output.
     */
    @BeforeAll
    public void awaitArchiveTaskOfContextStart() throws InterruptedException {
        long deadline = System.nanoTime() + ARCHIVE_WAIT.toNanos();
        while (System.nanoTime() < deadline) {
            Thread scheduler = Thread.getAllStackTraces().keySet().stream()
                    .filter(t -> SCHEDULER_THREAD.equals(t.getName())).findFirst().orElse(null);
            if (scheduler != null && scheduler.getState() != Thread.State.RUNNABLE) {
                return;
            }
            TimeUnit.MILLISECONDS.sleep(50);
        }
        throw new AssertionError("the scheduler thread did not become idle within " + ARCHIVE_WAIT);
    }

    @BeforeEach
    public void emptyTheCollections() {
        db = mongoTemplate.getDb();
        mongock = new MongockTemplate(mongoTemplate);
        db.getCollection(APPLICATION_RECORD).drop();
        for (String name : List.of(FOLDER, USER, APPLICATION, APPLICATION_VERSION, SNAPSHOT, SNAPSHOT_TS)) {
            db.getCollection(name).deleteMany(new Document());
        }
        // 029 built the unique (applicationId, tag) index at startup; a test that dropped the collection gets it back.
        changelog.addTagIndexToRecord(mongock, commonConfig);
    }

    // ---------------------------------------------------------------- start-up run

    @Test
    public void startup_recordsEveryChangeSetAsExecuted() {
        Set<String> declared = new TreeSet<>();
        for (Method method : DatabaseChangelog.class.getDeclaredMethods()) {
            ChangeSet changeSet = method.getAnnotation(ChangeSet.class);
            if (changeSet != null) {
                declared.add(changeSet.id());
            }
        }
        // Mongock also records its own system change (ids "system-change-00001" and "..._before"); only ours are compared.
        List<Document> recorded = db.getCollection(CHANGE_LOG_COLLECTION).find().into(new ArrayList<>()).stream()
                .filter(d -> !d.getString(CHANGE_ID_FIELD).startsWith(MONGOCK_SYSTEM_CHANGE_PREFIX))
                .collect(Collectors.toList());
        Set<String> recordedIds = recorded.stream().map(d -> d.getString(CHANGE_ID_FIELD))
                .collect(Collectors.toCollection(TreeSet::new));
        log.info("{}declared change sets: {}, recorded: {}", TAG, declared.size(), recordedIds.size());

        assertThat(declared).as("change sets declared on DatabaseChangelog").hasSize(DECLARED_CHANGE_SETS);
        assertThat(recordedIds).as("change ids recorded in " + CHANGE_LOG_COLLECTION + " of this context's database")
                .isEqualTo(declared);
        assertThat(recorded).extracting(d -> d.getString(STATE_FIELD)).containsOnly(STATE_EXECUTED);
        assertThat(recordedIds).contains("init-indexes", "normalize-email-backfill");
    }

    // ---------------------------------------------------------------- 024 fill-create-at

    @Test
    public void fillCreateAt_setsCreatedAtOnlyWhereMissing_andIsIdempotent() {
        Date original = new Date(1_600_000_000_000L);
        Instant before = Instant.now();
        ObjectId missing = new ObjectId();
        ObjectId present = new ObjectId();
        db.getCollection(FOLDER).insertMany(List.of(
                new Document("_id", missing).append("gid", uniqueGid()).append("name", "no createdAt"),
                new Document("_id", present).append("gid", uniqueGid()).append("name", "has createdAt")
                        .append("createdAt", original)));

        changelog.fillCreateAt(mongock);

        Document filled = byId(FOLDER, missing);
        Document kept = byId(FOLDER, present);
        log.info("{}fillCreateAt: filled={} kept={}", TAG, filled.get("createdAt"), kept.get("createdAt"));
        assertThat(filled.getDate("createdAt").toInstant()).isBetween(before.minusSeconds(1), Instant.now().plusSeconds(1));
        assertThat(kept.getDate("createdAt")).as("an existing createdAt is not touched").isEqualTo(original);

        Date firstFill = filled.getDate("createdAt");
        changelog.fillCreateAt(mongock);
        assertThat(byId(FOLDER, missing).getDate("createdAt")).as("second run changes nothing").isEqualTo(firstFill);
        assertThat(byId(FOLDER, present).getDate("createdAt")).isEqualTo(original);
        assertThat(db.getCollection(FOLDER).countDocuments()).isEqualTo(2);
    }

    // ---------------------------------------------------------------- 027 populate-email-in-user-connections

    @Test
    public void populateEmailInUserConnections_copiesNameIntoEmailConnectionsThatLackEmail() {
        ObjectId lacking = new ObjectId();
        ObjectId alreadySet = new ObjectId();
        ObjectId mixed = new ObjectId();
        db.getCollection(USER).insertMany(List.of(
                new Document("_id", lacking).append("connections", List.of(
                        connection(EMAIL, "lacking@example.com", null, false),
                        connection(GOOGLE, "google name", null, false))),
                new Document("_id", alreadySet).append("connections", List.of(
                        connection(EMAIL, "name@example.com", "kept@example.com", true))),
                // EMAIL connection with an email next to a GOOGLE one without: selected by the query, changed by nothing
                new Document("_id", mixed).append("connections", List.of(
                        connection(EMAIL, "mixed@example.com", "mixed-email@example.com", true),
                        connection(GOOGLE, "mixed google", null, false)))));

        changelog.populateEmailInUserConnections(mongock, commonConfig);

        List<Document> lackingConnections = connectionsOf(lacking);
        log.info("{}populateEmail: lacking={}", TAG, lackingConnections);
        assertThat(lackingConnections.get(0).getString("email")).isEqualTo("lacking@example.com");
        assertThat(lackingConnections.get(1).containsKey("email")).as("a non-EMAIL connection is left alone").isFalse();
        assertThat(connectionsOf(alreadySet).get(0).getString("email")).isEqualTo("kept@example.com");
        assertThat(connectionsOf(mixed).get(0).getString("email")).isEqualTo("mixed-email@example.com");
        assertThat(connectionsOf(mixed).get(1).containsKey("email")).isFalse();
    }

    /**
     * An EMAIL connection whose {@code email} is stored as an explicit null matches the changeset's query but is skipped
     * by its loop ({@code !connection.containsKey("email")}, DatabaseChangelog:421), so it stays null. Pinned as observed;
     * the changeset runs once per database (Mongock), so this is a property of a manual re-run on such data.
     */
    @Test
    public void populateEmailInUserConnections_anExplicitNullEmailIsNotFilled() {
        ObjectId id = new ObjectId();
        db.getCollection(USER).insertOne(new Document("_id", id).append("connections",
                List.of(connection(EMAIL, "null-email@example.com", null, true))));

        changelog.populateEmailInUserConnections(mongock, commonConfig);

        Document connection = connectionsOf(id).get(0);
        log.info("{}populateEmail explicit null: {}", TAG, connection);
        assertThat(connection.containsKey("email")).isTrue();
        assertThat(connection.get("email")).isNull();
    }

    // ---------------------------------------------------------------- 028 published-to-record, 029

    @Test
    public void publishedToRecord_createsOneVersionRecordPerPublishedApplication() {
        ObjectId published = new ObjectId();
        ObjectId unpublished = new ObjectId();
        Instant before = Instant.now();
        db.getCollection(APPLICATION).insertMany(List.of(
                new Document("_id", published).append("gid", uniqueGid()).append("createdBy", "creator-1")
                        .append("publishedApplicationDSL", new Document("comp", new Document("name", "table1")).append("version", 3)),
                new Document("_id", unpublished).append("gid", uniqueGid()).append("createdBy", "creator-2")
                        .append("editingApplicationDSL", new Document("comp", "only editing"))));

        changelog.publishedToRecord(mongock, commonConfig);

        List<Document> versions = db.getCollection(APPLICATION_VERSION).find().into(new ArrayList<>());
        log.info("{}publishedToRecord: {}", TAG, versions);
        assertThat(versions).hasSize(1);
        Document record = versions.get(0);
        assertThat(record.getString("applicationId")).isEqualTo(published.toHexString());
        assertThat(record.getString("tag")).isEqualTo(FIRST_VERSION_TAG);
        assertThat(record.getString("commitMessage")).isEmpty();
        assertThat(record.getString("createdBy")).isEqualTo("creator-1");
        assertThat(record.getString("modifiedBy")).isEqualTo("creator-1");
        Document dsl = record.get("applicationDSL", Document.class);
        assertThat(dsl.get("comp", Document.class).getString("name")).isEqualTo("table1");
        assertThat(dsl.getInteger("version")).isEqualTo(3);
        assertThat(record.getDate("createdAt").toInstant()).isBetween(before.minusSeconds(1), Instant.now().plusSeconds(1));
        assertThat(record.getDate("updatedAt")).isNotNull();
    }

    /**
     * A second run inserts the same (applicationId, tag) again and the unique index from changeset 029 rejects it, so the
     * changeset is not idempotent. Mongock runs it once per database; only a manual re-run gets here.
     */
    @Test
    public void publishedToRecord_runTwice_failsOnTheUniqueApplicationIdTagIndex() {
        ObjectId id = new ObjectId();
        db.getCollection(APPLICATION).insertOne(new Document("_id", id).append("gid", uniqueGid()).append("createdBy", "c")
                .append("publishedApplicationDSL", new Document("a", 1)));
        changelog.publishedToRecord(mongock, commonConfig);

        assertThatThrownBy(() -> changelog.publishedToRecord(mongock, commonConfig))
                .as("second run").isInstanceOf(DuplicateKeyException.class);
        assertThat(db.getCollection(APPLICATION_VERSION).countDocuments()).isEqualTo(1);
    }

    // ---------------------------------------------------------------- 030 rename

    @Test
    public void renameApplicationRecordCollection_renamesWhenPresent() {
        db.getCollection(APPLICATION_VERSION).drop();
        db.getCollection(APPLICATION_RECORD).insertOne(new Document("applicationId", "app-1").append("tag", "x"));

        changelog.renameApplicationRecordCollection(mongock, db);

        assertThat(collectionNames()).contains(APPLICATION_VERSION).doesNotContain(APPLICATION_RECORD);
        List<Document> moved = db.getCollection(APPLICATION_VERSION).find().into(new ArrayList<>());
        assertThat(moved).extracting(d -> d.getString("applicationId")).containsExactly("app-1");
    }

    @Test
    public void renameApplicationRecordCollection_skipsWhenTheOldCollectionIsAbsent() {
        db.getCollection(APPLICATION_VERSION).insertOne(new Document("applicationId", "stays"));

        changelog.renameApplicationRecordCollection(mongock, db);

        assertThat(collectionNames()).doesNotContain(APPLICATION_RECORD).contains(APPLICATION_VERSION);
        assertThat(db.getCollection(APPLICATION_VERSION).countDocuments()).isEqualTo(1);
    }

    // ---------------------------------------------------------------- 031 delete-old-super-admin

    @Test
    public void deleteOldSuperAdmin_keepsOnlyTheNewestSuperAdmin() {
        ObjectId oldest = new ObjectId();
        ObjectId middle = new ObjectId();
        ObjectId newest = new ObjectId();
        ObjectId ordinary = new ObjectId();
        db.getCollection(USER).insertMany(List.of(
                admin(oldest, 1_000_000L), admin(newest, 3_000_000L), admin(middle, 2_000_000L),
                new Document("_id", ordinary).append("createdAt", new Date(500L)).append("connections", List.of(connection(EMAIL, "ordinary", "o@example.com", true)))));

        changelog.deleteOldSuperAdmin(mongock, db);

        List<ObjectId> remaining = db.getCollection(USER).find().into(new ArrayList<>()).stream()
                .map(d -> d.getObjectId("_id")).collect(Collectors.toList());
        log.info("{}deleteOldSuperAdmin remaining: {}", TAG, remaining);
        assertThat(remaining).containsExactlyInAnyOrder(newest, ordinary);
    }

    @Test
    public void deleteOldSuperAdmin_aSingleSuperAdminStays() {
        ObjectId only = new ObjectId();
        db.getCollection(USER).insertOne(admin(only, 1_000L));

        changelog.deleteOldSuperAdmin(mongock, db);

        assertThat(db.getCollection(USER).countDocuments()).isEqualTo(1);
        assertThat(byId(USER, only)).isNotNull();
    }

    // ---------------------------------------------------------------- 026 time-series snapshot history (MongoDB < 5)

    @Test
    public void addTimeSeriesSnapshotHistory_onMongoBelow5_movesOnlySnapshotsOlderThanTheKeepDuration() {
        assertThat(mongoMajorVersion()).as("the container's MongoDB major version (the < 5 branch is the one that runs)")
                .isLessThan(MONGO_TIME_SERIES_MAJOR);
        Instant oldEnough = Instant.now().minus(commonConfig.getQuery().getAppSnapshotKeepDuration() + KEEP_DAYS_TOLERANCE_DAYS, java.time.temporal.ChronoUnit.DAYS);
        Instant recent = Instant.now().minus(1, java.time.temporal.ChronoUnit.DAYS);
        ObjectId oldOne = new ObjectId();
        ObjectId oldTwo = new ObjectId();
        ObjectId kept = new ObjectId();
        db.getCollection(SNAPSHOT).insertMany(List.of(
                snapshot(oldOne, "app-old-1", oldEnough), snapshot(oldTwo, "app-old-2", oldEnough.minusSeconds(60)),
                snapshot(kept, "app-recent", recent)));

        changelog.addTimeSeriesSnapshotHistory(mongock, commonConfig);

        List<Document> archived = db.getCollection(SNAPSHOT_TS).find().into(new ArrayList<>());
        List<Document> remaining = db.getCollection(SNAPSHOT).find().into(new ArrayList<>());
        log.info("{}archived={} remaining={}", TAG, archived, remaining);
        assertThat(archived).extracting(d -> d.getString("applicationId")).containsExactlyInAnyOrder("app-old-1", "app-old-2");
        assertThat(archived).extracting(d -> d.getObjectId("id")).containsExactlyInAnyOrder(oldOne, oldTwo);
        assertThat(archived.get(0).get("dsl", Document.class).getString("marker")).isEqualTo("dsl-of-" + archived.get(0).getString("applicationId"));
        assertThat(remaining).extracting(d -> d.getObjectId("_id")).containsExactly(kept);
    }

    /**
     * On MongoDB below 5 the changeset moves the old snapshots with {@code $out}, which replaces the target collection:
     * what the time-series collection held before the run is gone afterwards, and a run with nothing to move empties it.
     * Pinned as observed (a manual re-run only: Mongock runs the changeset once per database).
     */
    @Test
    public void addTimeSeriesSnapshotHistory_onMongoBelow5_outReplacesWhatTheTargetHeld() {
        Instant oldEnough = Instant.now().minus(commonConfig.getQuery().getAppSnapshotKeepDuration() + KEEP_DAYS_TOLERANCE_DAYS, java.time.temporal.ChronoUnit.DAYS);
        db.getCollection(SNAPSHOT_TS).insertOne(snapshot(new ObjectId(), "archived-earlier", oldEnough));
        db.getCollection(SNAPSHOT).insertOne(snapshot(new ObjectId(), "moved-now", oldEnough));

        changelog.addTimeSeriesSnapshotHistory(mongock, commonConfig);

        List<String> afterFirst = applicationIds(SNAPSHOT_TS);
        log.info("{}after first run: {}", TAG, afterFirst);
        assertThat(afterFirst).as("the earlier archive row is replaced").containsExactly("moved-now");

        changelog.addTimeSeriesSnapshotHistory(mongock, commonConfig);

        assertThat(applicationIds(SNAPSHOT_TS)).as("a run with nothing to move empties the archive").isEmpty();
    }

    // ---------------------------------------------------------------- helpers of the changelog

    @Test
    public void dropIndexIfExists_dropsAKnownIndex_andIgnoresAnUnknownOne() {
        String field = "probe" + UUID.randomUUID().toString().replace("-", "");
        DatabaseChangelog.ensureIndexes(mongock, org.lowcoder.domain.folder.model.Folder.class, DatabaseChangelog.makeIndex(field));
        MongoCollection<Document> folders = db.getCollection(FOLDER);
        assertThat(indexNames(folders)).contains(field);

        DatabaseChangelog.dropIndexIfExists(mongock, org.lowcoder.domain.folder.model.Folder.class, field);
        assertThat(indexNames(folders)).doesNotContain(field);

        DatabaseChangelog.dropIndexIfExists(mongock, org.lowcoder.domain.folder.model.Folder.class, field);
        assertThat(indexNames(folders)).as("unknown index: the exception is swallowed").doesNotContain(field);
    }

    // ---------------------------------------------------------------- utilities

    private static String uniqueGid() {
        return UUID.randomUUID().toString();
    }

    private Document byId(String collection, ObjectId id) {
        return db.getCollection(collection).find(new Document("_id", id)).first();
    }

    private List<Document> connectionsOf(ObjectId userId) {
        return byId(USER, userId).getList("connections", Document.class);
    }

    private static Document connection(String authId, String name, String email, boolean withEmailKey) {
        Document connection = new Document("authId", authId).append("name", name)
                .append("source", authId).append("rawId", UUID.randomUUID().toString());
        if (withEmailKey) {
            connection.append("email", email);
        }
        return connection;
    }

    private static Document admin(ObjectId id, long createdAtMillis) {
        return new Document("_id", id).append("superAdmin", true).append("createdAt", new Date(createdAtMillis))
                .append("connections", List.of(connection(EMAIL, "admin-" + id, "admin@example.com", true)));
    }

    private static Document snapshot(ObjectId id, String applicationId, Instant createdAt) {
        return new Document("_id", id).append("applicationId", applicationId)
                .append("dsl", new Document("marker", "dsl-of-" + applicationId))
                .append("context", new Document("ctx", 1)).append("createdAt", Date.from(createdAt))
                .append("createdBy", "u").append("modifiedBy", "u").append("updatedAt", Date.from(createdAt));
    }

    private List<String> applicationIds(String collection) {
        return db.getCollection(collection).find().into(new ArrayList<>()).stream()
                .map(d -> d.getString("applicationId")).collect(Collectors.toList());
    }

    private List<String> collectionNames() {
        return db.listCollectionNames().into(new ArrayList<>());
    }

    private static List<String> indexNames(MongoCollection<Document> collection) {
        return collection.listIndexes().into(new ArrayList<>()).stream().map(d -> d.getString("name")).collect(Collectors.toList());
    }

    private int mongoMajorVersion() {
        Document buildInfo = db.runCommand(new Document("buildInfo", 1));
        return Integer.parseInt(buildInfo.getString("version").split("\\.")[0]);
    }
}
