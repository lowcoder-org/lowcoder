package org.lowcoder.domain.query.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.lowcoder.domain.query.util.QueryTimeoutUtils.parseQueryTimeoutMs;

import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;

/**
 * {@code QueryTimeoutUtils} (unit U1, task L3-4), in its own unit: the maximum argument is in SECONDS, which is what the
 * production caller {@code QueryExecutionServiceImpl} passes since BF-043 (it passed milliseconds).
 * The default is process-global static state, reset after every test.
 */
class QueryTimeoutUtilsTest {

    private static final int DEFAULT_SECONDS = 10;
    private static final int MAX_SECONDS = 300;
    /** 2148 s multiplied by 1000 as the caller did before BF-043: its milliseconds leave the int range. */
    private static final int CALLER_SCALED_MAX_SECONDS = 2_148_000;
    private static final int DEFAULT_MS = DEFAULT_SECONDS * 1000;
    private static final String BEYOND_THE_INT_RANGE = "99999999999s";
    private static final String INVALID_TIMEOUT_SETTING_KEY = "INVALID_TIMEOUT_SETTING";
    private static final String EXCEED_MAX_QUERY_TIMEOUT_KEY = "EXCEED_MAX_QUERY_TIMEOUT";
    /** The text {@code Double.parseDouble} reads as NaN (BF-079). */
    private static final String NAN = "NaN";

    @AfterEach
    void resetTheStaticDefault() {
        new QueryTimeoutUtils().setDefaultQueryTimeoutMillis(DEFAULT_SECONDS);
    }

    private static void assertPluginError(Throwable error, PluginCommonError expected, String messageKey, Object arg) {
        assertThat(error).isInstanceOf(PluginException.class);
        PluginException plugin = (PluginException) error;
        assertThat(plugin.getError()).isEqualTo(expected);
        assertThat(plugin.getMessageKey()).isEqualTo(messageKey);
        assertThat(plugin.getArgs()).containsExactly(arg);
    }

    /** Catches a default larger than the maximum being handed out unclamped (QueryTimeoutUtils:71-74). */
    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void parse_blankTimeout_usesTheDefaultClampedByTheMaximum(String blank) {
        assertThat(parseQueryTimeoutMs(blank, MAX_SECONDS)).as("default 10 s below the maximum").isEqualTo(10_000);
        assertThat(parseQueryTimeoutMs(blank, 5)).as("default 10 s clamped to a 5 s maximum").isEqualTo(5_000);
        System.out.println("[QueryTimeoutUtilsTest] blank '" + blank + "' -> default 10000 ms, clamped to 5000 ms by a 5 s maximum");
    }

    /**
     * Catches unit confusion with the property: despite its name, {@code setDefaultQueryTimeoutMillis} takes SECONDS
     * (:24-27), so 30 gives 30000 ms.
     */
    @Test
    void setDefaultQueryTimeout_takesSecondsDespiteItsName() {
        new QueryTimeoutUtils().setDefaultQueryTimeoutMillis(30);

        assertThat(parseQueryTimeoutMs("", MAX_SECONDS)).isEqualTo(30_000);
        System.out.println("[QueryTimeoutUtilsTest] setDefaultQueryTimeoutMillis(30) -> blank timeout is 30000 ms (value is seconds)");
    }

    /** Catches seconds read as milliseconds or the reverse, and case sensitivity of the unit. */
    @ParameterizedTest(name = "\"{0}\" -> {1} ms")
    @CsvSource({"5s,5000", "5S,5000", "2.5s,2500", "500ms,500", "500MS,500", "500,500", "1e3,1000", "0,0", "0s,0"})
    void parse_secondsAndMilliseconds_areScaledAndCaseInsensitive(String input, int expectedMs) {
        assertThat(parseQueryTimeoutMs(input, MAX_SECONDS)).isEqualTo(expectedMs);
        System.out.println("[QueryTimeoutUtilsTest] '" + input + "' -> " + expectedMs + " ms");
    }

    /**
     * BF-044 fixed: only the exact unit "s" was scaled, so minutes and the long forms of seconds (5m, 5min, 10sec,
     * 1minutes) were read as milliseconds. Every minute and second spelling is now scaled, in any case, with or without
     * a space before or after the unit (quoted rows: an unquoted CSV value would lose its trailing space).
     */
    @ParameterizedTest(name = "\"{0}\" -> {1} ms")
    @CsvSource(delimiter = '|', value = {
            "5m|300000", "5min|300000", "2mins|120000", "1minute|60000", "1minutes|60000", "5M|300000", "1.5m|90000",
            "10sec|10000", "3secs|3000", "1second|1000", "2seconds|2000", "10SEC|10000", "5 s|5000", "'5s '|5000", "'2 min '|120000"
    })
    void parse_minuteAndSecondUnits_areScaledBF044(String input, int expectedMs) {
        int parsed = parseQueryTimeoutMs(input, MAX_SECONDS);
        System.out.println("[QueryTimeoutUtilsTest] '" + input + "' -> " + parsed + " ms");
        assertThat(parsed).isEqualTo(expectedMs);
    }

    /**
     * BF-044: a unit outside the table was read as milliseconds whenever it started with m or s (5mx, 5sx, 5msec); it is
     * now refused like any other invalid timeout, and so are hours, which are not supported.
     */
    @ParameterizedTest(name = "\"{0}\"")
    @ValueSource(strings = {"5mx", "5sx", "5msec", "5mm", "1h", "1hour", "2hours"})
    void parse_unknownUnits_failWithQueryArgumentErrorBF044(String input) {
        assertThatThrownBy(() -> parseQueryTimeoutMs(input, MAX_SECONDS))
                .satisfies(error -> assertPluginError(error, PluginCommonError.QUERY_ARGUMENT_ERROR, INVALID_TIMEOUT_SETTING_KEY, input));
        System.out.println("[QueryTimeoutUtilsTest] '" + input + "' -> QUERY_ARGUMENT_ERROR");
    }

    /** Catches garbage turned into a negative or zero timeout (QueryTimeoutUtils:87-91): invalid text and negative numbers are rejected. */
    @ParameterizedTest(name = "\"{0}\"")
    @ValueSource(strings = {"-5", "-5s", "abc", "s", "ms", "5x", "1.2.3s", "5 5s"})
    void parse_invalidValues_failWithQueryArgumentError(String input) {
        assertThatThrownBy(() -> parseQueryTimeoutMs(input, MAX_SECONDS))
                .satisfies(error -> assertPluginError(error, PluginCommonError.QUERY_ARGUMENT_ERROR, INVALID_TIMEOUT_SETTING_KEY, input));
        System.out.println("[QueryTimeoutUtilsTest] '" + input + "' -> QUERY_ARGUMENT_ERROR");
    }

    /**
     * BF-079 (fixed; was pinned as the plan section 9 candidate reproduced by L3-4): {@code NumberUtils.toDouble("NaN", -1)}
     * is NaN, {@code NaN < 0} is false and {@code (int) NaN} is 0, so "NaN", signed or with a unit, was a 0 ms timeout. It is
     * refused like any other invalid text.
     */
    @ParameterizedTest(name = "\"{0}\"")
    @ValueSource(strings = {NAN, "-" + NAN, "+" + NAN, NAN + "s", NAN + "ms", NAN + " min"})
    void parse_nan_isRefusedAsAnInvalidTimeoutBF079(String input) {
        assertThatThrownBy(() -> parseQueryTimeoutMs(input, MAX_SECONDS))
                .satisfies(error -> assertPluginError(error, PluginCommonError.QUERY_ARGUMENT_ERROR, INVALID_TIMEOUT_SETTING_KEY, input));
        System.out.println("[QueryTimeoutUtilsTest] '" + input + "' -> QUERY_ARGUMENT_ERROR");
    }

    /**
     * Catches an off-by-one on the maximum and an int overflow slipping through (QueryTimeoutUtils:97-100): with a 10 s maximum, exactly 10 s
     * is accepted and anything above is rejected with EXCEED_MAX_QUERY_TIMEOUT carrying the maximum in seconds.
     */
    @Test
    void parse_maximumBoundary_isInclusive() {
        assertThat(parseQueryTimeoutMs("10s", 10)).isEqualTo(10_000);
        assertThat(parseQueryTimeoutMs("10000", 10)).isEqualTo(10_000);

        for (String above : new String[] {"10001", "10.001s", "11s", "99999999999s", "Infinity"}) {
            assertThatThrownBy(() -> parseQueryTimeoutMs(above, 10))
                    .as(above)
                    .satisfies(error -> assertPluginError(error, PluginCommonError.EXCEED_MAX_QUERY_TIMEOUT, EXCEED_MAX_QUERY_TIMEOUT_KEY, 10));
        }
        System.out.println("[QueryTimeoutUtilsTest] maximum 10 s: 10s/10000 accepted, 10001/10.001s/11s/overflow/Infinity rejected");
    }

    /** Catches mustache placeholders being parsed as garbage (QueryTimeoutUtils:53): the template is rendered from the parameters first. */
    @Test
    void parse_mustacheOverload_rendersParametersFirst() {
        assertThat(parseQueryTimeoutMs("{{t}}", Map.of("t", "5s"), MAX_SECONDS)).isEqualTo(5_000);
        assertThat(parseQueryTimeoutMs("{{n}}s", Map.of("n", 3), MAX_SECONDS)).isEqualTo(3_000);
        assertThat(parseQueryTimeoutMs("", Map.of("t", "5s"), MAX_SECONDS)).as("blank template").isEqualTo(10_000);
        assertThat(parseQueryTimeoutMs(null, Map.of(), MAX_SECONDS)).as("null template").isEqualTo(10_000);
        System.out.println("[QueryTimeoutUtilsTest] mustache overload: {{t}} -> 5000, {{n}}s -> 3000, blank/null -> default");
    }

    /**
     * Pins what an unresolved parameter renders to: {@code {{missing}}} renders to an empty string, which is blank, so
     * the default timeout applies instead of an error.
     */
    @Test
    void parse_mustacheOverload_missingParameterRendersBlankAndFallsBackToTheDefault() {
        assertThat(parseQueryTimeoutMs("{{missing}}", Map.of("t", "5s"), MAX_SECONDS)).isEqualTo(10_000);
        assertThat(parseQueryTimeoutMs("{{missing}}", Map.of("t", "5s"), 5)).as("clamped by the maximum").isEqualTo(5_000);
        System.out.println("[QueryTimeoutUtilsTest] unresolved {{missing}} -> blank -> default timeout");
    }

    /**
     * Catches (BF-043) the blank-timeout default overflowing: a maximum whose milliseconds exceed the int range (2148 s
     * multiplied by 1000 as the caller did, or the largest int) still gives the 10 s default, never a negative timeout.
     */
    @ParameterizedTest(name = "maximum {0} s")
    @ValueSource(ints = {CALLER_SCALED_MAX_SECONDS, Integer.MAX_VALUE})
    void parse_blankTimeoutWithAMaximumBeyondTheIntRange_isTheDefaultBF043(int maxSeconds) {
        int timeoutMs = parseQueryTimeoutMs("", maxSeconds);
        System.out.println("[QueryTimeoutUtilsTest] blank with maximum " + maxSeconds + " s -> " + timeoutMs + " ms");
        assertThat(timeoutMs).isEqualTo(DEFAULT_MS);
    }

    /** Documents the limit of the javadoc: with a maximum beyond the int range, a larger timeout is cut to Integer.MAX_VALUE ms. */
    @Test
    void parse_aTimeoutBeyondTheIntRange_isCutToIntegerMaxValueMilliseconds() {
        assertThat(parseQueryTimeoutMs(BEYOND_THE_INT_RANGE, Integer.MAX_VALUE)).isEqualTo(Integer.MAX_VALUE);
    }
}
