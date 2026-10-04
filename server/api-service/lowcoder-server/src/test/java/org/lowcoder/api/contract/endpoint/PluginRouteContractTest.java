package org.lowcoder.api.contract.endpoint;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.MiscSamples;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.framework.plugin.LowcoderPluginManager;
import org.lowcoder.api.framework.plugin.endpoint.PluginEndpointHandler;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.contract.GoldenJson;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.EntityExchangeResult;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Codec-level test of the functional route {@code GET /api/plugins/} (docs/API_PAYLOAD_TEST_PLAN.md §1.1, §1.3, §5.2,
 * task T7.4), through the production {@code PluginConfiguration} bean the harness registers (E10): the route writes
 * {@code LowcoderPluginManager#getLoadedPluginsInfo}, a list of the private record {@code PluginInfo}
 * ({@code id}, {@code description}, and {@code info} declared {@code Object}), with the server codec, outside the
 * {@code ResponseView} envelope.
 *
 * <ul>
 *   <li>{@link #loadedPluginsListed}: two {@code PluginInfo}s ({@link MiscSamples#pluginInfo}), each {@code info} the
 *       §4.6 representative input; the body is pinned in {@value #PLUGINS_FIXTURE}. The golden lies outside
 *       {@code types/}, as {@code PluginInfo} is neither a closure type nor a registry extra root;</li>
 *   <li>{@link #noPluginsLoaded}: the harness's default, an empty list, answers {@code []}.</li>
 * </ul>
 *
 * <p>Limits: the plugin manager is a mock, so plugin loading is not run; the route's other branch, the endpoints of
 * loaded plugins ({@code PluginConfiguration.java:29-34}), passes the plugins' bytes through (§1.4,
 * {@code functional-routes.json}) and is not tested here.
 */
class PluginRouteContractTest {

    static final String PLUGINS_FIXTURE = "routes/plugins.json";
    static final String NO_PLUGINS = "[]";
    static final String FIRST = "PluginInfo[0]";
    static final String SECOND = "PluginInfo[1]";
    static final String INFO = "info";
    static final int OK = 200;

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @Test
    void loadedPluginsListed() {
        try (ContractTestClient client = ContractTestClient.builder().build()) {
            Mockito.doReturn(new ArrayList<>(List.of(MiscSamples.pluginInfo(FIRST), MiscSamples.pluginInfo(SECOND))))
                    .when(client.bean(LowcoderPluginManager.class)).getLoadedPluginsInfo();
            String body = get(client);
            System.out.println("[PluginRouteContractTest] each info "
                    + (CanonicalJson.compare(GOLDEN.read(PayloadSamples.REPRESENTATIVE_OUTPUT), firstInfo(body)).equivalent() ? "equals" : "differs from")
                    + " the production mapper's output " + PayloadSamples.REPRESENTATIVE_OUTPUT);
            GOLDEN.assertJson(PLUGINS_FIXTURE, body);
        }
    }

    @Test
    void noPluginsLoaded() {
        try (ContractTestClient client = ContractTestClient.builder().build()) {
            CanonicalJson.assertEquivalent(NO_PLUGINS, get(client));
        }
    }

    private static String get(ContractTestClient client) {
        EntityExchangeResult<byte[]> result = client.web().get().uri(PluginEndpointHandler.PLUGINS_BASE_URL).exchange().expectBody().returnResult();
        String body = new String(result.getResponseBodyContent() == null ? new byte[0] : result.getResponseBodyContent(), StandardCharsets.UTF_8);
        System.out.println("[PluginRouteContractTest] GET " + PluginEndpointHandler.PLUGINS_BASE_URL + " -> " + result.getStatus().value() + " "
                + result.getResponseHeaders().getContentType() + " " + body);
        assertThat(result.getStatus().value()).as("status").isEqualTo(OK);
        assertThat(result.getResponseHeaders().getContentType()).as("Content-Type")
                .satisfies(type -> assertThat(type.isCompatibleWith(MediaType.APPLICATION_JSON)).isTrue());
        return body;
    }

    /** The {@code info} member of the body's first element, as text. */
    private static String firstInfo(String body) {
        try {
            return PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(PayloadAssertions.FIXTURE_EDITOR.readTree(body).get(0).get(INFO));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("the plugin list is not JSON: " + body, e);
        }
    }
}
