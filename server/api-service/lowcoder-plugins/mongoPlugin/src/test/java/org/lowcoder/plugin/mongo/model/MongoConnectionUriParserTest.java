package org.lowcoder.plugin.mongo.model;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.PluginCommonError.DATASOURCE_ARGUMENT_ERROR;

/**
 * Unit MG-1 (task L5-8a): {@link MongoConnectionUriParser}: the validity check, the split of a connection string into
 * head, credentials, host list, database and options, and the database name taken from it.
 *
 * <p>What consumes the result (MongoPlugin.java): the raw URI is what {@code MongoClients.create} gets in URI mode
 * ({@code buildClientUri}, lines 316-331), so the parsed host and credentials are never used to connect; the parts only
 * validate the string ({@code validateConfig} 394-410, {@code buildClientUri} 324-327) and the database name comes from here
 * ({@code getParsedDatabase}, used at lines 183, 206, 301 and 359). A misread therefore shows as a wrong or missing database
 * name, not as a wrong host.
 *
 * <p>Limits: pure string handling, no driver and no server; the client form carries a copy of the same regex
 * (mongoDatasourceForm.tsx:53-55), not tested here.
 */
public class MongoConnectionUriParserTest {

    static final String HEAD = "uriHead";
    static final String USER = "username";
    static final String PASSWORD = "password";
    static final String HOST_PORT = "hostPort";
    static final String DB = "dbName";
    static final String TAIL = "uriTail";
    static final String PLAIN_HEAD = "mongodb://";
    static final String SRV_HEAD = "mongodb+srv://";

    private static Map<String, String> parts(String uri) {
        Map<String, String> info = MongoConnectionUriParser.extractInfoFromConnectionStringURI(uri);
        System.out.println("[MongoConnectionUriParserTest] " + uri + " -> " + (info == null ? null : new java.util.TreeMap<>(info)));
        return info;
    }

    private static Map<String, String> expected(String head, String user, String password, String hostPort, String db, String tail) {
        Map<String, String> map = new HashMap<>();
        map.put(HEAD, head);
        map.put(USER, user);
        map.put(PASSWORD, password);
        map.put(HOST_PORT, hostPort);
        map.put(DB, db);
        map.put(TAIL, tail);
        return map;
    }

    @Test
    public void plainUriWithCredentialsPortDatabaseAndOptionsIsSplitIntoItsParts() {
        assertEquals(expected(PLAIN_HEAD, "u", "p", "h:27017", "db", "x=y"), parts("mongodb://u:p@h:27017/db?x=y"));
        assertTrue(MongoConnectionUriParser.isValid("mongodb://u:p@h:27017/db?x=y"));
        assertEquals("db", MongoConnectionUriParser.parseDatabaseFrom("mongodb://u:p@h:27017/db?x=y"));
    }

    @Test
    public void srvUriKeepsItsHead() {
        assertEquals(expected(SRV_HEAD, "u", "p", "cluster0.example.net", "db", null), parts("mongodb+srv://u:p@cluster0.example.net/db"));
        assertEquals(expected(SRV_HEAD, null, null, "cluster0.example.net", "db", "retryWrites=true&w=majority"), parts("mongodb+srv://cluster0.example.net/db?retryWrites=true&w=majority"));
    }

    @Test
    public void multiHostReplicaSetWithoutCredentialsKeepsTheWholeHostList() {
        assertEquals(expected(PLAIN_HEAD, null, null, "h1:27017,h2:27018,h3:27019", "db", "replicaSet=rs0"),
                parts("mongodb://h1:27017,h2:27018,h3:27019/db?replicaSet=rs0"));
    }

    @Test
    public void credentialsAreReturnedAsWrittenNotDecoded() {
        assertEquals(expected(PLAIN_HEAD, "us%40er", "p%3Aw%40rd", "h", "db", null), parts("mongodb://us%40er:p%3Aw%40rd@h/db"));
        assertEquals(expected(PLAIN_HEAD, "u", "p@ss", "h", "db", null), parts("mongodb://u:p@ss@h/db"), "the greedy credentials group runs to the last @ before the host");
        assertEquals(expected(PLAIN_HEAD, "u", "p/ss", "h", "db", null), parts("mongodb://u:p/ss@h/db"), "a slash in the password stays in the password");
    }

    @Test
    public void missingDatabaseGivesNullInTheMapAndAnErrorFromParseDatabase() {
        for (String uri : List.of("mongodb://h", "mongodb://h/", "mongodb://h:27017?x=y", "mongodb://h/?x=y")) {
            Map<String, String> info = parts(uri);
            assertNull(info.get(DB), uri);
            assertTrue(MongoConnectionUriParser.isValid(uri), uri);
            PluginException thrown = assertThrows(PluginException.class, () -> MongoConnectionUriParser.parseDatabaseFrom(uri), uri);
            assertEquals(DATASOURCE_ARGUMENT_ERROR, thrown.getError());
            assertEquals("MONGODB_DATABASE_EMPTY", thrown.getMessageKey());
        }
        assertEquals("x=y", parts("mongodb://h/?x=y").get(TAIL));
        PluginException blank = assertThrows(PluginException.class, () -> MongoConnectionUriParser.parseDatabaseFrom("mongodb://h/ "));
        assertEquals("MONGODB_DATABASE_EMPTY", blank.getMessageKey(), "a blank database name counts as missing");
    }

    @Test
    public void emptyOptionsAfterTheQuestionMarkGiveNoTail() {
        assertEquals(expected(PLAIN_HEAD, null, null, "h", "db", null), parts("mongodb://h/db?"));
    }

    @Test
    public void databaseNameRunsUpToTheQuestionMarkSoASlashStaysInIt() {
        assertEquals(expected(PLAIN_HEAD, null, null, "h", "db/x", "a=1"), parts("mongodb://h/db/x?a=1"));
        assertEquals("db/x", MongoConnectionUriParser.parseDatabaseFrom("mongodb://h/db/x?a=1"));
    }

    @Test
    public void invalidStringsAreRejectedAndGiveNoParts() {
        for (String uri : List.of("", "mongodb://", "http://h/db", "MONGODB://h/db", "mongodb:/h/db", " mongodb://h/db", "mongodb+srv:/h", "h/db", "mongodb://?x=y")) {
            assertFalse(MongoConnectionUriParser.isValid(uri), "'" + uri + "'");
            assertNull(MongoConnectionUriParser.extractInfoFromConnectionStringURI(uri), "'" + uri + "'");
            PluginException thrown = assertThrows(PluginException.class, () -> MongoConnectionUriParser.parseDatabaseFrom(uri), uri);
            assertEquals(DATASOURCE_ARGUMENT_ERROR, thrown.getError());
            assertEquals("INVALID_MONGODB_URL", thrown.getMessageKey());
        }
    }

    /**
     * Pins the plan section 9 row "MongoConnectionUriParser reads a `:`...`@` in the query string as credentials: no database (createConnection fails) or a different database than the URI names (queries run against it)" (D-6: fix deferred): the optional credentials group {@code (.+):(.+)@} is greedy and sees the whole string, so a
     * {@code :} and a later {@code @} in the options are read as user name and password and the host moves. In
     * {@code mongodb://realhost/db?appName=a:b@other} the "user" becomes {@code realhost/db?appName=a}, the "password" {@code b},
     * the "host" {@code other} and the database is lost: {@code parseDatabaseFrom} fails with MONGODB_DATABASE_EMPTY while
     * the driver, which gets the raw URI, would connect to realhost/db. When a {@code /} follows the {@code @} the database name
     * is the wrong one: {@code mongodb://h/db?appName=a:b@c/other} gives database {@code other}. A fix (credentials matched
     * only before the first {@code /} or {@code ?}) changes this test on purpose.
     */
    @Test
    public void aColonAndAnAtSignInTheOptionsAreReadAsCredentials_pinsTheSection9Row() {
        String uri = "mongodb://realhost/db?appName=a:b@other";
        Map<String, String> info = parts(uri);
        assertEquals(expected(PLAIN_HEAD, "realhost/db?appName=a", "b", "other", null, null), info);
        assertTrue(MongoConnectionUriParser.isValid(uri), "the string passes the validity check");
        PluginException thrown = assertThrows(PluginException.class, () -> MongoConnectionUriParser.parseDatabaseFrom(uri));
        assertEquals("MONGODB_DATABASE_EMPTY", thrown.getMessageKey(), "the database of realhost/db is lost");

        String wrongDatabase = "mongodb://h/db?appName=a:b@c/other";
        assertEquals(expected(PLAIN_HEAD, "h/db?appName=a", "b", "c", "other", null), parts(wrongDatabase));
        assertEquals("other", MongoConnectionUriParser.parseDatabaseFrom(wrongDatabase), "the database named in the options is taken instead of db");
    }

    /**
     * Observation, no section 9 row: a user name without a password has no {@code :} to match the credentials group, so
     * {@code mongodb://user@h/db} is read as host {@code user@h} with no user. The database is still right and the driver gets
     * the raw URI, so nothing downstream goes wrong; only the parts are misleading. A fix changes this test on purpose.
     */
    @Test
    public void aUserNameWithoutPasswordIsReadAsPartOfTheHost() {
        assertEquals(expected(PLAIN_HEAD, null, null, "user@h", "db", null), parts("mongodb://user@h/db"));
        assertEquals("db", MongoConnectionUriParser.parseDatabaseFrom("mongodb://user@h/db"));
    }

    /** Null is not guarded: all three entry points throw a NullPointerException. */
    @Test
    public void nullInputThrowsANullPointerException() {
        assertThrows(NullPointerException.class, () -> MongoConnectionUriParser.isValid(null));
        assertThrows(NullPointerException.class, () -> MongoConnectionUriParser.extractInfoFromConnectionStringURI(null));
        assertThrows(NullPointerException.class, () -> MongoConnectionUriParser.parseDatabaseFrom(null));
    }
}
