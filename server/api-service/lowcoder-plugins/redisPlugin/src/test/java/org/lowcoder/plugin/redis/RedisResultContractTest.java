package org.lowcoder.plugin.redis;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.redis.model.RedisQueryExecutionContext;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.QueryResults;
import org.lowcoder.sdk.models.QueryExecutionResult;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.Protocol;
import redis.clients.jedis.commands.ProtocolCommand;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The Redis row of the §4.6 producer table (docs/API_PAYLOAD_TEST_PLAN.md §4.6, task T8.2):
 * {@code RedisEngine.executeQuery} with a pool whose connection answers each reply of {@link #OUTPUTS} to
 * {@code sendCommand}, as Jedis decodes the RESP2 types. The engine puts {@code processCommandOutput(reply)} into the
 * result ({@code RedisPlugin.java:223}): a bulk string becomes a {@code String} decoded as UTF-8, an array a
 * {@code List<String>}, an integer its text; an array that holds an array (as {@code SCAN} and {@code EXEC} return)
 * or integers fails the cast to {@code byte[]}, and the engine returns a {@code REDIS_EXECUTION_ERROR} result (O76). Each case's report ({@link QueryResults#report}) is pinned in {@value #REPORT}.
 *
 * <p>Limits: no Redis server runs; the replies are the Java objects Jedis returns for each RESP type, and the pool is
 * never started.
 */
public class RedisResultContractTest {

    static final String REPORT = "query-results/RedisEngine.results.json";
    static final String KEY = "contract:key";
    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final Map<String, Object> OUTPUTS = outputs();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    private final RedisPlugin.RedisEngine engine = new RedisPlugin.RedisEngine();

    @Test
    public void resultsAsPinned() {
        Map<String, Object> report = new LinkedHashMap<>();
        OUTPUTS.forEach((name, output) -> report.put(name, report(output)));
        String actual = ConfigBinding.write(report);
        System.out.println("[RedisResultContractTest]\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    private Object report(Object output) {
        RedisQueryExecutionContext context = RedisQueryExecutionContext.builder()
                .protocolCommand(Protocol.Command.GET).args(new String[] {KEY}).build();
        try (JedisPool pool = pool(output)) {
            QueryExecutionResult result = engine.executeQuery(pool, context).block(TIMEOUT);
            return result == null ? null : QueryResults.report(result);
        } catch (RuntimeException e) {
            return Map.of(QueryResults.ERROR_KEY, ConfigBinding.errorText(e));
        }
    }

    /** A pool that is never started: its connection answers {@code output} to every command without a server. */
    static JedisPool pool(Object output) {
        Jedis jedis = new Jedis() {
            @Override
            public Object sendCommand(ProtocolCommand cmd, String... args) {
                return output;
            }

            @Override
            public Object sendCommand(ProtocolCommand cmd) {
                return output;
            }
        };
        return new JedisPool() {
            @Override
            public Jedis getResource() {
                return jedis;
            }
        };
    }

    private static byte[] utf8(String text) {
        return text.getBytes(StandardCharsets.UTF_8);
    }

    private static Map<String, Object> outputs() {
        Map<String, Object> outputs = new LinkedHashMap<>();
        outputs.put("bulkString", utf8("{\"a\": 1.50, \"text\": \"žluť\"}"));
        outputs.put("invalidUtf8", new byte[] {'a', (byte) 0xFF, 'b'});
        outputs.put("simpleStringOk", utf8("OK"));
        outputs.put("integer", 3_000_000_001L);
        outputs.put("nil", null);
        outputs.put("array", Arrays.asList(utf8("one"), null, utf8("žluť")));
        outputs.put("emptyArray", List.of());
        outputs.put("nestedArray", List.of(utf8("0"), List.of(utf8("key1"), utf8("key2"))));
        outputs.put("arrayOfIntegers", List.of(1L, 2L));
        return outputs;
    }
}
