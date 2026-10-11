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
 * {@code QueryTimeoutUtils} (unit U1, task L3-4), in its own unit: the maximum argument is in SECONDS. Note that the
 * only production caller, {@code QueryExecutionServiceImpl:47}, passes milliseconds (see the plan section 9 row "the
 * maximum query timeout is multiplied by 1000 twice over"); that is pinned with the caller, not here.
 * The default is process-global static state, reset after every test.
 */
class QueryTimeoutUtilsTest {

    private static final int DEFAULT_SECONDS = 10;
    private static final int MAX_SECONDS = 300;

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

    /** Catches a default larger than the maximum being handed out unclamped (:36). */
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

    /** Catches seconds read as milliseconds or the reverse, and case sensitivity of the unit (:64, :72-79). */
    @ParameterizedTest(name = "\"{0}\" -> {1} ms")
    @CsvSource({"5s,5000", "5S,5000", "2.5s,2500", "500ms,500", "500MS,500", "500,500", "1e3,1000", "0,0", "0s,0"})
    void parse_secondsAndMilliseconds_areScaledAndCaseInsensitive(String input, int expectedMs) {
        assertThat(parseQueryTimeoutMs(input, MAX_SECONDS)).isEqualTo(expectedMs);
        System.out.println("[QueryTimeoutUtilsTest] '" + input + "' -> " + expectedMs + " ms");
    }

    /**
     * Pins the plan section 9 row "QueryTimeoutUtils reads 5m as 5 ms" (convertToMs:63-69): only the exact unit "s"
     * is scaled, every other unit (m, min, sec, minutes) is read as milliseconds. A fix changes this test on purpose.
     */
    @ParameterizedTest(name = "\"{0}\" -> {1} ms")
    @CsvSource({"5m,5", "5min,5", "10sec,10", "1minutes,1", "5M,5"})
    void parse_unitsOtherThanExactlyS_areReadAsMilliseconds_pinsSection9Row(String input, int expectedMs) {
        assertThat(parseQueryTimeoutMs(input, MAX_SECONDS)).isEqualTo(expectedMs);
        System.out.println("[QueryTimeoutUtilsTest] pins the section 9 row: '" + input + "' read as " + expectedMs + " ms");
    }

    /** Catches garbage turned into a negative or zero timeout (:51): invalid text and negative numbers are rejected. */
    @ParameterizedTest(name = "\"{0}\"")
    @ValueSource(strings = {"-5", "-5s", "abc", "s", "ms", "5x", "1.2.3s", "5 5s"})
    void parse_invalidValues_failWithQueryArgumentError(String input) {
        assertThatThrownBy(() -> parseQueryTimeoutMs(input, MAX_SECONDS))
                .satisfies(error -> assertPluginError(error, PluginCommonError.QUERY_ARGUMENT_ERROR, "INVALID_TIMEOUT_SETTING", input));
        System.out.println("[QueryTimeoutUtilsTest] '" + input + "' -> QUERY_ARGUMENT_ERROR");
    }

    /**
     * Pins the plan section 9 row "Candidate, to be reproduced by L3-4" (NaN): {@code NumberUtils.toDouble("NaN", -1)}
     * is NaN, {@code NaN < 0} is false (:51), {@code (int) NaN} is 0 and {@code 0 > max} is false, so "NaN" is accepted
     * as a 0 ms timeout. A fix (reject NaN) changes this test on purpose.
     */
    @Test
    void parse_nan_isAcceptedAsZeroMilliseconds_pinsSection9Candidate() {
        assertThat(parseQueryTimeoutMs("NaN", MAX_SECONDS)).isZero();
        System.out.println("[QueryTimeoutUtilsTest] pins the section 9 candidate: 'NaN' -> 0 ms");
    }

    /**
     * Catches an off-by-one on the maximum and an int overflow slipping through (:56): with a 10 s maximum, exactly 10 s
     * is accepted and anything above is rejected with EXCEED_MAX_QUERY_TIMEOUT carrying the maximum in seconds. (The
     * production caller passes milliseconds here, see the section 9 row named in the class comment.)
     */
    @Test
    void parse_maximumBoundary_isInclusive() {
        assertThat(parseQueryTimeoutMs("10s", 10)).isEqualTo(10_000);
        assertThat(parseQueryTimeoutMs("10000", 10)).isEqualTo(10_000);

        for (String above : new String[] {"10001", "10.001s", "11s", "99999999999s", "Infinity"}) {
            assertThatThrownBy(() -> parseQueryTimeoutMs(above, 10))
                    .as(above)
                    .satisfies(error -> assertPluginError(error, PluginCommonError.EXCEED_MAX_QUERY_TIMEOUT, "EXCEED_MAX_QUERY_TIMEOUT", 10));
        }
        System.out.println("[QueryTimeoutUtilsTest] maximum 10 s: 10s/10000 accepted, 10001/10.001s/11s/overflow/Infinity rejected");
    }

    /** Catches mustache placeholders being parsed as garbage (:30): the template is rendered from the parameters first. */
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
}
