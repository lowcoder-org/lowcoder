package org.lowcoder.runner.migrations;

import java.time.Duration;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.bson.Document;
import org.bson.conversions.Bson;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import com.mongodb.ErrorCategory;
import com.mongodb.MongoException;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.FindOneAndUpdateOptions;
import com.mongodb.client.model.ReturnDocument;
import com.mongodb.client.result.UpdateResult;

import lombok.extern.slf4j.Slf4j;

/**
 * Keeps two instances from running change sets at the same time: a lease that is renewed while it is held and fenced
 * before every change set and every history write.
 *
 * <p>Why a renewed lease: a change set has no time limit ({@code addSuperAdminUser}, change set 020, waits for its job without
 * one), so a lock with a fixed expiry would run out inside such a change set and let a second instance start.
 *
 * <p>Document. One document, {@value #LOCK_ID}, in {@value #COLLECTION} (not Mongock's {@code mongockLock}, whose
 * format this code does not rely on): {@code owner} (random per acquisition), {@code generation} (raised by one at every
 * acquisition) and {@code expiresAt}. Every time comes from the database server ({@code $$NOW}), so the clocks of the
 * instances do not matter.
 *
 * <p>Acquire: one find-and-modify that takes the document when it is new or its {@code expiresAt} is past, and leaves it
 * alone otherwise (see {@link #tryAcquire}); a duplicate-key error from two first acquisitions at once means the other
 * instance won. {@link #acquire()} polls until it succeeds or the maximum wait
 * passes. Renew: a background thread renews every {@link MigrationLockSettings#renewalEvery()} with an update that
 * matches {@code _id}, {@code owner} and {@code generation}. Fence: {@link Held#confirm()} runs the same update. Lost:
 * the update matches nothing (another instance took the lock over), or no renewal succeeded before the lease ran out
 * (errors are retried until then); {@link Held#confirm()} then throws {@link MigrationLockLostException} for good.
 * Release: {@link Held#close()} deletes the document with the same filter.
 *
 * <p>Limits. The fence guards the history writes and the start of each change set. It cannot stop what a change set
 * body writes after its instance lost the lock, for example when the whole process stalled for longer than the lease.
 * The lock does not exclude Mongock (the build before the replacement), which locks {@code mongockLock}: the two
 * builds must not start on one database at the same time.
 */
@Slf4j
@Component
@Profile("!test")
public class MigrationLock {

    static final String COLLECTION = "lowcoderMigrationLock";
    static final String LOCK_ID = "migrations";
    static final String ID = "_id";
    static final String OWNER = "owner";
    static final String GENERATION = "generation";
    static final String EXPIRES_AT = "expiresAt";

    private static final String NOW = "$$NOW";
    private static final String HEARTBEAT_THREAD = "migration-lock-heartbeat";
    private static final long RETRY_PAUSE_MILLIS = 500;
    private static final long HEARTBEAT_STOP_SECONDS = 5;

    private final MongoTemplate mongoTemplate;
    private final MigrationLockSettings settings;

    @Autowired
    public MigrationLock(MongoTemplate mongoTemplate,
            @Value("${lowcoder.migration-lock.lease:PT60S}") Duration lease,
            @Value("${lowcoder.migration-lock.max-wait:PT10M}") Duration maxWait) {
        this(mongoTemplate, MigrationLockSettings.of(lease, maxWait));
    }

    public MigrationLock(MongoTemplate mongoTemplate, MigrationLockSettings settings) {
        this.mongoTemplate = mongoTemplate;
        this.settings = settings;
    }

    /**
     * Waits for the lock, at most {@link MigrationLockSettings#maxWait()}, and starts renewing it.
     *
     * @throws MigrationLockTimeoutException another instance held the lock for the whole wait
     * @throws MigrationLockException        the database failed in a way other than a held lock
     */
    public Held acquire() {
        String owner = UUID.randomUUID().toString();
        long giveUpAt = System.nanoTime() + settings.maxWait().toNanos();
        while (true) {
            long attemptStartedAt = System.nanoTime();
            Document acquired = tryAcquire(owner);
            if (acquired != null) {
                Held held = new Held(owner, acquired.getLong(GENERATION), attemptStartedAt + settings.lease().toNanos());
                log.info("Migration lock acquired: owner={} generation={}", owner, held.generation);
                held.startRenewing();
                return held;
            }
            if (System.nanoTime() - giveUpAt >= 0) {
                throw new MigrationLockTimeoutException("another instance held the migration lock in " + COLLECTION
                        + " for " + settings.maxWait());
            }
            log.info("Migration lock is held by another instance, waiting");
            pause(settings.pollEvery().toMillis());
        }
    }

    /**
     * One find-and-modify on {@code _id} that upserts. A pipeline update decides inside the document: when it is new or
     * its {@code expiresAt} is past (database time), it takes {@code owner}, raises {@code generation} and sets
     * {@code expiresAt}; otherwise it leaves all three alone. (A filter on {@code expiresAt} cannot do this: MongoDB
     * refuses {@code $expr}, which {@code $$NOW} needs, in the predicate of an upsert.) The lock is ours when the
     * returned document carries our owner.
     */
    private Document tryAcquire(String owner) {
        Document expired = new Document("$lte", Arrays.asList(
                new Document("$ifNull", Arrays.asList("$" + EXPIRES_AT, new Date(0))), NOW));
        Document currentGeneration = new Document("$ifNull", Arrays.asList("$" + GENERATION, 0L));
        List<Bson> pipeline = List.of(new Document("$set", new Document()
                .append(OWNER, new Document("$cond", Arrays.asList(expired, new Document("$literal", owner), "$" + OWNER)))
                .append(GENERATION, new Document("$cond", Arrays.asList(expired,
                        new Document("$add", Arrays.asList(currentGeneration, 1L)), currentGeneration)))
                .append(EXPIRES_AT, new Document("$cond", Arrays.asList(expired, leaseEnd(), "$" + EXPIRES_AT)))));
        try {
            Document current = collection().findOneAndUpdate(new Document(ID, LOCK_ID), pipeline,
                    new FindOneAndUpdateOptions().upsert(true).returnDocument(ReturnDocument.AFTER));
            return current != null && owner.equals(current.getString(OWNER)) ? current : null;
        } catch (MongoException e) {
            if (ErrorCategory.fromErrorCode(e.getCode()) == ErrorCategory.DUPLICATE_KEY) {
                return null;
            }
            throw new MigrationLockException("cannot acquire the migration lock in " + COLLECTION, e);
        }
    }

    private Document leaseEnd() {
        return new Document("$dateAdd", new Document("startDate", NOW)
                .append("unit", "millisecond")
                .append("amount", settings.lease().toMillis()));
    }

    private MongoCollection<Document> collection() {
        return mongoTemplate.getCollection(COLLECTION);
    }

    private static void pause(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new MigrationLockException("interrupted while waiting for the migration lock", e);
        }
    }

    /** A lock this instance holds. Close it to release it, also after a failure. */
    public final class Held implements AutoCloseable {

        private final String owner;
        private final long generation;
        private final Object refreshMonitor = new Object();
        private volatile long validUntilNanos;
        private volatile boolean lost;
        private ScheduledExecutorService heartbeat;

        private Held(String owner, long generation, long validUntilNanos) {
            this.owner = owner;
            this.generation = generation;
            this.validUntilNanos = validUntilNanos;
        }

        public String owner() {
            return owner;
        }

        public long generation() {
            return generation;
        }

        /**
         * Confirms that this instance still holds the lock, and renews it. Call it before starting a change set and
         * before writing a history entry.
         *
         * @throws MigrationLockLostException the lock was taken over or ran out; it stays lost
         */
        public void confirm() {
            refresh();
        }

        private void startRenewing() {
            if (!settings.renewing()) {
                return;
            }
            heartbeat = Executors.newSingleThreadScheduledExecutor(task -> {
                Thread thread = new Thread(task, HEARTBEAT_THREAD);
                thread.setDaemon(true);
                return thread;
            });
            long every = settings.renewalEvery().toMillis();
            heartbeat.scheduleWithFixedDelay(this::renewInBackground, every, every, TimeUnit.MILLISECONDS);
        }

        private void renewInBackground() {
            if (lost) {
                return;
            }
            try {
                refresh();
            } catch (MigrationLockLostException e) {
                log.error("Migration lock lost: {}", e.getMessage());
            } catch (RuntimeException e) {
                log.error("Migration lock renewal stopped by {}", e.toString(), e);
            }
        }

        private void refresh() {
            synchronized (refreshMonitor) {
                if (lost) {
                    throw new MigrationLockLostException("the migration lock was lost earlier (owner " + owner
                            + ", generation " + generation + ")");
                }
                while (true) {
                    long attemptStartedAt = System.nanoTime();
                    try {
                        UpdateResult result = collection().updateOne(heldFilter(),
                                List.of(new Document("$set", new Document(EXPIRES_AT, leaseEnd()))));
                        if (result.getMatchedCount() == 0) {
                            lost = true;
                            throw new MigrationLockLostException("another instance took over the migration lock: no"
                                    + " document with owner " + owner + " and generation " + generation + " in "
                                    + COLLECTION);
                        }
                        validUntilNanos = attemptStartedAt + settings.lease().toNanos();
                        return;
                    } catch (MongoException e) {
                        if (System.nanoTime() - validUntilNanos >= 0) {
                            lost = true;
                            throw new MigrationLockLostException("no renewal of the migration lock succeeded within "
                                    + settings.lease() + " (owner " + owner + ", generation " + generation + ")", e);
                        }
                        log.warn("Migration lock renewal failed, retrying: {}", e.toString());
                        pause(RETRY_PAUSE_MILLIS);
                    }
                }
            }
        }

        private Document heldFilter() {
            return new Document(ID, LOCK_ID).append(OWNER, owner).append(GENERATION, generation);
        }

        /** Stops the renewal and deletes the lock document if this instance still owns it. */
        @Override
        public void close() {
            if (heartbeat != null) {
                heartbeat.shutdownNow();
                try {
                    heartbeat.awaitTermination(HEARTBEAT_STOP_SECONDS, TimeUnit.SECONDS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            try {
                long released = collection().deleteOne(heldFilter()).getDeletedCount();
                log.info("Migration lock released: owner={} generation={} (document {})", owner, generation,
                        released == 1 ? "deleted" : "no longer ours");
            } catch (MongoException e) {
                log.warn("Migration lock could not be released and expires on its own: {}", e.toString());
            }
        }
    }
}
