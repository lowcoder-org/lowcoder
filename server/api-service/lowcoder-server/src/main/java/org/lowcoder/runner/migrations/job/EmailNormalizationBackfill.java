package org.lowcoder.runner.migrations.job;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import org.bson.Document;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.util.EmailUtils;
import org.lowcoder.sdk.util.HashUtils;

import com.mongodb.MongoBulkWriteException;
import com.mongodb.MongoException;
import com.mongodb.bulk.BulkWriteError;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.BulkWriteOptions;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Projections;
import com.mongodb.client.model.ReplaceOneModel;
import com.mongodb.client.model.ReplaceOptions;
import com.mongodb.client.model.UpdateOneModel;
import com.mongodb.client.model.WriteModel;

import lombok.extern.slf4j.Slf4j;

/**
 * Backfills existing email addresses into the canonical form the application has written since the
 * sanitization change: trimmed and lower-cased. See {@code EMAIL-SANITIZATION.md}.
 *
 * <p><b>Policy: converge what is unambiguous, freeze and report what is not.</b> Where the survey sees two
 * accounts converging on one normalized identity, every member of that group is left byte-for-byte as it
 * is and written to {@value #REPORT_COLLECTION} for an operator to resolve. Nothing is merged, deleted or
 * disabled. The dual-probe lookups in {@code UserServiceImpl} keep frozen rows reachable by their exact
 * stored casing, so freezing costs nobody their login.
 *
 * <p>A collision that only appears <i>after</i> the survey is handled differently and more weakly: the
 * write is refused by the index, and the document that lost is reported under {@code space: "write"}. The
 * account that took the key is not part of that report -- it was not a conflict when it was read, and
 * finding it would need a third pass. Such a group is therefore reported by one member, not all of them.
 *
 * <p><b>Nothing in the data it finds may prevent the application from starting.</b> Mongock runs as an
 * {@code ApplicationRunner} at boot and records a throwing changeset as FAILED, which by default stops
 * startup. Worse, {@code AddSuperAdminRunner} writes the super-admin user from a {@code @PostConstruct}
 * that ends in a bare {@code subscribe()}, so it is not ordered against this migration and can land a
 * write mid-run on every boot; multi-replica deployments add ordinary login traffic from the other pods.
 * The survey therefore cannot be the safety mechanism -- it is the policy enforcer, the one that makes a
 * conflict group atomic. Safety comes from tolerating duplicate keys at write time, which is the same
 * policy applied a moment later: a write that turns out to collide is not applied, it is reported.
 *
 * <p>Only data faults are tolerated. Infrastructure faults -- sockets, auth, write concern, any bulk error
 * that is not {@value #DUPLICATE_KEY_ERROR} -- still propagate, because those should be loud.
 */
@Slf4j
public final class EmailNormalizationBackfill {

    public static final String USER_COLLECTION = "user";
    public static final String REPORT_COLLECTION = "emailNormalizationConflict";

    static final String FIELD_ID = "_id";
    static final String FIELD_EMAIL = "email";
    static final String FIELD_CONNECTIONS = "connections";
    static final String FIELD_SOURCE = "source";
    static final String FIELD_RAW_ID = "rawId";

    static final String REPORT_SPACE = "space";
    static final String REPORT_VALUE = "normalizedValue";
    static final String REPORT_USER_ID = "userId";
    static final String REPORT_STORED = "storedValues";
    static final String REPORT_PATH = "path";
    static final String REPORT_VALUE_FIELD = "value";
    static final String REPORT_RUN_ID = "runId";
    static final String REPORT_DETECTED_AT = "detectedAt";
    static final String SUMMARY_ID = "summary";

    /** Two accounts converge on one EMAIL-connection {@code rawId} -- the key the unique index enforces. */
    static final String SPACE_RAW_ID = "connections.rawId";
    /** Two accounts converge in the {@code findByEmailDeep} keyspace -- {@code email} or a connection email. */
    static final String SPACE_EMAIL = "email";
    /** The write collided anyway: someone took the key between the survey and the write. */
    static final String SPACE_WRITE = "write";

    static final String MONGO_SET = "$set";
    static final int BULK_BATCH_SIZE = 1000;
    static final int CURSOR_BATCH_SIZE = 1000;
    static final int PROGRESS_LOG_INTERVAL = 50_000;
    static final int SAMPLE_LIMIT = 20;
    static final int DUPLICATE_KEY_ERROR = 11000;

    private EmailNormalizationBackfill() {
    }

    /** Changeset entry point. */
    public static Summary run(MongoDatabase db) {
        return run(db, USER_COLLECTION, REPORT_COLLECTION);
    }

    /**
     * Collection names are parameters so tests can drive this against throwaway collections. The embedded
     * mongod is shared across test classes, and the real {@code user} collection carries other suites'
     * fixtures.
     *
     * <p>The absent-collection guard is load-bearing rather than defensive. {@code @ActiveProfiles} replaces
     * the active profile set rather than adding to it, so every test class that names its own profile --
     * {@code emailSanitization}, {@code testGeneric}, {@code testFolder} and the rest -- does NOT have
     * {@code test} active, {@code @Profile("!test")} matches, and Mongock runs this changeset at context
     * startup against a database those suites have not populated yet.
     */
    static Summary run(MongoDatabase db, String usersCollection, String reportCollection) {
        if (!collectionExists(db, usersCollection)) {
            log.info("032 email backfill: collection {} does not exist; nothing to do.", usersCollection);
            return Summary.empty();
        }
        MongoCollection<Document> users = db.getCollection(usersCollection);
        MongoCollection<Document> report = db.getCollection(reportCollection);

        Survey survey = survey(users);
        Summary summary = backfill(users, report, survey, UUID.randomUUID().toString(), Instant.now());
        ensureLookupIndexes(users);
        return summary;
    }

    private static boolean collectionExists(MongoDatabase db, String name) {
        try (MongoCursor<String> names = db.listCollectionNames().iterator()) {
            while (names.hasNext()) {
                if (name.equals(names.next())) {
                    return true;
                }
            }
        }
        return false;
    }

    // -------------------------------------------------------------------------------- pass 1: survey

    /**
     * Finds the normalized values that more than one account would end up owning.
     *
     * <p>Grouped in Java with {@link EmailUtils#normalize} -- the very function the backfill applies -- and
     * not with a server-side {@code $group} on {@code $toLower}, which neither trims nor handles non-ASCII.
     * Under that weaker key {@code " john@doe.com"} forms its own group, passes the gate, and then converges
     * during the backfill, surfacing as a bare duplicate-key error: exactly what the gate exists to prevent.
     *
     * <p>Every document is scanned, including already-canonical ones. Grouping only the documents that need
     * a write would miss the common shape: {@code A="john@doe.com"} needs no write, so {@code B="JoHn@DoE.com"}
     * would look like a lone owner and be written straight onto A's key.
     *
     * <p>Holds two maps of normalized value to owning id for the length of the pass. This is the only part
     * that does not stream; at a million users it is a few hundred MB and well inside the container.
     */
    static Survey survey(MongoCollection<Document> users) {
        Map<String, Object> rawIdOwners = new HashMap<>();
        Map<String, Object> emailOwners = new HashMap<>();
        Set<String> conflictingRawIds = new HashSet<>();
        Set<String> conflictingEmails = new HashSet<>();
        long scanned = 0;

        try (MongoCursor<Document> cursor = users.find()
                .projection(Projections.include(FIELD_ID, FIELD_EMAIL, FIELD_CONNECTIONS))
                .batchSize(CURSOR_BATCH_SIZE)
                .noCursorTimeout(true)
                .iterator()) {
            while (cursor.hasNext()) {
                Document doc = cursor.next();
                scanned++;
                Object id = doc.get(FIELD_ID);

                for (String key : emailConnectionRawIdKeys(doc)) {
                    claim(rawIdOwners, conflictingRawIds, key, id);
                }
                for (String key : lookupEmailKeys(doc)) {
                    claim(emailOwners, conflictingEmails, key, id);
                }

                if (scanned % PROGRESS_LOG_INTERVAL == 0) {
                    log.info("032 email backfill survey: scanned {}.", scanned);
                }
            }
        }
        log.info("032 email backfill survey: scanned {} documents, found {} conflicting rawId values and "
                + "{} conflicting email values.", scanned, conflictingRawIds.size(), conflictingEmails.size());
        return new Survey(conflictingRawIds, conflictingEmails, scanned);
    }

    /**
     * Records this document as an owner of the key, marking the key conflicting when a different document
     * already owns it. Ids are compared as stored objects: {@code ObjectId} has value equality, and
     * {@code toString} would merge an {@code ObjectId} with a String of the same hex.
     */
    private static void claim(Map<String, Object> owners, Set<String> conflicting, String key, Object id) {
        Object previous = owners.putIfAbsent(key, id);
        if (previous != null && !Objects.equals(previous, id)) {
            conflicting.add(key);
        }
    }

    /**
     * The normalized EMAIL-connection {@code rawId}s this document would own, deduplicated.
     *
     * <p>Keyed on {@code source} equal to {@code EMAIL} and nothing else, which is what the unique index is
     * keyed on. Two consequences that both matter:
     *
     * <ul>
     * <li>An OIDC subject that happens to be an address -- many providers set {@code sub} to the user's
     * email -- lives under a different {@code source}, so it is a different index key and must not be
     * allowed to freeze the form account holding the same address. On an SSO-heavy install, grouping on the
     * bare value would freeze most of the collection.
     * <li>{@code User.markAsDeleted} rewrites {@code source} to {@code "EMAIL(User deleted at <ts>)"}, so a
     * tombstone is likewise a different key and cannot block a live account from converging.
     * </ul>
     *
     * <p>Values that normalize to empty are excluded here and never written, so they cannot converge onto a
     * shared {@code ""} key.
     */
    static Set<String> emailConnectionRawIdKeys(Document doc) {
        Set<String> keys = new LinkedHashSet<>();
        for (Object element : rawConnections(doc)) {
            if (!(element instanceof Document connection)
                    || !AuthSourceConstants.EMAIL.equals(stringOrNull(connection, FIELD_SOURCE))) {
                continue;
            }
            String rawId = stringOrNull(connection, FIELD_RAW_ID);
            if (rawId == null) {
                continue;
            }
            String normalized = EmailUtils.normalize(rawId);
            if (!normalized.isEmpty()) {
                keys.add(normalized);
            }
        }
        return keys;
    }

    /**
     * The normalized values this document would own in the {@code findByEmailDeep} keyspace.
     *
     * <p>That lookup is {@code {$or: [{email: v}, {"connections.email": v}]}}, so both fields share one
     * keyspace and connection emails count for every source, not just EMAIL.
     *
     * <p>Gated on {@link EmailUtils#looksLikeEmail}. Changeset {@code 023} ran
     * {@code update.set("email", document.getString("name"))} for every user, so on an upgraded install
     * {@code user.email} is full of display names, handles, empty strings and nulls. Those are not
     * addresses: normalizing {@code "Iron Man"} to {@code "iron man"} is a visible regression in the UI for
     * no benefit, and counting duplicates among them would freeze their owners' perfectly unambiguous
     * {@code rawId} for reasons that have nothing to do with email case.
     */
    static Set<String> lookupEmailKeys(Document doc) {
        Set<String> keys = new LinkedHashSet<>();
        addEmailKey(keys, stringOrNull(doc, FIELD_EMAIL));
        for (Object element : rawConnections(doc)) {
            if (element instanceof Document connection) {
                addEmailKey(keys, stringOrNull(connection, FIELD_EMAIL));
            }
        }
        return keys;
    }

    private static void addEmailKey(Set<String> keys, String value) {
        if (value == null) {
            return;
        }
        String normalized = EmailUtils.normalize(value);
        if (EmailUtils.looksLikeEmail(normalized)) {
            keys.add(normalized);
        }
    }

    // ---------------------------------------------------------------------- pass 2: backfill + report

    static Summary backfill(MongoCollection<Document> users, MongoCollection<Document> report, Survey survey,
            String runId, Instant runAt) {
        List<Op> ops = new ArrayList<>();
        List<Document> reportRows = new ArrayList<>();
        List<String> samples = new ArrayList<>();
        long scanned = 0;
        long modified = 0;
        long rawIdFrozen = 0;
        long emailFrozen = 0;
        long collidedAtWrite = 0;
        long notConverged = 0;

        try (MongoCursor<Document> cursor = users.find()
                .projection(Projections.include(FIELD_ID, FIELD_EMAIL, FIELD_CONNECTIONS))
                .batchSize(CURSOR_BATCH_SIZE)
                .noCursorTimeout(true)
                .iterator()) {
            while (cursor.hasNext()) {
                Document doc = cursor.next();
                scanned++;
                Object id = doc.get(FIELD_ID);

                boolean freezeRawId = intersects(emailConnectionRawIdKeys(doc), survey.conflictingRawIds());
                boolean freezeEmail = intersects(lookupEmailKeys(doc), survey.conflictingEmails());
                if (freezeRawId) {
                    rawIdFrozen++;
                    collectConflictRows(reportRows, samples, doc, id, SPACE_RAW_ID, survey, runId, runAt);
                }
                if (freezeEmail) {
                    emailFrozen++;
                    collectConflictRows(reportRows, samples, doc, id, SPACE_EMAIL, survey, runId, runAt);
                }

                UpdateOneModel<Document> operation = buildBackfillOperation(doc, freezeRawId, freezeEmail);
                if (operation != null) {
                    ops.add(new Op(id, targetValueOf(doc, freezeRawId), operation));
                    modified++;
                }
                if (ops.size() >= BULK_BATCH_SIZE) {
                    BulkOutcome outcome = flush(users, ops, reportRows, runId, runAt);
                    collidedAtWrite += outcome.collided().size();
                    notConverged += outcome.notConverged();
                    ops.clear();
                }
                if (scanned % PROGRESS_LOG_INTERVAL == 0) {
                    log.info("032 email backfill: scanned {}, modified {}.", scanned, modified);
                }
            }
        }
        BulkOutcome last = flush(users, ops, reportRows, runId, runAt);
        collidedAtWrite += last.collided().size();
        notConverged += last.notConverged();
        // Counted at queue time, so back out everything that did not actually land: a document whose key
        // was taken, and one the compare-and-swap filter rejected. An operator reading "modified" after a
        // production identity migration has to be able to trust it.
        modified -= collidedAtWrite + notConverged;

        Summary summary = new Summary(scanned, modified, rawIdFrozen, emailFrozen,
                survey.conflictingRawIds().size() + survey.conflictingEmails().size(), collidedAtWrite,
                notConverged);
        // The user data is the valuable part and it is already written. Losing the report is bad, but
        // failing the changeset over it is worse: Mongock would record 032 FAILED and stop the application
        // from starting, having already normalized the collection.
        try {
            upsertConflictRows(report, reportRows);
            writeSummaryAndSweepStale(report, summary, runId, runAt);
        } catch (RuntimeException e) {
            log.error("032 email backfill: the data was migrated but the conflict report could not be "
                    + "written to {}. Re-run the changeset to regenerate it.",
                    report.getNamespace().getCollectionName(), e);
        }
        logOutcome(summary, samples, report.getNamespace().getCollectionName());
        return summary;
    }

    private static BulkOutcome flush(MongoCollection<Document> users, List<Op> ops,
            List<Document> reportRows, String runId, Instant runAt) {
        BulkOutcome outcome = executeBulk(users, ops, "032 email backfill");
        for (Op op : outcome.collided()) {
            reportRows.add(conflictRow(SPACE_WRITE, op.targetValue(), op.userId(), List.of(), runId, runAt));
        }
        return outcome;
    }

    /**
     * The canonical address this operation is trying to claim, for the report row a late collision
     * produces. Empty when the document is only having non-indexed email fields normalized, which cannot
     * collide.
     */
    private static String targetValueOf(Document doc, boolean freezeRawId) {
        if (freezeRawId) {
            return "";
        }
        for (String key : emailConnectionRawIdKeys(doc)) {
            return key;
        }
        return "";
    }

    private static boolean intersects(Set<String> keys, Set<String> conflicting) {
        for (String key : keys) {
            if (conflicting.contains(key)) {
                return true;
            }
        }
        return false;
    }

    /**
     * The single update this document needs, or null when nothing changes.
     *
     * <p>One operation per document, never split per field. Whole-document atomicity is what makes "frozen
     * means untouched" true and keeps the report unambiguous; a half-applied document would be neither
     * converged nor pristine, and an operator resolving the conflict could not tell which.
     *
     * <p>The filter is a compare-and-swap: every path written is pinned to the value it was read with, and
     * a {@code rawId} write additionally pins its {@code source}. This subsumes pinning the array length --
     * if the array shrank, a dotted path matches nothing and the update is simply skipped, so MongoDB never
     * pads the array to reach a stale index -- and unlike a length check it also covers reordering and a
     * concurrent {@code markAsDeleted} turning {@code EMAIL} into a tombstone source mid-run.
     */
    static UpdateOneModel<Document> buildBackfillOperation(Document doc, boolean freezeRawId,
            boolean freezeEmail) {
        Document set = new Document();
        List<org.bson.conversions.Bson> guards = new ArrayList<>();
        guards.add(Filters.eq(FIELD_ID, doc.get(FIELD_ID)));

        if (!freezeEmail) {
            String email = stringOrNull(doc, FIELD_EMAIL);
            if (email != null && changesToAnAddress(email)) {
                set.append(FIELD_EMAIL, EmailUtils.normalize(email));
                guards.add(Filters.eq(FIELD_EMAIL, email));
            }
        }

        List<?> connections = rawConnections(doc);
        for (int i = 0; i < connections.size(); i++) {
            // Anything that is not a document -- nulls, scalars, nested arrays -- is skipped rather than
            // cast. The index is the STORED index because the whole array was projected; projecting
            // connections.source/connections.rawId instead would drop non-document elements and shift every
            // later position, so a dotted write would land on a foreign IdP subject.
            if (!(connections.get(i) instanceof Document connection)) {
                continue;
            }
            String prefix = FIELD_CONNECTIONS + "." + i + ".";
            String source = stringOrNull(connection, FIELD_SOURCE);

            if (!freezeRawId && AuthSourceConstants.EMAIL.equals(source)) {
                String rawId = stringOrNull(connection, FIELD_RAW_ID);
                // No shape gate here, unlike the email fields: rawId under an EMAIL source IS the login
                // identifier by definition, so normalizing it always improves reachability. Empty results
                // are suppressed so whitespace-only values cannot converge onto a shared "" key.
                if (rawId != null && !EmailUtils.normalize(rawId).isEmpty()
                        && !EmailUtils.normalize(rawId).equals(rawId)) {
                    set.append(prefix + FIELD_RAW_ID, EmailUtils.normalize(rawId));
                    guards.add(Filters.eq(prefix + FIELD_RAW_ID, rawId));
                    guards.add(Filters.eq(prefix + FIELD_SOURCE, source));
                }
            }

            if (!freezeEmail) {
                String email = stringOrNull(connection, FIELD_EMAIL);
                if (email != null && changesToAnAddress(email)) {
                    set.append(prefix + FIELD_EMAIL, EmailUtils.normalize(email));
                    guards.add(Filters.eq(prefix + FIELD_EMAIL, email));
                }
            }
        }

        if (set.isEmpty()) {
            return null;
        }
        return new UpdateOneModel<>(Filters.and(guards), new Document(MONGO_SET, set));
    }

    /** Whether this value is an address AND is not already canonical -- the condition for writing it. */
    private static boolean changesToAnAddress(String value) {
        String normalized = EmailUtils.normalize(value);
        return EmailUtils.looksLikeEmail(normalized) && !normalized.equals(value);
    }

    // ------------------------------------------------------------------------------------- writing

    /**
     * Applies the batch and returns the ids that could not be written because their key was already taken.
     *
     * <p>Unordered, so one rejected operation does not abandon the rest of the batch. A duplicate key here
     * means the survey's picture went stale -- someone registered or bound the address while the migration
     * ran -- which is the same condition the survey freezes for, discovered later. So it is reported and
     * the run continues. Anything else is an infrastructure fault and propagates.
     */
    static BulkOutcome executeBulk(MongoCollection<Document> collection, List<Op> ops, String what) {
        if (ops.isEmpty()) {
            return BulkOutcome.empty();
        }
        List<WriteModel<Document>> models = new ArrayList<>(ops.size());
        for (Op op : ops) {
            models.add(op.model());
        }
        try {
            BulkWriteResult result = collection.bulkWrite(models, new BulkWriteOptions().ordered(false));
            // With w=0 the counts are not zero, getMatchedCount throws outright, so check before reading.
            if (!result.wasAcknowledged()) {
                log.warn("{}: the connection is configured for unacknowledged writes (w=0), so this batch "
                        + "cannot be verified. Run the migration against an acknowledged connection.", what);
                return BulkOutcome.empty();
            }
            long shortfall = ops.size() - result.getMatchedCount();
            if (shortfall > 0) {
                // The compare-and-swap filter rejected these: the documents changed under the migration.
                // Not fatal and not a conflict -- they are simply not converged, and another run picks
                // them up. Failing the changeset here would fail application startup instead. Returned
                // rather than only logged, so the summary does not count them as normalized.
                log.warn("{}: {} of {} operations matched nothing because the document changed during the "
                        + "run. Those documents are not normalized; re-run the migration.", what, shortfall,
                        ops.size());
            }
            return new BulkOutcome(List.of(), shortfall);
        } catch (MongoBulkWriteException e) {
            List<Op> collided = new ArrayList<>();
            boolean onlyDuplicates = e.getWriteConcernError() == null;
            for (BulkWriteError error : e.getWriteErrors()) {
                if (error.getCode() == DUPLICATE_KEY_ERROR) {
                    collided.add(ops.get(error.getIndex()));
                } else {
                    onlyDuplicates = false;
                    log.error("{} failed for _id {}: code {} -- {}", what,
                            ops.get(error.getIndex()).userId(), error.getCode(), error.getMessage());
                }
            }
            if (!onlyDuplicates) {
                if (e.getWriteConcernError() != null) {
                    log.error("{} write concern error: code {} -- {}", what,
                            e.getWriteConcernError().getCode(), e.getWriteConcernError().getMessage());
                }
                throw e;
            }
            log.warn("{}: {} documents could not be normalized because another account already holds the "
                    + "address. They are unchanged and reported.", what, collided.size());
            long applied = e.getWriteResult().wasAcknowledged()
                    ? e.getWriteResult().getMatchedCount()
                    : ops.size() - collided.size();
            return new BulkOutcome(collided, Math.max(0, ops.size() - collided.size() - applied));
        } catch (MongoException e) {
            // Socket, command and write-concern failures carry no per-operation detail, so name the pass
            // rather than letting a bare driver exception surface with no indication of what was running.
            log.error("{} failed: {}", what, e.getMessage());
            throw e;
        }
    }

    // -------------------------------------------------------------------------------------- report

    private static void collectConflictRows(List<Document> rows, List<String> samples, Document doc,
            Object id, String space, Survey survey, String runId, Instant runAt) {
        Set<String> conflicting = SPACE_RAW_ID.equals(space)
                ? survey.conflictingRawIds()
                : survey.conflictingEmails();
        Set<String> keys = SPACE_RAW_ID.equals(space)
                ? emailConnectionRawIdKeys(doc)
                : lookupEmailKeys(doc);

        for (String key : keys) {
            if (!conflicting.contains(key)) {
                continue;
            }
            rows.add(conflictRow(space, key, id, storedValuesFor(doc, space, key), runId, runAt));
            if (samples.size() < SAMPLE_LIMIT) {
                samples.add(String.format("%s=%s held by _id %s", space, key, id));
            }
        }
    }

    /** The actual stored strings behind a conflicting key, with their dotted paths, for the report. */
    private static List<Document> storedValuesFor(Document doc, String space, String key) {
        List<Document> stored = new ArrayList<>();
        boolean emailSpace = SPACE_EMAIL.equals(space);

        if (emailSpace) {
            String email = stringOrNull(doc, FIELD_EMAIL);
            if (email != null && key.equals(EmailUtils.normalize(email))) {
                stored.add(new Document(REPORT_PATH, FIELD_EMAIL).append(REPORT_VALUE_FIELD, email));
            }
        }
        List<?> connections = rawConnections(doc);
        for (int i = 0; i < connections.size(); i++) {
            if (!(connections.get(i) instanceof Document connection)) {
                continue;
            }
            String prefix = FIELD_CONNECTIONS + "." + i + ".";
            String field = emailSpace ? FIELD_EMAIL : FIELD_RAW_ID;
            if (!emailSpace && !AuthSourceConstants.EMAIL.equals(stringOrNull(connection, FIELD_SOURCE))) {
                continue;
            }
            String value = stringOrNull(connection, field);
            if (value != null && key.equals(EmailUtils.normalize(value))) {
                stored.add(new Document(REPORT_PATH, prefix + field).append(REPORT_VALUE_FIELD, value));
            }
        }
        return stored;
    }

    /**
     * One report row. The {@code _id} is a hash rather than the concatenation because an {@code _id} index
     * key is capped at 1024 bytes and an address is not bounded; hashing also makes the row deterministic,
     * so a re-run replaces it in place instead of accumulating duplicates.
     */
    private static Document conflictRow(String space, String normalizedValue, Object userId,
            List<Document> storedValues, String runId, Instant runAt) {
        String key = space + " " + normalizedValue + " " + userId;
        return new Document(FIELD_ID, HashUtils.hash(key.getBytes(StandardCharsets.UTF_8)))
                .append(REPORT_SPACE, space)
                .append(REPORT_VALUE, normalizedValue)
                .append(REPORT_USER_ID, userId)
                .append(REPORT_STORED, storedValues)
                .append(REPORT_RUN_ID, runId)
                .append(REPORT_DETECTED_AT, Date.from(runAt));
    }

    static void upsertConflictRows(MongoCollection<Document> report, List<Document> rows) {
        if (rows.isEmpty()) {
            return;
        }
        List<WriteModel<Document>> models = new ArrayList<>(rows.size());
        for (Document row : rows) {
            models.add(new ReplaceOneModel<>(Filters.eq(FIELD_ID, row.get(FIELD_ID)), row,
                    new ReplaceOptions().upsert(true)));
            if (models.size() >= BULK_BATCH_SIZE) {
                report.bulkWrite(models, new BulkWriteOptions().ordered(false));
                models.clear();
            }
        }
        if (!models.isEmpty()) {
            report.bulkWrite(models, new BulkWriteOptions().ordered(false));
        }
    }

    /**
     * Writes the one row an operator actually reads, then drops rows from earlier runs.
     *
     * <p>The sweep is what stops a resolved conflict haunting the collection forever. It runs only after a
     * completed pass, so an aborted run can never delete rows that are still valid.
     */
    static void writeSummaryAndSweepStale(MongoCollection<Document> report, Summary summary, String runId,
            Instant runAt) {
        Document doc = new Document(FIELD_ID, SUMMARY_ID)
                .append(REPORT_RUN_ID, runId)
                .append(REPORT_DETECTED_AT, Date.from(runAt))
                .append("scanned", summary.scanned())
                .append("modified", summary.modified())
                .append("rawIdFrozen", summary.rawIdFrozen())
                .append("emailFrozen", summary.emailFrozen())
                .append("conflictGroups", summary.conflictGroups())
                .append("collidedAtWrite", summary.collidedAtWrite())
                .append("notConverged", summary.notConverged());
        report.replaceOne(Filters.eq(FIELD_ID, SUMMARY_ID), doc, new ReplaceOptions().upsert(true));
        report.deleteMany(Filters.ne(REPORT_RUN_ID, runId));
    }

    private static void logOutcome(Summary summary, List<String> samples, String reportCollection) {
        log.info("032 email backfill complete: scanned {}, normalized {}.", summary.scanned(),
                summary.modified());
        if (summary.notConverged() > 0) {
            log.warn("032 email backfill: {} documents were changed by something else while the migration "
                    + "ran and were left un-normalized. Re-run the changeset to pick them up.",
                    summary.notConverged());
        }
        if (summary.rawIdFrozen() == 0 && summary.emailFrozen() == 0 && summary.collidedAtWrite() == 0) {
            return;
        }
        log.warn("032 email backfill left {} documents unchanged because their address is shared with "
                        + "another account ({} on the login identifier, {} in the email lookup, {} discovered "
                        + "at write time). They still work, by their stored casing. See collection {} -- "
                        + "its \"{}\" document has the counts. First {} of {}: {}",
                summary.rawIdFrozen() + summary.emailFrozen() + summary.collidedAtWrite(),
                summary.rawIdFrozen(), summary.emailFrozen(), summary.collidedAtWrite(), reportCollection,
                SUMMARY_ID, samples.size(), summary.conflictGroups(), samples);
    }

    // ------------------------------------------------------------------------------------- indexes

    /**
     * Indexes the {@code findByEmailDeep} keyspace. Both fields, because that lookup is an {@code $or} and
     * MongoDB can only serve an {@code $or} from indexes when every branch has one -- indexing {@code email}
     * alone would still leave the query a collection scan.
     *
     * <p>It was already a scan on the SSO login, invite and SCIM paths; password recovery is about to start
     * using it too, and that endpoint is unauthenticated, which makes an unindexed full scan there an
     * amplification vector.
     *
     * <p>Plain, non-unique, non-sparse. Non-unique is the point: a unique index would hard-fail on exactly
     * the conflict groups this migration has deliberately left in place.
     */
    static void ensureLookupIndexes(MongoCollection<Document> users) {
        // Same reasoning as the report: these are a performance improvement, not the migration's purpose.
        // An install that already carries an index on the same keys under a different name makes
        // createIndex throw, and that must not turn into a failed changeset and a refused startup.
        try {
            users.createIndex(new Document(FIELD_EMAIL, 1), new IndexOptions().name("email_1"));
            users.createIndex(new Document(FIELD_CONNECTIONS + "." + FIELD_EMAIL, 1),
                    new IndexOptions().name("connections.email_1"));
        } catch (RuntimeException e) {
            log.warn("032 email backfill: could not create the email lookup indexes. findByEmailDeep will "
                    + "still work, as a collection scan. Create them by hand: {}", e.getMessage());
        }
    }

    // ------------------------------------------------------------------------------------- helpers

    private static List<?> rawConnections(Document doc) {
        return doc.get(FIELD_CONNECTIONS) instanceof List<?> list ? list : List.of();
    }

    /** The value at this key when it is a String, else null. Never throws on a wrongly-typed field. */
    private static String stringOrNull(Document doc, String field) {
        return doc.get(field) instanceof String value ? value : null;
    }

    /** The conflicting normalized values, in each of the two keyspaces that can produce them. */
    record Survey(Set<String> conflictingRawIds, Set<String> conflictingEmails, long scanned) {
    }

    /**
     * A pending update, the id it targets and the canonical value it is trying to claim, so a bulk error
     * can name both the document and the address it lost.
     */
    record Op(Object userId, String targetValue, UpdateOneModel<Document> model) {
    }

    /** What a batch actually did: which operations lost a key, and how many the CAS filter rejected. */
    record BulkOutcome(List<Op> collided, long notConverged) {

        static BulkOutcome empty() {
            return new BulkOutcome(List.of(), 0);
        }
    }

    /** The outcome of a run. Public because it is what the public entry point returns. */
    public record Summary(long scanned, long modified, long rawIdFrozen, long emailFrozen,
            long conflictGroups, long collidedAtWrite, long notConverged) {

        static Summary empty() {
            return new Summary(0, 0, 0, 0, 0, 0, 0);
        }
    }
}
