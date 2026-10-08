package org.lowcoder.plugin.redis;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.redis.model.RedisDatasourceConfig;
import org.lowcoder.plugin.redis.model.RedisQueryExecutionContext;
import org.lowcoder.sdk.exception.PluginException;
import redis.clients.jedis.Protocol;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;

/**
 * Unit RD-3 (task L5-9): {@code RedisEngine.validateConfig} and {@code buildQueryExecutionContext}: the raw command text
 * parser (quotes, whitespace, case, template rendering), the form branch's template rendering, and the failures of a blank
 * or unknown raw command (defect D7).
 *
 * <p>Limits: nothing is sent to a server (RD-6).
 */
public class RedisEngineQueryConfigTest {

    static final String TAG = "[RedisEngineQueryConfigTest] ";
    static final String HOST = "cache.example.org";

    private final RedisPlugin.RedisEngine engine = new RedisPlugin.RedisEngine();
    private final RedisDatasourceConfig datasource = RedisDatasourceConfig.buildFrom(Map.of("host", HOST));

    private RedisQueryExecutionContext raw(String command, Map<String, Object> params) {
        Map<String, Object> config = new HashMap<>();
        config.put("compType", "RAW");
        config.put("comp", new HashMap<>(Map.of("command", command)));
        RedisQueryExecutionContext context = engine.buildQueryExecutionContext(datasource, config, params, null);
        System.out.println(TAG + "raw [" + command + "] " + params + " -> " + context.getProtocolCommand() + " " + Arrays.toString(context.getArgs()));
        return context;
    }

    private RedisQueryExecutionContext raw(String command) {
        return raw(command, Map.of());
    }

    private RedisQueryExecutionContext form(String type, Map<String, Object> comp, Map<String, Object> params) {
        Map<String, Object> config = new HashMap<>();
        config.put("compType", type);
        config.put("comp", new HashMap<>(comp));
        RedisQueryExecutionContext context = engine.buildQueryExecutionContext(datasource, config, params, null);
        System.out.println(TAG + "form " + type + " " + comp + " " + params + " -> " + context.getProtocolCommand() + " " + Arrays.toString(context.getArgs()));
        return context;
    }

    // ---- validateConfig

    private Set<String> invalids(Map<String, Object> values) {
        return engine.validateConfig(RedisDatasourceConfig.buildFrom(values));
    }

    @Test
    public void validateConfigRejectsLoopbackBlankHostMissingPortAndBlankUri() {
        assertEquals(Set.of(), invalids(Map.of("host", HOST, "port", 6379)));
        assertEquals(Set.of("INVALID_HOST", "PORT_EMPTY"), invalids(Map.of("host", "localhost")));
        assertEquals(Set.of("INVALID_HOST"), invalids(Map.of("host", "LocalHost", "port", 1)));
        assertEquals(Set.of("INVALID_HOST"), invalids(Map.of("host", "127.0.0.1", "port", 1)));
        assertEquals(Set.of("HOST_EMPTY_PLZ_CHECK", "PORT_EMPTY"), invalids(Map.of("host", "  ")));
        assertEquals(Set.of("HOST_EMPTY_PLZ_CHECK"), invalids(Map.of("port", 1)));
        assertEquals(Set.of("REDIS_URL_EMPTY"), invalids(Map.of("usingUri", true, "uri", "  ")));
        assertEquals(Set.of(), invalids(Map.of("usingUri", true, "uri", "redis://cache.example.org:6379")));
        assertEquals(Set.of("INVALID_HOST", "REDIS_URL_EMPTY"), invalids(Map.of("usingUri", true, "host", "localhost")), "the host check also runs in URI mode");
    }

    // ---- raw command parser

    @Test
    public void rawCommandIsUpperCasedAndSplitAtWhitespace() {
        RedisQueryExecutionContext context = raw("  get   some_key  ");
        assertEquals(Protocol.Command.GET, context.getProtocolCommand());
        assertArrayEquals(new String[] {"some_key"}, context.getArgs());
        RedisQueryExecutionContext none = raw("PING");
        assertEquals(Protocol.Command.PING, none.getProtocolCommand());
        assertNull(none.getArgs(), "no arguments: the args are absent, not an empty array");
        assertArrayEquals(new String[] {"k", "v"}, raw("set\tk\nv").getArgs(), "tabs and new lines separate arguments too");
    }

    @Test
    public void doubleQuotedArgumentKeepsItsSpacesAndLosesTheQuotes() {
        assertArrayEquals(new String[] {"k", "a b"}, raw("set k \"a b\"").getArgs());
    }

    /** Observation: single quotes are NOT removed, they stay part of the argument (and the text inside keeps its spaces). */
    @Test
    public void singleQuotedArgumentKeepsItsQuotes() {
        assertArrayEquals(new String[] {"k", "'a b'"}, raw("set k 'a b'").getArgs());
        assertArrayEquals(new String[] {"k", "'{\"a\":1}'"}, raw("set k '{\"a\":1}'").getArgs());
    }

    @Test
    public void emptyDoubleQuotesAreAnEmptyArgument() {
        assertArrayEquals(new String[] {"k", ""}, raw("set k \"\"").getArgs());
    }

    /** Observation: a rendered parameter value that contains spaces is split into several arguments (the render happens before the split). */
    @Test
    public void templateValueWithSpacesIsSplitIntoSeveralArguments() {
        assertArrayEquals(new String[] {"a", "b", "c"}, raw("set {{k}} {{v}}", Map.of("k", "a", "v", "b c")).getArgs());
        assertArrayEquals(new String[] {"a", "b c"}, raw("set {{k}} \"{{v}}\"", Map.of("k", "a", "v", "b c")).getArgs(), "quoted placeholder keeps the value whole");
    }

    // ---- D7

    /**
     * BF-121 (D7): for a raw command, {@code Protocol.Command.valueOf((String) cmdAndArgs.get("cmd"))} threw
     * {@code NullPointerException} for a blank command and {@code IllegalArgumentException} for an unknown one, so a raw JDK
     * error reached the user. Now a blank command is QUERY_ARGUMENT_ERROR / COMMAND_EMPTY and an unknown one
     * QUERY_ARGUMENT_ERROR / INVALID_REDIS_REQUEST naming the upper-cased word, the form's error for an unknown type.
     */
    @Test
    public void blankAndUnknownRawCommandsAreCodedQueryArgumentErrorsBF121() {
        for (String blank : List.of("", "   ", "\t", "{{empty}}")) {
            PluginException thrown = assertThrows(PluginException.class, () -> raw(blank, Map.of("empty", "")), "[" + blank + "]");
            System.out.println(TAG + "blank raw command [" + blank + "] -> " + thrown.getError() + " / " + thrown.getMessageKey());
            assertEquals(QUERY_ARGUMENT_ERROR, thrown.getError(), "[" + blank + "]");
            assertEquals("COMMAND_EMPTY", thrown.getMessageKey(), "[" + blank + "]");
        }
        PluginException unknown = assertThrows(PluginException.class, () -> raw("flyhigh x"));
        System.out.println(TAG + "unknown raw command -> " + unknown.getError() + " / " + unknown.getMessageKey() + " " + Arrays.toString(unknown.getArgs()));
        assertEquals(QUERY_ARGUMENT_ERROR, unknown.getError());
        assertEquals("INVALID_REDIS_REQUEST", unknown.getMessageKey());
        assertArrayEquals(new Object[] {"FLYHIGH"}, unknown.getArgs());
        assertEquals("invalid Redis request: FLYHIGH.", unknown.getMessage());
        assertEquals(Protocol.Command.GET, raw("get k").getProtocolCommand(), "a known command is still read");
    }

    /**
     * Pins defect D17 (analysis-plugins section 0.6; plan section 9 D1-D20 row) for the raw parser
     * ({@code RedisPlugin.java}, {@code matcher.group().toUpperCase()}): under a Turkish default locale a lower-case
     * {@code lindex} becomes a dotted capital I word, which is no command, so the raw command fails with the enum's error. The
     * default locale is global state: restored in finally. A fix ({@code Locale.ROOT}) changes this test on purpose. Since
     * BF-121 the unknown word is the coded INVALID_REDIS_REQUEST instead of the enum's IllegalArgumentException.
     */
    @Test
    public void lowerCaseRawCommandFailsUnderATurkishDefaultLocale_pinsD17() {
        Locale saved = Locale.getDefault();
        try {
            Locale.setDefault(Locale.forLanguageTag("tr-TR"));
            System.out.println(TAG + "default locale: " + Locale.getDefault());
            assertEquals("INVALID_REDIS_REQUEST", assertThrows(PluginException.class, () -> raw("lindex k 0")).getMessageKey());
            assertEquals(Protocol.Command.LINDEX, raw("LINDEX k 0").getProtocolCommand(), "upper case is unaffected");
        } finally {
            Locale.setDefault(saved);
        }
        assertEquals(Protocol.Command.LINDEX, raw("lindex k 0").getProtocolCommand(), "locale restored: " + Locale.getDefault());
    }

    // ---- form branch

    @Test
    public void formModeRendersTemplatesInEachArgument() {
        RedisQueryExecutionContext context = form("SET", Map.of("key", "user:{{id}}", "value", "{{name}}"), Map.of("id", 7, "name", "Ann"));
        assertEquals(Protocol.Command.SET, context.getProtocolCommand());
        assertArrayEquals(new String[] {"user:7", "Ann"}, context.getArgs());
    }

    @Test
    public void formModeKeepsAValueWithSpacesWhole() {
        RedisQueryExecutionContext context = form("SET", Map.of("key", "k", "value", "{{v}}"), Map.of("v", "a b  c"));
        assertArrayEquals(new String[] {"k", "a b  c"}, context.getArgs());
    }

    @Test
    public void formModeUnknownTypeIsRejected() {
        PluginException thrown = assertThrows(PluginException.class, () -> form("FLUSHALL", Map.of(), Map.of()));
        assertEquals(QUERY_ARGUMENT_ERROR, thrown.getError());
        assertEquals("INVALID_REDIS_REQUEST", thrown.getMessageKey());
    }

    @Test
    public void callersConfigIsNotChanged() {
        Map<String, Object> comp = new HashMap<>(Map.of("key", "{{k}}"));
        Map<String, Object> config = new HashMap<>(Map.of("compType", "GET", "comp", comp));
        engine.buildQueryExecutionContext(datasource, config, Map.of("k", "x"), null);
        assertEquals("{{k}}", ((Map<?, ?>) config.get("comp")).get("key"));
    }
}
