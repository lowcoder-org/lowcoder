package org.lowcoder.sdk.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

import java.text.MessageFormat;
import java.util.List;
import java.util.Locale;
import java.util.ResourceBundle;
import java.util.Set;
import java.util.TreeSet;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.slf4j.LoggerFactory;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;

/**
 * {@link LocaleUtils#getMessage(Locale, String, Object...)}: a key is formatted with the text of the bundle {@code locale}
 * selected for the requested locale; a key that bundle lacks is still logged as an error and is now formatted with the text
 * of {@code locale_en} (NEW-35: {@code locale_de} has fewer keys than {@code locale_en}, and a German request for any other
 * key got the German "service is busy" text); a key {@code locale_en} lacks too gives the requested locale's
 * {@code INTERNAL_SERVER_ERROR} text. Expected texts are read from the bundle files with a no-fallback control or written
 * as constants, not taken from {@link LocaleUtils}.
 */
class LocaleUtilsTest {

    private static final String LOG_PREFIX = "[LocaleUtilsTest] ";
    private static final String BUNDLE_BASE_NAME = "locale";
    private static final ResourceBundle.Control NO_FALLBACK =
            ResourceBundle.Control.getNoFallbackControl(ResourceBundle.Control.FORMAT_PROPERTIES);
    private static final Object[] SAMPLE_ARGUMENTS = {"A0", "A1", "A2", "A3"};
    private static final String QUERY_EXECUTION_ERROR_KEY = "QUERY_EXECUTION_ERROR";
    private static final String QUERY_EXECUTION_ERROR_ARGUMENT = "boom";
    private static final String QUERY_EXECUTION_ERROR_ENGLISH = "Query execution error: boom.";
    private static final String QUERY_EXECUTION_ERROR_CHINESE = "查询执行错误：boom。";
    private static final String GERMAN_KEY = "INVALID_GROUP_ID";
    private static final String GERMAN_TEXT = "Ungültige Gruppen-ID, bitte überprüfen und erneut versuchen.";
    private static final String UNKNOWN_KEY = "NO_SUCH_KEY_FOR_LOCALE_UTILS_TEST";
    private static final String BUSY_ENGLISH = "Oops! Service is busy, please try again later.";
    private static final String BUSY_GERMAN = "Oops! Der Dienst ist ausgelastet, bitte versuchen Sie es später erneut.";
    private static final String BUSY_CHINESE = "哎呀！服务繁忙，请稍后重试。";
    private static final String MISSING_KEY_LOG = "message key not exist";
    private Logger logger;
    private ListAppender<ILoggingEvent> appender;

    @BeforeEach
    void captureLog() {
        logger = (Logger) LoggerFactory.getLogger(LocaleUtils.class);
        appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
    }

    @AfterEach
    void releaseLog() {
        logger.detachAppender(appender);
    }

    private static ResourceBundle bundle(Locale locale) {
        return ResourceBundle.getBundle(BUNDLE_BASE_NAME, locale, NO_FALLBACK);
    }

    private static Set<String> keys(Locale locale) {
        return new TreeSet<>(bundle(locale).keySet());
    }

    static Set<String> keysTheGermanBundleLacks() {
        Set<String> keys = keys(Locale.ENGLISH);
        keys.removeAll(keys(Locale.GERMAN));
        return keys;
    }

    static Set<String> keysOfTheGermanBundle() {
        return keys(Locale.GERMAN);
    }

    private static String formatted(Locale bundleLocale, String key) {
        return new MessageFormat(bundle(bundleLocale).getString(key)).format(SAMPLE_ARGUMENTS);
    }

    private List<ILoggingEvent> errors() {
        return appender.list.stream().filter(event -> event.getLevel() == Level.ERROR).toList();
    }

    /** The derived tests below are not vacuous: the German bundle lacks keys, the task's example among them. */
    @Test
    void theGermanBundleLacksKeysOfTheEnglishOne() {
        Set<String> lacking = keysTheGermanBundleLacks();
        System.out.println(LOG_PREFIX + "locale_en " + keys(Locale.ENGLISH).size() + " keys, locale_de " + keys(Locale.GERMAN).size()
                + ", lacking from locale_de " + lacking.size());

        assertThat(lacking).contains(QUERY_EXECUTION_ERROR_KEY);
        assertThat(keys(Locale.ENGLISH)).containsAll(keys(Locale.GERMAN));
    }

    /** NEW-35: each key the German bundle lacks gives in German the English text; the missing key is still logged once. */
    @ParameterizedTest(name = "{0}")
    @MethodSource("keysTheGermanBundleLacks")
    void aKeyTheGermanBundleLacksGivesTheEnglishTextNEW35(String key) {
        String message = LocaleUtils.getMessage(Locale.GERMAN, key, SAMPLE_ARGUMENTS);
        System.out.println(LOG_PREFIX + "de " + key + " -> " + message + "; errors logged " + errors().size());

        assertThat(message).isEqualTo(formatted(Locale.ENGLISH, key));
        assertMissingKeyLoggedOnce(key);
    }

    /** Each key of the German bundle keeps its German text: the English fallback is used only for a missing key. */
    @ParameterizedTest(name = "{0}")
    @MethodSource("keysOfTheGermanBundle")
    void aKeyOfTheGermanBundleKeepsItsGermanText(String key) {
        String message = LocaleUtils.getMessage(Locale.GERMAN, key, SAMPLE_ARGUMENTS);
        System.out.println(LOG_PREFIX + "de " + key + " -> " + message);

        assertThat(message).isEqualTo(formatted(Locale.GERMAN, key));
    }

    /** The task's example with its argument, for German with and without a country, and the unchanged Chinese and English. */
    @Test
    void aQueryExecutionErrorIsEnglishInGermanAndChineseInChineseNEW35() {
        for (Locale locale : List.of(Locale.GERMAN, Locale.GERMANY, Locale.ENGLISH)) {
            String message = LocaleUtils.getMessage(locale, QUERY_EXECUTION_ERROR_KEY, QUERY_EXECUTION_ERROR_ARGUMENT);
            System.out.println(LOG_PREFIX + locale + " " + QUERY_EXECUTION_ERROR_KEY + " -> " + message);
            assertThat(message).as(locale.toString()).isEqualTo(QUERY_EXECUTION_ERROR_ENGLISH);
        }
        assertThat(LocaleUtils.getMessage(Locale.CHINESE, QUERY_EXECUTION_ERROR_KEY, QUERY_EXECUTION_ERROR_ARGUMENT))
                .isEqualTo(QUERY_EXECUTION_ERROR_CHINESE);
        assertThat(LocaleUtils.getMessage(Locale.GERMANY, GERMAN_KEY)).isEqualTo(GERMAN_TEXT);
    }

    /** The limit: a key of no bundle still gives the busy text, of the requested locale, and is logged once as an error. */
    @Test
    void aKeyOfNoBundleGivesTheBusyTextOfTheRequestedLocaleAndIsLogged() {
        List<Object[]> cases = List.of(new Object[] {Locale.GERMAN, BUSY_GERMAN}, new Object[] {Locale.ENGLISH, BUSY_ENGLISH},
                new Object[] {Locale.CHINESE, BUSY_CHINESE});
        for (Object[] each : cases) {
            Locale locale = (Locale) each[0];
            appender.list.clear();
            String message = LocaleUtils.getMessage(locale, UNKNOWN_KEY);
            System.out.println(LOG_PREFIX + locale + " " + UNKNOWN_KEY + " -> " + message + "; errors logged " + errors().size());
            assertThat(message).as(locale.toString()).isEqualTo(each[1]);
            assertMissingKeyLoggedOnce(UNKNOWN_KEY);
        }
    }

    /** The limit: a null key is a NullPointerException, as before. */
    @Test
    void aNullKeyIsANullPointerException() {
        Throwable thrown = catchThrowable(() -> LocaleUtils.getMessage(Locale.GERMAN, (String) null));
        System.out.println(LOG_PREFIX + "de null key -> " + thrown);

        assertThat(thrown).isInstanceOf(NullPointerException.class);
    }

    private void assertMissingKeyLoggedOnce(String key) {
        assertThat(errors()).as("one error logged").singleElement()
                .satisfies(event -> assertThat(event.getFormattedMessage()).contains(MISSING_KEY_LOG, key));
    }
}
