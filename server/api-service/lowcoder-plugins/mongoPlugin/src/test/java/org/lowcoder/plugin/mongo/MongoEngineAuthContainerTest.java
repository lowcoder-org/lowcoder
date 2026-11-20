package org.lowcoder.plugin.mongo;

import tools.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.mongo.model.MongoConnection;
import org.lowcoder.plugin.mongo.model.MongoDatasourceConfig;
import org.lowcoder.plugin.mongo.model.MongoQueryExecutionContext;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.QueryExecutionResult;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.plugin.mongo.MongoAuthContainerSupport.ADMIN_DATABASE;
import static org.lowcoder.plugin.mongo.MongoAuthContainerSupport.APP_PASSWORD;
import static org.lowcoder.plugin.mongo.MongoAuthContainerSupport.APP_USER;
import static org.lowcoder.plugin.mongo.MongoAuthContainerSupport.BLOCK_TIMEOUT;
import static org.lowcoder.plugin.mongo.MongoAuthContainerSupport.DATABASE;
import static org.lowcoder.plugin.mongo.MongoAuthContainerSupport.ENGINE;
import static org.lowcoder.plugin.mongo.MongoAuthContainerSupport.ROOT_PASSWORD;
import static org.lowcoder.plugin.mongo.MongoAuthContainerSupport.ROOT_USER;
import static org.lowcoder.plugin.mongo.MongoAuthContainerSupport.WRONG_PASSWORD;
import static org.lowcoder.plugin.mongo.MongoAuthContainerSupport.hostConfig;
import static org.lowcoder.plugin.mongo.MongoAuthContainerSupport.uri;
import static org.lowcoder.plugin.mongo.MongoAuthContainerSupport.uriConfig;

/**
 * Unit MG-7: the Mongo engine against a MongoDB 7.0 that requires authentication ({@link MongoAuthContainerSupport}), with SCRAM
 * through a host config and through a URI config: test-connection, a connection that inserts a document and finds it again, a wrong
 * password, and the authentication database. A host config has no authentication-database field, so the user is authenticated
 * against the config's {@code database} (the driver's default for a connection string without {@code authSource}); a URI
 * config names it with {@code ?authSource=}. The tests pin both consequences: the root user (defined in {@code admin}) works in
 * a host config whose database is {@code admin} and in a URI with {@code authSource=admin}, and fails in a host config whose
 * database is {@code app}.
 *
 * <p>Observed behaviour pinned here: {@code ping} needs no authentication on MongoDB 7.0, so a config without credentials
 * passes test-connection against this server and is refused only by the first command that needs a role.
 *
 * <p>Limits: SCRAM-SHA-1 and SCRAM-SHA-256 only (the {@code MONGODB-X509} value of the enum needs client certificates and TLS,
 * which the image does not offer); no TLS; each test uses its own collection.
 */
public class MongoEngineAuthContainerTest {

    static final String TAG = "[MongoEngineAuthContainerTest] ";
    static final String QUERY_CODE_OK = "OK";
    static final String SCRAM_SHA_1 = "SCRAM_SHA_1";
    static final String SCRAM_SHA_256 = "SCRAM_SHA_256";
    static final String AUTH_SOURCE_ADMIN = "?authSource=" + ADMIN_DATABASE;
    static final String UNAUTHORIZED_KEY = "QUERY_ARGUMENT_ERROR";
    static final String REQUIRES_AUTHENTICATION = "requires authentication";
    static final String AUTHENTICATION_FAILED = "Exception authenticating MongoCredential";
    static final String SOURCE_APP = "source='app'";

    private static String collection(String prefix) {
        return prefix + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private static Map<String, Object> form(String type, String collection, Object... compKeysAndValues) {
        Map<String, Object> comp = new HashMap<>();
        for (int i = 0; i < compKeysAndValues.length; i += 2) {
            comp.put((String) compKeysAndValues[i], compKeysAndValues[i + 1]);
        }
        Map<String, Object> form = new HashMap<>();
        form.put("compType", type);
        form.put("collection", collection);
        form.put("comp", comp);
        return form;
    }

    private static QueryExecutionResult run(MongoDatasourceConfig config, MongoConnection connection, Map<String, Object> form) {
        MongoQueryExecutionContext context = ENGINE.buildQueryExecutionContext(config, form, Map.of(), null);
        QueryExecutionResult result = ENGINE.executeQuery(connection, context).block(BLOCK_TIMEOUT);
        System.out.println(TAG + context.getCommand().toJson() + " -> " + result.getQueryCode() + " " + result.getData());
        return result;
    }

    private static DatasourceTestResult test(String label, MongoDatasourceConfig config) {
        DatasourceTestResult result = ENGINE.testConnection(config).block(BLOCK_TIMEOUT);
        assertNotNull(result, "testConnection emits a result: " + label);
        System.out.println(TAG + "test connection " + label + ": success=" + result.isSuccess()
                + (result.isSuccess() ? "" : " message=" + result.getInvalidMessage(Locale.ENGLISH)));
        return result;
    }

    /** Connects, inserts one document, finds it, and closes the connection. */
    private static void insertAndFind(String label, MongoDatasourceConfig config) {
        MongoConnection connection = ENGINE.createConnection(config).block(BLOCK_TIMEOUT);
        try {
            String c = collection("auth");
            QueryExecutionResult inserted = run(config, connection, form("INSERT", c, "documents", "{\"n\": 1, \"who\": \"" + label + "\"}"));
            assertEquals(QUERY_CODE_OK, inserted.getQueryCode(), label + ": the insert succeeds");
            assertEquals("{\"n\":1}", inserted.getData().toString(), label + ": one document inserted");
            QueryExecutionResult found = run(config, connection, form("FIND", c, "projection", "{\"_id\": 0}"));
            assertEquals(QUERY_CODE_OK, found.getQueryCode(), label + ": the find succeeds");
            JsonNode rows = (JsonNode) found.getData();
            assertEquals("[{\"n\":1,\"who\":\"" + label + "\"}]", rows.toString(), label + ": the inserted document is read back");
        } finally {
            ENGINE.destroyConnection(connection).block(BLOCK_TIMEOUT);
        }
    }

    // ---- host config

    @Test
    public void hostConfigWithTheAppUserAuthenticatesAgainstItsDatabaseWithEachScramMechanism() {
        for (String mechanism : new String[] {null, SCRAM_SHA_1, SCRAM_SHA_256}) {
            MongoDatasourceConfig config = hostConfig(DATABASE, APP_USER, APP_PASSWORD, mechanism);
            assertTrue(test("host app user, mechanism " + mechanism, config).isSuccess(), "test connection passes with mechanism " + mechanism);
            insertAndFind("host-" + mechanism, config);
        }
    }

    @Test
    public void hostConfigWithTheRootUserWorksWhenTheDatabaseIsAdminAndFailsWhenItIsApp() {
        MongoDatasourceConfig admin = hostConfig(ADMIN_DATABASE, ROOT_USER, ROOT_PASSWORD, SCRAM_SHA_256);
        assertTrue(test("host root user in admin", admin).isSuccess());
        insertAndFind("host-root-admin", admin);

        MongoDatasourceConfig app = hostConfig(DATABASE, ROOT_USER, ROOT_PASSWORD, null);
        DatasourceTestResult failed = test("host root user in app", app);
        assertFalse(failed.isSuccess(), "the root user is defined in admin; a host config authenticates against its database (app)");
        assertTrue(failed.getInvalidMessage(Locale.ENGLISH).contains(AUTHENTICATION_FAILED), failed.getInvalidMessage(Locale.ENGLISH));
        assertTrue(failed.getInvalidMessage(Locale.ENGLISH).contains(SOURCE_APP), "the credential's source is the config's database: " + failed.getInvalidMessage(Locale.ENGLISH));
    }

    @Test
    public void hostConfigWithAWrongPasswordFailsTestConnectionWithAuthenticationFailed() {
        for (String mechanism : new String[] {null, SCRAM_SHA_1, SCRAM_SHA_256}) {
            DatasourceTestResult failed = test("host wrong password, mechanism " + mechanism,
                    hostConfig(DATABASE, APP_USER, WRONG_PASSWORD, mechanism));
            assertFalse(failed.isSuccess(), "a wrong password fails the test with mechanism " + mechanism);
            assertTrue(failed.getInvalidMessage(Locale.ENGLISH).contains(AUTHENTICATION_FAILED), failed.getInvalidMessage(Locale.ENGLISH));
        }
    }

    @Test
    public void hostConfigWithAWrongUserFailsTestConnection() {
        DatasourceTestResult failed = test("host unknown user", hostConfig(DATABASE, "nobody", APP_PASSWORD, null));
        assertFalse(failed.isSuccess(), "an unknown user fails the test");
        assertTrue(failed.getInvalidMessage(Locale.ENGLISH).contains(AUTHENTICATION_FAILED), failed.getInvalidMessage(Locale.ENGLISH));
    }

    // ---- URI config

    @Test
    public void uriConfigWithTheAppUserAuthenticatesAgainstItsDatabase() {
        MongoDatasourceConfig config = uriConfig(uri(APP_USER, APP_PASSWORD, DATABASE, ""));
        assertTrue(test("uri app user", config).isSuccess());
        insertAndFind("uri-app", config);

        MongoDatasourceConfig sha256 = uriConfig(uri(APP_USER, APP_PASSWORD, DATABASE, "?authMechanism=SCRAM-SHA-256"));
        assertTrue(test("uri app user, SCRAM-SHA-256", sha256).isSuccess());
        insertAndFind("uri-app-sha256", sha256);
    }

    @Test
    public void uriConfigWithTheRootUserNeedsAuthSourceAdmin() {
        MongoDatasourceConfig withSource = uriConfig(uri(ROOT_USER, ROOT_PASSWORD, DATABASE, AUTH_SOURCE_ADMIN));
        assertTrue(test("uri root user with authSource=admin", withSource).isSuccess());
        insertAndFind("uri-root-authsource", withSource);

        DatasourceTestResult without = test("uri root user without authSource", uriConfig(uri(ROOT_USER, ROOT_PASSWORD, DATABASE, "")));
        assertFalse(without.isSuccess(), "without authSource the root user is looked up in app, where it does not exist");
        assertTrue(without.getInvalidMessage(Locale.ENGLISH).contains(AUTHENTICATION_FAILED), without.getInvalidMessage(Locale.ENGLISH));
        assertTrue(without.getInvalidMessage(Locale.ENGLISH).contains(SOURCE_APP), "the credential's source defaults to the URI's database: " + without.getInvalidMessage(Locale.ENGLISH));
    }

    @Test
    public void uriConfigWithAWrongPasswordFailsTestConnectionWithAuthenticationFailed() {
        DatasourceTestResult failed = test("uri wrong password", uriConfig(uri(APP_USER, WRONG_PASSWORD, DATABASE, "")));
        assertFalse(failed.isSuccess(), "a wrong password fails the test");
        assertTrue(failed.getInvalidMessage(Locale.ENGLISH).contains(AUTHENTICATION_FAILED), failed.getInvalidMessage(Locale.ENGLISH));
        DatasourceTestResult wrongSource = test("uri wrong password, authSource=admin", uriConfig(uri(ROOT_USER, WRONG_PASSWORD, DATABASE, AUTH_SOURCE_ADMIN)));
        assertFalse(wrongSource.isSuccess());
    }

    // ---- no credentials

    @Test
    public void aConfigWithoutCredentialsPassesTestConnectionBecausePingNeedsNoRoleButItsQueriesAreRefused() {
        MongoDatasourceConfig anonymous = hostConfig(DATABASE, null, null, null);
        assertTrue(test("host without credentials", anonymous).isSuccess(), "ping needs no authentication on this server");

        MongoConnection connection = ENGINE.createConnection(anonymous).block(BLOCK_TIMEOUT);
        try {
            PluginException refused = assertThrows(PluginException.class,
                    () -> run(anonymous, connection, form("FIND", collection("anon"))));
            System.out.println(TAG + "find without credentials: " + refused.getError() + " " + refused.getMessageKey() + " "
                    + java.util.List.of(refused.getArgs()));
            assertEquals(UNAUTHORIZED_KEY, refused.getMessageKey());
            assertTrue(String.valueOf(refused.getArgs()[0]).contains(REQUIRES_AUTHENTICATION), String.valueOf(refused.getArgs()[0]));
        } finally {
            ENGINE.destroyConnection(connection).block(BLOCK_TIMEOUT);
        }
    }
}
