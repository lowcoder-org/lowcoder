package org.lowcoder.plugin.redis.utils;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.redis.commands.RedisCommand;
import org.lowcoder.sdk.exception.PluginException;
import redis.clients.jedis.Protocol;

import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;

/**
 * Unit RD-2 (task L5-9): {@code RedisQueryUtils.convertRedisFormInputToRedisCommand} for all 34 form commands. The table
 * {@link #SYNTAX} is written from the Redis command reference (not from the code): each command with its arguments in
 * Redis order, in terms of the distinct form values of {@link #FORM_VALUES}, so a swapped pair (key and value, score and
 * member, min and max) fails. Also the dispatch rules and the lower-case type (defect D17).
 *
 * <p>Limits: only the command and the argument list are built; the server's reading of them is RD-6.
 */
public class RedisQueryUtilsTest {

    static final String TAG = "[RedisQueryUtilsTest] ";
    static final Map<String, String> FORM_VALUES = formValues();
    static final Map<String, List<String>> SYNTAX = syntax();

    private static Map<String, String> formValues() {
        Map<String, String> values = new LinkedHashMap<>();
        for (String field : List.of("key", "keys", "value", "pattern", "field", "fields", "index", "count", "source", "destination",
                "start", "stop", "member", "score", "min", "max")) {
            values.put(field, "<" + field + ">");
        }
        return values;
    }

    /** Redis syntax per command, each argument named by its form field. */
    private static Map<String, List<String>> syntax() {
        Map<String, List<String>> table = new LinkedHashMap<>();
        table.put("GET", List.of("key"));
        table.put("SET", List.of("key", "value"));
        table.put("DEL", List.of("key"));
        table.put("KEYS", List.of("pattern"));
        table.put("MGET", List.of("keys"));
        table.put("HGET", List.of("key", "field"));
        table.put("HMGET", List.of("key", "fields"));
        table.put("HGETALL", List.of("key"));
        table.put("HSET", List.of("key", "field", "value"));
        table.put("HSETNX", List.of("key", "field", "value"));
        table.put("HLEN", List.of("key"));
        table.put("HDEL", List.of("key", "field"));
        table.put("HKEYS", List.of("key"));
        table.put("HVALS", List.of("key"));
        table.put("LINDEX", List.of("key", "index"));
        table.put("LLEN", List.of("key"));
        table.put("LPUSH", List.of("key", "value"));
        table.put("LREM", List.of("key", "count", "value"));
        table.put("RPOPLPUSH", List.of("source", "destination"));
        table.put("LRANGE", List.of("key", "start", "stop"));
        table.put("SADD", List.of("key", "member"));
        table.put("SCARD", List.of("key"));
        table.put("SMEMBERS", List.of("key"));
        table.put("SISMEMBER", List.of("key", "member"));
        table.put("SRANDMEMBER", List.of("key", "count"));
        table.put("SREM", List.of("key", "member"));
        table.put("ZADD", List.of("key", "score", "member"));
        table.put("ZCARD", List.of("key"));
        table.put("ZCOUNT", List.of("key", "min", "max"));
        table.put("ZRANGE", List.of("key", "start", "stop"));
        table.put("ZRANGEBYSCORE", List.of("key", "min", "max"));
        table.put("ZRANK", List.of("key", "member"));
        table.put("ZREM", List.of("key", "member"));
        table.put("ZSCORE", List.of("key", "member"));
        return table;
    }

    static Map<String, Object> form(String type) {
        Map<String, Object> comp = new HashMap<>(FORM_VALUES);
        Map<String, Object> form = new HashMap<>();
        form.put("compType", type);
        form.put("comp", comp);
        return form;
    }

    @Test
    public void everyCommandHasItsProtocolCommandAndArgumentsInRedisOrder() {
        assertEquals(34, SYNTAX.size());
        for (Map.Entry<String, List<String>> entry : SYNTAX.entrySet()) {
            RedisCommand command = RedisQueryUtils.convertRedisFormInputToRedisCommand(form(entry.getKey()));
            List<String> expected = entry.getValue().stream().map(FORM_VALUES::get).toList();
            System.out.println(TAG + entry.getKey() + " -> " + command.getProtocolCommand() + " " + Arrays.toString(command.getArgs()));
            assertEquals(Protocol.Command.valueOf(entry.getKey()), command.getProtocolCommand(), entry.getKey());
            assertEquals(expected, Arrays.asList(command.getArgs()), entry.getKey());
        }
    }

    @Test
    public void commandTypeIsMatchedInAnyCaseAndUnknownTypesAreRejectedWithTheirName() {
        assertInstanceOf(RedisCommand.Get.class, RedisQueryUtils.convertRedisFormInputToRedisCommand(form("get")));
        assertInstanceOf(RedisCommand.Hgetall.class, RedisQueryUtils.convertRedisFormInputToRedisCommand(form("HgetAll")));
        for (String unknown : List.of("FLUSHALL", "", "RAW", "GETS")) {
            PluginException thrown = assertThrows(PluginException.class, () -> RedisQueryUtils.convertRedisFormInputToRedisCommand(form(unknown)), unknown);
            assertEquals(QUERY_ARGUMENT_ERROR, thrown.getError());
            assertEquals("INVALID_REDIS_REQUEST", thrown.getMessageKey());
            assertEquals(unknown, thrown.getArgs()[0]);
        }
        Map<String, Object> noType = new HashMap<>();
        assertEquals("INVALID_REDIS_REQUEST", assertThrows(PluginException.class, () -> RedisQueryUtils.convertRedisFormInputToRedisCommand(noType)).getMessageKey());
    }

    @Test
    public void rawIsDetectedInAnyCase() {
        assertTrue(RedisQueryUtils.isRawCommand(form("RAW")));
        assertTrue(RedisQueryUtils.isRawCommand(form("raw")));
        assertFalse(RedisQueryUtils.isRawCommand(form("GET")));
        assertFalse(RedisQueryUtils.isRawCommand(new HashMap<>()));
    }

    /**
     * Observation (no row): a field that is absent from the form is a null argument, and the argument list keeps the slot.
     * The client form sends every field of the command as text (an empty field is the empty string,
     * redisQuery.tsx KeyInput and the other inputs are ParamsStringControl, paramsControl.tsx:129), so only an API call omits one.
     */
    @Test
    public void aFieldAbsentFromTheFormIsANullArgument() {
        Map<String, Object> form = new HashMap<>();
        form.put("compType", "SET");
        form.put("comp", new HashMap<>(Map.of("key", "k")));
        RedisCommand command = RedisQueryUtils.convertRedisFormInputToRedisCommand(form);
        System.out.println(TAG + "SET with no value -> " + Arrays.toString(command.getArgs()));
        assertEquals(Arrays.asList("k", null), Arrays.asList(command.getArgs()));
    }

    /**
     * Pins defect D17 (analysis-plugins section 0.6; plan section 9 D1-D20 row) for the dispatch
     * ({@code RedisQueryUtils.java}, {@code commandType.toUpperCase()}): under a Turkish default locale the lower-case type
     * {@code lindex} becomes a dotted capital I word and is rejected as unknown. The client sends upper-case types
     * (redisQuery.tsx:22-57), which a Turkish locale does not change, so only an API call with a lower-case type reaches it.
     * A fix ({@code Locale.ROOT}) changes this test on purpose. The default locale is global state: restored in finally.
     */
    @Test
    public void lowerCaseCommandTypeIsRejectedUnderATurkishDefaultLocale_pinsD17() {
        Locale saved = Locale.getDefault();
        try {
            Locale.setDefault(Locale.forLanguageTag("tr-TR"));
            System.out.println(TAG + "default locale: " + Locale.getDefault() + ", upper case of lindex: " + "lindex".toUpperCase());
            PluginException thrown = assertThrows(PluginException.class, () -> RedisQueryUtils.convertRedisFormInputToRedisCommand(form("lindex")));
            assertEquals("INVALID_REDIS_REQUEST", thrown.getMessageKey());
            assertInstanceOf(RedisCommand.Lindex.class, RedisQueryUtils.convertRedisFormInputToRedisCommand(form("LINDEX")), "the upper-case type the client sends is unaffected");
        } finally {
            Locale.setDefault(saved);
        }
        assertInstanceOf(RedisCommand.Lindex.class, RedisQueryUtils.convertRedisFormInputToRedisCommand(form("lindex")), "locale restored: " + Locale.getDefault());
    }

    /**
     * Observation (no row): the dispatch accepts a lower-case type, but {@code RedisCommand.getProtocolCommand} reads the type
     * without upper-casing it, so the command it hands on fails with the enum's own {@code IllegalArgumentException}. The client
     * sends upper case, so this is reachable by an API call only.
     */
    @Test
    public void lowerCaseTypeIsAcceptedByTheDispatchButNotByTheProtocolCommandLookup() {
        RedisCommand command = RedisQueryUtils.convertRedisFormInputToRedisCommand(form("get"));
        assertThrows(IllegalArgumentException.class, command::getProtocolCommand);
    }
}
