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
 * ({@code buildClientUri}, lines 324-336), so the parsed host and credentials are never used to connect; the parts only
 * validate the string ({@code validateConfig} 425-444, {@code buildClientUri} 330-333) and the database name comes from here
 * ({@code getParsedDatabase}, used at lines 189, 212, 307 and 365). A misread therefore shows as a wrong or missing database
 * name, not as a wrong host.
 *
 * <p>Limits: string handling, no server; the driver (the module's, 4.11) is used only to read the database it would connect
 * with (BF-060 agreement test); the client form carries a copy of the regex as it was before BF-060, which accepts every
 * URI this one accepts (mongoDatasourceForm.tsx:53-55), not tested here.
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
        assertEquals(expected(PLAIN_HEAD, null, null, "u:p", "ss@h/db", null), parts("mongodb://u:p/ss@h/db"),
                "a slash ends the authority, as for the driver (which refuses this URI: an unencoded / in the password)");
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
     * BF-060 (formerly pinned as the plan section 9 row "MongoConnectionUriParser reads a `:`...`@` in the query string as
     * credentials"): the credentials are matched only before the first {@code /}, so a {@code :} and a later {@code @}
     * in the options stay in the options, while a {@code ?} before the first {@code /} stays in the credentials, as the
     * driver reads it. {@code mongodb://realhost/db?appName=a:b@other} has host
     * {@code realhost} and database {@code db} (it lost its database before), and {@code mongodb://h/db?appName=a:b@c/other}
     * has database {@code db} (it gave {@code other}); the driver reads the same database (driver agreement test below).
     */
    @Test
    public void aColonAndAnAtSignInTheOptionsStayInTheOptionsBF060() {
        String uri = "mongodb://realhost/db?appName=a:b@other";
        assertEquals(expected(PLAIN_HEAD, null, null, "realhost", "db", "appName=a:b@other"), parts(uri));
        assertEquals("db", MongoConnectionUriParser.parseDatabaseFrom(uri));

        String otherDatabase = "mongodb://h/db?appName=a:b@c/other";
        assertEquals(expected(PLAIN_HEAD, null, null, "h", "db", "appName=a:b@c/other"), parts(otherDatabase));
        assertEquals("db", MongoConnectionUriParser.parseDatabaseFrom(otherDatabase));

        String withCredentials = "mongodb://u:p@h/db?appName=a:b@c";
        assertEquals(expected(PLAIN_HEAD, "u", "p", "h", "db", "appName=a:b@c"), parts(withCredentials), "real credentials are still read");

        assertEquals(expected(PLAIN_HEAD, "u?x", "p?q", "h", "db", "a=1"), parts("mongodb://u?x:p?q@h/db?a=1"), "a ? before the first / is in the credentials");
    }

    /**
     * BF-060: for every URI the MongoDB driver accepts, the database the parser gives is the one the driver connects with
     * ({@code ConnectionString.getDatabase}): the database that the structure and the queries use is the URI's. The driver
     * is the module's own (4.11), so a driver upgrade that reads the authority differently fails here: 5.5 ends the authority
     * at a {@code ?}, reads no database from {@code mongodb://u?x:p?q@h/db?a=1} and refuses {@code mongodb://?u:p@h/db}.
     */
    @Test
    public void theDatabaseIsTheOneTheDriverReadsBF060() {
        for (String uri : List.of("mongodb://realhost/db?appName=a:b@other", "mongodb://h/db?appName=a:b@c/other", "mongodb://u:p@h:27017/db?x=y",
                "mongodb+srv://u:p@cluster0.example.net/db?retryWrites=true", "mongodb://us%40er:p%3Aw%40rd@h/db", "mongodb://h1:1,h2:2/db?replicaSet=rs0",
                "mongodb://u:p@h/db?authSource=admin&appName=x:y@z", "mongodb://u?x:p?q@h/db?a=1", "mongodb://?u:p@h/db")) {
            String driverDatabase = new com.mongodb.ConnectionString(uri).getDatabase();
            System.out.println("[MongoConnectionUriParserTest] " + uri + " driver database " + driverDatabase);
            assertEquals(driverDatabase, MongoConnectionUriParser.parseDatabaseFrom(uri), uri);
        }
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
