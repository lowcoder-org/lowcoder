package org.lowcoder.plugin.redis;

import org.lowcoder.plugin.redis.model.RedisDatasourceConfig;
import org.lowcoder.sdk.contract.ContainerImages;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;
import redis.clients.jedis.Jedis;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * The Redis 7.2 containers of the L5-9 tests (default build, not heavy-container). Three servers, each started once on first
 * use of its holder and removed by Testcontainers' reaper when the JVM exits, on the port Docker assigns: {@link Open} (no
 * password), {@link Secured} (password {@link #PASSWORD}) and {@link Special} (a password with reserved URI characters,
 * {@link #SPECIAL_PASSWORD}). A generic container, not a module class (see log-L5.md). Start is bounded twice: a log wait with a
 * startup timeout, then a bounded ping loop. No Docker guard on purpose (owner decision D-7). Not a test.
 */
final class RedisContainerSupport {

    static final int REDIS_PORT = 6379;
    static final String PASSWORD = "s3cret-pass";
    static final String SPECIAL_PASSWORD = "p@ss:w/rd#1%";
    private static final String READY_PATTERN = ".*Ready to accept connections.*";
    private static final Duration START_TIMEOUT = Duration.ofMinutes(2);
    private static final int PING_ATTEMPTS = 30;
    private static final long PING_PAUSE_MILLIS = 500;
    private static final int PING_SOCKET_TIMEOUT_MILLIS = 5000;

    private RedisContainerSupport() {
    }

    /** A started server and the way to reach it. */
    static final class Server {
        private final GenericContainer<?> container;
        private final String password;

        private Server(String name, String password) {
            this.password = password;
            GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse(ContainerImages.REDIS_7_2)).withExposedPorts(REDIS_PORT)
                    .waitingFor(Wait.forLogMessage(READY_PATTERN, 1).withStartupTimeout(START_TIMEOUT));
            if (password != null) {
                redis.withCommand("redis-server", "--requirepass", password);
            }
            long start = System.nanoTime();
            redis.start();
            this.container = redis;
            System.out.println("[RedisContainerSupport] " + name + " " + ContainerImages.REDIS_7_2 + " started in "
                    + (System.nanoTime() - start) / 1_000_000 + " ms on " + host() + ":" + port());
            awaitPing(name);
        }

        String host() {
            return container.getHost();
        }

        int port() {
            return container.getMappedPort(REDIS_PORT);
        }

        /** A host-mode datasource config for this server, with the given credentials. */
        RedisDatasourceConfig config(String username, String configuredPassword) {
            Map<String, Object> values = new HashMap<>();
            values.put("host", host());
            values.put("port", port());
            if (username != null) {
                values.put("username", username);
            }
            if (configuredPassword != null) {
                values.put("password", configuredPassword);
            }
            return RedisDatasourceConfig.buildFrom(values);
        }

        RedisDatasourceConfig config() {
            return config(null, password);
        }

        /** A direct connection to this server as its default user (the test's own setup, not the code under test); the caller closes it. */
        Jedis jedis() {
            Jedis jedis = new Jedis(host(), port(), PING_SOCKET_TIMEOUT_MILLIS);
            if (password != null) {
                jedis.auth(password);
            }
            return jedis;
        }

        private void awaitPing(String name) {
            RuntimeException last = null;
            for (int attempt = 1; attempt <= PING_ATTEMPTS; attempt++) {
                try (Jedis jedis = jedis()) {
                    String pong = jedis.ping();
                    System.out.println("[RedisContainerSupport] " + name + " ping answered on attempt " + attempt + ": " + pong);
                    return;
                } catch (RuntimeException e) {
                    last = e;
                    try {
                        Thread.sleep(PING_PAUSE_MILLIS);
                    } catch (InterruptedException interrupted) {
                        Thread.currentThread().interrupt();
                        throw new IllegalStateException("interrupted while waiting for Redis", interrupted);
                    }
                }
            }
            throw new IllegalStateException("Redis " + name + " did not answer a ping after " + PING_ATTEMPTS + " attempts", last);
        }
    }

    /** No password. Started on first use. */
    static final class Open {
        static final Server SERVER = new Server("open", null);

        private Open() {
        }
    }

    /** Password {@link #PASSWORD}. Started on first use. */
    static final class Secured {
        static final Server SERVER = new Server("secured", PASSWORD);

        private Secured() {
        }
    }

    /** Password {@link #SPECIAL_PASSWORD}. Started on first use. */
    static final class Special {
        static final Server SERVER = new Server("special", SPECIAL_PASSWORD);

        private Special() {
        }
    }
}
