package org.lowcoder.sdk.models;

import org.springframework.data.annotation.Transient;

import java.util.Map;

public interface TokenBasedConnectionDetail extends Encrypt {

    @Transient
    boolean isStale();

    Map<String, Object> toMap();
}
