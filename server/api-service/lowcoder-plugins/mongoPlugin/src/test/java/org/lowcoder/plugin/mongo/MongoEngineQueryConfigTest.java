package org.lowcoder.plugin.mongo;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mongo.model.MongoDatasourceConfig;
import org.lowcoder.plugin.mongo.model.MongoQueryExecutionContext;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.exception.PluginException;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_QUERY_SETTINGS;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;

/**
 * Unit MG-5 (task L5-8c): {@code MongoEngine.buildQueryExecutionContext}: how the query config the client sends and the
 * request parameters become the command and the database name: the raw-command branch (its three error codes), the GUI
 * branch (template rendering of each field, BSON fields as JSON, the others as text), the leaf-type check with its dotted
 * path, and the wrapping of command errors (a coded command error keeps its key, BF-117). The special-type rewriting of rendered text is covered by
 * {@code MongoSpecialTypesContractTest}; the command documents themselves by {@code MongoCommandDocumentsTest}.
 *
 * <p>Limits: nothing is sent to a server (MG-6).
 */
public class MongoEngineQueryConfigTest {

    static final String DATABASE = "shop";
    static final String INVALID_SETTINGS = "INVALID_QUERY_SETTINGS";
    /** INVALID_JSON_FORMAT of "Documents" in locale_en. */
    static final String INVALID_JSON_DOCUMENTS_TEXT = "Invalid query configuration: not a valid JSON Documents.";

    private final MongoPlugin.MongoEngine engine = new MongoPlugin.MongoEngine(new ConfigCenterForTest());
    private final MongoDatasourceConfig datasourceConfig = MongoDatasourceConfig.buildFrom(Map.of("database", DATABASE, "host", "localhost"));

    private MongoQueryExecutionContext build(Map<String, Object> queryConfig, Map<String, Object> params) {
        MongoQueryExecutionContext context = engine.buildQueryExecutionContext(datasourceConfig, queryConfig, params, null);
        System.out.println("[MongoEngineQueryConfigTest] " + queryConfig + " " + params + " -> " + context.getDatabaseName() + " " + context.getCommand().toJson());
        return context;
    }

    private PluginException failure(Map<String, Object> queryConfig, Map<String, Object> params) {
        PluginException thrown = assertThrows(PluginException.class, () -> engine.buildQueryExecutionContext(datasourceConfig, queryConfig, params, null));
        System.out.println("[MongoEngineQueryConfigTest] " + queryConfig + " " + params + " -> " + thrown.getMessageKey() + " " + Arrays.toString(thrown.getArgs()));
        return thrown;
    }

    private static Map<String, Object> raw(Object command) {
        Map<String, Object> comp = new HashMap<>();
        comp.put("command", command);
        Map<String, Object> config = new HashMap<>();
        config.put("compType", "RAW");
        config.put("comp", comp);
        return config;
    }

    private static Map<String, Object> gui(String type, Object collection, Map<String, Object> comp) {
        Map<String, Object> config = new HashMap<>();
        config.put("compType", type);
        config.put("collection", collection);
        config.put("comp", comp);
        return config;
    }

    @Test
    public void rawCommandIsRenderedWithJsonEscapedParametersAndParsed() {
        MongoQueryExecutionContext context = build(raw("{\"find\": \"{{table}}\", \"filter\": {\"name\": {{name}}, \"age\": {{age}}}}"),
                Map.of("table", "users", "name", "a\"b", "age", 7));
        assertEquals(DATABASE, context.getDatabaseName());
        assertEquals(Document.parse("{\"find\": \"users\", \"filter\": {\"name\": \"a\\\"b\", \"age\": 7}}"), context.getCommand());
    }

    @Test
    public void rawCommandBodyMustBeANonBlankString() {
        PluginException notString = failure(raw(5), Map.of());
        assertEquals(INVALID_QUERY_SETTINGS, notString.getError());
        assertEquals("INVALID_RAW_REQUEST_PARAM", notString.getMessageKey());
        assertEquals("INVALID_RAW_REQUEST_PARAM", failure(raw(null), Map.of()).getMessageKey());
        assertEquals("RAW_REQUEST_PARAM_EMPTY", failure(raw("   "), Map.of()).getMessageKey());
        assertEquals("RAW_REQUEST_PARAM_EMPTY", failure(raw(""), Map.of()).getMessageKey());
    }

    @Test
    public void rawCommandThatIsNotJsonIsWrappedAsInvalidQuerySettings() {
        PluginException thrown = failure(raw("{\"find\": "), Map.of());
        assertEquals(INVALID_QUERY_SETTINGS, thrown.getError());
        assertEquals(INVALID_SETTINGS, thrown.getMessageKey());
        assertEquals(1, thrown.getArgs().length, "the parser's message is the one argument");
    }

    /**
     * BF-117: what the user receives for a GUI field that is no document. The command's coded error (here INVALID_JSON_FORMAT
     * of "Documents") reaches the caller with its key, as on the raw path; before, every error of {@code parseCommand} was
     * wrapped as INVALID_QUERY_SETTINGS, so a BsonInvalidOperationException's text ("readStartDocument can only be called
     * when CurrentBSONType is DOCUMENT, not when CurrentBSONType is ARRAY.") reached the user, and a coded error lost its key.
     */
    @Test
    public void aGuiFieldThatIsNoDocumentReachesTheCallerAsItsCodedErrorBF117() {
        Map<String, Object> comp = new HashMap<>();
        comp.put("documents", "[}");
        PluginException thrown = failure(gui("INSERT", "c", comp), Map.of());
        assertEquals(QUERY_ARGUMENT_ERROR, thrown.getError());
        assertEquals("INVALID_JSON_FORMAT", thrown.getMessageKey());
        assertEquals("Documents", thrown.getArgs()[0]);
        assertEquals(INVALID_JSON_DOCUMENTS_TEXT, thrown.getMessage());
    }

    @Test
    public void guiFieldsAreRenderedByKind() {
        Map<String, Object> comp = new HashMap<>();
        comp.put("query", "{\"name\": {{name}}, \"n\": {{n}}}");
        comp.put("limit", "{{n}}");
        comp.put("skip", "{{n}}");
        MongoQueryExecutionContext context = build(gui("FIND", "{{coll}}", comp), Map.of("name", "o'neil", "n", 3, "coll", "people"));
        Document command = context.getCommand();
        assertEquals("people", command.get("find"), "the collection is rendered as text");
        assertEquals(Document.parse("{\"name\": \"o'neil\", \"n\": 3}"), command.get("filter"), "a BSON field is rendered as JSON");
        assertEquals(3, command.get("limit"));
        assertEquals(3L, command.get("skip"));
        assertEquals(DATABASE, context.getDatabaseName());
    }

    @Test
    public void guiBsonFieldsAreJsonEscapedWhileTextFieldsAreNot() {
        Map<String, Object> filter = new HashMap<>();
        filter.put("query", "{\"name\": {{name}}}");
        Document json = build(gui("COUNT", "c", filter), Map.of("name", "x\"y")).getCommand();
        assertEquals(Document.parse("{\"name\": \"x\\\"y\"}"), json.get("query"), "a quote in the value stays inside the string");
        Map<String, Object> key = new HashMap<>();
        key.put("key", "{{k}}");
        assertEquals("x\"y", build(gui("DISTINCT", "c", key), Map.of("k", "x\"y")).getCommand().get("key"), "the distinct key is text: rendered verbatim");
    }

    @Test
    public void guiAllBsonFieldsOfEveryCommandAreRendered() {
        Map<String, Object> params = Map.of("v", 1);
        Map<String, Object> update = new HashMap<>();
        update.put("query", "{\"a\": {{v}}}");
        update.put("update", "{\"$set\": {\"b\": {{v}}}}");
        Document updated = build(gui("UPDATE", "c", update), params).getCommand();
        Document statement = (Document) ((List<?>) updated.get("updates")).get(0);
        assertEquals(Document.parse("{\"a\": 1}"), statement.get("q"));
        assertEquals(Document.parse("{\"$set\": {\"b\": 1}}"), statement.get("u"));

        Map<String, Object> delete = new HashMap<>();
        delete.put("query", "{\"a\": {{v}}}");
        assertEquals(Document.parse("{\"a\": 1}"), ((Document) ((List<?>) build(gui("DELETE", "c", delete), params).getCommand().get("deletes")).get(0)).get("q"));

        Map<String, Object> insert = new HashMap<>();
        insert.put("documents", "{\"a\": {{v}}}");
        assertEquals(List.of(Document.parse("{\"a\": 1}")), build(gui("INSERT", "c", insert), params).getCommand().get("documents"));

        Map<String, Object> find = new HashMap<>();
        find.put("sort", "{\"a\": {{v}}}");
        find.put("projection", "{\"a\": {{v}}}");
        Document found = build(gui("FIND", "c", find), params).getCommand();
        assertEquals(Document.parse("{\"a\": 1}"), found.get("sort"));
        assertEquals(Document.parse("{\"a\": 1}"), found.get("projection"));

        Map<String, Object> distinct = new HashMap<>();
        distinct.put("key", "k");
        distinct.put("query", "{\"a\": {{v}}}");
        assertEquals(Document.parse("{\"a\": 1}"), build(gui("DISTINCT", "c", distinct), params).getCommand().get("query"));

        Map<String, Object> aggregate = new HashMap<>();
        aggregate.put("arrayPipelines", "[{\"$match\": {\"a\": {{v}}}}]");
        aggregate.put("limit", "10");
        Document aggregated = build(gui("AGGREGATE", "c", aggregate), params).getCommand();
        assertEquals("[{\"$match\": {\"a\": 1}}]", ((org.bson.BsonArray) aggregated.get("pipeline")).toString().replace("{\"$numberInt\": \"1\"}", "1").replace("BsonArray{values=", "").replace("}]}", "}]"));
    }

    @Test
    public void aValueThatIsNotTextAtAnyDepthIsRejectedWithItsDottedPathAndType() {
        Map<String, Object> comp = new HashMap<>();
        comp.put("limit", 5);
        PluginException direct = failure(gui("FIND", "c", comp), Map.of());
        assertEquals(INVALID_QUERY_SETTINGS, direct.getError());
        assertEquals("INVALID_FORMAT", direct.getMessageKey());
        assertEquals("comp.limit", direct.getArgs()[0]);
        assertEquals("Integer", direct.getArgs()[1]);

        PluginException top = failure(gui("FIND", 7L, new HashMap<>()), Map.of());
        assertEquals("INVALID_FORMAT", top.getMessageKey());
        assertEquals("collection", top.getArgs()[0]);
        assertEquals("Long", top.getArgs()[1]);

        Map<String, Object> listed = new HashMap<>();
        listed.put("query", List.of("{}", true));
        PluginException inList = failure(gui("FIND", "c", listed), Map.of());
        assertEquals("comp.query", inList.getArgs()[0]);
        assertEquals("Boolean", inList.getArgs()[1]);
    }

    @Test
    public void nullValuesAreKeptAndTheCallersConfigIsNotChanged() {
        Map<String, Object> comp = new HashMap<>();
        comp.put("query", "{\"a\": {{v}}}");
        comp.put("sort", null);
        Map<String, Object> config = gui("FIND", "c", comp);
        Map<String, Object> before = new HashMap<>(config);
        Document command = build(config, Map.of("v", 1)).getCommand();
        assertEquals(Document.parse("{\"a\": 1}"), command.get("filter"));
        assertEquals(false, command.containsKey("sort"));
        assertEquals(before, config);
        assertEquals("{\"a\": {{v}}}", ((Map<?, ?>) config.get("comp")).get("query"), "the template in the caller's map is untouched");
    }

    /**
     * A command error that is not coded (here Find's {@code Long.parseLong} of a skip that is no number) is wrapped as
     * INVALID_QUERY_SETTINGS with its message; a coded one keeps its key (BF-117: it was wrapped too), as do validation errors.
     */
    @Test
    public void uncodedCommandErrorsAreWrappedAsInvalidQuerySettingsWhileCodedOnesPassThroughBF117() {
        Map<String, Object> skip = new HashMap<>();
        skip.put("skip", "ten");
        PluginException wrapped = failure(gui("FIND", "c", skip), Map.of());
        assertEquals(INVALID_QUERY_SETTINGS, wrapped.getError());
        assertEquals(INVALID_SETTINGS, wrapped.getMessageKey());
        assertEquals(1, wrapped.getArgs().length, "the original message is the argument");
        assertEquals("For input string: \"ten\"", wrapped.getArgs()[0]);

        Map<String, Object> comp = new HashMap<>();
        comp.put("query", "{\"a\": ");
        PluginException coded = failure(gui("FIND", "c", comp), Map.of());
        assertEquals(QUERY_ARGUMENT_ERROR, coded.getError());
        assertEquals("INVALID_JSON_FORMAT", coded.getMessageKey());
        assertEquals("Query", coded.getArgs()[0]);

        PluginException invalid = failure(gui("DELETE", "c", new HashMap<>()), Map.of());
        assertEquals("INVALID_PARAM_CONFIG_PLZ_CHECK", invalid.getMessageKey());
        assertEquals(List.of("Query"), invalid.getArgs()[0]);

        PluginException unknown = failure(gui("MERGE", "c", new HashMap<>()), Map.of());
        assertEquals("INVALID_MONGODB_REQUEST", unknown.getMessageKey());
    }
}
