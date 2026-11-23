package org.lowcoder.domain.datasource.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.encryption.EncryptionServiceImpl;
import org.lowcoder.domain.plugin.client.DatasourcePluginClient;
import org.lowcoder.domain.plugin.client.dto.DatasourcePluginDefinition;
import org.lowcoder.domain.plugin.service.impl.DatasourceMetaInfoServiceImpl;
import org.lowcoder.infra.js.NodeServerHelper;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.CommonConfigHelper;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Request;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.test.StepVerifier;

/**
 * A datasource that is saved with a type the node service no longer lists (the removed "fauna" plugin).
 *
 * <p>A real {@link DatasourcePluginClient} talks to a local server ({@link RecordingHttpServer}) standing in for the
 * node service, which answers {@code GET /plugins} with a list that does not contain "fauna". The real
 * {@link DatasourceMetaInfoServiceImpl} decides the type is a JS plugin and the real {@link JsDatasourceHelper}
 * runs on top. A control with a listed type shows the wiring does fill a definition, so the "removed" results below
 * are not an artefact of the stand-in.
 *
 * <p>Limits: only this layer is covered (the plugin client and the helper that reads the plugin list). The
 * repository and service callers of {@code fillPluginDefinition}, the response encryption of the stored
 * {@code apiKey} and the client's edit page are not run here. A query on such a datasource, which node service answers
 * with 400 "plugin not found", is not covered either.
 */
class SavedDatasourceOfRemovedPluginTest {

    private static final String REMOVED_TYPE = "fauna";
    private static final String LISTED_TYPE = "gitlab";
    private static final String API = "/node-service/api/";
    private static final String PLUGINS_PATH = API + "plugins";
    private static final String DYNAMIC_CONFIG_PATH = API + "getPluginDynamicConfig";
    private static final String GET = "GET";
    private static final String JSON = "application/json";
    private static final int OK = 200;
    private static final Duration TIMEOUT = Duration.ofSeconds(20);
    private static final String API_KEY_KEY = "apiKey";
    private static final String REGION_KEY = "region";
    private static final String STORED_API_KEY = "encrypted-stored-key";
    private static final String STORED_REGION = "eu";
    private static final String PLUGIN_LIST = "[{\"id\":\"" + LISTED_TYPE + "\",\"name\":\"GitLab\"},{\"id\":\"graphql\",\"name\":\"GraphQL\"}]";

    private RecordingHttpServer server;
    private DatasourcePluginClient pluginClient;
    private JsDatasourceHelper helper;

    @BeforeEach
    void setUp() {
        server = RecordingHttpServer.start(Map.of(PLUGINS_PATH, new Response(OK,
                Map.of(RecordingHttpServer.CONTENT_TYPE, List.of(JSON)), PLUGIN_LIST.getBytes(StandardCharsets.UTF_8))));
        CommonConfig commonConfig = new CommonConfig();
        commonConfig.getJsExecutor().setHost(server.baseUrl());
        commonConfig.getJsExecutor().setPassword("");
        commonConfig.getJsExecutor().setSalt("");
        CommonConfigHelper commonConfigHelper = new CommonConfigHelper(commonConfig, new ConfigCenterForTest());
        NodeServerHelper nodeServerHelper = new NodeServerHelper();
        ReflectionTestUtils.setField(nodeServerHelper, "commonConfigHelper", commonConfigHelper);
        pluginClient = new DatasourcePluginClient(commonConfigHelper, commonConfig, nodeServerHelper, new EncryptionServiceImpl(commonConfig));
        helper = new JsDatasourceHelper();
        ReflectionTestUtils.setField(helper, "datasourceMetaInfoService", new DatasourceMetaInfoServiceImpl());
        ReflectionTestUtils.setField(helper, "datasourcePluginClient", pluginClient);
    }

    @AfterEach
    void tearDown() {
        server.close();
    }

    private static JsDatasourceConnectionConfig savedConfig() {
        JsDatasourceConnectionConfig config = new JsDatasourceConnectionConfig();
        config.put(API_KEY_KEY, STORED_API_KEY);
        config.put(REGION_KEY, STORED_REGION);
        return config;
    }

    private static Datasource saved(String type, JsDatasourceConnectionConfig config) {
        return Datasource.builder().id("ds").type(type).detailConfig(config).build();
    }

    private List<String> requestedPaths() {
        return server.requests().stream().map(Request::pathAndQuery).toList();
    }

    @Test
    void theRemovedTypeIsStillAJsPluginTypeForTheMetaInfoService() {
        DatasourceMetaInfoServiceImpl metaInfo = new DatasourceMetaInfoServiceImpl();

        assertThat(metaInfo.isJsDatasourcePlugin(REMOVED_TYPE)).isTrue();
        assertThat(metaInfo.isJavaDatasourcePlugin(REMOVED_TYPE)).isFalse();
        System.out.println("[SavedDatasourceOfRemovedPluginTest] " + REMOVED_TYPE + " -> JS plugin type, not Java");
    }

    @Test
    void theClientFindsNoDefinitionForTheRemovedTypeAndOneForAListedType() {
        StepVerifier.create(pluginClient.getDatasourcePluginDefinition(REMOVED_TYPE)).expectComplete().verify(TIMEOUT);
        DatasourcePluginDefinition listed = pluginClient.getDatasourcePluginDefinition(LISTED_TYPE).block(TIMEOUT);

        assertThat(listed).isNotNull();
        assertThat(listed.getId()).isEqualTo(LISTED_TYPE);
        assertThat(requestedPaths()).hasSize(2).allMatch(path -> path.endsWith(PLUGINS_PATH));
        System.out.println("[SavedDatasourceOfRemovedPluginTest] plugin list: " + REMOVED_TYPE + " -> none, " + LISTED_TYPE + " -> found");
    }

    /** The control: with a listed type the same wiring fills the definition on the datasource and on the config. */
    @Test
    void controlAListedTypeGetsItsDefinitionFilled() {
        JsDatasourceConnectionConfig config = savedConfig();
        Datasource datasource = saved(LISTED_TYPE, config);

        StepVerifier.create(helper.fillPluginDefinition(datasource)).expectComplete().verify(TIMEOUT);

        assertThat(datasource.getPluginDefinition()).isNotNull();
        assertThat(datasource.getPluginDefinition().getId()).isEqualTo(LISTED_TYPE);
        assertThat(config.getDefinition()).isSameAs(datasource.getPluginDefinition());
        assertThat(config.getType()).isEqualTo(LISTED_TYPE);
        System.out.println("[SavedDatasourceOfRemovedPluginTest] control: " + LISTED_TYPE + " definition filled");
    }

    @Test
    void aSavedDatasourceOfTheRemovedTypeLoadsWithoutAnErrorAndWithoutADefinition() {
        JsDatasourceConnectionConfig config = savedConfig();
        Datasource datasource = saved(REMOVED_TYPE, config);

        StepVerifier.create(helper.fillPluginDefinition(datasource)).expectComplete().verify(TIMEOUT);

        assertThat(datasource.getPluginDefinition()).isNull();
        assertThat(config.getDefinition()).isNull();
        assertThat(config.getType()).isNull();
        assertThat(config).containsEntry(API_KEY_KEY, STORED_API_KEY).containsEntry(REGION_KEY, STORED_REGION);
        assertThat(datasource.getType()).isEqualTo(REMOVED_TYPE);
        assertThat(requestedPaths()).hasSize(1).allMatch(path -> path.endsWith(PLUGINS_PATH));
        System.out.println("[SavedDatasourceOfRemovedPluginTest] " + REMOVED_TYPE + " datasource: no error, no definition, stored fields kept");
    }

    @Test
    void theDynamicConfigStepsCompleteWithoutAnErrorAndSendNoDynamicConfigRequest() {
        JsDatasourceConnectionConfig config = savedConfig();
        Datasource datasource = saved(REMOVED_TYPE, config);

        StepVerifier.create(helper.processDynamicDatasourceConfigExtra(datasource)).expectComplete().verify(TIMEOUT);
        StepVerifier.create(helper.processDynamicQueryConfig(datasource)).expectComplete().verify(TIMEOUT);

        assertThat(datasource.getPluginDefinition()).isNull();
        assertThat(config.getDefinition()).isNull();
        assertThat(config.getType()).isNull();
        assertThat(config).doesNotContainKey("extra").containsEntry(API_KEY_KEY, STORED_API_KEY).containsEntry(REGION_KEY, STORED_REGION);
        assertThat(requestedPaths()).isNotEmpty().allMatch(path -> path.endsWith(PLUGINS_PATH))
                .noneMatch(path -> path.endsWith(DYNAMIC_CONFIG_PATH));
        assertThat(server.requests()).allMatch(request -> GET.equals(request.method()));
        System.out.println("[SavedDatasourceOfRemovedPluginTest] dynamic steps: no error, only plugin-list reads");
    }
}
