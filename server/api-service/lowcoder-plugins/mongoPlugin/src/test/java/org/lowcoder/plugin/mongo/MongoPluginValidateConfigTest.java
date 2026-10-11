package org.lowcoder.plugin.mongo;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mongo.model.MongoDatasourceConfig;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.plugin.mysql.MysqlDatasourceConfig;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Unit MG-3 (task L5-8b): {@code MongoPlugin.MongoEngine.validateConfig} for every branch: URI mode (blank, invalid, valid),
 * host mode (blank host, a pasted URI in the host, the loopback restriction, the empty database) and the way the codes combine.
 *
 * <p>Limits: the second check of the URI branch ({@code extractInfoFromConnectionStringURI == null}, MongoPlugin.java:404-407)
 * cannot fire, because {@code isValid} true implies a non-null parse, so it is not covered. The message codes are asserted, not
 * their localized texts.
 */
public class MongoPluginValidateConfigTest {

    static final String URL_EMPTY = "MONGODB_URL_EMPTY_PLZ_CHECK";
    static final String URL_INVALID = "INVALID_MONGODB_URL_PLZ_CHECK";
    static final String HOST_EMPTY = "HOST_EMPTY_PLZ_CHECK";
    static final String INVALID_HOST = "INVALID_HOST";
    static final String DATABASE_EMPTY = "DATABASE_EMPTY";
    static final String GOOD_HOST = "db.example.org";
    static final String GOOD_DATABASE = "app";

    private final MongoPlugin.MongoEngine engine = new MongoPlugin.MongoEngine(new ConfigCenterForTest());

    private Set<String> uri(String uri) {
        Set<String> result = engine.validateConfig(MongoDatasourceConfig.builder().usingUri(true).uri(uri).build());
        System.out.println("[MongoPluginValidateConfigTest] uri " + uri + " -> " + new TreeSet<>(result));
        return result;
    }

    private Set<String> host(String host, String database) {
        Set<String> result = engine.validateConfig(MongoDatasourceConfig.builder().usingUri(false).host(host).database(database).build());
        System.out.println("[MongoPluginValidateConfigTest] host '" + host + "' database '" + database + "' -> " + new TreeSet<>(result));
        return result;
    }

    // ---- URI mode

    @Test
    public void blankUriIsReportedAsEmpty() {
        for (String blank : Arrays.asList(null, "", "   ")) {
            assertEquals(Set.of(URL_EMPTY), uri(blank), "'" + blank + "'");
        }
    }

    @Test
    public void invalidUriIsReported() {
        for (String invalid : List.of("not a uri", "http://h/db", "mongodb://", "MONGODB://h/db", " mongodb://h/db")) {
            assertEquals(Set.of(URL_INVALID), uri(invalid), "'" + invalid + "'");
        }
    }

    @Test
    public void validUrisGiveNoMessage() {
        for (String valid : List.of("mongodb://u:p@db.example.org:27017/app?x=y", "mongodb+srv://cluster0.example.net/app", "mongodb://h1:1,h2:2/app?replicaSet=rs0", "mongodb://db.example.org")) {
            assertEquals(Set.of(), uri(valid), valid);
        }
    }

    /**
     * Pins defect D13 (analysis-plugins section 0.6; plan section 9 D1-D20 row): the loopback restriction is applied to host
     * mode only. In URI mode the same hosts that host mode rejects ({@code localhost}, {@code 127.0.0.1}) are accepted, so
     * switching to URI mode bypasses it. A fix (applying the restriction to the host part of the URI) changes this test on
     * purpose. The comparison of host mode is the next test.
     */
    @Test
    public void uriModeAcceptsLoopbackHostsThatHostModeRejects_pinsD13() {
        for (String loopback : List.of("mongodb://localhost/app", "mongodb://LOCALHOST:27017/app", "mongodb://127.0.0.1/app", "mongodb://u:p@127.0.0.1:27017/app?x=y", "mongodb+srv://localhost/app")) {
            assertEquals(Set.of(), uri(loopback), loopback);
        }
        assertEquals(Set.of(INVALID_HOST), host("localhost", GOOD_DATABASE), "host mode rejects the same host");
        assertEquals(Set.of(INVALID_HOST), host("127.0.0.1", GOOD_DATABASE), "host mode rejects the same host");
    }

    // ---- host mode

    @Test
    public void hostModeWithHostAndDatabaseGivesNoMessage() {
        assertEquals(Set.of(), host(GOOD_HOST, GOOD_DATABASE));
        assertEquals(Set.of(), host("localhost.example.org", GOOD_DATABASE), "only the whole name localhost is restricted");
        assertEquals(Set.of(), host("my-localhost", GOOD_DATABASE), "not a loopback name either");
    }

    @Test
    public void localhostAndTheLiteralLoopbackAddressAreRejected() {
        for (String restricted : List.of("localhost", "LOCALHOST", "LocalHost", "127.0.0.1")) {
            assertEquals(Set.of(INVALID_HOST), host(restricted, GOOD_DATABASE), restricted);
        }
    }

    /**
     * Pins the plan section 9 row "mongo host mode's loopback rejection is an exact string compare: 127.0.0.2, 0.0.0.0 and
     * [::1] are accepted" (D-6: fix deferred): {@code validateConfig} compares the host with {@code localhost} (any case) and
     * {@code 127.0.0.1} (exact) only, so the other loopback or any-local addresses pass. A fix (a literal-address check or
     * {@code InetAddress.isLoopbackAddress/isAnyLocalAddress}) changes this test on purpose.
     */
    @Test
    public void otherLoopbackAddressesAreAccepted_pinsTheSection9Row() {
        for (String loopback : List.of("127.0.0.2", "127.255.255.254", "0.0.0.0", "[::1]", "::1", "0:0:0:0:0:0:0:1", " 127.0.0.1")) {
            assertEquals(Set.of(), host(loopback, GOOD_DATABASE), loopback);
        }
    }

    @Test
    public void blankHostIsReportedAsEmpty() {
        for (String blank : Arrays.asList(null, "", "   ")) {
            assertEquals(Set.of(HOST_EMPTY), host(blank, GOOD_DATABASE), "'" + blank + "'");
        }
    }

    /**
     * Shows the code for a connection string pasted into the host field: it is reported with the same code as an empty host
     * ({@code HOST_EMPTY_PLZ_CHECK}) although the host is not empty (the wrong-code part of D13, analysis-plugins section 0.6;
     * plan section 9 D1-D20 row). Asserted as today's behaviour.
     */
    @Test
    public void aUriPastedIntoTheHostFieldIsReportedWithTheEmptyHostCode() {
        for (String pasted : List.of("mongodb://db.example.org", "mongodb+srv://cluster0.example.net", "see mongodb://h", "xmongodb+srv")) {
            assertEquals(Set.of(HOST_EMPTY), host(pasted, GOOD_DATABASE), pasted);
        }
        assertEquals(Set.of(), host("mongodb.example.org", GOOD_DATABASE), "the word mongodb alone is fine");
    }

    @Test
    public void emptyDatabaseIsReportedButABlankOneIsNot() {
        assertEquals(Set.of(DATABASE_EMPTY), host(GOOD_HOST, null));
        assertEquals(Set.of(DATABASE_EMPTY), host(GOOD_HOST, ""));
        assertEquals(Set.of(), host(GOOD_HOST, "   "), "the check is isEmpty, not isBlank: a database of spaces is accepted");
    }

    @Test
    public void severalProblemsAreReportedTogether() {
        assertEquals(Set.of(HOST_EMPTY, DATABASE_EMPTY), host("", ""));
        assertEquals(Set.of(HOST_EMPTY, DATABASE_EMPTY), host(null, null));
        assertEquals(Set.of(INVALID_HOST, DATABASE_EMPTY), host("localhost", ""));
        assertEquals(Set.of(HOST_EMPTY, DATABASE_EMPTY), host("mongodb://localhost", ""), "a pasted URI never also counts as localhost");
    }

    // ---- sdk entry

    @Test
    public void doValidateConfigDelegatesForAMongoConfigAndRejectsAForeignOneWithABareClassCastException() {
        DatasourceConnectionConfig mongo = MongoDatasourceConfig.builder().usingUri(false).host(GOOD_HOST).database(GOOD_DATABASE).build();
        assertEquals(Set.of(), engine.doValidateConfig(mongo));
        DatasourceConnectionConfig empty = MongoDatasourceConfig.builder().usingUri(true).build();
        assertEquals(Set.of(URL_EMPTY), engine.doValidateConfig(empty));
        MysqlDatasourceConfig foreign = new MysqlDatasourceConfig("db", "u", "p", "h", 3306L, false, null, false, false, null);
        ClassCastException thrown = assertThrows(ClassCastException.class, () -> engine.doValidateConfig(foreign));
        System.out.println("[MongoPluginValidateConfigTest] foreign config: " + thrown.getMessage());
    }
}
