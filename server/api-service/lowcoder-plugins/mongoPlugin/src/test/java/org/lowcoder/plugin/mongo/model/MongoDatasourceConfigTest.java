package org.lowcoder.plugin.mongo.model;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.Endpoint;
import org.lowcoder.sdk.plugin.mysql.MysqlDatasourceConfig;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.BizError.INVALID_DATASOURCE_CONFIG_TYPE;
import static org.lowcoder.sdk.exception.PluginCommonError.DATASOURCE_ARGUMENT_ERROR;

/**
 * Unit MG-2 (task L5-8a): {@link MongoDatasourceConfig}: the merge of an edited config into the stored one, the defaults and
 * derived values (port, trimmed user name, endpoints, database), and the encrypt and decrypt hooks.
 *
 * <p>Limits: encrypt and decrypt are checked with a function shaped like the production one ({@code EncryptionServiceImpl}
 * returns a null or empty input unchanged); a function that fails on null is not tested because production never passes one.
 */
public class MongoDatasourceConfigTest {

    static final String STORED_URI = "mongodb://u:p@stored-host:27017/stored_db";
    static final String NEW_URI = "mongodb://new-host/new_db";
    static final String STORED_PASSWORD = "stored-secret";
    static final String NEW_PASSWORD = "new-secret";
    static final int DEFAULT_PORT = 27017;
    static final int CUSTOM_PORT = 28018;
    static final Function<String, String> ENCRYPT = s -> s == null || s.isEmpty() ? s : "enc(" + s + ")";
    static final Function<String, String> DECRYPT = s -> s == null || s.isEmpty() ? s : s.substring("enc(".length(), s.length() - 1);

    private static MongoDatasourceConfig.MongoDatasourceConfigBuilder host() {
        return MongoDatasourceConfig.builder().host("old-host").port(CUSTOM_PORT).database("old_db").username("old-user").password(STORED_PASSWORD).ssl(true).srvMode(true);
    }

    private static MongoDatasourceConfig merged(MongoDatasourceConfig stored, MongoDatasourceConfig update) {
        MongoDatasourceConfig result = (MongoDatasourceConfig) stored.mergeWithUpdatedConfig(update);
        System.out.println("[MongoDatasourceConfigTest] merged: usingUri " + result.isUsingUri() + ", uri " + result.getUri() + ", host " + result.getHost() + ", port " + result.getPort()
                + ", database " + result.getDatabase() + ", user '" + result.getUsername() + "', password " + result.getPassword());
        return result;
    }

    // ---- merge

    @Test
    public void uriModeKeepsTheStoredUriWhenTheUpdateHasNoneAndTakesTheUpdateOtherwise() {
        MongoDatasourceConfig stored = MongoDatasourceConfig.builder().usingUri(true).uri(STORED_URI).build();
        MongoDatasourceConfig kept = merged(stored, MongoDatasourceConfig.builder().usingUri(true).build());
        assertTrue(kept.isUsingUri());
        assertEquals(STORED_URI, kept.getUri());
        MongoDatasourceConfig replaced = merged(stored, MongoDatasourceConfig.builder().usingUri(true).uri(NEW_URI).build());
        assertEquals(NEW_URI, replaced.getUri());
        assertEquals("new_db", replaced.getParsedDatabase());
    }

    @Test
    public void uriModeMergeDropsEveryHostModeField() {
        MongoDatasourceConfig merged = merged(host().build(), MongoDatasourceConfig.builder().usingUri(true).uri(NEW_URI).host("ignored").database("ignored").username("ignored").password("ignored").ssl(true).build());
        assertTrue(merged.isUsingUri());
        assertNull(merged.getHost());
        assertNull(merged.getDatabase());
        assertEquals("", merged.getUsername());
        assertNull(merged.getPassword());
        assertFalse(merged.isSsl());
        assertFalse(merged.isSrvMode());
        assertEquals(DEFAULT_PORT, merged.getPort());
        assertEquals(List.of(), merged.getEndpoints());
    }

    @Test
    public void hostModeKeepsTheStoredPasswordWhenTheUpdateHasNoneAndTakesEverythingElseFromTheUpdate() {
        MongoDatasourceConfig update = MongoDatasourceConfig.builder().host("new-host").port(CUSTOM_PORT + 1).database("new_db").username("new-user")
                .ssl(false).srvMode(false).authMechanism(MongoAuthMechanism.SCRAM_SHA_256).endpoints(List.of(Endpoint.builder().host("e").port(1L).build())).build();
        MongoDatasourceConfig merged = merged(host().build(), update);
        assertFalse(merged.isUsingUri());
        assertEquals(STORED_PASSWORD, merged.getPassword(), "the stored password is kept");
        assertEquals("new-host", merged.getHost());
        assertEquals(CUSTOM_PORT + 1, merged.getPort());
        assertEquals("new_db", merged.getDatabase());
        assertEquals("new-user", merged.getUsername());
        assertFalse(merged.isSsl());
        assertFalse(merged.isSrvMode());
        assertEquals(MongoAuthMechanism.SCRAM_SHA_256, merged.getAuthMechanism());
        assertEquals(1, merged.getEndpoints().size());
        MongoDatasourceConfig withPassword = merged(host().build(), MongoDatasourceConfig.builder().host("h").database("d").password(NEW_PASSWORD).build());
        assertEquals(NEW_PASSWORD, withPassword.getPassword(), "a password in the update replaces the stored one");
    }

    @Test
    public void hostModeMergeWithAnEmptyPasswordReplacesTheStoredOne() {
        MongoDatasourceConfig merged = merged(host().build(), MongoDatasourceConfig.builder().host("h").database("d").password("").build());
        System.out.println("[MongoDatasourceConfigTest] merge with an empty password: '" + merged.getPassword() + "'");
        assertEquals("", merged.getPassword(), "only null keeps the stored password: an empty string is taken from the update");
    }

    @Test
    public void switchingModesDoesNotCarryTheOtherModesFields() {
        MongoDatasourceConfig toHost = merged(MongoDatasourceConfig.builder().usingUri(true).uri(STORED_URI).build(), MongoDatasourceConfig.builder().host("h").database("d").build());
        assertFalse(toHost.isUsingUri());
        assertNull(toHost.getUri(), "the stored URI is not kept in host mode");
        assertNull(toHost.getPassword(), "a URI-mode config had no password to keep");
        MongoDatasourceConfig toUri = merged(host().build(), MongoDatasourceConfig.builder().usingUri(true).build());
        assertTrue(toUri.isUsingUri());
        assertNull(toUri.getUri(), "nothing stored to keep and nothing given: the URI stays null");
    }

    @Test
    public void foreignConfigTypeIsRejectedWithItsClassName() {
        MysqlDatasourceConfig foreign = new MysqlDatasourceConfig("db", "u", "p", "h", 3306L, false, null, false, false, null);
        BizException thrown = assertThrows(BizException.class, () -> host().build().mergeWithUpdatedConfig(foreign));
        System.out.println("[MongoDatasourceConfigTest] foreign config: " + thrown.getError() + " " + thrown.getMessageKey() + " " + java.util.Arrays.toString(thrown.getArgs()));
        assertEquals(INVALID_DATASOURCE_CONFIG_TYPE, thrown.getError());
        assertEquals("INVALID_DATASOURCE_CONFIG_TYPE", thrown.getMessageKey());
        assertEquals("MysqlDatasourceConfig", thrown.getArgs()[0]);
    }

    // ---- defaults and derived values

    @Test
    public void portDefaultsTo27017UserNameIsTrimmedAndEndpointsDefaultToEmpty() {
        MongoDatasourceConfig empty = MongoDatasourceConfig.builder().build();
        assertEquals(DEFAULT_PORT, empty.getPort());
        assertEquals("", empty.getUsername());
        assertEquals(List.of(), empty.getEndpoints());
        MongoDatasourceConfig set = MongoDatasourceConfig.builder().port(CUSTOM_PORT).username("  bob  ").endpoints(List.of(Endpoint.builder().host("h").port(5L).build())).build();
        assertEquals(CUSTOM_PORT, set.getPort());
        assertEquals("bob", set.getUsername());
        assertEquals(1, set.getEndpoints().size());
    }

    @Test
    public void parsedDatabaseComesFromTheUriInUriModeAndFromTheFieldInHostMode() {
        assertEquals("stored_db", MongoDatasourceConfig.builder().usingUri(true).uri(STORED_URI).database("ignored").build().getParsedDatabase());
        assertEquals("old_db", host().build().getParsedDatabase());
        assertEquals("old_db", host().uri(STORED_URI).build().getParsedDatabase(), "a stored URI is ignored in host mode");
        PluginException noDatabase = assertThrows(PluginException.class, () -> MongoDatasourceConfig.builder().usingUri(true).uri("mongodb://h").build().getParsedDatabase());
        assertEquals(DATASOURCE_ARGUMENT_ERROR, noDatabase.getError());
        assertEquals("MONGODB_DATABASE_EMPTY", noDatabase.getMessageKey());
        PluginException invalid = assertThrows(PluginException.class, () -> MongoDatasourceConfig.builder().usingUri(true).uri("not a uri").build().getParsedDatabase());
        assertEquals("INVALID_MONGODB_URL", invalid.getMessageKey());
    }

    /**
     * A URI-mode config with no URI cannot be created through the client: the URI field is required unless an existing
     * URI-mode datasource is being edited (mongoDatasourceForm.tsx:45-50), an edit that sends no URI keeps the stored one (the
     * merge above), and the server checks for a blank URI before it reads the database (MongoPlugin.java:324-327 and
     * 426-428). So the NullPointerException of {@code getParsedDatabase} for a missing URI is reachable only through the
     * class API or a hand-made API call; asserted as observed.
     */
    @Test
    public void parsedDatabaseOfAUriModeConfigWithoutAUriThrowsANullPointerException() {
        assertThrows(NullPointerException.class, () -> MongoDatasourceConfig.builder().usingUri(true).build().getParsedDatabase());
    }

    // ---- encrypt and decrypt

    @Test
    public void encryptAndDecryptApplyTheFunctionToPasswordAndUriAndReturnTheSameObject() {
        MongoDatasourceConfig config = MongoDatasourceConfig.builder().usingUri(true).uri(STORED_URI).password(STORED_PASSWORD).build();
        List<String> seen = new ArrayList<>();
        DatasourceConnectionConfig encrypted = config.doEncrypt(s -> {
            seen.add(s);
            return ENCRYPT.apply(s);
        });
        assertSame(config, encrypted);
        assertEquals(List.of(STORED_PASSWORD, STORED_URI), seen, "password first, then the URI");
        assertEquals("enc(" + STORED_PASSWORD + ")", config.getPassword());
        assertEquals("enc(" + STORED_URI + ")", config.getUri());
        assertSame(config, config.doDecrypt(DECRYPT));
        assertEquals(STORED_PASSWORD, config.getPassword());
        assertEquals(STORED_URI, config.getUri());
    }

    @Test
    public void nullPasswordAndNullUriStayNullThroughTheProductionStyleFunction() {
        MongoDatasourceConfig config = host().password(null).build();
        config.doEncrypt(ENCRYPT);
        assertNull(config.getPassword());
        assertNull(config.getUri());
        config.doDecrypt(DECRYPT);
        assertNull(config.getPassword());
        assertNull(config.getUri());
    }
}
