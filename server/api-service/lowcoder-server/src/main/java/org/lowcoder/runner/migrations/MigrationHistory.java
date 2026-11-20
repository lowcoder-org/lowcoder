package org.lowcoder.runner.migrations;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

import org.bson.Document;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import com.mongodb.MongoException;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Projections;

/**
 * The record of which change sets ran, in the collection {@value #COLLECTION}.
 *
 * <p>Format. The collection and the documents are those Mongock 5.4.0 wrote before this runner replaced it: production
 * databases hold them, and the build before the replacement has to read what this runner writes (it then runs no change
 * set). The fields and their BSON types are those of a Mongock entry: {@code executionId} (text), {@code changeId},
 * {@code author}, {@code timestamp} (date), {@code state}, {@code type}, {@code changeLogClass},
 * {@code changeSetMethod}, {@code metadata} (null), {@code executionMillis} (long), {@code executionHostname},
 * {@code errorTrace} (null, or the stack trace of a failure) and {@code systemChange} (false).
 *
 * <p>Rule. A change set counts as done only with an entry that has its {@code changeId} and {@code author} and
 * {@code state} {@value #STATE_EXECUTED}. A {@value #STATE_FAILED} entry, or any other state, never counts, so a failed
 * change set runs again at the next start. A failure adds a {@value #STATE_FAILED} entry and removes none; a later
 * success adds an {@value #STATE_EXECUTED} entry.
 *
 * <p>Limits. Mongock also writes two entries of its own ({@code system-change-00001} and its {@code _before}) when it
 * first runs on a database. This runner neither writes nor reads them: on a database that only this runner migrated, the
 * Mongock build writes them at its first start. The unique index Mongock keeps on the collection is not created here.
 * The writes take no lock of their own; {@link MigrationRunner} writes them while it holds {@link MigrationLock}.
 */
@Component
@Profile("!test")
public class MigrationHistory {

    public static final String COLLECTION = "mongockChangeLog";

    static final String EXECUTION_ID = "executionId";
    static final String CHANGE_ID = "changeId";
    static final String AUTHOR = "author";
    static final String TIMESTAMP = "timestamp";
    static final String STATE = "state";
    static final String TYPE = "type";
    static final String CHANGE_LOG_CLASS = "changeLogClass";
    static final String CHANGE_SET_METHOD = "changeSetMethod";
    static final String METADATA = "metadata";
    static final String EXECUTION_MILLIS = "executionMillis";
    static final String EXECUTION_HOSTNAME = "executionHostname";
    static final String ERROR_TRACE = "errorTrace";
    static final String SYSTEM_CHANGE = "systemChange";

    static final String STATE_EXECUTED = "EXECUTED";
    static final String STATE_FAILED = "FAILED";
    static final String TYPE_EXECUTION = "EXECUTION";

    private static final String UNKNOWN_HOSTNAME = "unknown";
    private static final int EXECUTION_ID_SUFFIX_BOUND = 1000;

    /** The identity of a change set in the history. */
    public record ChangeKey(String changeId, String author) {
    }

    private final MongoTemplate mongoTemplate;
    private final String hostname = resolveHostname();

    public MigrationHistory(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /** The identifier that ties the entries of one start together: the local time and a random number. */
    public static String newExecutionId() {
        return LocalDateTime.now() + "-" + ThreadLocalRandom.current().nextInt(EXECUTION_ID_SUFFIX_BOUND);
    }

    /** The keys of the change sets with an {@value #STATE_EXECUTED} entry; entries in any other state are ignored. */
    public Set<ChangeKey> executedKeys() {
        Set<ChangeKey> keys = new HashSet<>();
        try {
            for (Document entry : collection()
                    .find(new Document(STATE, STATE_EXECUTED))
                    .projection(Projections.include(CHANGE_ID, AUTHOR))) {
                keys.add(new ChangeKey(entry.getString(CHANGE_ID), entry.getString(AUTHOR)));
            }
        } catch (MongoException e) {
            throw new MigrationHistoryException("cannot read the migration history in " + COLLECTION, e);
        }
        return keys;
    }

    public void recordExecuted(MigrationStep step, String executionId, Instant startedAt, long executionMillis) {
        insert(entry(step, executionId, startedAt, executionMillis, STATE_EXECUTED, null));
    }

    public void recordFailed(MigrationStep step, String executionId, Instant startedAt, long executionMillis,
            Throwable failure) {
        insert(entry(step, executionId, startedAt, executionMillis, STATE_FAILED, stackTrace(failure)));
    }

    private Document entry(MigrationStep step, String executionId, Instant startedAt, long executionMillis, String state,
            String errorTrace) {
        return new Document()
                .append(EXECUTION_ID, executionId)
                .append(CHANGE_ID, step.id())
                .append(AUTHOR, step.author())
                .append(TIMESTAMP, Date.from(startedAt))
                .append(STATE, state)
                .append(TYPE, TYPE_EXECUTION)
                .append(CHANGE_LOG_CLASS, step.changeLogClass())
                .append(CHANGE_SET_METHOD, step.changeSetMethod())
                .append(METADATA, null)
                .append(EXECUTION_MILLIS, executionMillis)
                .append(EXECUTION_HOSTNAME, hostname)
                .append(ERROR_TRACE, errorTrace)
                .append(SYSTEM_CHANGE, false);
    }

    private void insert(Document entry) {
        try {
            collection().insertOne(entry);
        } catch (MongoException e) {
            throw new MigrationHistoryException("cannot write the migration history entry of "
                    + entry.getString(CHANGE_ID) + " (" + entry.getString(STATE) + ") to " + COLLECTION, e);
        }
    }

    private MongoCollection<Document> collection() {
        return mongoTemplate.getCollection(COLLECTION);
    }

    private static String stackTrace(Throwable failure) {
        StringWriter text = new StringWriter();
        failure.printStackTrace(new PrintWriter(text));
        return text.toString();
    }

    private static String resolveHostname() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (UnknownHostException e) {
            return UNKNOWN_HOSTNAME;
        }
    }
}
