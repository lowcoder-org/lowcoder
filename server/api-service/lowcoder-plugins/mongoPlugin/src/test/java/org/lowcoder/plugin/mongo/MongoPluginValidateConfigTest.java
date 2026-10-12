package org.lowcoder.plugin.mongo;

import com.mongodb.ConnectionString;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mongo.model.MongoConnectionUriParser;
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
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit MG-3 (task L5-8b): {@code MongoPlugin.MongoEngine.validateConfig} for every branch: URI mode (blank, invalid, valid),
 * host mode (blank host, a pasted URI in the host, the loopback restriction, the empty database) and the way the codes combine.
 *
 * <p>Host names are resolved by the loopback check (BF-023), in the host field and in the connection string the driver would
 * use; the names used for accepted hosts here do not resolve, which the check lets pass.
 *
 * <p>The URI branch now has three checks before the loopback one: the regex ({@code isValid}), the parse into parts
 * ({@code extractInfoFromConnectionStringURI == null}) and the driver's own parser ({@code driverParse == null}, NEW-20).
 *
 * <p>Limits: the second of those cannot fire (MongoPlugin.java:479-482), because {@code isValid} true implies a non-null
 * parse, so it is not covered.
 * The message codes are asserted, not their localized texts, and nothing here asserts the HTTP status or body those codes
 * become. Host mode is not fixed for a driver refusal (NEW-55): today's silence is pinned below rather than corrected.
 */
public class MongoPluginValidateConfigTest {

    static final String URL_EMPTY = "MONGODB_URL_EMPTY_PLZ_CHECK";
    static final String URL_INVALID = "INVALID_MONGODB_URL_PLZ_CHECK";
    static final String HOST_EMPTY = "HOST_EMPTY_PLZ_CHECK";
    static final String INVALID_HOST = "INVALID_HOST";
    static final String DATABASE_EMPTY = "DATABASE_EMPTY";
    static final String GOOD_HOST = "db.example.org";
    static final String GOOD_DATABASE = "app";

    /**
     * NEW-20: connection strings {@code MONGO_URL_REGEX} matches and the driver refuses, one per reason - an authority
     * read as host {@code u:p} with a non-numeric port (BF-060's split case), a database holding '/' or ' ', options
     * without the leading '/', an option without '=', an SRV host carrying a port, a username without a password, a
     * port that is not a number and one out of range, an unknown read preference, an unknown auth mechanism, and an
     * unenclosed IPv6 literal. Both tests below assert the driver's verdict case by case, so this list pins the
     * parsing decisions of whichever driver the classpath resolves rather than a stable MongoDB URI specification.
     */
    static final List<String> DRIVER_REFUSED_URIS = List.of(
            "mongodb://u:p/ss@h/db", "mongodb://h/db/x", "mongodb://h?x=1", "mongodb://localhost?x=1",
            "mongodb://h/db?x", "mongodb+srv://h:27017/db", "mongodb://u@h/db", "mongodb://h:notaport/db",
            "mongodb://h:99999/db", "mongodb://h/db?readPreference=bogus", "mongodb://h/a b",
            "mongodb://u:p@h/db?authMechanism=NOPE", "mongodb://[::1/db");

    /** NEW-20: connection strings that look malformed and the driver accepts; the last two are BF-060's cases. */
    static final List<String> DRIVER_ACCEPTED_URIS = List.of(
            "mongodb://h/db#frag", "mongodb://h,/db", "mongodb://h/db?ssl=notabool", "mongodb://h/db?w=x=y",
            "mongodb://realhost/db?appName=a:b@other", "mongodb://u?x:p?q@h/db");

    /** NEW-55: host-field values the driver refuses once the connection string is built around them. */
    static final List<String> DRIVER_REFUSED_HOSTS = List.of("h:notaport", "[::1", "h:99999");

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

    /**
     * BF-060: the credentials are read only before the first '/', so a URI whose authority is empty, which the old pattern
     * read by taking the credentials from the path, is now invalid, as it is for the driver.
     */
    @Test
    public void aUriWithAnEmptyAuthorityIsInvalidBF060() {
        for (String emptyAuthority : List.of("mongodb:///:p@h/db", "mongodb+srv:///db:x@h")) {
            assertEquals(Set.of(URL_INVALID), uri(emptyAuthority), emptyAuthority);
            assertThrows(IllegalArgumentException.class, () -> new ConnectionString(emptyAuthority), "the driver refuses " + emptyAuthority);
        }
    }

    /**
     * NEW-20: a connection string the regex matches but the driver's own parser refuses is now reported, instead of
     * saving and failing later on connect. Each case asserts three things in order: that the regex accepts it, so the
     * check that fires is the driver one and not {@code isValid}; that the driver refuses it, so the expectation is the
     * driver's own verdict and not a list copied from a probe; and the resulting code. `mongodb://localhost?x=1` also
     * pins the choice of code: a loopback host inside a refused URI gives the URL code alone, because a refused string
     * yields no hosts for the loopback check to see.
     *
     * <p>The printed driver messages can quote the part of the URI that was refused, which for two of these is a
     * credential pair; both are fabricated constants here, and the production path prints nothing at all.
     */
    @Test
    public void aUriTheDriverRefusesIsInvalidNEW20() {
        for (String refused : DRIVER_REFUSED_URIS) {
            assertTrue(MongoConnectionUriParser.isValid(refused), "the regex accepts '" + refused + "'");
            IllegalArgumentException thrown = assertThrows(IllegalArgumentException.class,
                    () -> new ConnectionString(refused), "the driver refuses '" + refused + "'");
            System.out.println("[MongoPluginValidateConfigTest] driver refuses " + refused + " -> " + thrown.getMessage());
            assertEquals(Set.of(URL_INVALID), uri(refused), refused);
        }
        Set<String> throughSdkEntry = engine.doValidateConfig(
                MongoDatasourceConfig.builder().usingUri(true).uri(DRIVER_REFUSED_URIS.get(0)).build());
        System.out.println("[MongoPluginValidateConfigTest] doValidateConfig " + DRIVER_REFUSED_URIS.get(0) + " -> " + throughSdkEntry);
        assertEquals(Set.of(URL_INVALID), throughSdkEntry, "the same key through the sdk entry the server calls");
    }

    /**
     * NEW-20, the guard: a URI the driver accepts gains no message from the new check. It asserts that and no more -
     * not that the datasource is usable. Each of these looks malformed and is not, so an implementation that rejected
     * on appearance rather than on the driver's verdict would fail here; the last two are BF-060's cases, which carry a
     * ':' and an '@' past the authority. `mongodb://h` and `mongodb://h/` are driver-accepted too but deliberately
     * absent: they carry no database, so asserting an empty result would pin something this task has no view on, which
     * {@code MongoConnectionUriParser.parseDatabaseFrom} contradicts later anyway.
     */
    @Test
    public void aUriTheDriverAcceptsIsNotRejectedByTheNewCheckNEW20() {
        for (String accepted : DRIVER_ACCEPTED_URIS) {
            ConnectionString parsed = new ConnectionString(accepted);
            System.out.println("[MongoPluginValidateConfigTest] driver accepts " + accepted + " -> hosts " + parsed.getHosts()
                    + " database " + parsed.getDatabase());
            assertEquals(Set.of(), uri(accepted), accepted);
        }
    }

    /**
     * NEW-55, asserted as today's behaviour and not as behaviour this task endorses: host mode answers nothing for a
     * host the driver cannot parse, so such a datasource still saves and fails on connect. It is pinned here because
     * NEW-20's fix rewrote {@code driverHosts(String)}, which host mode is the only caller of, and the rewrite must not
     * turn that silence into a {@code NullPointerException}.
     */
    @Test
    public void hostModeStillAnswersNothingWhenTheDriverRefusesTheBuiltStringNEW55() {
        for (String refusedHost : DRIVER_REFUSED_HOSTS) {
            assertEquals(Set.of(), host(refusedHost, GOOD_DATABASE), refusedHost);
        }
    }

    @Test
    public void validUrisGiveNoMessage() {
        for (String valid : List.of("mongodb://u:p@db.example.org:27017/app?x=y", "mongodb+srv://cluster0.example.net/app", "mongodb://h1:1,h2:2/app?replicaSet=rs0", "mongodb://db.example.org")) {
            assertEquals(Set.of(), uri(valid), valid);
        }
    }

    /**
     * BF-023 / D13 (fixed; was pinned: the loopback restriction applied to host mode only, so switching to URI mode
     * bypassed it). Every host of the URI is checked like the host field: one loopback or wildcard host among several, an
     * IPv6 literal and an SRV name are refused too.
     */
    @Test
    public void uriModeRejectsTheSameLoopbackHostsAsHostMode() {
        for (String loopback : List.of("mongodb://localhost/app", "mongodb://LOCALHOST:27017/app", "mongodb://127.0.0.1/app", "mongodb://u:p@127.0.0.1:27017/app?x=y",
                "mongodb+srv://localhost/app", "mongodb://[::1]:27017/app", "mongodb://h1:1,127.0.0.2:2/app?replicaSet=rs0", "mongodb://0.0.0.0/app")) {
            assertEquals(Set.of(INVALID_HOST), uri(loopback), loopback);
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
     * BF-023 (fixed; was pinned as the plan section 9 row "mongo host mode's loopback rejection is an exact string compare:
     * 127.0.0.2, 0.0.0.0 and [::1] are accepted"): the host is resolved and refused when any address is a loopback or the
     * wildcard address, whatever its spelling, including a loopback host added to the host field as a second host.
     */
    @Test
    public void otherLoopbackAndWildcardAddressesAreRejected() {
        for (String loopback : List.of("127.0.0.2", "127.255.255.254", "127.1", "0.0.0.0", "[::1]", "::1", "0:0:0:0:0:0:0:1", "::", " 127.0.0.1",
                "db.example.org:27017,127.0.0.1")) {
            assertEquals(Set.of(INVALID_HOST), host(loopback, GOOD_DATABASE), loopback);
        }
    }

    /**
     * The host field is put into the connection string as is, and the driver then reads hosts the field does not show as a
     * host: what follows a '/' or '?', or comes after credentials. The check reads the connection string the connection
     * would use, with the driver's own parser, so these are refused too.
     */
    @Test
    public void loopbackHostsTheDriverWouldReadFromTheConnectionStringAreRejected() {
        for (String smuggled : List.of("127.0.0.1/x?", "127.0.0.1/admin?authSource=")) {
            assertEquals(Set.of(INVALID_HOST), host(smuggled, GOOD_DATABASE), smuggled);
        }
        Set<String> withCredentials = engine.validateConfig(MongoDatasourceConfig.builder().usingUri(false)
                .username("u").password("p").host("127.0.0.1/x?").database(GOOD_DATABASE).build());
        System.out.println("[MongoPluginValidateConfigTest] credentials + host '127.0.0.1/x?' -> " + withCredentials);
        assertEquals(Set.of(INVALID_HOST), withCredentials);
    }

    /** The restriction is loopback and wildcard only: a private or a public address literal is accepted. */
    @Test
    public void privateAndPublicAddressesAreAccepted() {
        for (String address : List.of("10.0.0.5", "192.168.1.20", "172.16.0.1", "8.8.8.8", "[2001:db8::1]")) {
            assertEquals(Set.of(), host(address, GOOD_DATABASE), address);
            assertEquals(Set.of(), uri("mongodb://" + address + ":27017/app"), address);
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
