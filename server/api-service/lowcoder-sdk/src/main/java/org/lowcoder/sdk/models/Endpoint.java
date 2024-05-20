package org.lowcoder.sdk.models;

import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import lombok.extern.jackson.Jacksonized;
import org.apache.commons.lang3.StringUtils;

@ToString
@EqualsAndHashCode
@Builder
@Jacksonized
public class Endpoint {

    private final String host;
    private final Long port;

    public Long getPort() {
        return port;
    }

    public String getHost() {
        return StringUtils.trimToEmpty(host);
    }

    public long getPort(long defaultPort) {
        return port == null ? defaultPort : port;
    }
}
