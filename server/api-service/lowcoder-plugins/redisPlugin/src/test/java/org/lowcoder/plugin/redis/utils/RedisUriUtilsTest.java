package org.lowcoder.plugin.redis.utils;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.redis.model.RedisDatasourceConfig;
import redis.clients.jedis.util.JedisURIHelper;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Unit RD-1 (task L5-9): {@code RedisUriUtils.getURI}, the connection URI built from the datasource config: host and port,
 * the default port, the credentials, URI mode, the SSL scheme (D6, fixed by BF-024) and the encoded credentials (D5, fixed by
 * BF-055). The credentials are read back as Jedis reads them ({@link JedisURIHelper}).
 *
 * <p>Limits: only the URI is built; whether a server accepts it is RD-6.
 */
public class RedisUriUtilsTest {

    static final String TAG = "[RedisUriUtilsTest] ";
    static final String HOST = "cache.example.org";
    static final long PORT = 6380;
    static final long DEFAULT_PORT = 6379;
    static final String PASSWORD = "pw";
    /** Each character a URI's user info gives a meaning to, a space, a plus and a non-ASCII letter. */
    static final List<String> RESERVED = List.of("a@b", "a:b", "a/b", "a#b", "a%b", "a?b", "a b", "a+b", "p@ss:w/rd#1%", "pässwörd");

    private static RedisDatasourceConfig config(Map<String, Object> values) {
        return RedisDatasourceConfig.buildFrom(new HashMap<>(values));
    }

    private static URI uri(Map<String, Object> values) throws URISyntaxException {
        URI uri = RedisUriUtils.getURI(config(values));
        System.out.println(TAG + values + " -> " + uri);
        return uri;
    }

    @Test
    public void hostAndPortBuildAPlainRedisUri() throws Exception {
        URI uri = uri(Map.of("host", HOST, "port", PORT));
        assertEquals("redis://" + HOST + ":" + PORT, uri.toString());
        assertEquals("redis", uri.getScheme());
        assertEquals(HOST, uri.getHost());
        assertEquals(PORT, uri.getPort());
        assertNull(uri.getUserInfo());
    }

    @Test
    public void portDefaultsTo6379() throws Exception {
        assertEquals("redis://" + HOST + ":" + DEFAULT_PORT, uri(Map.of("host", HOST)).toString());
    }

    @Test
    public void passwordAloneIsAnEmptyUserAndUserWithPasswordIsBoth() throws Exception {
        assertEquals("redis://:pw@" + HOST + ":" + PORT, uri(Map.of("host", HOST, "port", PORT, "password", "pw")).toString());
        assertEquals("redis://alice:pw@" + HOST + ":" + PORT, uri(Map.of("host", HOST, "port", PORT, "username", "alice", "password", "pw")).toString());
        assertEquals("redis://" + HOST + ":" + PORT, uri(Map.of("host", HOST, "port", PORT, "password", "   ")).toString(), "a blank password adds no credentials");
    }

    /**
     * BF-055 (formerly the D5 observation "a user name without a password is dropped", which connected anonymously): the user
     * name is kept with an empty password, which Jedis sends as {@code AUTH alice ""}.
     */
    @Test
    public void userNameWithoutPasswordIsKeptWithAnEmptyPasswordBF055() throws Exception {
        URI uri = uri(Map.of("host", HOST, "port", PORT, "username", "alice"));
        assertEquals("redis://alice:@" + HOST + ":" + PORT, uri.toString());
        assertEquals("alice", JedisURIHelper.getUser(uri));
        assertEquals("", JedisURIHelper.getPassword(uri));
        URI blankPassword = uri(Map.of("host", HOST, "port", PORT, "username", "alice", "password", "  "));
        assertEquals(uri, blankPassword, "a blank password counts as absent");
    }

    @Test
    public void uriModePassesTheStoredUriThroughAndRejectsAnInvalidOne() throws Exception {
        assertEquals("redis://u:p@other:7000/2", uri(Map.of("usingUri", true, "uri", "redis://u:p@other:7000/2", "host", HOST)).toString());
        assertEquals("rediss://secure:6380", uri(Map.of("usingUri", true, "uri", "rediss://secure:6380")).toString());
        assertThrows(URISyntaxException.class, () -> uri(Map.of("usingUri", true, "uri", "redis://bad host:1")));
    }

    /** The URI for the given credentials (null for none), as Jedis reads it back: user, password and host. */
    private static List<String> readBack(String username, String password) throws URISyntaxException {
        Map<String, Object> values = new HashMap<>(Map.of("host", HOST, "port", PORT));
        if (username != null) {
            values.put("username", username);
        }
        values.put("password", password);
        URI uri = RedisUriUtils.getURI(config(values));
        List<String> read = Arrays.asList(JedisURIHelper.getUser(uri), JedisURIHelper.getPassword(uri), uri.getHost());
        System.out.println(TAG + "user " + username + ", password " + password + " -> " + uri + " -> Jedis reads " + read);
        return read;
    }

    /**
     * BF-055 (formerly pinned as D5, "credentials not URL-encoded"): a password with characters a URI gives a meaning to comes
     * back from the URI unchanged, alone and with a user name.
     */
    @Test
    public void passwordsWithReservedCharactersRoundTripBF055() throws Exception {
        assertEquals("redis://:a%40b%3Ac%2Fd%23e%25f%20g@" + HOST + ":" + PORT, uri(Map.of("host", HOST, "port", PORT, "password", "a@b:c/d#e%f g")).toString());
        for (String password : RESERVED) {
            assertEquals(Arrays.asList(null, password, HOST), readBack(null, password), password);
            assertEquals(List.of("alice", password, HOST), readBack("alice", password), password);
        }
    }

    /**
     * BF-055, the user-name half: a user name with characters a URI gives a meaning to comes back unchanged, except a colon:
     * Jedis splits the decoded user info at its first colon, so a user name with one cannot be given (the limit documented on
     * {@code RedisUriUtils.getUriAuth}).
     */
    @Test
    public void userNamesWithReservedCharactersRoundTripExceptAColonBF055() throws Exception {
        for (String username : RESERVED) {
            if (username.contains(":")) {
                continue;
            }
            assertEquals(List.of(username, PASSWORD, HOST), readBack(username, PASSWORD), username);
        }
        assertEquals(List.of("a", "b:" + PASSWORD, HOST), readBack("a:b", PASSWORD), "the colon limit");
    }

    /**
     * Catches a clear-text connection when SSL is selected (BF-024, formerly pinned as D6 "the SSL switch is ignored"): with
     * {@code usingSsl} the scheme is {@code rediss}, the scheme Jedis connects to with TLS, with the same credentials, host and
     * port as without it; without it the scheme stays {@code redis}. In URI mode the stored URI is passed through unchanged,
     * whatever the switch says.
     */
    @Test
    public void sslSwitchSelectsTheRedissScheme() throws Exception {
        URI withSsl = uri(Map.of("host", HOST, "port", PORT, "username", "alice", "password", "pw", "usingSsl", true));
        URI withoutSsl = uri(Map.of("host", HOST, "port", PORT, "username", "alice", "password", "pw", "usingSsl", false));
        assertEquals("rediss://alice:pw@" + HOST + ":" + PORT, withSsl.toString());
        assertEquals("redis://alice:pw@" + HOST + ":" + PORT, withoutSsl.toString());
        assertEquals("redis://u:p@other:7000/2", uri(Map.of("usingUri", true, "uri", "redis://u:p@other:7000/2", "usingSsl", true)).toString());
    }
}
