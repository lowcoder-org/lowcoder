package org.lowcoder.domain.query.util;

import static org.lowcoder.sdk.exception.PluginCommonError.EXCEED_MAX_QUERY_TIMEOUT;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;
import static org.lowcoder.sdk.util.MustacheHelper.renderMustacheString;

import java.time.Duration;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.apache.commons.lang3.tuple.Pair;
import org.lowcoder.sdk.exception.PluginException;

import com.google.common.annotations.VisibleForTesting;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public final class QueryTimeoutUtils {

    private static int defaultQueryTimeout = 10;

    private static final String MILLISECONDS = "ms";
    private static final String INVALID_TIMEOUT_SETTING_KEY = "INVALID_TIMEOUT_SETTING";
    private static final String EXCEED_MAX_QUERY_TIMEOUT_KEY = "EXCEED_MAX_QUERY_TIMEOUT";
    private static final long MILLIS_PER_SECOND = 1000L;
    private static final long MILLIS_PER_MINUTE = 60 * MILLIS_PER_SECOND;
    /**
     * The units a timeout may be written in (case-insensitive), in milliseconds (BF-044: only the exact unit {@code s}
     * was scaled, so {@code 5m}, {@code 5min} or {@code 10sec} were read as milliseconds). A number without a unit is in
     * milliseconds. Hours and any other unit are refused.
     */
    private static final Map<String, Long> MILLIS_PER_UNIT = Map.ofEntries(
            Map.entry(MILLISECONDS, 1L),
            Map.entry("s", MILLIS_PER_SECOND),
            Map.entry("sec", MILLIS_PER_SECOND),
            Map.entry("secs", MILLIS_PER_SECOND),
            Map.entry("second", MILLIS_PER_SECOND),
            Map.entry("seconds", MILLIS_PER_SECOND),
            Map.entry("m", MILLIS_PER_MINUTE),
            Map.entry("min", MILLIS_PER_MINUTE),
            Map.entry("mins", MILLIS_PER_MINUTE),
            Map.entry("minute", MILLIS_PER_MINUTE),
            Map.entry("minutes", MILLIS_PER_MINUTE));

    @Value("${default.query-timeout}")
    public void setDefaultQueryTimeoutMillis(int defaultQueryTimeout) {
        QueryTimeoutUtils.defaultQueryTimeout = defaultQueryTimeout;
    }

    public static int parseQueryTimeoutMs(String timeoutStr, Map<String, Object> paramMap, int maxQueryTimeoutSeconds) {
        return parseQueryTimeoutMs(renderMustacheString(timeoutStr, paramMap), maxQueryTimeoutSeconds);
    }

    /**
     * The query timeout in milliseconds: a blank text is the default, clamped by the maximum. The maximum and the
     * default are in seconds and are compared in {@code long} (BF-043: the blank-timeout default was computed in
     * {@code int}, so a large maximum made it negative and every query timed out at once).
     * <p>
     * Invalid text, a negative number and {@code NaN} with or without a unit are refused with {@code INVALID_TIMEOUT_SETTING}
     * (BF-079: {@code NaN} was read as 0 ms); {@code Infinity} is refused as above the maximum, unless the maximum is itself
     * above {@link Integer#MAX_VALUE} ms, where it is cut like any larger value (see the limits).
     * <p>
     * Limits: a timeout is an {@code int} of milliseconds, so it is at most {@link Integer#MAX_VALUE} ms (about 24.8 days);
     * a larger value that a maximum of that size allows is cut to it.
     */
    @VisibleForTesting
    public static int parseQueryTimeoutMs(String timeoutStr, int maxQueryTimeoutSeconds) {
        long maxQueryTimeoutMs = Duration.ofSeconds(maxQueryTimeoutSeconds).toMillis();
        if (StringUtils.isBlank(timeoutStr)) {
            long defaultQueryTimeoutMs = Duration.ofSeconds(defaultQueryTimeout).toMillis();
            return (int) Math.min(Integer.MAX_VALUE, Math.min(defaultQueryTimeoutMs, maxQueryTimeoutMs));
        }

        Pair<String, Integer> unitInfo = getUnitInfo(timeoutStr);
        String unit = unitInfo.getLeft();
        int unitIndex = unitInfo.getRight();

        String valueStr;
        if (unitIndex == -1) {
            valueStr = timeoutStr;
        } else {
            valueStr = timeoutStr.substring(0, unitIndex);
        }

        double value = NumberUtils.toDouble(valueStr, -1);
        // NaN is no timeout: it fails "< 0" and casts to 0 ms (BF-079)
        if (Double.isNaN(value) || value < 0) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, INVALID_TIMEOUT_SETTING_KEY, timeoutStr);
        }
 
        Long millisPerUnit = MILLIS_PER_UNIT.get(unit);
        if (millisPerUnit == null) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, INVALID_TIMEOUT_SETTING_KEY, timeoutStr);
        }
        int millis = (int) (value * millisPerUnit);
        if (millis > maxQueryTimeoutMs) {
            throw new PluginException(EXCEED_MAX_QUERY_TIMEOUT, EXCEED_MAX_QUERY_TIMEOUT_KEY, maxQueryTimeoutSeconds);
        }

        return millis;
    }

    private static Pair<String, Integer> getUnitInfo(String str) {
        int unitIndex = StringUtils.indexOfAny(str, 'M', 'm');
        if (unitIndex == -1) {
            unitIndex = StringUtils.indexOfAny(str, 'S', 's');
        }
        if (unitIndex == -1) {
            return Pair.of(MILLISECONDS, -1);
        }
        return Pair.of(str.substring(unitIndex).trim().toLowerCase(), unitIndex);

    }

}
