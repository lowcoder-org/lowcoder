package org.lowcoder.api.contract.support;

import org.lowcoder.api.config.ConfigEndpoints.UpdateConfigRequest;
import org.lowcoder.api.config.ConfigView;
import org.lowcoder.infra.config.model.ServerConfig;
import org.lowcoder.sdk.constants.WorkspaceMode;

import java.util.ArrayList;
import java.util.List;

/**
 * Samples of the configuration types of WP7 (docs/API_PAYLOAD_TEST_PLAN.md §3.3, task T7.1), with the conventions of
 * {@link PayloadSamples}.
 */
public final class ConfigSamples {

    private ConfigSamples() {
    }

    /**
     * {@code ConfigEndpoints#getConfig}: an organization's login configuration, with one auth config of each of the five
     * {@code AbstractAuthConfig} classes, so the {@code Public} view of the endpoint hides each class's secret (§4.5).
     * The booleans are {@code true}, not the primitives' default.
     */
    public static ConfigView configView() {
        return ConfigView.builder()
                .isCloudHosting(true)
                .authConfigs(new ArrayList<>(List.of(
                        OrganizationSamples.emailAuthConfig("ConfigView.authConfigs[0]"),
                        OrganizationSamples.oauth2SimpleAuthConfig("ConfigView.authConfigs[1]"),
                        OrganizationSamples.oauth2GenericAuthConfig("ConfigView.authConfigs[2]"),
                        OrganizationSamples.oauth2KeycloakAuthConfig("ConfigView.authConfigs[3]"),
                        OrganizationSamples.oauth2OryAuthConfig("ConfigView.authConfigs[4]"))))
                .workspaceMode(WorkspaceMode.ENTERPRISE)
                .selfDomain(true)
                .cookieName("ConfigView.cookieName")
                .build();
    }

    /** A stored server configuration; {@code value} is declared {@code Object}, so it holds the §4.6 representative input. */
    public static ServerConfig serverConfig() {
        return ServerConfig.builder()
                .id("ServerConfig.id")
                .createdBy("ServerConfig.createdBy")
                .key("ServerConfig.key")
                .value(PayloadSamples.representativeObject())
                .build();
    }

    /** {@code ConfigEndpoints#updateServerConfig}. */
    public static UpdateConfigRequest updateConfigRequest() {
        return new UpdateConfigRequest("UpdateConfigRequest.value");
    }
}
