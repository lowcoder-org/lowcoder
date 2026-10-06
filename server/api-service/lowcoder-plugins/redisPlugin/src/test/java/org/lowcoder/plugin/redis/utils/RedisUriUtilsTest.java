package org.lowcoder.plugin.redis.utils;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.redis.model.RedisDatasourceConfig;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit RD-1 (task L5-9): {@code RedisUriUtils.getURI}, the connection URI built from the datasource config: host and port,
 * the default port, the credentials, URI mode, the SSL scheme (D6, fixed by BF-024) and the known defect D5 (credentials not
 * encoded).
 *
 * <p>Limits: only the URI is built; whether a server accepts it is RD-6.
 */
public class RedisUriUtilsTest {

    static final String TAG = "[RedisUriUtilsTest] ";
    static final String HOST = "cache.example.org";
    static final long PORT = 6380;
    static final long DEFAULT_PORT = 6379;

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

    /** Observation, part of the D5 row: a user name without a password is silently dropped, so the server sees an anonymous connection. */
    @Test
    public void userNameWithoutPasswordIsDropped_partOfTheD5Row() throws Exception {
        URI uri = uri(Map.of("host", HOST, "port", PORT, "username", "alice"));
        assertEquals("redis://" + HOST + ":" + PORT, uri.toString());
        assertNull(uri.getUserInfo());
    }

    @Test
    public void uriModePassesTheStoredUriThroughAndRejectsAnInvalidOne() throws Exception {
        assertEquals("redis://u:p@other:7000/2", uri(Map.of("usingUri", true, "uri", "redis://u:p@other:7000/2", "host", HOST)).toString());
        assertEquals("rediss://secure:6380", uri(Map.of("usingUri", true, "uri", "rediss://secure:6380")).toString());
        assertThrows(URISyntaxException.class, () -> uri(Map.of("usingUri", true, "uri", "redis://bad host:1")));
    }

    private static boolean roundTrips(String password) {
        try {
            URI uri = RedisUriUtils.getURI(config(Map.of("host", HOST, "port", PORT, "password", password)));
            boolean same = (":" + password).equals(uri.getUserInfo());
            System.out.println(TAG + "password " + password + " -> " + uri + " userInfo=" + uri.getUserInfo() + " host=" + uri.getHost() + " roundTrips=" + same);
            return same && HOST.equals(uri.getHost());
        } catch (URISyntaxException e) {
            System.out.println(TAG + "password " + password + " -> URISyntaxException " + e.getMessage());
            return false;
        }
    }

    /**
     * Pins defect D5 (analysis-plugins section 0.6; plan section 9 D1-D20 row): the credentials are put into the URI without
     * URL-encoding, so a password with one of {@code @ / # %} does not come back as the same password (a syntax error, or a
     * different user info or host). A fix (encoding the user name and password) changes this test on purpose.
     */
    @Test
    public void passwordsWithReservedCharactersDoNotRoundTrip_pinsD5() {
        assertTrue(roundTrips("plain-Pass_1"), "a password without reserved characters is the control");
        assertTrue(roundTrips("a:b"), "a colon in the password survives: the user info keeps everything before the at sign");
        for (String password : List.of("a@b", "a/b", "a#b", "a%b")) {
            assertFalse(roundTrips(password), password);
        }
    }

    private static boolean userRoundTrips(String username) {
        try {
            URI uri = RedisUriUtils.getURI(config(Map.of("host", HOST, "port", PORT, "username", username, "password", "pw")));
            boolean same = uri.getUserInfo() != null && Arrays.equals(new String[] {username, "pw"}, uri.getUserInfo().split(":", 2)); // the split Jedis applies: user before the first colon
            System.out.println(TAG + "user " + username + " -> " + uri + " userInfo=" + uri.getUserInfo() + " host=" + uri.getHost() + " roundTrips=" + same);
            return same && HOST.equals(uri.getHost());
        } catch (URISyntaxException e) {
            System.out.println(TAG + "user " + username + " -> URISyntaxException " + e.getMessage());
            return false;
        }
    }

    /**
     * Pins the user-name half of defect D5 (analysis-plugins section 0.6; plan section 9 D1-D20 row): the user name is put into the
     * URI without URL-encoding either, so a user name with one of {@code @ : / # %} does not come back as the same user (a syntax
     * error, or a different user info or host). A fix (encoding the user name) changes this test on purpose.
     */
    @Test
    public void userNamesWithReservedCharactersDoNotRoundTrip_pinsD5() {
        assertTrue(userRoundTrips("alice_1"), "a user name without reserved characters is the control");
        for (String username : List.of("a@b", "a:b", "a/b", "a#b", "a%b")) {
            assertFalse(userRoundTrips(username), username);
        }
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
