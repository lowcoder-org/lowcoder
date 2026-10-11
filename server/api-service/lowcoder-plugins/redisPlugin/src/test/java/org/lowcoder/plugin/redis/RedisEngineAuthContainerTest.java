package org.lowcoder.plugin.redis;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.redis.model.RedisDatasourceConfig;
import org.lowcoder.sdk.models.DatasourceTestResult;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.plugin.redis.RedisContainerSupport.PASSWORD;
import static org.lowcoder.plugin.redis.RedisContainerSupport.SPECIAL_PASSWORD;

/**
 * Unit RD-6 (task L5-9), connection and authentication against real servers ({@link RedisContainerSupport}): {@code testConnection}
 * with no password, the right and a wrong password, a user name, and a password with reserved URI characters (defect D5 against a
 * server).
 *
 * <p>Limits: the default user and the single {@code requirepass} password only; ACL users, TLS and clusters are not exercised.
 */
public class RedisEngineAuthContainerTest {

    static final String TAG = "[RedisEngineAuthContainerTest] ";
    static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(30);
    static final String DEFAULT_USER = "default";

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

    @Test
    public void aPasswordThatIsSentToAServerWithoutOneFails() {
        assertFalse(test("open, password sent", RedisContainerSupport.Open.SERVER.config(null, "unexpected")).isSuccess());
    }

    /**
     * Pins defect D5 (analysis-plugins section 0.6; plan section 9 D1-D20 row) against a real server: the password
     * {@code p@ss:w/rd#1%} is the server's, and the same password entered in a host-mode config fails to connect, because the
     * credentials are put into the URI unencoded. The URI-mode config with the encoded password connects, which shows the
     * password itself is right. A fix (encoding the credentials in host mode) changes the first assertion on purpose.
     */
    @Test
    public void hostModeConfigWithReservedCharactersInThePasswordFails_pinsD5() {
        RedisContainerSupport.Server server = RedisContainerSupport.Special.SERVER;
        assertFalse(test("special password, host mode", server.config()).isSuccess());
        String encoded = URLEncoder.encode(SPECIAL_PASSWORD, StandardCharsets.UTF_8);
        RedisDatasourceConfig viaUri = RedisDatasourceConfig.buildFrom(Map.of("usingUri", true, "uri", "redis://:" + encoded + "@" + server.host() + ":" + server.port()));
        assertTrue(test("special password, encoded in URI mode", viaUri).isSuccess());
    }
}
