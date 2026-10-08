package org.lowcoder.plugins;

import org.junit.jupiter.api.Test;
import org.lowcoder.plugins.SmtpPlugin.SmtpEngine;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Unit SM-3 (task L5-10): {@code SmtpEngine.resolveConfig} and {@code validateConfig}, and {@code SmtpDatasourceConfig}: merge of
 * an edited config into the stored one, encrypt and decrypt of the password, and BF-124 (D18: the merge's type check).
 *
 * <p>Limits: the encrypt function is a stand-in (a pure string function); a server is not involved.
 */
public class SmtpDatasourceConfigTest {

    static final String TAG = "[SmtpDatasourceConfigTest] ";
    static final String HOST = "smtp.example.org";
    static final int PORT = 587;

    private final SmtpEngine engine = new SmtpEngine();

    private SmtpDatasourceConfig config(Map<String, Object> values) {
        return engine.resolveConfig(new HashMap<>(values));
    }

    @Test
    public void resolveConfigBindsHostPortUserAndPassword() {
        SmtpDatasourceConfig bound = config(Map.of("host", HOST, "port", PORT, "username", "u", "password", "p"));
        assertEquals(HOST, bound.getHost());
        assertEquals(PORT, bound.getPort());
        assertEquals("u", bound.getUsername());
        assertEquals("p", bound.getPassword());
        SmtpDatasourceConfig minimal = config(Map.of("host", HOST));
        assertEquals(0, minimal.getPort(), "an absent port is 0");
        assertNull(minimal.getUsername());
        assertNull(minimal.getPassword());
    }

    @Test
    public void validateConfigNamesABlankHostAndANegativePort() {
        assertEquals(Set.of(), engine.validateConfig(config(Map.of("host", HOST, "port", PORT))));
        assertEquals(Set.of("HOST_EMPTY"), engine.validateConfig(config(Map.of("host", "  ", "port", PORT))));
        assertEquals(Set.of("HOST_EMPTY"), engine.validateConfig(config(Map.of("port", PORT))));
        assertEquals(Set.of("INVALID_PORT"), engine.validateConfig(config(Map.of("host", HOST, "port", -1))));
        assertEquals(Set.of(), engine.validateConfig(config(Map.of("host", HOST, "port", 0))), "port 0 passes");
        assertEquals(Set.of("HOST_EMPTY", "INVALID_PORT"), engine.validateConfig(config(Map.of("port", -5))));
    }

    @Test
    public void mergeKeepsTheStoredPasswordWhenTheUpdateHasNone() {
        SmtpDatasourceConfig stored = config(Map.of("host", "old", "port", 25, "username", "old-user", "password", "stored"));
        SmtpDatasourceConfig merged = (SmtpDatasourceConfig) stored.mergeWithUpdatedConfig(config(Map.of("host", HOST, "port", PORT, "username", "u")));
        assertEquals(HOST, merged.getHost());
        assertEquals(PORT, merged.getPort());
        assertEquals("u", merged.getUsername());
        assertEquals("stored", merged.getPassword());
        SmtpDatasourceConfig replaced = (SmtpDatasourceConfig) stored.mergeWithUpdatedConfig(config(Map.of("host", HOST, "port", PORT, "password", "new")));
        assertEquals("new", replaced.getPassword());
        assertNull(replaced.getUsername(), "the user always comes from the update");
    }

    /** A config of another datasource type. */
    static final class Foreign implements DatasourceConnectionConfig {
        @Override
        public DatasourceConnectionConfig mergeWithUpdatedConfig(DatasourceConnectionConfig detailConfig) {
            return this;
        }
    }

    /**
     * BF-124 (D18): the merge cast the update to {@code SmtpDatasourceConfig} without an {@code instanceof} check, so a config
     * of another type gave a {@code ClassCastException}. It is now refused with {@code INVALID_DATASOURCE_CONFIG_TYPE} naming the
     * type, as the Mongo, Oracle and Elasticsearch configs do.
     */
    @Test
    public void foreignConfigTypeIsRefusedAsAnInvalidConfigTypeBF124() {
        BizException thrown = assertThrows(BizException.class, () -> config(Map.of("host", HOST)).mergeWithUpdatedConfig(new Foreign()));
        System.out.println(TAG + "foreign type -> " + thrown.getError() + " / " + thrown.getMessageKey() + ": " + thrown.getMessage());
        assertEquals(BizError.INVALID_DATASOURCE_CONFIG_TYPE, thrown.getError());
        assertEquals("INVALID_DATASOURCE_CONFIG_TYPE", thrown.getMessageKey());
        assertEquals(Foreign.class.getSimpleName(), thrown.getArgs()[0]);
    }

    @Test
    public void encryptAndDecryptApplyTheFunctionOnlyToANonBlankPassword() {
        AtomicInteger calls = new AtomicInteger();
        Function<String, String> encrypt = s -> {
            calls.incrementAndGet();
            return "enc(" + s + ")";
        };
        Function<String, String> decrypt = s -> {
            calls.incrementAndGet();
            return s.substring(4, s.length() - 1);
        };
        SmtpDatasourceConfig built = config(Map.of("host", HOST, "password", "p"));
        assertSame(built, built.doEncrypt(encrypt));
        assertEquals("enc(p)", built.getPassword());
        assertSame(built, built.doDecrypt(decrypt));
        assertEquals("p", built.getPassword());
        assertEquals(2, calls.get());
        for (Map<String, Object> noSecret : java.util.List.of(Map.<String, Object>of("host", HOST), Map.<String, Object>of("host", HOST, "password", "   "))) {
            SmtpDatasourceConfig none = config(noSecret);
            String before = none.getPassword();
            none.doEncrypt(encrypt);
            none.doDecrypt(decrypt);
            assertEquals(before, none.getPassword());
        }
        assertEquals(2, calls.get(), "the function is not called for a null or blank password");
    }
}
