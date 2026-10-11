package org.lowcoder.plugin.redis;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.redis.model.RedisDatasourceConfig;
import org.lowcoder.sdk.exception.PluginException;
import redis.clients.jedis.JedisPool;

import java.lang.reflect.Field;
import java.net.URISyntaxException;
import java.time.Duration;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.plugin.redis.RedisError.REDIS_URL_ERROR;
import static org.lowcoder.plugin.redis.constants.RedisConstants.JEDIS_POOL_MAX_IDLE;
import static org.lowcoder.plugin.redis.constants.RedisConstants.JEDIS_POOL_MAX_TOTAL;
import static org.lowcoder.plugin.redis.constants.RedisConstants.JEDIS_POOL_MIN_EVICTABLE_IDLE_MILLIS;
import static org.lowcoder.plugin.redis.constants.RedisConstants.JEDIS_POOL_MIN_IDLE;
import static org.lowcoder.plugin.redis.constants.RedisConstants.JEDIS_POOL_TIME_BETWEEN_EVICTION_RUNS_MILLIS;

/**
 * Unit RD-5 (task L5-9): {@code RedisEngine.createConnection} and {@code destroyConnection}: the pool is built lazily (no server
 * is contacted: the host is a reserved test address that nothing answers), with the pool settings of {@code buildPoolConfig};
 * an unparsable URI is reported; destroying null or twice does not throw.
 *
 * <p>Limits: the pool settings are read from the Jedis pool's protected {@code internalPool} field by reflection (Jedis 3.3.0 has
 * no public getter for them); borrowing behaviour against a server is RD-6.
 */
public class RedisEngineConnectionTest {

    static final String TAG = "[RedisEngineConnectionTest] ";
    static final String UNREACHABLE_HOST = "192.0.2.1";
    static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(10);

    private final RedisPlugin.RedisEngine engine = new RedisPlugin.RedisEngine();

    private static Object poolSetting(JedisPool pool, String getter) throws Exception {
        Field internal = redis.clients.jedis.util.Pool.class.getDeclaredField("internalPool");
        internal.setAccessible(true);
        Object generic = internal.get(pool);
        return generic.getClass().getMethod(getter).invoke(generic);
    }

    @Test
    public void createConnectionBuildsALazyPoolWithTheConfiguredSettings() throws Exception {
        long start = System.nanoTime();
        JedisPool pool = engine.createConnection(RedisDatasourceConfig.buildFrom(Map.of("host", UNREACHABLE_HOST, "port", 6379))).block(BLOCK_TIMEOUT);
        long millis = (System.nanoTime() - start) / 1_000_000;
        System.out.println(TAG + "pool built in " + millis + " ms: " + pool);
        try {
            assertNotNull(pool);
            assertTrue(millis < 5_000, "no connection attempt: " + millis);
            assertEquals(0, pool.getNumActive());
            assertEquals(JEDIS_POOL_MAX_TOTAL, poolSetting(pool, "getMaxTotal"));
            assertEquals(JEDIS_POOL_MAX_IDLE, poolSetting(pool, "getMaxIdle"));
            assertEquals(JEDIS_POOL_MIN_IDLE, poolSetting(pool, "getMinIdle"));
            assertEquals(true, poolSetting(pool, "getTestOnBorrow"));
            assertEquals(true, poolSetting(pool, "getTestOnReturn"));
            assertEquals(true, poolSetting(pool, "getTestWhileIdle"));
            assertEquals(false, poolSetting(pool, "getBlockWhenExhausted"));
            assertEquals(Duration.ofSeconds(JEDIS_POOL_MIN_EVICTABLE_IDLE_MILLIS).toMillis(), poolSetting(pool, "getMinEvictableIdleTimeMillis"));
            assertEquals(Duration.ofSeconds(JEDIS_POOL_TIME_BETWEEN_EVICTION_RUNS_MILLIS).toMillis(), poolSetting(pool, "getTimeBetweenEvictionRunsMillis"));
        } finally {
            engine.destroyConnection(pool).block(BLOCK_TIMEOUT);
        }
    }

    /** Observation: only an ArrayIndexOutOfBoundsException is mapped to REDIS_URL_ERROR; an unparsable URI reaches the caller as the raw URISyntaxException. */
    @Test
    public void unparsableUriInUriModeReachesTheCallerAsAUriSyntaxException() {
        RedisDatasourceConfig bad = RedisDatasourceConfig.buildFrom(Map.of("usingUri", true, "uri", "redis://bad host:1"));
        Throwable thrown = assertThrows(Throwable.class, () -> engine.createConnection(bad).block(BLOCK_TIMEOUT));
        System.out.println(TAG + "unparsable uri: " + thrown);
        Throwable root = thrown;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        assertInstanceOf(URISyntaxException.class, root);
    }

    @Test
    public void aUriWithAUserButNoPasswordIsMappedToRedisUrlError() {
        RedisDatasourceConfig config = RedisDatasourceConfig.buildFrom(Map.of("usingUri", true, "uri", "redis://u@h:1"));
        PluginException thrown = assertThrows(PluginException.class, () -> engine.createConnection(config).block(BLOCK_TIMEOUT));
        System.out.println(TAG + "user without password: " + thrown.getMessageKey() + " " + thrown.getArgs()[0]);
        assertEquals("REDIS_URL_ERROR", thrown.getMessageKey());
        assertEquals(REDIS_URL_ERROR, thrown.getError());
    }

    /** Observation: other URIs that the Jedis pool refuses reach the caller as Jedis's or the JDK's own exceptions, not as REDIS_URL_ERROR. */
    @Test
    public void otherUnusableUrisReachTheCallerAsRawExceptions() {
        assertRaw("redis://:@h", redis.clients.jedis.exceptions.InvalidURIException.class);
        assertRaw("redis:///", redis.clients.jedis.exceptions.InvalidURIException.class);
        assertRaw("redis://h:1/x", NumberFormatException.class);
    }

    private void assertRaw(String uri, Class<? extends Throwable> expected) {
        RedisDatasourceConfig config = RedisDatasourceConfig.buildFrom(Map.of("usingUri", true, "uri", uri));
        Throwable thrown = assertThrows(Throwable.class, () -> engine.createConnection(config).block(BLOCK_TIMEOUT), uri);
        assertInstanceOf(expected, thrown, uri);
    }

    @Test
    public void destroyConnectionAcceptsNullAndCanRunTwice() {
        engine.destroyConnection(null).block(BLOCK_TIMEOUT);
        JedisPool pool = engine.createConnection(RedisDatasourceConfig.buildFrom(Map.of("host", UNREACHABLE_HOST))).block(BLOCK_TIMEOUT);
        assertFalse(pool.isClosed());
        engine.destroyConnection(pool).block(BLOCK_TIMEOUT);
        assertTrue(pool.isClosed());
        engine.destroyConnection(pool).block(BLOCK_TIMEOUT);
        assertTrue(pool.isClosed());
    }
}
