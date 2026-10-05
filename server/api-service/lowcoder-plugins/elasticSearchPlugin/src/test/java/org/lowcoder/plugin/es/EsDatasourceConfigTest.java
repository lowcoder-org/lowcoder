package org.lowcoder.plugin.es;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.function.Function;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.es.model.EsDatasourceConfig;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.slf4j.LoggerFactory;

/**
 * {@link EsDatasourceConfig}: merging an edited config with the stored one, and the password encryption hooks. The log
 * of the failure path is read through a logback list appender on the class's logger.
 */
public class EsDatasourceConfigTest {

    private static final String PASSWORD = "plain-secret";

    private final Logger configLogger = (Logger) LoggerFactory.getLogger(EsDatasourceConfig.class);
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();

    @BeforeEach
    public void captureLog() {
        logs.start();
        configLogger.addAppender(logs);
    }

    @AfterEach
    public void releaseLog() {
        configLogger.detachAppender(logs);
        logs.stop();
    }

    private static EsDatasourceConfig config(String password) {
        return EsDatasourceConfig.builder().connectionString("host:9200").username("elastic").password(password).usingSsl(true).build();
    }

    @Test
    public void mergeKeepsTheStoredPasswordWhenTheUpdateHasNoneAndTakesTheUpdatedValuesOtherwise() {
        EsDatasourceConfig stored = config("stored-secret");
        EsDatasourceConfig update = EsDatasourceConfig.builder().connectionString("other:9201").username("kibana").usingSsl(false).build();

        EsDatasourceConfig merged = (EsDatasourceConfig) stored.mergeWithUpdatedConfig(update);
        EsDatasourceConfig withNewPassword = (EsDatasourceConfig) stored.mergeWithUpdatedConfig(
                EsDatasourceConfig.builder().connectionString("other:9201").password("new-secret").build());

        assertEquals("stored-secret", merged.getPassword(), "the password the update does not carry is kept");
        assertEquals("other:9201", merged.getConnectionString());
        assertEquals("kibana", merged.getUsername());
        assertEquals(false, merged.getUsingSsl());
        assertEquals("new-secret", withNewPassword.getPassword());
        assertNotSame(stored, merged);
    }

    @Test
    public void mergeRejectsAConfigOfAnotherType() {
        DatasourceConnectionConfig foreign = other -> other;

        BizException failure = assertThrows(BizException.class, () -> config("x").mergeWithUpdatedConfig(foreign));

        System.out.println("[EsDatasourceConfigTest] foreign type -> " + failure.getMessage());
    }

    @Test
    public void encryptAndDecryptApplyTheFunctionToThePasswordAndReturnTheSameObject() {
        EsDatasourceConfig config = config("abc");

        DatasourceConnectionConfig encrypted = config.doEncrypt(text -> "enc(" + text + ")");
        assertSame(config, encrypted);
        assertEquals("enc(abc)", config.getPassword());

        DatasourceConnectionConfig decrypted = config.doDecrypt(text -> text.substring(4, text.length() - 1));
        assertSame(config, decrypted);
        assertEquals("abc", config.getPassword());
        assertTrue(logs.list.isEmpty());
    }

    /**
     * DEFECT D8 pinned (analysis-plugins section 0.6; plan section 9 "D1-D20" row; D-6, fix deferred): when the
     * encryption or decryption function throws, {@code EsDatasourceConfig} logs {@code "fail to encrypt password: {}"}
     * with the password itself as the argument (EsDatasourceConfig.java:54 and :65; the decrypt branch even says
     * "encrypt"), at ERROR level, together with the exception. The password stays in the object and the object is
     * returned unchanged. The obvious fix is to log without the password, which turns the log assertions red.
     */
    @Test
    public void whenTheFunctionThrowsTheObjectIsUnchangedAndThePasswordIsWrittenToTheLogD8() {
        Function<String, String> failing = text -> {
            throw new IllegalStateException("key unavailable");
        };
        EsDatasourceConfig forEncrypt = config(PASSWORD);
        EsDatasourceConfig forDecrypt = config(PASSWORD);

        DatasourceConnectionConfig afterEncrypt = forEncrypt.doEncrypt(failing);
        DatasourceConnectionConfig afterDecrypt = forDecrypt.doDecrypt(failing);

        assertSame(forEncrypt, afterEncrypt);
        assertSame(forDecrypt, afterDecrypt);
        assertEquals(PASSWORD, forEncrypt.getPassword());
        assertEquals(PASSWORD, forDecrypt.getPassword());
        List<ILoggingEvent> events = logs.list;
        events.forEach(event -> System.out.println("[EsDatasourceConfigTest] " + event.getLevel() + " " + event.getFormattedMessage()));
        assertEquals(2, events.size());
        events.forEach(event -> {
            assertEquals(Level.ERROR, event.getLevel());
            assertTrue(event.getFormattedMessage().contains(PASSWORD), "the plaintext password is in the log: " + event.getFormattedMessage());
            assertTrue(event.getThrowableProxy().getMessage().contains("key unavailable"));
        });
        assertFalse(events.get(1).getFormattedMessage().contains("decrypt"), "the decrypt branch reports an encrypt failure");
    }
}
