package org.lowcoder.plugin.redis;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.redis.model.RedisDatasourceConfig;
import org.lowcoder.plugin.redis.model.RedisQueryExecutionContext;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.QueryExecutionResult;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.exceptions.JedisDataException;

import java.time.Duration;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit RD-6 (task L5-9), commands against a real Redis 7.2 ({@link RedisContainerSupport.Open}): every form command is built by
 * {@code buildQueryExecutionContext}, run by {@code executeQuery}, and its effect read back, which proves the argument order
 * of RD-2 semantically; raw commands; the reply conversion ({@code processCommandOutput}); the error result; connection
 * failures. Each test uses its own key prefix, so the tests do not depend on order.
 *
 * <p>Limits: single-statement commands only; authentication is in {@link RedisEngineAuthContainerTest}.
 */
public class RedisEngineContainerTest {

    static final String TAG = "[RedisEngineContainerTest] ";
    static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(30);
    static final String QUERY_CODE_OK = "OK";
    static final String OK_REPLY = "OK";

    private static final RedisPlugin.RedisEngine ENGINE = new RedisPlugin.RedisEngine();
    private static final RedisDatasourceConfig CONFIG = RedisContainerSupport.Open.SERVER.config();
    private static JedisPool pool;

    @BeforeAll
    static void connect() {
        pool = ENGINE.createConnection(CONFIG).block(BLOCK_TIMEOUT);
    }

    @AfterAll
    static void disconnect() {
        ENGINE.destroyConnection(pool).block(BLOCK_TIMEOUT);
    }

    private static String prefix(String name) {
        return name + ":" + UUID.randomUUID().toString().substring(0, 8) + ":";
    }

    private static QueryExecutionResult run(String type, String... fieldsAndValues) {
        Map<String, Object> comp = new HashMap<>();
        for (int i = 0; i < fieldsAndValues.length; i += 2) {
            comp.put(fieldsAndValues[i], fieldsAndValues[i + 1]);
        }
        Map<String, Object> form = new HashMap<>();
        form.put("compType", type);
        form.put("comp", comp);
        return execute(form);
    }

    private static QueryExecutionResult raw(String command) {
        Map<String, Object> form = new HashMap<>();
        form.put("compType", "RAW");
        form.put("comp", new HashMap<>(Map.of("command", command)));
        return execute(form);
    }

    private static QueryExecutionResult execute(Map<String, Object> form) {
        RedisQueryExecutionContext context = ENGINE.buildQueryExecutionContext(CONFIG, form, Map.of(), null);
        QueryExecutionResult result = ENGINE.executeQuery(pool, context).block(BLOCK_TIMEOUT);
        System.out.println(TAG + context.getProtocolCommand() + " " + Arrays.toString(context.getArgs()) + " -> " + result.getQueryCode() + " " + result.getData());
        return result;
    }

    private static Object data(QueryExecutionResult result) {
        assertEquals(QUERY_CODE_OK, result.getQueryCode());
        return result.getData();
    }

    // ---- connection

    @Test
    public void testConnectionSucceedsAgainstTheServer() {
        DatasourceTestResult result = ENGINE.testConnection(CONFIG).block(BLOCK_TIMEOUT);
        assertTrue(result.isSuccess());
    }

    @Test
    public void testConnectionToAClosedPortReturnsAFailedResult() {
        RedisDatasourceConfig closed = RedisDatasourceConfig.buildFrom(Map.of("host", RedisContainerSupport.Open.SERVER.host(), "port", 1));
        DatasourceTestResult result = ENGINE.testConnection(closed).block(BLOCK_TIMEOUT);
        System.out.println(TAG + "closed port: success=" + result.isSuccess() + " message=" + result.getInvalidMessage(Locale.ENGLISH));
        assertFalse(result.isSuccess());
    }

    // ---- commands, by data type

    @Test
    public void stringCommands() {
        String p = prefix("str");
        assertEquals(OK_REPLY, data(run("SET", "key", p + "a", "value", "va")));
        assertEquals("va", data(run("GET", "key", p + "a")));
        assertEquals(OK_REPLY, data(run("SET", "key", p + "b", "value", "vb")));
        assertEquals(List.of("va"), data(run("MGET", "keys", p + "a")));
        assertEquals(Arrays.asList((String) null), data(run("MGET", "keys", p + "missing")));
        assertEquals(List.of(p + "a", p + "b"), ((List<?>) data(run("KEYS", "pattern", p + "*"))).stream().sorted().toList());
        assertEquals("1", data(run("DEL", "key", p + "a")));
        assertNull(data(run("GET", "key", p + "a")));
        assertEquals("0", data(run("DEL", "key", p + "a")));
    }

    @Test
    public void hashCommands() {
        String p = prefix("hash");
        String key = p + "h";
        assertEquals("1", data(run("HSET", "key", key, "field", "f1", "value", "v1")));
        assertEquals("0", data(run("HSET", "key", key, "field", "f1", "value", "v1b")), "an existing field is an update: 0 new");
        assertEquals("0", data(run("HSETNX", "key", key, "field", "f1", "value", "ignored")));
        assertEquals("1", data(run("HSETNX", "key", key, "field", "f2", "value", "v2")));
        assertEquals("v1b", data(run("HGET", "key", key, "field", "f1")));
        assertEquals(List.of("v2"), data(run("HMGET", "key", key, "fields", "f2")));
        assertEquals("2", data(run("HLEN", "key", key)));
        assertEquals(List.of("f1", "f2"), ((List<?>) data(run("HKEYS", "key", key))).stream().sorted().toList());
        assertEquals(List.of("v1b", "v2"), ((List<?>) data(run("HVALS", "key", key))).stream().sorted().toList());
        assertEquals(List.of("f1", "v1b", "f2", "v2"), data(run("HGETALL", "key", key)));
        assertEquals("1", data(run("HDEL", "key", key, "field", "f1")));
        assertEquals("1", data(run("HLEN", "key", key)));
    }

    @Test
    public void listCommands() {
        String p = prefix("list");
        String key = p + "l";
        assertEquals("1", data(run("LPUSH", "key", key, "value", "a")));
        assertEquals("2", data(run("LPUSH", "key", key, "value", "b")));
        assertEquals("2", data(run("LLEN", "key", key)));
        assertEquals("b", data(run("LINDEX", "key", key, "index", "0")));
        assertEquals("a", data(run("LINDEX", "key", key, "index", "1")));
        assertEquals(List.of("b", "a"), data(run("LRANGE", "key", key, "start", "0", "stop", "-1")));
        assertEquals(List.of("b"), data(run("LRANGE", "key", key, "start", "0", "stop", "0")));
        assertEquals("1", data(run("LREM", "key", key, "count", "0", "value", "a")));
        assertEquals(List.of("b"), data(run("LRANGE", "key", key, "start", "0", "stop", "-1")));
        String source = p + "src";
        String destination = p + "dst";
        run("LPUSH", "key", source, "value", "x");
        run("LPUSH", "key", source, "value", "y");
        assertEquals("x", data(run("RPOPLPUSH", "source", source, "destination", destination)), "pops the tail of the source");
        assertEquals(List.of("x"), data(run("LRANGE", "key", destination, "start", "0", "stop", "-1")));
        assertEquals(List.of("y"), data(run("LRANGE", "key", source, "start", "0", "stop", "-1")));
    }

    @Test
    public void setCommands() {
        String p = prefix("set");
        String key = p + "s";
        assertEquals("1", data(run("SADD", "key", key, "member", "m1")));
        assertEquals("0", data(run("SADD", "key", key, "member", "m1")));
        assertEquals("1", data(run("SADD", "key", key, "member", "m2")));
        assertEquals("2", data(run("SCARD", "key", key)));
        assertEquals(List.of("m1", "m2"), ((List<?>) data(run("SMEMBERS", "key", key))).stream().sorted().toList());
        assertEquals("1", data(run("SISMEMBER", "key", key, "member", "m1")));
        assertEquals("0", data(run("SISMEMBER", "key", key, "member", "other")));
        assertEquals(2, ((List<?>) data(run("SRANDMEMBER", "key", key, "count", "5"))).size(), "a count above the size returns every member");
        assertEquals(1, ((List<?>) data(run("SRANDMEMBER", "key", key, "count", "1"))).size());
        assertEquals("1", data(run("SREM", "key", key, "member", "m1")));
        assertEquals(List.of("m2"), data(run("SMEMBERS", "key", key)));
    }

    @Test
    public void sortedSetCommands() {
        String p = prefix("zset");
        String key = p + "z";
        assertEquals("1", data(run("ZADD", "key", key, "score", "1", "member", "a")));
        assertEquals("1", data(run("ZADD", "key", key, "score", "2", "member", "b")));
        assertEquals("1", data(run("ZADD", "key", key, "score", "3", "member", "c")));
        assertEquals("3", data(run("ZCARD", "key", key)));
        assertEquals("2", data(run("ZCOUNT", "key", key, "min", "1", "max", "2")));
        assertEquals("1", data(run("ZCOUNT", "key", key, "min", "3", "max", "3")));
        assertEquals("0", data(run("ZCOUNT", "key", key, "min", "3", "max", "1")), "min above max matches nothing");
        assertEquals(List.of("a", "b", "c"), data(run("ZRANGE", "key", key, "start", "0", "stop", "-1")));
        assertEquals(List.of("b"), data(run("ZRANGE", "key", key, "start", "1", "stop", "1")));
        assertEquals(List.of("b", "c"), data(run("ZRANGEBYSCORE", "key", key, "min", "2", "max", "3")));
        assertEquals("1", data(run("ZRANK", "key", key, "member", "b")));
        assertEquals("2", data(run("ZSCORE", "key", key, "member", "b")));
        assertEquals("1", data(run("ZREM", "key", key, "member", "b")));
        assertEquals(List.of("a", "c"), data(run("ZRANGE", "key", key, "start", "0", "stop", "-1")));
    }

    // ---- raw commands and replies

    @Test
    public void rawCommandsRunAndConvertTheirReplies() {
        String p = prefix("raw");
        assertNull(data(raw("GET " + p + "missing")), "a missing key is a null result");
        assertEquals(OK_REPLY, data(raw("SET " + p + "k \"two words\"")));
        assertEquals("two words", data(raw("get " + p + "k")));
        assertEquals("PONG", data(raw("PING")));
        assertEquals(Arrays.asList("two words", null), data(raw("MGET " + p + "k " + p + "missing")), "a list reply keeps a null element");
        assertEquals("9", data(raw("STRLEN " + p + "k")), "an integer reply is its text");
        assertEquals("1", data(raw("EXPIRE " + p + "k 100")));
        long ttl = Long.parseLong((String) data(raw("TTL " + p + "k")));
        assertTrue(ttl > 0 && ttl <= 100, "ttl " + ttl);
    }

    @Test
    public void serverErrorsBecomeAnErrorResultCarryingTheException() {
        String p = prefix("err");
        run("SET", "key", p + "k", "value", "v");
        QueryExecutionResult result = run("LPUSH", "key", p + "k", "value", "x");
        assertEquals("REDIS_EXECUTION_ERROR", result.getQueryCode());
        assertEquals("REDIS_EXECUTION_ERROR", result.getMessageKey());
        JedisDataException cause = assertInstanceOf(JedisDataException.class, result.getMessageArgs()[0]);
        assertTrue(cause.getMessage().startsWith("WRONGTYPE"), cause.getMessage());
    }

    // ---- empty and absent fields

    /**
     * Observation (no row): an empty text field is sent as an empty argument, which the server accepts (the key and the value
     * may be empty strings). The client form sends every field as text, an empty field being the empty string
     * (redisQuery.tsx KeyInput and the other ParamsStringControl inputs, paramsControl.tsx:129), so this is what a user with a blank
     * field gets: no coded error, a successful command on the empty key.
     */
    @Test
    public void emptyFieldsAreSentAsEmptyArguments() {
        assertEquals(OK_REPLY, data(run("SET", "key", "", "value", "")));
        assertEquals("", data(run("GET", "key", "")));
        assertEquals("1", data(run("DEL", "key", "")));
    }

    /**
     * Observation (no row): a field absent from the query config (an API call; the form always sends text) is a null argument and
     * the command fails inside Jedis: the error result carries the raw exception, not a coded message.
     */
    @Test
    public void anAbsentFieldFailsInsideJedis() {
        QueryExecutionResult result = run("SET", "key", prefix("absent") + "k");
        System.out.println(TAG + "absent value: " + result.getQueryCode() + " " + result.getMessageKey() + " " + Arrays.toString(result.getMessageArgs()));
        assertEquals("REDIS_EXECUTION_ERROR", result.getQueryCode());
        assertInstanceOf(Throwable.class, result.getMessageArgs()[0]);
    }
}
