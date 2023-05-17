package org.lowcoder.sdk.util;

import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.exception.PluginError;
import org.lowcoder.sdk.exception.PluginException;

public class Preconditions {

    public static void check(boolean condition, BizError errorCode, String messageKey, Object... args) {
        if (!condition) {
            throw new BizException(errorCode, messageKey, args);
        }
    }

    public static void check(boolean condition, PluginError errorCode, String messageKey, Object... args) {
        if (!condition) {
            throw new PluginException(errorCode, messageKey, args);
        }
    }
}
