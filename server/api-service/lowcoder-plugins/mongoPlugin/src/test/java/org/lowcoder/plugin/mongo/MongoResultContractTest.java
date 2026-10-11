package org.lowcoder.plugin.mongo;

import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoDatabase;
import org.bson.Document;
import org.bson.types.Decimal128;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mongo.model.MongoConnection;
import org.lowcoder.plugin.mongo.model.MongoQueryExecutionContext;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.QueryResults;
import org.lowcoder.sdk.models.QueryExecutionResult;
import reactor.core.publisher.Mono;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Group {@code external-json} of the Mongo plugin and its row of the §4.6 producer table (docs/API_PAYLOAD_TEST_PLAN.md
 * §4.6, §4.10, task T8.2): {@code MongoEngine.executeQuery} with a {@link MongoClient} whose database answers each
 * reply of {@link #REPLIES} to {@code runCommand}. The engine writes the reply with BSON's relaxed extended JSON
 * ({@code Document.toJson}), reads it into {@code org.json}, and {@code MongoQueryUtils.parseResultBody} rewrites the
 * {@code $oid}, {@code $numberLong}, {@code $date} and {@code $numberDecimal} wrappers and reads the text into a
 * Jackson tree, once per reply kind: a {@code findAndModify} {@code value}, a {@code find} cursor, an insert's
 * {@code n}, an update's {@code nModified}, a {@code distinct}'s {@code values}, a reply of none of those, and a reply
 * that is not {@code ok}. The {@code org.json} step loses the document's key order, writes a whole double as an
 * integer and a {@code Decimal128} as a double, and fails the whole query on a date before 1970 (O75). Each case's report ({@link QueryResults#report}) is pinned in {@value #REPORT}.
 *
 * <p>Limits: the reply is a {@link Document} handed to the engine, not one read from a server; dates are formatted in
 * the JVM's default zone ({@code MongoQueryUtils.FORMATTER}), so the test checks each against that formatting and pins
 * the instant in its place ({@link #pinnedDates}).
 */
public class MongoResultContractTest {

    static final String REPORT = "external-json/MongoEngine.results.json";
    static final String DATE_PATTERN = "yyyy-MM-dd HH:mm:ss";
    static final String DATE_TOKEN_PREFIX = "<date in the JVM zone: ";
    static final String DATE_TOKEN_SUFFIX = ">";
    static final String DATABASE = "contract";
    static final String OK = "ok";
    static final double OK_VALUE = 1.0;
    static final double NOT_OK_VALUE = 0.0;
    static final Instant DATE = Instant.parse("2024-02-29T23:59:58Z");
    static final Instant PRE_EPOCH_DATE = Instant.parse("1969-07-20T20:17:40Z");
    static final ObjectId OBJECT_ID = new ObjectId("65f0c0ffee0000000000abcd");
    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final Map<String, Document> REPLIES = replies();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private final MongoPlugin.MongoEngine engine = new MongoPlugin.MongoEngine(new ConfigCenterForTest());

    @BoundarySites({
            "lowcoder-plugins/mongoPlugin/src/main/java/org/lowcoder/plugin/mongo/MongoPlugin.java#MongoPlugin.MongoEngine.executeQuery#parseResultBody#1",
            "lowcoder-plugins/mongoPlugin/src/main/java/org/lowcoder/plugin/mongo/utils/MongoQueryUtils.java#MongoQueryUtils.parseResultBody#readTree#1",
            "lowcoder-plugins/mongoPlugin/src/main/java/org/lowcoder/plugin/mongo/utils/MongoQueryUtils.java#MongoQueryUtils.parseResultBody#readTree#2",
            "lowcoder-plugins/mongoPlugin/src/main/java/org/lowcoder/plugin/mongo/utils/MongoQueryUtils.java#MongoQueryUtils.parseResultBody#readTree#3",
            "lowcoder-plugins/mongoPlugin/src/main/java/org/lowcoder/plugin/mongo/utils/MongoQueryUtils.java#MongoQueryUtils.parseResultBody#readTree#4",
            "lowcoder-plugins/mongoPlugin/src/main/java/org/lowcoder/plugin/mongo/utils/MongoQueryUtils.java#MongoQueryUtils.parseResultBody#readTree#5",
            "lowcoder-plugins/mongoPlugin/src/main/java/org/lowcoder/plugin/mongo/utils/MongoQueryUtils.java#MongoQueryUtils.parseResultBody#readTree#6"})
    @Test
    public void resultsAsPinned() {
        Map<String, Object> report = new LinkedHashMap<>();
        REPLIES.forEach((name, reply) -> report.put(name, report(reply)));
        String actual = pinnedDates(ConfigBinding.write(report));
        System.out.println("[MongoResultContractTest] zone " + ZoneId.systemDefault() + "\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    /** The report of the engine's result for {@code reply}, or the error text when the query fails. */
    private Object report(Document reply) {
        MongoQueryExecutionContext context = MongoQueryExecutionContext.builder()
                .databaseName(DATABASE).command(new Document("contract", 1)).build();
        try {
            QueryExecutionResult result = engine.executeQuery(connection(reply), context).block(TIMEOUT);
            return result == null ? null : QueryResults.report(result);
        } catch (RuntimeException e) {
            return Map.of(QueryResults.ERROR_KEY, ConfigBinding.errorText(e));
        }
    }

    /**
     * {@code text} with each date of {@link #DATE} and {@link #PRE_EPOCH_DATE} as the engine formats it in the JVM
     * zone replaced by a token naming the instant; asserts the formatted text is there, so the formatting stays pinned.
     */
    static String pinnedDates(String text) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DATE_PATTERN).withZone(ZoneId.systemDefault());
        String formatted = formatter.format(DATE);
        assertTrue(text.contains(formatted), "the report has the date formatted in the JVM zone: " + formatted);
        return text.replace(formatted, DATE_TOKEN_PREFIX + DATE + DATE_TOKEN_SUFFIX)
                .replace(formatter.format(PRE_EPOCH_DATE), DATE_TOKEN_PREFIX + PRE_EPOCH_DATE + DATE_TOKEN_SUFFIX);
    }

    /** A connection whose database answers {@code reply} to every command; any other call fails. */
    static MongoConnection connection(Document reply) {
        MongoDatabase database = proxy(MongoDatabase.class, "runCommand", Mono.just(reply));
        return new MongoConnection(proxy(MongoClient.class, "getDatabase", database), DATABASE);
    }

    private static <T> T proxy(Class<T> type, String method, Object answer) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[] {type}, (self, called, args) -> {
            if (called.getName().equals(method)) {
                return answer;
            }
            throw new UnsupportedOperationException(type.getSimpleName() + "." + called.getName());
        }));
    }

    /** A document of every BSON type the plugin rewrites, plus JSON scalars, in an order a sorted map would change. */
    static Document document() {
        return new Document("zeta", "first key")
                .append("_id", OBJECT_ID)
                .append("int", 1)
                .append("intMax", Integer.MAX_VALUE)
                .append("long", 3_000_000_001L)
                .append("longMax", Long.MAX_VALUE)
                .append("decimal128", new Decimal128(new BigDecimal("1.50")))
                .append("double", 1.5)
                .append("wholeDouble", 2.0)
                .append("bigDouble", 1e20)
                .append("date", Date.from(DATE))
                .append("unicode", "žluťoučký kůň 🐎")
                .append("null", null)
                .append("true", true)
                .append("emptyObject", new Document())
                .append("emptyArray", List.of())
                .append("nested", new Document("ids", List.of(OBJECT_ID, 7L, new Document("at", Date.from(DATE)))))
                .append("alpha", "last key");
    }

    private static Map<String, Document> replies() {
        Map<String, Document> replies = new LinkedHashMap<>();
        replies.put("findAndModify", new Document("lastErrorObject", new Document("n", 1).append("updatedExisting", true))
                .append("value", document()).append(OK, OK_VALUE));
        replies.put("find", new Document("cursor", new Document("firstBatch", List.of(document(), new Document("_id", 2)))
                .append("id", 0L).append("ns", "contract.items")).append(OK, OK_VALUE));
        replies.put("findPreEpochDate", new Document("cursor", new Document("firstBatch",
                List.of(new Document("date", Date.from(PRE_EPOCH_DATE)))).append("id", 0L)).append(OK, OK_VALUE));
        replies.put("insert", new Document("n", 3_000_000_001L).append(OK, OK_VALUE));
        replies.put("update", new Document("nModified", 2).append(OK, OK_VALUE));
        replies.put("updateWithN", new Document("n", 2).append("nModified", 1).append(OK, OK_VALUE));
        replies.put("distinct", new Document("values", List.of(1, "two", OBJECT_ID, 2.5, 3_000_000_001L,
                new Decimal128(new BigDecimal("10.50")), Date.from(DATE))).append(OK, OK_VALUE));
        replies.put("other", new Document("acknowledged", true).append(OK, OK_VALUE));
        replies.put("notOk", new Document("errmsg", "failed").append(OK, NOT_OK_VALUE));
        return replies;
    }
}
