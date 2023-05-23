package org.lowcoder.sdk.exception;

import java.io.Serializable;

public interface PluginError extends Serializable {

    String name();

    default boolean logVerbose() {
        return false;
    }
}
