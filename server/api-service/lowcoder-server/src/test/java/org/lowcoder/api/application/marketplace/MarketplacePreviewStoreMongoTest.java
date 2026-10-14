package org.lowcoder.api.application.marketplace;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoClients;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.common.TestContainers;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.index.IndexField;
import org.springframework.data.mongodb.core.index.IndexInfo;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Pins {@link MarketplacePreviewStore} against the module's MongoDB test container ({@link TestContainers#mongoUri}), so
 * the default build runs the store; upstream's {@code MarketplacePreviewMongoTest} runs only with
 * {@code LOWCODER_PREVIEW_TEST_MONGO_URI} set. Each test gets a database of its own, dropped afterwards.
 *
 * <p>Framework behaviour relied on, which an upgrade could change: MongoDB stores a date to the millisecond, so the
 * time windows of {@link #failReschedulesOrGivesUp} truncate their lower bound to milliseconds; Mockito's inline spy of
 * {@link ReactiveMongoTemplate} in {@link #desireAbsorbsALostInsertRace}.
 *
 * <p>Limits: the insert race that {@code desire} absorbs ({@code DuplicateKeyException}) cannot be provoked
 * deterministically against a real MongoDB, so {@link #desireAbsorbsALostInsertRace} simulates it with a spied
 * template whose {@code upsert} answers the exception; the race itself is not raced. Concurrent claims are upstream's
 * skipped test's subject, not this class's.
 */
class MarketplacePreviewStoreMongoTest {

    private static final String LOG_PREFIX = "[MarketplacePreviewStoreMongoTest] ";
    private static final String DATABASE_PREFIX = "marketplace_preview_store_";
    private static final String APP_ID = "app";
    private static final String OTHER_APP_ID = "other-app";
    private static final String HASH_V1 = "v1";
    private static final String HASH_V2 = "v2";
    private static final String HASH_V3 = "v3";
    private static final String STALE_LEASE_TOKEN = "stale-lease-token";
    private static final byte[] IMAGE = {1, 2, 3};
    private static final byte[] STALE_IMAGE = {9};

    /** The statuses and limits {@code MarketplacePreviewStore.java:55-80} writes as literals. */
    private static final String STATUS_PENDING = "pending";
    private static final String STATUS_READY = "ready";
    private static final String STATUS_FAILED = "failed";
    private static final int MAX_ATTEMPTS = 3;
    private static final long LEASE_SECONDS = 180;
    private static final long BUSY_DELAY_SECONDS = 10;
    private static final long RETRY_DELAY_SECONDS = 60;
    private static final long AN_HOUR_SECONDS = 3600;

    private static final String STATUS_FIELD = "status";
    private static final String NEXT_ATTEMPT_AT_FIELD = "nextAttemptAt";
    private static final String LEASE_UNTIL_FIELD = "leaseUntil";
    private static final String ATTEMPTS_FIELD = "attempts";
    private static final String IMAGE_FIELD = "image";
    private static final List<String> CLAIM_INDEX_KEYS = List.of(STATUS_FIELD, NEXT_ATTEMPT_AT_FIELD);

    private MongoClient client;
    private ReactiveMongoTemplate mongo;
    private MarketplacePreviewStore store;

    @BeforeEach
    void setUp() {
        String database = DATABASE_PREFIX + UUID.randomUUID().toString().replace("-", "");
        client = MongoClients.create(TestContainers.mongoUri(database));
        mongo = new ReactiveMongoTemplate(client, database);
        store = new MarketplacePreviewStore(mongo);
        System.out.println(LOG_PREFIX + "database " + database);
    }

    @AfterEach
    void tearDown() {
        try {
            mongo.getMongoDatabase().flatMap(database -> Mono.from(database.drop())).block();
        } finally {
            client.close();
        }
    }

    @Test
    void ensureIndexCreatesTheClaimIndex() {
        store.ensureIndex().block();

        List<IndexInfo> indexes = mongo.indexOps(MarketplacePreview.class).getIndexInfo().collectList().block();
        System.out.println(LOG_PREFIX + "indexes " + indexes);
        IndexInfo claimIndex = indexes.stream()
                .filter(index -> index.getIndexFields().stream().map(IndexField::getKey).toList().equals(CLAIM_INDEX_KEYS))
                .findFirst().orElseThrow(() -> new AssertionError("no index on " + CLAIM_INDEX_KEYS + " in " + indexes));
        assertThat(claimIndex.getIndexFields()).extracting(IndexField::getDirection)
                .containsExactly(Sort.Direction.ASC, Sort.Direction.ASC);
    }

    @Test
    void desireInsertsAPendingJob() {
        store.desire(APP_ID, HASH_V1).block();

        MarketplacePreview job = read(APP_ID);
        assertThat(job.getDesiredHash()).isEqualTo(HASH_V1);
        assertThat(job.getStatus()).isEqualTo(STATUS_PENDING);
        assertThat(job.getAttempts()).isZero();
        assertThat(job.getNextAttemptAt()).isEqualTo(Instant.EPOCH);
        assertThat(job.getLeaseUntil()).isEqualTo(Instant.EPOCH);
        assertThat(job.getLeaseToken()).isNull();
        assertThat(job.getRenderedHash()).isNull();
        assertThat(job.getImage()).isNull();
    }

    @Test
    void desireOfTheSameHashKeepsTheJob() {
        store.desire(APP_ID, HASH_V1).block();
        store.complete(claim(now()), IMAGE).block();
        assertThat(read(APP_ID).getStatus()).isEqualTo(STATUS_READY);

        store.desire(APP_ID, HASH_V1).block();

        MarketplacePreview job = read(APP_ID);
        assertThat(job.getStatus()).isEqualTo(STATUS_READY);
        assertThat(job.getImage()).isEqualTo(IMAGE);
        assertThat(job.getRenderedHash()).isEqualTo(HASH_V1);
        assertThat(job.getAttempts()).isEqualTo(1);
    }

    @Test
    void desireOfANewHashRequeuesTheJobAndKeepsTheImage() {
        store.desire(APP_ID, HASH_V1).block();
        store.complete(claim(now()), IMAGE).block();
        store.desire(APP_ID, HASH_V2).block();
        MarketplacePreview leased = claim(now());
        assertThat(leased.getLeaseToken()).isNotNull();

        store.desire(APP_ID, HASH_V3).block();

        MarketplacePreview job = read(APP_ID);
        assertThat(job.getDesiredHash()).isEqualTo(HASH_V3);
        assertThat(job.getStatus()).isEqualTo(STATUS_PENDING);
        assertThat(job.getAttempts()).isZero();
        assertThat(job.getNextAttemptAt()).isEqualTo(Instant.EPOCH);
        assertThat(job.getLeaseUntil()).isEqualTo(Instant.EPOCH);
        assertThat(job.getLeaseToken()).isNull();
        assertThat(job.getImage()).isEqualTo(IMAGE);
        assertThat(job.getRenderedHash()).isEqualTo(HASH_V1);
    }

    @Test
    void desireAbsorbsALostInsertRace() {
        ReactiveMongoTemplate racing = spy(mongo);
        doReturn(Mono.error(new DuplicateKeyException("another desire inserted " + APP_ID + " first")))
                .when(racing).upsert(any(Query.class), any(Update.class), eq(MarketplacePreview.class));

        StepVerifier.create(new MarketplacePreviewStore(racing).desire(APP_ID, HASH_V1)).verifyComplete();

        verify(racing, times(1)).upsert(any(Query.class), any(Update.class), eq(MarketplacePreview.class));
        MarketplacePreview job = store.read(APP_ID).block();
        System.out.println(LOG_PREFIX + "after the lost race " + describe(job));
        assertThat(job).isNull();
    }

    @Test
    void claimLeasesTheOldestDueJob() {
        Instant now = now();
        store.desire(APP_ID, HASH_V1).block();
        set(APP_ID, NEXT_ATTEMPT_AT_FIELD, Instant.EPOCH.plusSeconds(RETRY_DELAY_SECONDS));
        store.desire(OTHER_APP_ID, HASH_V1).block();
        set(OTHER_APP_ID, IMAGE_FIELD, IMAGE);

        MarketplacePreview first = claim(now);
        assertThat(first.getId()).isEqualTo(OTHER_APP_ID);
        assertThat(first.getLeaseToken()).isNotNull();
        assertThat(first.getLeaseUntil()).isEqualTo(now.plusSeconds(LEASE_SECONDS));
        assertThat(first.getAttempts()).isEqualTo(1);
        assertThat(first.getImage()).as("the claim excludes the stored image").isNull();
        assertThat(read(OTHER_APP_ID).getImage()).isEqualTo(IMAGE);

        MarketplacePreview second = claim(now);
        assertThat(second.getId()).isEqualTo(APP_ID);
        assertThat(second.getLeaseToken()).isNotEqualTo(first.getLeaseToken());

        assertThat(claim(now)).isNull();
    }

    @Test
    void claimSkipsAJobWithoutAttemptsLeftOrNotYetDue() {
        Instant now = now();
        String exhausted = "exhausted";
        String notYetDue = "not-yet-due";
        String leased = "leased";
        String due = "due";
        store.desire(exhausted, HASH_V1).block();
        set(exhausted, ATTEMPTS_FIELD, MAX_ATTEMPTS);
        store.desire(notYetDue, HASH_V1).block();
        set(notYetDue, NEXT_ATTEMPT_AT_FIELD, now.plusSeconds(AN_HOUR_SECONDS));
        store.desire(leased, HASH_V1).block();
        set(leased, LEASE_UNTIL_FIELD, now.plusSeconds(AN_HOUR_SECONDS));

        assertThat(claim(now)).isNull();

        store.desire(due, HASH_V1).block();
        assertThat(claim(now).getId()).isEqualTo(due);
    }

    @Test
    void completeIgnoresAStaleLease() {
        store.desire(APP_ID, HASH_V1).block();
        MarketplacePreview job = claim(now());
        MarketplacePreview stale = withLeaseToken(job, STALE_LEASE_TOKEN);

        store.complete(stale, STALE_IMAGE).block();

        MarketplacePreview unchanged = read(APP_ID);
        assertThat(unchanged.getStatus()).isEqualTo(STATUS_PENDING);
        assertThat(unchanged.getImage()).isNull();
        assertThat(unchanged.getLeaseToken()).isEqualTo(job.getLeaseToken());

        store.complete(job, IMAGE).block();

        MarketplacePreview completed = read(APP_ID);
        assertThat(completed.getStatus()).isEqualTo(STATUS_READY);
        assertThat(completed.getImage()).isEqualTo(IMAGE);
        assertThat(completed.getRenderedHash()).isEqualTo(HASH_V1);
        assertThat(completed.getLeaseToken()).isNull();
        assertThat(completed.getLeaseUntil()).isEqualTo(Instant.EPOCH);
    }

    /** One {@code fail} call: the attempts stored before the claim, whether the renderer was busy, and the outcome. */
    record FailCase(String name, int attemptsBeforeClaim, boolean busy, String expectedStatus, int expectedAttempts,
                    long expectedDelaySeconds) {
        @Override
        public String toString() {
            return name;
        }
    }

    static Stream<FailCase> failCases() {
        return Stream.of(
                new FailCase("not busy after attempt 1", 0, false, STATUS_PENDING, 1, RETRY_DELAY_SECONDS),
                new FailCase("not busy after attempt 3", MAX_ATTEMPTS - 1, false, STATUS_FAILED, MAX_ATTEMPTS,
                        RETRY_DELAY_SECONDS * MAX_ATTEMPTS * MAX_ATTEMPTS),
                new FailCase("busy after attempt 1", 0, true, STATUS_PENDING, 0, BUSY_DELAY_SECONDS),
                new FailCase("busy after attempt 3", MAX_ATTEMPTS - 1, true, STATUS_PENDING, MAX_ATTEMPTS - 1,
                        BUSY_DELAY_SECONDS));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("failCases")
    void failReschedulesOrGivesUp(FailCase failCase) {
        store.desire(APP_ID, HASH_V1).block();
        set(APP_ID, ATTEMPTS_FIELD, failCase.attemptsBeforeClaim());
        MarketplacePreview job = claim(now());

        Instant before = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        store.fail(job, failCase.busy()).block();
        Instant after = Instant.now();

        MarketplacePreview failed = read(APP_ID);
        Instant earliest = before.plusSeconds(failCase.expectedDelaySeconds());
        Instant latest = after.plusSeconds(failCase.expectedDelaySeconds());
        System.out.println(LOG_PREFIX + failCase + ": next attempt expected in [" + earliest + ", " + latest + "]");
        assertThat(failed.getStatus()).isEqualTo(failCase.expectedStatus());
        assertThat(failed.getAttempts()).isEqualTo(failCase.expectedAttempts());
        assertThat(failed.getNextAttemptAt()).isBetween(earliest, latest);
        assertThat(failed.getLeaseToken()).isNull();
        assertThat(failed.getLeaseUntil()).isEqualTo(Instant.EPOCH);
    }

    @Test
    void discardRemovesOnlyAnOwnedJob() {
        store.desire(APP_ID, HASH_V1).block();
        MarketplacePreview job = claim(now());

        store.discard(withLeaseToken(job, STALE_LEASE_TOKEN)).block();
        assertThat(read(APP_ID).getLeaseToken()).isEqualTo(job.getLeaseToken());

        store.discard(job).block();
        MarketplacePreview discarded = store.read(APP_ID).block();
        System.out.println(LOG_PREFIX + "after the owned discard " + describe(discarded));
        assertThat(discarded).isNull();
    }

    /** Now, to the millisecond MongoDB keeps, so a date written from it reads back equal. */
    private static Instant now() {
        return Instant.now().truncatedTo(ChronoUnit.MILLIS);
    }

    private MarketplacePreview claim(Instant now) {
        MarketplacePreview job = store.claim(now).block();
        System.out.println(LOG_PREFIX + "claimed at " + now + ": " + describe(job));
        return job;
    }

    private MarketplacePreview read(String id) {
        MarketplacePreview job = store.read(id).block();
        System.out.println(LOG_PREFIX + "read " + id + ": " + describe(job));
        assertThat(job).as("job " + id).isNotNull();
        return job;
    }

    private void set(String id, String field, Object value) {
        mongo.updateFirst(Query.query(Criteria.where("_id").is(id)), new Update().set(field, value), MarketplacePreview.class)
                .block();
    }

    private static MarketplacePreview withLeaseToken(MarketplacePreview job, String leaseToken) {
        MarketplacePreview copy = new MarketplacePreview();
        copy.setId(job.getId());
        copy.setDesiredHash(job.getDesiredHash());
        copy.setAttempts(job.getAttempts());
        copy.setLeaseToken(leaseToken);
        return copy;
    }

    private static String describe(MarketplacePreview job) {
        if (job == null) return "none";
        return "{id=" + job.getId() + ", desiredHash=" + job.getDesiredHash() + ", renderedHash=" + job.getRenderedHash()
                + ", status=" + job.getStatus() + ", attempts=" + job.getAttempts() + ", nextAttemptAt=" + job.getNextAttemptAt()
                + ", leaseUntil=" + job.getLeaseUntil() + ", leaseToken=" + job.getLeaseToken()
                + ", image=" + (job.getImage() == null ? "none" : job.getImage().length + " bytes") + "}";
    }
}
