package org.lowcoder.sdk.plugin.common.sql;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import java.util.Map;
import java.util.function.Function;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.plugin.mysql.MysqlDatasourceConfig;
import org.slf4j.LoggerFactory;

/**
 * Merge and encryption of {@link SqlBasedDatasourceConnectionConfig}, exercised through its concrete
 * {@link MysqlDatasourceConfig}.
 */
class SqlBasedConfigMergeTest {

    private static final String STORED_PASSWORD = "stored-secret";
    private static final String NEW_PASSWORD = "new-secret";
    private static final long MYSQL_DEFAULT_PORT = 3306L;
    private static final long UPDATED_PORT = 3307L;
    private static final String ENCRYPT_FAILURE = "encrypt backend down";
    private static final String DECRYPT_FAILURE = "bad ciphertext";

    private Logger logger;
    private ListAppender<ILoggingEvent> appender;

    @BeforeEach
    void captureLog() {
        logger = (Logger) LoggerFactory.getLogger(SqlBasedDatasourceConnectionConfig.class);
        appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
    }

    @AfterEach
    void releaseLog() {
        logger.detachAppender(appender);
    }

    private static MysqlDatasourceConfig stored(String password) {
        return new MysqlDatasourceConfig("db1", "user1", password, "host1", 3306L, false, "tz1", false, false, Map.of("stored", "1"));
    }

    private static MysqlDatasourceConfig update(String password, Long port) {
        return new MysqlDatasourceConfig("db2", "user2", password, "host2", port, true, "UTC", true, true, Map.of("updated", "2"));
    }

    @Test
    void mergeKeepsOldPasswordWhenUpdateHasNoneAndTakesAllOtherFieldsFromUpdate() {
        DatasourceConnectionConfig merged = stored(STORED_PASSWORD).mergeWithUpdatedConfig(update(null, UPDATED_PORT));

        MysqlDatasourceConfig config = (MysqlDatasourceConfig) merged;
        assertThat(config.getPassword()).as("password not resent: stored one kept").isEqualTo(STORED_PASSWORD);
        assertThat(config.getDatabase()).isEqualTo("db2");
        assertThat(config.getUsername()).isEqualTo("user2");
        assertThat(config.getHost()).isEqualTo("host2");
        assertThat(config.getPort()).isEqualTo(UPDATED_PORT);
        assertThat(config.isUsingSsl()).isTrue();
        assertThat(config.getServerTimezone()).isEqualTo("UTC");
        assertThat(config.isReadonly()).isTrue();
        assertThat(config.isEnableTurnOffPreparedStatement()).isTrue();
        assertThat(config.getExtParams()).isEqualTo(Map.of("updated", "2"));
        System.out.println("[SqlBasedConfigMergeTest] merged: host=" + config.getHost() + " port=" + config.getPort() + " db=" + config.getDatabase());
    }

    @Test
    void mergeReplacesPasswordWhenUpdateSendsOne() {
        MysqlDatasourceConfig merged = (MysqlDatasourceConfig) stored(STORED_PASSWORD).mergeWithUpdatedConfig(update(NEW_PASSWORD, UPDATED_PORT));

        assertThat(merged.getPassword()).isEqualTo(NEW_PASSWORD);
        System.out.println("[SqlBasedConfigMergeTest] new password wins over the stored one");
    }

    @Test
    void mergeReturnsNewInstanceOfSameRuntimeClassAndPinsDefaultPortWhenUpdateHasNone() {
        MysqlDatasourceConfig storedConfig = stored(STORED_PASSWORD);
        DatasourceConnectionConfig merged = storedConfig.mergeWithUpdatedConfig(update(null, null));

        assertThat(merged).isInstanceOf(MysqlDatasourceConfig.class).isNotSameAs(storedConfig);
        assertThat(((MysqlDatasourceConfig) merged).getPort())
                .as("merge passes getPort(), so a null port in the update becomes the default port")
                .isEqualTo(MYSQL_DEFAULT_PORT);
        System.out.println("[SqlBasedConfigMergeTest] merged class " + merged.getClass().getSimpleName() + ", port " + ((MysqlDatasourceConfig) merged).getPort());
    }

    @Test
    void mergeRejectsNonSqlConfig() {
        DatasourceConnectionConfig other = new DatasourceConnectionConfig() {
            @Override
            public DatasourceConnectionConfig mergeWithUpdatedConfig(DatasourceConnectionConfig detailConfig) {
                return this;
            }
        };

        assertThatThrownBy(() -> stored(STORED_PASSWORD).mergeWithUpdatedConfig(other))
                .isInstanceOfSatisfying(BizException.class,
                        e -> assertThat(e.getError()).isEqualTo(BizError.INVALID_DATASOURCE_CONFIG_TYPE));
        System.out.println("[SqlBasedConfigMergeTest] non-SQL update rejected");
    }

    @Test
    void encryptAndDecryptApplyFunctionToPassword() {
        MysqlDatasourceConfig config = stored("pw");

        assertThat(config.doEncrypt(s -> s + "|enc")).isSameAs(config);
        assertThat(config.getPassword()).isEqualTo("pw|enc");
        assertThat(config.doDecrypt(s -> s.substring(0, s.length() - "|enc".length()))).isSameAs(config);
        assertThat(config.getPassword()).isEqualTo("pw");
        System.out.println("[SqlBasedConfigMergeTest] password encrypt/decrypt roundtrip");
    }

    private static Function<String, String> failing(String message) {
        return s -> {
            throw new IllegalStateException(message);
        };
    }

    @Test
    void encryptFailureReturnsConfigUnchangedAndDoesNotPropagate() {
        MysqlDatasourceConfig config = stored("pw");

        DatasourceConnectionConfig result = config.doEncrypt(failing(ENCRYPT_FAILURE));

        assertThat(result).isSameAs(config);
        assertThat(config.getPassword()).isEqualTo("pw");
        System.out.println("[SqlBasedConfigMergeTest] encrypt failure swallowed, config unchanged");
    }

    @Test
    void decryptFailureReturnsConfigUnchangedAndDoesNotPropagate() {
        MysqlDatasourceConfig config = stored("pw");

        DatasourceConnectionConfig result = config.doDecrypt(failing(DECRYPT_FAILURE));

        assertThat(result).isSameAs(config);
        assertThat(config.getPassword()).isEqualTo("pw");
        System.out.println("[SqlBasedConfigMergeTest] decrypt failure swallowed, config unchanged");
    }

    /**
     * BF-026 a (plan section 9 row "password logged when encryption fails"): the error log of a failed encryption names the
     * failure and carries the exception, but not the password. Limit: the exception is logged as thrown, so a function
     * whose exception message quotes its input would still write it.
     */
    @Test
    void encryptFailureLogsWithoutThePasswordBF026() {
        stored("super-secret-pw").doEncrypt(failing(ENCRYPT_FAILURE));

        assertErrorLogWithoutPassword("super-secret-pw", "fail to encrypt password", ENCRYPT_FAILURE);
    }

    /** Same for the decrypt branch, which was given the stored (encrypted) value. */
    @Test
    void decryptFailureLogsWithoutThePasswordValueBF026() {
        stored("cipher-or-secret-value").doDecrypt(failing(DECRYPT_FAILURE));

        assertErrorLogWithoutPassword("cipher-or-secret-value", "fail to decrypt password", DECRYPT_FAILURE);
    }

    private void assertErrorLogWithoutPassword(String password, String expectedLine, String failureMessage) {
        assertThat(appender.list).hasSize(1);
        ILoggingEvent event = appender.list.get(0);
        System.out.println("[SqlBasedConfigMergeTest] error log: " + event.getFormattedMessage() + " / " + event.getThrowableProxy().getMessage());
        assertThat(event.getLevel()).isEqualTo(Level.ERROR);
        assertThat(event.getFormattedMessage()).isEqualTo(expectedLine).doesNotContain(password);
        assertThat(event.getThrowableProxy().getMessage()).isEqualTo(failureMessage);
    }
}
