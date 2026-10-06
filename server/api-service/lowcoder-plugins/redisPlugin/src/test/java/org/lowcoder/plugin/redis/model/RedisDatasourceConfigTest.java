package org.lowcoder.plugin.redis.model;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.BizException;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit RD-4 (task L5-9): {@code RedisDatasourceConfig}: {@code buildFrom}, the merge of an edited config into the stored one,
 * and the secret fields' encrypt and decrypt, including the failure path and defect D8 (fixed by BF-026: no secret in the log).
 *
 * <p>Limits: the encrypt function here is a stand-in for the production one (a pure string function); its own strength is not
 * under test.
 */
public class RedisDatasourceConfigTest {

    static final String TAG = "[RedisDatasourceConfigTest] ";
    static final String HOST = "cache.example.org";
    static final String STORED_PASSWORD = "stored-secret";
    static final String STORED_URI = "redis://:stored-secret@cache.example.org:6379";
    static final String SECRET_IN_FAILURE = "do-not-log-me";
    static final String URI_IN_FAILURE = "redis://:uri-secret-do-not-log@cache.example.org:6379";

    private static RedisDatasourceConfig config(Map<String, Object> values) {
        return RedisDatasourceConfig.buildFrom(new HashMap<>(values));
    }

    @Test
    public void buildFromReadsEveryField() {
        RedisDatasourceConfig built = config(Map.of("host", HOST, "port", 6380, "usingSsl", true, "username", "u", "password", "p", "usingUri", false, "uri", "redis://x"));
        assertEquals(HOST, built.getHost());
        assertEquals(6380L, built.getPort());
        assertTrue(built.isUsingSsl());
        assertEquals("u", built.getUsername());
        assertEquals("p", built.getPassword());
        assertFalse(built.isUsingUri());
        assertEquals("redis://x", built.getUri());
        RedisDatasourceConfig empty = config(Map.of());
        assertNull(empty.getHost());
        assertNull(empty.getPort());
        assertFalse(empty.isUsingSsl());
    }

    @Test
    public void mergeKeepsTheStoredPasswordWhenTheUpdateHasNone() {
        RedisDatasourceConfig stored = config(Map.of("host", "old", "port", 1, "password", STORED_PASSWORD));
        RedisDatasourceConfig merged = (RedisDatasourceConfig) stored.mergeWithUpdatedConfig(config(Map.of("host", HOST, "port", 6380, "username", "u", "usingSsl", true)));
        assertEquals(HOST, merged.getHost());
        assertEquals(6380L, merged.getPort());
        assertEquals("u", merged.getUsername());
        assertTrue(merged.isUsingSsl());
        assertEquals(STORED_PASSWORD, merged.getPassword());
        assertFalse(merged.isUsingUri());
        assertNull(merged.getUri(), "host mode: the stored URI is not carried over");
        RedisDatasourceConfig replaced = (RedisDatasourceConfig) stored.mergeWithUpdatedConfig(config(Map.of("host", HOST, "password", "new")));
        assertEquals("new", replaced.getPassword());
    }

    @Test
    public void mergeInUriModeKeepsTheStoredUriWhenTheUpdateHasNone() {
        RedisDatasourceConfig stored = config(Map.of("usingUri", true, "uri", STORED_URI));
        RedisDatasourceConfig kept = (RedisDatasourceConfig) stored.mergeWithUpdatedConfig(config(Map.of("usingUri", true)));
        assertTrue(kept.isUsingUri());
        assertEquals(STORED_URI, kept.getUri());
        RedisDatasourceConfig replaced = (RedisDatasourceConfig) stored.mergeWithUpdatedConfig(config(Map.of("usingUri", true, "uri", "redis://new:1")));
        assertEquals("redis://new:1", replaced.getUri());
        assertNull(replaced.getHost(), "URI mode: host fields are dropped");
        RedisDatasourceConfig fromHost = (RedisDatasourceConfig) config(Map.of("host", HOST, "password", STORED_PASSWORD)).mergeWithUpdatedConfig(config(Map.of("usingUri", true, "uri", "redis://n:1")));
        assertEquals("redis://n:1", fromHost.getUri());
    }

    @Test
    public void mergeRejectsAForeignConfigTypeNamingItsClass() {
        org.lowcoder.sdk.models.DatasourceConnectionConfig foreign = new FOREIGN();
        BizException thrown = assertThrows(BizException.class, () -> config(Map.of("host", HOST)).mergeWithUpdatedConfig(foreign));
        System.out.println(TAG + "foreign: " + thrown.getMessageKey() + " " + java.util.Arrays.toString(thrown.getArgs()));
        assertEquals("INVALID_DATASOURCE_CONFIG_TYPE", thrown.getMessageKey());
        assertEquals("FOREIGN", thrown.getArgs()[0]);
    }

    @Test
    public void encryptAndDecryptApplyTheFunctionToPasswordAndUri() {
        RedisDatasourceConfig built = config(Map.of("host", HOST, "password", "p", "uri", "u"));
        Function<String, String> encrypt = s -> s == null ? null : "enc(" + s + ")";
        Function<String, String> decrypt = s -> s == null ? null : s.substring(4, s.length() - 1);
        RedisDatasourceConfig encrypted = (RedisDatasourceConfig) built.doEncrypt(encrypt);
        assertSame(built, encrypted);
        assertEquals("enc(p)", encrypted.getPassword());
        assertEquals("enc(u)", encrypted.getUri());
        RedisDatasourceConfig decrypted = (RedisDatasourceConfig) encrypted.doDecrypt(decrypt);
        assertEquals("p", decrypted.getPassword());
        assertEquals("u", decrypted.getUri());
        assertEquals(HOST, decrypted.getHost(), "the other fields are untouched");
        RedisDatasourceConfig none = (RedisDatasourceConfig) config(Map.of("host", HOST)).doEncrypt(encrypt);
        assertNull(none.getPassword());
        assertNull(none.getUri());
    }

    private static ListAppender<ILoggingEvent> capture() {
        Logger logger = (Logger) LoggerFactory.getLogger(RedisDatasourceConfig.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        logger.setLevel(Level.ALL);
        return appender;
    }

    private static void release(ListAppender<ILoggingEvent> appender) {
        ((Logger) LoggerFactory.getLogger(RedisDatasourceConfig.class)).detachAppender(appender);
        appender.stop();
    }

    /** A config of another datasource type. */
    static final class FOREIGN implements org.lowcoder.sdk.models.DatasourceConnectionConfig {
        @Override
        public org.lowcoder.sdk.models.DatasourceConnectionConfig mergeWithUpdatedConfig(org.lowcoder.sdk.models.DatasourceConnectionConfig detailConfig) {
            return this;
        }
    }

    private static final Function<String, String> FAILING = s -> {
        throw new IllegalStateException("cipher unavailable");
    };

    @Test
    public void whenTheFunctionThrowsTheConfigIsReturnedUnchanged() {
        ListAppender<ILoggingEvent> appender = capture();
        try {
            RedisDatasourceConfig built = config(Map.of("host", HOST, "password", SECRET_IN_FAILURE, "uri", "u"));
            assertSame(built, built.doEncrypt(FAILING));
            assertSame(built, built.doDecrypt(FAILING));
            assertEquals(SECRET_IN_FAILURE, built.getPassword());
            assertEquals("u", built.getUri());
            assertEquals(2, appender.list.size(), "one error line per failed call");
        } finally {
            release(appender);
        }
    }

    /**
     * Defect D8 fixed, Redis half (BF-026 a): when encrypting or decrypting fails, the log line names the failure and carries
     * the exception, but neither the password nor the URI (which can hold the password too).
     */
    @Test
    public void aFailedEncryptOrDecryptLogsNeitherThePasswordNorTheUriBF026() {
        ListAppender<ILoggingEvent> appender = capture();
        try {
            RedisDatasourceConfig built = config(Map.of("host", HOST, "password", SECRET_IN_FAILURE, "uri", URI_IN_FAILURE));
            built.doEncrypt(FAILING);
            built.doDecrypt(FAILING);
            List<String> lines = appender.list.stream().map(ILoggingEvent::getFormattedMessage).toList();
            System.out.println(TAG + "log lines: " + lines);
            assertEquals(2, lines.size());
            assertEquals(List.of("fail to encrypt password and uri", "fail to decrypt password and uri"), lines);
            for (ILoggingEvent event : appender.list) {
                assertNotNull(event.getThrowableProxy(), "the exception is still logged");
                assertFalse(event.getFormattedMessage().contains(SECRET_IN_FAILURE) || event.getFormattedMessage().contains(URI_IN_FAILURE));
            }
        } finally {
            release(appender);
        }
    }
}
