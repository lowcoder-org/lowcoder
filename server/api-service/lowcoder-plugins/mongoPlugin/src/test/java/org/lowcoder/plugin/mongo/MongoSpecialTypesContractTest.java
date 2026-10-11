package org.lowcoder.plugin.mongo;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mongo.model.MongoDatasourceConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.exception.PluginException;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Group {@code downstream-render}, its {@code mongoPlugin} row (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T8.5): after
 * rendering a raw command or a BSON field of a GUI command, {@code MongoEngine.removeOrAddQuotesAroundSpecialTypes}
 * rewrites a quoted special type ({@code "ObjectId('x')"}, {@code ISODate}, {@code Date}, {@code Timestamp}) into the
 * unquoted shell form, writing the argument of the types that take a string as the production mapper's JSON string
 * ({@code toJson}); the engine then parses the text into the command. For each command of {@link #COMMANDS}, run with
 * the request parameters {@link #PARAMS}, the command the engine built is pinned as extended JSON (which keeps the
 * BSON type of every value), one line per command ({@link GoldenJson#assertText}), in {@value #FIXTURE}.
 *
 * <p>Limits: the rewritten text is internal to the engine; the built command is what it produces. The command is not
 * sent to a server. {@code Date(...)} is not run: the command parser reads it as the shell's {@code Date()}, the current
 * time as text, whatever the argument, so it has no stable result.
 */
public class MongoSpecialTypesContractTest {

    static final String FIXTURE = "downstream-render/MongoEngine.specialTypes.txt";
    static final String SEPARATOR = "\t";
    static final String NEWLINE = "\n";
    static final Map<String, Object> PARAMS = params();
    static final Map<String, Map<String, Object>> COMMANDS = commands();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private final MongoPlugin.MongoEngine engine = new MongoPlugin.MongoEngine(new ConfigCenterForTest());
    private final MongoDatasourceConfig datasourceConfig = MongoDatasourceConfig.buildFrom(Map.of("database", "contract", "host", "localhost"));

    @BoundarySites("lowcoder-plugins/mongoPlugin/src/main/java/org/lowcoder/plugin/mongo/MongoPlugin.java#MongoPlugin.MongoEngine.removeOrAddQuotesAroundSpecialTypes#toJson#1")
    @Test
    public void commandsAsBuilt() {
        StringBuilder text = new StringBuilder();
        COMMANDS.forEach((name, queryConfig) -> {
            String command;
            try {
                command = engine.buildQueryExecutionContext(datasourceConfig, queryConfig, PARAMS, null).getCommand()
                        .toJson(MongoTreeTextContractTest.EXTENDED);
            } catch (PluginException e) {
                command = "ERROR " + ConfigBinding.errorText(e) + " " + Arrays.toString(e.getArgs());
            }
            text.append(name).append(SEPARATOR).append(command).append(NEWLINE);
        });
        System.out.println("[MongoSpecialTypesContractTest] " + FIXTURE + "\n" + text);
        GOLDEN.assertText(FIXTURE, text.toString());
    }

    private static Map<String, Object> params() {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("id", "65f0c0ffee0000000000abcd");
        params.put("day", "2024-02-29T13:14:15.123Z");
        params.put("seconds", 1_709_212_455L);
        params.put("quoted", "it's \"q\" \\");
        return params;
    }

    /** A raw {@code find} command whose filter is {@code filter}. */
    private static Map<String, Object> raw(String filter) {
        return MongoTreeTextContractTest.form("RAW", Map.of("command", "{\"find\": \"items\", \"filter\": {" + filter + "}}"));
    }

    private static Map<String, Map<String, Object>> commands() {
        Map<String, Map<String, Object>> commands = new LinkedHashMap<>();
        commands.put("rawObjectId", raw("\"_id\": \"ObjectId('{{id}}')\""));
        commands.put("rawObjectIdSpaced", raw("\"_id\": \"ObjectId( '{{id}}' )\""));
        commands.put("rawIsoDate", raw("\"day\": \"ISODate('{{day}}')\""));
        commands.put("rawIsoDateDoubleQuoted", raw("\"day\": \"ISODate(\\\"{{day}}\\\")\""));
        commands.put("rawTimestamp", raw("\"ts\": \"Timestamp({{seconds}}, 1)\""));
        commands.put("rawSeveral", raw("\"_id\": \"ObjectId('{{id}}')\", \"day\": \"ISODate('{{day}}')\", \"ts\": \"Timestamp({{seconds}}, 1)\""));
        commands.put("rawUnquotedArgument", raw("\"_id\": \"ObjectId({{id}})\""));
        commands.put("rawQuotedText", raw("\"day\": \"ISODate('{{quoted}}')\""));
        commands.put("guiFind", MongoTreeTextContractTest.form("FIND", Map.of("query",
                "{\"_id\": \"ObjectId('{{id}}')\", \"day\": {\"$lt\": \"ISODate('{{day}}')\"}}", "limit", "1")));
        return commands;
    }
}
