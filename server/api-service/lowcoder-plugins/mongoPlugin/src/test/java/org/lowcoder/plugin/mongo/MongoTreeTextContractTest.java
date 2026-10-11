package org.lowcoder.plugin.mongo;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import org.bson.Document;
import org.bson.json.JsonMode;
import org.bson.json.JsonWriterSettings;
import org.bson.types.Decimal128;
import org.bson.types.ObjectId;
import org.json.JSONObject;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mongo.model.MongoDatasourceConfig;
import org.lowcoder.plugin.mongo.utils.MongoQueryUtils;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.util.MustacheHelper;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

/**
 * Group {@code tree-text}, its {@code mongoPlugin} rows (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T8.4):
 * <ul>
 *   <li>{@code MongoEngine.buildQueryExecutionContext} renders a raw command, and the BSON fields of a GUI command
 *       ({@code evaluateString}), with {@code renderMustacheJsonString}, whose text is {@code JsonNode#toString} (E13),
 *       and parses that text into the command {@link Document}. Each line of {@link #COMMANDS} pins the exact text
 *       {@code renderMustacheJsonString} gives for the caller's own arguments (the raw command, or each BSON field of
 *       the GUI form, with the request parameters), then the command the engine built, as extended JSON, which keeps
 *       the BSON type of every number.</li>
 *   <li>{@code MongoQueryUtils.parseResultBody} builds a {@code distinct} result as a node and re-reads its
 *       {@code toString} text ({@code MongoQueryUtils.java:193-204}): the resulting node is pinned by its
 *       {@code toString} and its production-mapper text.</li>
 * </ul>
 * Pinned in {@value #COMMANDS_REPORT} and {@value #DISTINCT_REPORT}.
 *
 * <p>Limits: the engine keeps its rendered text internal, so the test renders it by calling the same static helper with
 * the same arguments the engine passes ({@code MongoPlugin.java:178}, {@code :249}); the built command shows the
 * engine read that text. The special types ({@code ObjectId(...)}) are rewritten after rendering; that rewrite is
 * {@code downstream-render}'s (T8.5).
 */
public class MongoTreeTextContractTest {

    static final String COMMANDS_REPORT = "tree-text/MongoEngine.commands.txt";
    static final String DISTINCT_REPORT = "tree-text/MongoQueryUtils.distinct.txt";
    static final String COLLECTION = "items";
    static final String FIELD_PREFIX = "comp";
    /** The form fields the engine renders as JSON: the raw command and the BSON fields of the GUI commands. */
    static final Set<String> BSON_FIELDS = Set.of("command", "query", "sort", "projection", "documents", "update", "arrayPipelines");
    static final String SEPARATOR = "\t";
    static final String NEWLINE = "\n";
    static final JsonWriterSettings EXTENDED = JsonWriterSettings.builder().outputMode(JsonMode.EXTENDED).build();
    static final Map<String, Object> PARAMS = params();
    static final Map<String, Map<String, Object>> COMMANDS = commands();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private final MongoPlugin.MongoEngine engine = new MongoPlugin.MongoEngine(new ConfigCenterForTest());
    private final MongoDatasourceConfig datasourceConfig = MongoDatasourceConfig.buildFrom(Map.of("database", "contract", "host", "localhost"));

    @BoundarySites({
            "lowcoder-plugins/mongoPlugin/src/main/java/org/lowcoder/plugin/mongo/MongoPlugin.java#MongoPlugin.MongoEngine.buildQueryExecutionContext#renderMustacheJsonString#1",
            "lowcoder-plugins/mongoPlugin/src/main/java/org/lowcoder/plugin/mongo/MongoPlugin.java#MongoPlugin.MongoEngine.evaluateString#renderMustacheJsonString#1"})
    @Test
    public void commandsAsParsed() {
        StringBuilder text = new StringBuilder();
        COMMANDS.forEach((name, queryConfig) -> {
            text.append(name).append(SEPARATOR).append(renderedText(queryConfig)).append(SEPARATOR);
            String command;
            try {
                command = engine.buildQueryExecutionContext(datasourceConfig, queryConfig, PARAMS, null).getCommand().toJson(EXTENDED);
            } catch (RuntimeException e) {
                command = "ERROR " + ConfigBinding.errorText(e);
            }
            text.append(command).append(NEWLINE);
        });
        System.out.println("[MongoTreeTextContractTest] commands\n" + text);
        GOLDEN.assertText(COMMANDS_REPORT, text.toString());
    }

    @BoundarySites("lowcoder-plugins/mongoPlugin/src/main/java/org/lowcoder/plugin/mongo/utils/MongoQueryUtils.java#<file>#import#1")
    @Test
    public void distinctResultNode() throws JsonProcessingException {
        Document reply = new Document("values", List.of(1, 3_000_000_001L, 2.5, "žluť \"quoted\"", new ObjectId("65f0c0ffee0000000000abcd"),
                new Decimal128(new BigDecimal("10.50")), new Document("nested", List.of(true)))).append("ok", 1.0);
        JsonNode node = MongoQueryUtils.parseResultBody(new JSONObject(reply.toJson()));
        String text = "toString" + SEPARATOR + node + NEWLINE
                + "production" + SEPARATOR + JsonUtils.getObjectMapper().writeValueAsString(node) + NEWLINE;
        System.out.println("[MongoTreeTextContractTest] distinct\n" + text);
        GOLDEN.assertText(DISTINCT_REPORT, text);
    }

    /**
     * The text {@code renderMustacheJsonString} gives for what the engine renders: the raw command, or each BSON
     * field of the GUI form ({@code comp.<field>}, in name order), with the request parameters.
     */
    @SuppressWarnings("unchecked")
    private static String renderedText(Map<String, Object> queryConfig) {
        Map<String, Object> comp = (Map<String, Object>) queryConfig.get(FIELD_PREFIX);
        StringBuilder rendered = new StringBuilder();
        new TreeMap<>(comp).forEach((field, value) -> {
            if (BSON_FIELDS.contains(field)) {
                rendered.append(field).append('=').append(outcome(() -> MustacheHelper.renderMustacheJsonString((String) value, PARAMS))).append(' ');
            }
        });
        return rendered.toString().trim();
    }

    private static String outcome(java.util.function.Supplier<String> render) {
        try {
            return render.get();
        } catch (RuntimeException e) {
            return "ERROR " + ConfigBinding.errorText(e);
        }
    }

    private static Map<String, Object> params() {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("price", 1.5);
        params.put("count", 3_000_000_001L);
        params.put("q", "kůň \"quoted\" \\");
        params.put("tags", List.of("a", 2, 2.50));
        Map<String, Object> range = new LinkedHashMap<>();
        range.put("$gte", new BigDecimal("1.50"));
        range.put("$lt", 3_000_000_001L);
        params.put("range", range);
        params.put("filter", Map.of("n", new BigInteger("9223372036854775808")));
        return params;
    }

    /** A GUI form as the editor sends it: the command type and collection at the top, the fields under "comp". */
    static Map<String, Object> form(String type, Map<String, Object> fields) {
        Map<String, Object> form = new HashMap<>();
        form.put("compType", type);
        form.put("collection", COLLECTION);
        form.put(FIELD_PREFIX, new HashMap<>(fields));
        return form;
    }

    private static Map<String, Map<String, Object>> commands() {
        Map<String, Map<String, Object>> commands = new LinkedHashMap<>();
        commands.put("raw", form("RAW", Map.of("command", "{\"find\": \"items\", \"filter\": {\"price\": {\"$gte\": {{price}}}, "
                + "\"count\": {{count}}, \"name\": \"{{q}}\", \"tags\": {\"$in\": {{tags}}}, \"range\": {{range}}}, \"limit\": 1.50, \"skip\": 2147483648}")));
        commands.put("rawBigIntegerInMap", form("RAW", Map.of("command", "{\"find\": \"items\", \"filter\": {{filter}}}")));
        commands.put("guiFind", form("FIND", Map.of("query", "{\"price\": {{price}}, \"name\": \"{{q}}\", \"range\": {{range}}}",
                "sort", "{\"price\": -1}", "projection", "{\"name\": 1.0}", "limit", "10")));
        commands.put("guiInsert", form("INSERT", Map.of("documents", "[{\"n\": {{count}}, \"t\": {{tags}}}]")));
        commands.put("rawInvalid", form("RAW", Map.of("command", "{\"find\": ")));
        return commands;
    }
}
