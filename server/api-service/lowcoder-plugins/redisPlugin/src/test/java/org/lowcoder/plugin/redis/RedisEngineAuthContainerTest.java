package org.lowcoder.plugin.redis;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.redis.model.RedisDatasourceConfig;
import org.lowcoder.sdk.models.DatasourceTestResult;
import redis.clients.jedis.Jedis;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.plugin.redis.RedisContainerSupport.PASSWORD;
import static org.lowcoder.plugin.redis.RedisContainerSupport.SPECIAL_PASSWORD;

/**
 * Unit RD-6 (task L5-9), connection and authentication against real servers ({@link RedisContainerSupport}): {@code testConnection}
 * with no password, the right and a wrong password, a user name, a password with reserved URI characters (D5, fixed by BF-055)
 * and ACL users (BF-055).
 *
 * <p>Limits: clusters are not exercised, and TLS only as far as an SSL-selected config failing against a server without TLS (no
 * TLS server is started).
 */
public class RedisEngineAuthContainerTest {

    static final String TAG = "[RedisEngineAuthContainerTest] ";
    static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(30);
    static final String DEFAULT_USER = "default";
    /** An ACL user that needs no password. */
    static final String NOPASS_USER = "keyless-bf055";
    /** An ACL user whose name has characters a URI gives a meaning to (no colon: see {@code RedisUriUtils.getUriAuth}). */
    static final String RESERVED_USER = "ali@ce/#%?bf055";
    static final String ACL_OK = "OK";

    private final RedisPlugin.RedisEngine engine = new RedisPlugin.RedisEngine();

    private DatasourceTestResult test(String label, RedisDatasourceConfig config) {
        DatasourceTestResult result = engine.testConnection(config).block(BLOCK_TIMEOUT);
        System.out.println(TAG + label + ": success=" + result.isSuccess() + (result.isSuccess() ? "" : " message=" + result.getInvalidMessage(Locale.ENGLISH)));
        return result;
    }

    @Test
    public void serverWithoutPasswordAcceptsAConfigWithoutOne() {
        assertTrue(test("open, no password", RedisContainerSupport.Open.SERVER.config()).isSuccess());
    }

    @Test
    public void rightPasswordSucceedsAndWrongOrMissingPasswordFails() {
        RedisContainerSupport.Server server = RedisContainerSupport.Secured.SERVER;
        assertTrue(test("secured, right password", server.config()).isSuccess());
        assertTrue(test("secured, right password and the default user", server.config(DEFAULT_USER, PASSWORD)).isSuccess());
        assertFalse(test("secured, wrong password", server.config(null, "wrong")).isSuccess());
        assertFalse(test("secured, no password", server.config(null, null)).isSuccess());
        assertFalse(test("secured, unknown user", server.config("nobody", PASSWORD)).isSuccess());
    }

    /**
     * Catches the SSL switch not reaching the connection (BF-024): against a server without TLS, the config with SSL selected
     * fails, while the same config without SSL connects. Jedis opens the TLS handshake on the first command (the pool's
     * borrow test sends PING); the server, which speaks no TLS, does not answer the ClientHello, so the read times out and the
     * test reports the borrow failure (observed with a direct probe: {@code redis} answers PONG, {@code rediss} ends in
     * {@code SocketTimeoutException: Read timed out}).
     */
    @Test
    public void sslSelectedAgainstAServerWithoutTlsFails() {
        RedisContainerSupport.Server server = RedisContainerSupport.Open.SERVER;
        RedisDatasourceConfig withSsl = RedisDatasourceConfig.buildFrom(Map.of("host", server.host(), "port", server.port(), "usingSsl", true));
        RedisDatasourceConfig withoutSsl = RedisDatasourceConfig.buildFrom(Map.of("host", server.host(), "port", server.port(), "usingSsl", false));
        assertTrue(test("open, SSL not selected", withoutSsl).isSuccess());
        assertFalse(test("open, SSL selected", withSsl).isSuccess());
    }

    @Test
    public void aPasswordThatIsSentToAServerWithoutOneFails() {
        assertFalse(test("open, password sent", RedisContainerSupport.Open.SERVER.config(null, "unexpected")).isSuccess());
    }

    /**
     * BF-055 (formerly pinned as D5) against a real server: the password {@code p@ss:w/rd#1%} is the server's, and the same
     * password entered in a host-mode config connects, as does the URI-mode config with the password encoded by hand.
     */
    @Test
    public void hostModeConfigWithReservedCharactersInThePasswordConnectsBF055() {
        RedisContainerSupport.Server server = RedisContainerSupport.Special.SERVER;
        assertTrue(test("special password, host mode", server.config()).isSuccess());
        String encoded = URLEncoder.encode(SPECIAL_PASSWORD, StandardCharsets.UTF_8);
        RedisDatasourceConfig viaUri = RedisDatasourceConfig.buildFrom(Map.of("usingUri", true, "uri", "redis://:" + encoded + "@" + server.host() + ":" + server.port()));
        assertTrue(test("special password, encoded in URI mode", viaUri).isSuccess());
    }

    /**
     * BF-055 against a server that needs a password ({@code requirepass}), so an anonymous connection fails: an ACL user with
     * {@code nopass} given without a password connects (it was dropped, and the connection was anonymous), and an ACL user whose
     * name and password have reserved characters connects, while the same user with another password is refused.
     */
    @Test
    public void aclUserWithoutPasswordAndOneWithReservedCharactersConnectBF055() {
        RedisContainerSupport.Server server = RedisContainerSupport.Secured.SERVER;
        try (Jedis admin = server.jedis()) {
            assertEquals(ACL_OK, admin.aclSetUser(NOPASS_USER, "reset", "on", "nopass", "+@all", "~*"));
            assertEquals(ACL_OK, admin.aclSetUser(RESERVED_USER, "reset", "on", ">" + SPECIAL_PASSWORD, "+@all", "~*"));
        }
        try {
            assertFalse(test("secured, anonymous", server.config(null, null)).isSuccess(), "the control: no anonymous access");
            assertTrue(test("nopass ACL user without a password", server.config(NOPASS_USER, null)).isSuccess());
            assertTrue(test("ACL user with reserved characters", server.config(RESERVED_USER, SPECIAL_PASSWORD)).isSuccess());
            assertFalse(test("ACL user with reserved characters, another password", server.config(RESERVED_USER, PASSWORD)).isSuccess());
        } finally {
            try (Jedis admin = server.jedis()) {
                admin.aclDelUser(NOPASS_USER);
                admin.aclDelUser(RESERVED_USER);
            }
        }
    }
}
