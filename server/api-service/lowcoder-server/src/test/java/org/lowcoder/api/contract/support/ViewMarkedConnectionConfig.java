package org.lowcoder.api.contract.support;

import com.fasterxml.jackson.annotation.JsonView;
import org.lowcoder.sdk.config.JsonViews;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;

/**
 * The test-only {@link DatasourceConnectionConfig} of docs/API_PAYLOAD_TEST_PLAN.md §5.5 (task T5.1): one
 * {@code Public} and one {@code Internal} member, so that the datasource view endpoints, which answer under
 * {@code Public}, show which of a config's members they write. The real configs are bound and pinned in
 * {@code config-binding} (WP8); this one stands for any of them inside {@code Datasource#detailConfig}, whose declared
 * type is the interface (an {@code EXCLUDED_TYPES} entry).
 *
 * <p>The {@code Internal} member holds a {@link PayloadSamples#SECRET_MARKER} value, which {@code Public} output must
 * not contain (§4.5).
 */
public final class ViewMarkedConnectionConfig implements DatasourceConnectionConfig {

    private final String host;
    private final String password;

    public ViewMarkedConnectionConfig(String host, String password) {
        this.host = host;
        this.password = password;
    }

    @JsonView(JsonViews.Public.class)
    public String getHost() {
        return host;
    }

    @JsonView(JsonViews.Internal.class)
    public String getPassword() {
        return password;
    }

    /** Not called by the tests: the endpoints under test hand the config through unchanged. */
    @Override
    public DatasourceConnectionConfig mergeWithUpdatedConfig(DatasourceConnectionConfig detailConfig) {
        return detailConfig;
    }
}
