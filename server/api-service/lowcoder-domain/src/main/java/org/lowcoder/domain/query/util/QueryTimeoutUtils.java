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

public final class QueryTimeoutUtils {

    private static final int DEFAULT_QUERY_TIMEOUT_MILLIS = 10000;

    public static int parseQueryTimeoutMs(String timeoutStr, Map<String, Object> paramMap, int maxQueryTimeout) {
        return parseQueryTimeoutMs(renderMustacheString(timeoutStr, paramMap), maxQueryTimeout);
    }

    @VisibleForTesting
    public static int parseQueryTimeoutMs(String timeoutStr, int maxQueryTimeout) {
        if (StringUtils.isBlank(timeoutStr)) {
            return DEFAULT_QUERY_TIMEOUT_MILLIS;
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
        if (value < 0) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, "INVALID_TIMEOUT_SETTING", timeoutStr);
        }
 
        int millis = convertToMs(value, unit);
        if (millis > Duration.ofSeconds(maxQueryTimeout).toMillis()) {
            throw new PluginException(EXCEED_MAX_QUERY_TIMEOUT, "EXCEED_MAX_QUERY_TIMEOUT", maxQueryTimeout);
        }

        return millis;
    }

    private static int convertToMs(double value, String unit) {
        if (unit.equals("s")) {
            return (int) (value * 1000);
        } else {
            return (int) value;
        }
    }

    private static Pair<String, Integer> getUnitInfo(String str) {
        int unitIndex = StringUtils.indexOfAny(str, 'M', 'm');
        if (unitIndex == -1) {
            unitIndex = StringUtils.indexOfAny(str, 'S', 's');
        }
        if (unitIndex == -1) {
            return Pair.of("ms", -1);
        }
        return Pair.of(str.substring(unitIndex).toLowerCase(), unitIndex);

    }

}
