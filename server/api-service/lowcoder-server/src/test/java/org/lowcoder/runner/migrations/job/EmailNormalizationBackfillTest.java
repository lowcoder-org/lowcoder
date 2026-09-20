package org.lowcoder.runner.migrations.job;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.bson.Document;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.runner.migrations.job.EmailNormalizationBackfill.Summary;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.IndexOptions;

import lombok.extern.slf4j.Slf4j;

/**
 * Drives {@link EmailNormalizationBackfill} directly against the embedded mongod.
 *
 * <p>The changeset itself is never driven through Mongock here. Under {@code @ActiveProfiles("test")},
 * {@code DatabaseChangelog} is {@code @Profile("!test")} and Mongock skips it — which also means the real
 * {@code (connections.source, connections.rawId)} unique sparse index does not exist in this context, so
 * each test builds it on its own throwaway collection. That is a gift rather than a nuisance: it makes the
 * duplicate-key path testable in isolation, which it would not be against the shared {@code user}
 * collection.
 *
 * <p>Throwaway collections per test, because one embedded mongod is shared across every {@code test}-profile
 * class and the real {@code user} collection holds other suites' fixtures.
 *
 * <p>{@code classes = ServerApplication.class} is required: {@code @SpringBootTest} only searches upwards
 * from the test's own package for a {@code @SpringBootConfiguration}, and {@code org.lowcoder.api} is not an
 * ancestor of {@code org.lowcoder.runner.migrations.job}.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Slf4j
public class EmailNormalizationBackfillTest {

    private static final String EMAIL = "EMAIL";
    private static final String GOOGLE = "GOOGLE";
    private static final String GENERIC = "GENERIC";
    /** What {@code User.markAsDeleted} leaves behind in {@code connections[].source}. */
    private static final String DELETED_EMAIL_SOURCE = "EMAIL(User deleted at 1700000000)";

    @Autowired
    private MongoTemplate blockingMongoTemplate;

    private MongoDatabase db;
    private String usersName;
    private String reportName;
    private MongoCollection<Document> users;
    private MongoCollection<Document> report;

    @BeforeEach
    public void beforeEach() {
        db = blockingMongoTemplate.getDb();
        String suffix = UUID.randomUUID().toString().replace("-", "");
        usersName = "testUser_" + suffix;
        reportName = "testConflict_" + suffix;
        db.createCollection(usersName);
        users = db.getCollection(usersName);
        report = db.getCollection(reportName);
        // The real index from changeset 016, so collisions behave here exactly as they do in production.
        users.createIndex(new Document("connections.source", 1).append("connections.rawId", 1),
                new IndexOptions().unique(true).sparse(true));
    }

    @AfterEach
    public void afterEach() {
        users.drop();
        report.drop();
    }

    // ------------------------------------------------------------------------------------- helpers

    private static Document connection(String source, String rawId, String email, String name) {
        return new Document("source", source).append("rawId", rawId).append("email", email)
                .append("name", name);
    }

    private void insert(String id, String email, Object... connections) {
        users.insertOne(new Document("_id", id).append("email", email)
                .append("connections", Arrays.asList(connections)));
    }

    private Summary run() {
        return EmailNormalizationBackfill.run(db, usersName, reportName);
    }

    private Document reload(String id) {
        Document doc = users.find(Filters.eq("_id", id)).first();
        assertNotNull(doc, "user " + id + " vanished");
        return doc;
    }

    private Document conn(String id, int index) {
        return (Document) ((List<?>) reload(id).get("connections")).get(index);
    }

    private long reportRows(String id) {
        return report.countDocuments(Filters.eq("userId", id));
    }

    private void logDoc(String label, String id) {
        log.info("{}: {}", label, reload(id).toJson());
    }

    // -------------------------------------------------------------------------------- happy path

    @Test
    public void convergesAMixedCaseAccount() {
        insert("u1", "  JoHn@DoE.COM ",
                connection(EMAIL, "JoHn@DoE.COM", "JoHn@DoE.COM", "JoHn@DoE.COM"),
                connection(GOOGLE, "SuB-XyZ-123", "JoHn@DoE.COM", "John Doe"));

        Summary summary = run();
        logDoc("converged", "u1");

        assertEquals("john@doe.com", reload("u1").getString("email"), "user.email must be canonical");
        assertEquals("john@doe.com", conn("u1", 0).getString("rawId"), "EMAIL rawId must be canonical");
        assertEquals("john@doe.com", conn("u1", 0).getString("email"), "connection email must be canonical");
        assertEquals("john@doe.com", conn("u1", 1).getString("email"),
                "a non-EMAIL connection's email is still an address and is normalized");

        // The two identity fields the migration must never touch.
        assertEquals("SuB-XyZ-123", conn("u1", 1).getString("rawId"),
                "an opaque IdP subject must survive byte-for-byte -- lowercasing it would let subject "
                        + "AbC authenticate as abc");
        assertEquals("JoHn@DoE.COM", conn("u1", 0).getString("name"),
                "connection.name is a display field the write path does not normalize either");
        assertEquals(1, summary.modified());
    }

    /**
     * {@code connections[].name} is deliberately excluded. {@code AuthUser.toAuthConnection} writes it as
     * {@code .name(getUsername())} un-normalized, so every account created since the sanitization change
     * already stores a raw-cased name; normalizing it here would fight the application and the divergence
     * would reappear on the very next login.
     */
    @Test
    public void neverTouchesConnectionName() {
        insert("u1", "john@doe.com", connection(EMAIL, "john@doe.com", "john@doe.com", "JoHn@DoE.COM"));
        run();
        assertEquals("JoHn@DoE.COM", conn("u1", 0).getString("name"));
    }

    @Test
    public void isIdempotentAndWritesNothingOnASecondRun() {
        insert("u1", "JoHn@DoE.COM", connection(EMAIL, "JoHn@DoE.COM", "JoHn@DoE.COM", "n"));

        assertEquals(1, run().modified(), "first run converges the document");
        Summary second = run();
        log.info("second run: {}", second);
        assertEquals(0, second.modified(), "a converged document must produce no write at all");
        assertEquals("john@doe.com", reload("u1").getString("email"));
    }

    @Test
    public void createsNoEmailKeyForADocumentThatHasNone() {
        users.insertOne(new Document("_id", "u1")
                .append("connections", List.of(connection(EMAIL, "JoHn@DoE.COM", null, "n"))));
        run();
        assertTrue(!reload("u1").containsKey("email"),
                "a document with no email must not gain one -- normalize() is null-safe and an "
                        + "unconditional rule would write an explicit null");
        assertEquals("john@doe.com", conn("u1", 0).getString("rawId"));
    }

    // ----------------------------------------------------------------------------------- freezing

    @Test
    public void leavesBothMembersOfARawIdCollisionByteExact() {
        insert("u1", "john@doe.com", connection(EMAIL, "john@doe.com", "john@doe.com", "n"));
        insert("u2", "JoHn@DoE.COM", connection(EMAIL, "JoHn@DoE.COM", "JoHn@DoE.COM", "n"));

        Summary summary = run();
        logDoc("collision member 1", "u1");
        logDoc("collision member 2", "u2");

        assertEquals("john@doe.com", conn("u1", 0).getString("rawId"), "already canonical, unchanged");
        assertEquals("JoHn@DoE.COM", conn("u2", 0).getString("rawId"),
                "the conflicting account must be left exactly as it was");
        assertEquals("JoHn@DoE.COM", reload("u2").getString("email"),
                "frozen means the whole document is untouched, not partially normalized");
        assertTrue(summary.rawIdFrozen() >= 2, "both members counted as frozen");
        assertTrue(reportRows("u1") > 0 && reportRows("u2") > 0, "both members must be reported");
    }

    /**
     * Proves the policy is "every member of a conflicting group", not "first owner wins". A
     * {@code putIfAbsent}-style implementation normalizes the first owner straight onto the others' key.
     */
    @Test
    public void leavesAllThreeMembersOfAGroupUntouched() {
        insert("u1", null, connection(EMAIL, "John@Doe.com", null, "n"));
        insert("u2", null, connection(EMAIL, "JOHN@DOE.COM", null, "n"));
        insert("u3", null, connection(EMAIL, "jOhN@dOe.CoM", null, "n"));

        run();

        assertEquals("John@Doe.com", conn("u1", 0).getString("rawId"));
        assertEquals("JOHN@DOE.COM", conn("u2", 0).getString("rawId"));
        assertEquals("jOhN@dOe.CoM", conn("u3", 0).getString("rawId"));
    }

    /**
     * A tombstone must not block a live account. {@code User.markAsDeleted} mangles the connection source,
     * so the deleted row sits under a different index key and is a different group by construction.
     */
    @Test
    public void doesNotFoldADeletedTombstoneIntoALiveGroup() {
        insert("live", null, connection(EMAIL, "JoHn@DoE.COM", null, "n"));
        insert("dead", null, connection(DELETED_EMAIL_SOURCE, "john@doe.com", null, "n"));

        run();

        assertEquals("john@doe.com", conn("live", 0).getString("rawId"),
                "the live account must still converge");
        assertEquals("john@doe.com", conn("dead", 0).getString("rawId"),
                "the tombstone's rawId is not under an EMAIL source, so it is never rewritten");
        assertEquals(DELETED_EMAIL_SOURCE, conn("dead", 0).getString("source"));
    }

    /**
     * Many OIDC providers set {@code sub} to the user's address. That subject lives under a different
     * {@code source}, so it is a different index key and must not freeze the form account. Grouping on the
     * bare value instead of the source-qualified key would freeze most of an SSO-heavy install.
     */
    @Test
    public void doesNotFoldAnOidcSubjectIntoAnEmailGroup() {
        insert("form", null, connection(EMAIL, "JoHn@DoE.COM", null, "n"));
        insert("sso", null, connection(GENERIC, "john@doe.com", null, "n"));

        run();

        assertEquals("john@doe.com", conn("form", 0).getString("rawId"),
                "the form account must converge despite an OIDC subject holding the same text");
        assertEquals("john@doe.com", conn("sso", 0).getString("rawId"), "the subject is untouched");
    }

    /**
     * The two keyspaces are frozen independently. A shared flag would let changeset 023's pollution of
     * {@code user.email} freeze a perfectly unambiguous login identifier.
     */
    @Test
    public void freezesOnlyTheEmailSideWhenOnlyEmailsCollide() {
        insert("u1", "alice@x.com", connection(EMAIL, "alice-one@x.com", "alice@x.com", "n"));
        insert("u2", null, connection(EMAIL, "Alice-Two@X.com", "Alice@X.com", "n"));

        run();
        logDoc("email-frozen but rawId-converged", "u2");

        assertEquals("alice-two@x.com", conn("u2", 0).getString("rawId"),
                "the login identifier does not collide, so it must still converge");
        assertEquals("Alice@X.com", conn("u2", 0).getString("email"),
                "the connection email does collide, so it must be left alone");
    }

    // ----------------------------------------------------------------------- hostile document shapes

    @Test
    public void leavesBlankNormalizingRawIdsAlone() {
        insert("u1", null, connection(EMAIL, "   ", null, "n"));
        insert("u2", null, connection(EMAIL, "\t", null, "n"));

        run();

        assertEquals("   ", conn("u1", 0).getString("rawId"),
                "whitespace-only rawIds must not converge onto a shared empty key");
        assertEquals("\t", conn("u2", 0).getString("rawId"));
    }

    @Test
    public void leavesNonEmailShapedUserEmailAlone() {
        insert("u1", "Iron Man", connection(EMAIL, "ironman@avengers.com", null, "n"));
        users.insertOne(new Document("_id", "u2").append("email", 42));
        users.insertOne(new Document("_id", "u3").append("email", List.of("a@b.com")));

        run();

        assertEquals("Iron Man", reload("u1").getString("email"),
                "changeset 023 wrote display names into email; lowercasing one is a visible UI regression");
        assertEquals(42, reload("u2").get("email"), "a non-string email must not throw or be coerced");
        assertEquals(List.of("a@b.com"), reload("u3").get("email"));
    }

    /**
     * The highest-severity bug class in this migration: if positions read do not match positions written, a
     * dotted update lands on a foreign IdP subject. The whole array is projected precisely so the loop index
     * is the stored index.
     */
    @Test
    public void isSafeOnRaggedConnectionArrays() {
        List<Object> ragged = new ArrayList<>();
        ragged.add(connection(GOOGLE, "SuB-1", null, "n"));
        ragged.add(null);
        ragged.add("a bare string");
        ragged.add(42);
        ragged.add(new Document("authId", "EMAIL"));
        ragged.add(List.of("nested", "array"));
        ragged.add(new Document());
        ragged.add(connection(EMAIL, "JoHn@DoE.COM", null, "n"));
        users.insertOne(new Document("_id", "u1").append("connections", ragged));

        run();
        logDoc("ragged", "u1");

        List<?> after = (List<?>) reload("u1").get("connections");
        assertEquals(8, after.size(), "the array must keep its shape");
        assertEquals("SuB-1", ((Document) after.get(0)).getString("rawId"), "foreign subject intact");
        assertNull(after.get(1));
        assertEquals("a bare string", after.get(2));
        assertEquals(42, after.get(3));
        assertEquals("john@doe.com", ((Document) after.get(7)).getString("rawId"),
                "only the genuine EMAIL connection at the stored index is rewritten");
    }

    /**
     * One document holding two EMAIL connections differing only in case — a state the old {@code bindEmail}
     * could produce. Both converge onto one key; multikey index keys dedupe within a document, so this is
     * not a duplicate-key error. Asserted against the real index rather than assumed.
     */
    @Test
    public void normalizesTwoCaseVariantConnectionsInsideOneDocument() {
        insert("u1", null,
                connection(EMAIL, "John@Doe.com", null, "n"),
                connection(EMAIL, "JOHN@DOE.COM", null, "n"));

        run();
        logDoc("two case-variant connections", "u1");

        assertEquals("john@doe.com", conn("u1", 0).getString("rawId"));
        assertEquals("john@doe.com", conn("u1", 1).getString("rawId"));
        assertEquals(2, ((List<?>) reload("u1").get("connections")).size(),
                "per-document dedupe means this is one group with one owner, not a conflict");
        assertEquals(0, reportRows("u1"), "a document cannot conflict with itself");
    }

    // -------------------------------------------------------------- the race the survey cannot close

    /**
     * The survey is not atomic with the backfill, and on this codebase that window is not theoretical:
     * {@code AddSuperAdminRunner} writes the super-admin from a {@code @PostConstruct} ending in a bare
     * {@code subscribe()}, so it is unordered against Mongock on every boot, and other replicas keep
     * serving registrations throughout.
     *
     * <p>Simulated by surveying, then letting someone take the target key, then backfilling. The run must
     * absorb the duplicate key and report it — if it threw, Mongock would record the changeset FAILED and
     * the application would not start, which on a replicated deployment is a boot loop on exactly the
     * installs that most need the migration.
     */
    @Test
    public void toleratesACollisionThatAppearsAfterTheSurveyAndReportsIt() {
        insert("u2", null, connection(EMAIL, "JoHn@DoE.COM", null, "n"));
        insert("u3", null, connection(EMAIL, "Other@Example.COM", null, "n"));

        EmailNormalizationBackfill.Survey survey = EmailNormalizationBackfill.survey(users);
        assertTrue(survey.conflictingRawIds().isEmpty(), "nothing conflicts at survey time");

        // Someone registers the canonical address in the window between the two passes.
        insert("late", null, connection(EMAIL, "john@doe.com", null, "n"));

        Summary summary = EmailNormalizationBackfill.backfill(users, report, survey,
                "run-" + UUID.randomUUID(), java.time.Instant.now());
        log.info("after a late collision: {}", summary);

        assertEquals("JoHn@DoE.COM", conn("u2", 0).getString("rawId"),
                "the losing document must be left exactly as it was");
        assertEquals("other@example.com", conn("u3", 0).getString("rawId"),
                "an unordered bulk write must still apply every operation that does not collide");
        assertEquals(1, summary.collidedAtWrite());
        assertEquals(1, summary.modified(), "the collided document must not be counted as normalized");
        assertTrue(reportRows("u2") > 0, "the late collision must reach the report");
    }

    /**
     * A document the compare-and-swap filter rejects is not normalized, so it must not be counted as
     * normalized either. {@code modified} is incremented when the operation is queued, which is before
     * anyone knows whether it will land; an operator reading the summary of a production identity
     * migration has to be able to trust that number.
     */
    @Test
    public void doesNotCountADocumentTheCompareAndSwapRejectedAsModified() {
        insert("u1", null, connection(EMAIL, "JoHn@DoE.COM", null, "n"));
        Document asRead = users.find(Filters.eq("_id", "u1")).first();
        assertNotNull(asRead);
        var operation = EmailNormalizationBackfill.buildBackfillOperation(asRead, false, false);
        assertNotNull(operation, "this document does need a write");

        // Someone edits the document between the read and the write.
        users.updateOne(Filters.eq("_id", "u1"),
                new Document("$set", new Document("connections.0.rawId", "Changed@Example.COM")));

        EmailNormalizationBackfill.BulkOutcome outcome = EmailNormalizationBackfill.executeBulk(users,
                List.of(new EmailNormalizationBackfill.Op("u1", "john@doe.com", operation)), "test");
        log.info("stale write outcome: {}", outcome);

        assertEquals(1, outcome.notConverged(), "the rejected operation must be reported as not converged");
        assertTrue(outcome.collided().isEmpty(), "it is not a collision, just a stale read");
        assertEquals("Changed@Example.COM", conn("u1", 0).getString("rawId"),
                "and the concurrent edit must survive -- the migration must not clobber it");
    }

    // ------------------------------------------------------------------------------------- report

    @Test
    public void writesASummaryRow() {
        insert("u1", null, connection(EMAIL, "John@Doe.com", null, "n"));
        insert("u2", null, connection(EMAIL, "JOHN@DOE.COM", null, "n"));

        run();

        Document summary = report.find(Filters.eq("_id", "summary")).first();
        assertNotNull(summary, "an operator needs one row that states the outcome");
        log.info("summary row: {}", summary.toJson());
        assertEquals(2L, summary.getLong("scanned"));
        assertEquals(2L, summary.getLong("rawIdFrozen"));
        assertTrue(summary.getLong("conflictGroups") >= 1);
    }

    @Test
    public void reportIsIdempotentAcrossReruns() {
        insert("u1", null, connection(EMAIL, "John@Doe.com", null, "n"));
        insert("u2", null, connection(EMAIL, "JOHN@DOE.COM", null, "n"));

        run();
        long afterFirst = report.countDocuments();
        run();

        assertEquals(afterFirst, report.countDocuments(),
                "a deterministic _id must make re-runs replace rows, not accumulate them");
    }

    @Test
    public void reportDropsRowsForResolvedConflicts() {
        insert("u1", null, connection(EMAIL, "John@Doe.com", null, "n"));
        insert("u2", null, connection(EMAIL, "JOHN@DOE.COM", null, "n"));
        run();
        assertTrue(reportRows("u2") > 0);

        // The operator resolves it.
        users.deleteOne(Filters.eq("_id", "u2"));
        run();

        assertEquals(0, reportRows("u2"),
                "a resolved conflict must not haunt the report collection forever");
        assertEquals("john@doe.com", conn("u1", 0).getString("rawId"),
                "and the survivor converges on the next run");
    }

    // ------------------------------------------------------------------------- indexes and guards

    @Test
    public void ensureLookupIndexesBuildsBothAndIsRerunnable() {
        run();
        run();

        List<String> names = new ArrayList<>();
        users.listIndexes().forEach(index -> names.add(index.getString("name")));
        log.info("indexes: {}", names);
        assertTrue(names.contains("email_1"), "findByEmailDeep's email branch must be indexed");
        assertTrue(names.contains("connections.email_1"),
                "and its connections.email branch too -- an $or degrades to a collection scan unless "
                        + "every branch has an index");
    }

    /**
     * {@code @ActiveProfiles} replaces the active profiles rather than adding to them, so the eight test
     * classes that name their own profile do not have {@code test} active, {@code @Profile("!test")}
     * matches, and Mongock really does run this changeset at their context startup — against a database
     * their fixtures have not populated yet.
     */
    @Test
    public void runIsANoOpWhenTheUserCollectionIsAbsent() {
        Summary summary = EmailNormalizationBackfill.run(db, "absent_" + UUID.randomUUID(), reportName);
        log.info("absent-collection run: {}", summary);
        assertEquals(0, summary.scanned());
        assertEquals(0, summary.modified());
    }

    @Test
    public void runIsANoOpOnAnEmptyCollection() {
        Summary summary = run();
        assertEquals(0, summary.scanned());
        assertEquals(0, summary.modified());
    }
}
