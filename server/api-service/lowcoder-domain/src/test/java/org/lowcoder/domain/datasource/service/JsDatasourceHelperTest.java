package org.lowcoder.domain.datasource.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.plugin.client.DatasourcePluginClient;
import org.lowcoder.domain.plugin.client.dto.DatasourcePluginDefinition;
import org.lowcoder.domain.plugin.client.dto.GetPluginDynamicConfigRequestDTO;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@code JsDatasourceHelper} (unit U6, task L3-6): when the plugin definition is fetched, and where dynamic
 * datasource-config and query-config results are stored. Mockito client and meta info service, injected by field.
 */
class JsDatasourceHelperTest {

    private static final String TYPE = "L3-6-js-plugin";

    private DatasourceMetaInfoService metaInfoService;
    private DatasourcePluginClient pluginClient;
    private JsDatasourceHelper helper;

    @BeforeEach
    void setUp() {
        metaInfoService = mock(DatasourceMetaInfoService.class);
        pluginClient = mock(DatasourcePluginClient.class);
        helper = new JsDatasourceHelper();
        ReflectionTestUtils.setField(helper, "datasourceMetaInfoService", metaInfoService);
        ReflectionTestUtils.setField(helper, "datasourcePluginClient", pluginClient);
        when(metaInfoService.isJsDatasourcePlugin(TYPE)).thenReturn(true);
        when(metaInfoService.isJavaDatasourcePlugin(TYPE)).thenReturn(false);
    }

    private static DatasourcePluginDefinition definition(Map<String, Object> entries) {
        DatasourcePluginDefinition definition = new DatasourcePluginDefinition();
        definition.putAll(entries);
        return definition;
    }

    private static DatasourcePluginDefinition datasourceExtraDynamic() {
        return definition(Map.of("dataSourceConfig", Map.of("extra", Map.of("type", "dynamic"))));
    }

    private static DatasourcePluginDefinition queryConfigDynamic() {
        return definition(Map.of("queryConfig", Map.of("type", "dynamic")));
    }

    /** A datasource whose definition, config definition and config type are all present: nothing to fetch. */
    private static Datasource completeDatasource(DatasourcePluginDefinition definition, JsDatasourceConnectionConfig config) {
        config.setDefinition(definition);
        config.setType(TYPE);
        Datasource datasource = Datasource.builder().id("ds").type(TYPE).detailConfig(config).build();
        datasource.setPluginDefinition(definition);
        return datasource;
    }

    // ---------------------------------------------------------------- fillPluginDefinition

    /** Catches a fetch for a Java plugin (:29) or for a config that is not a JS config (:30). */
    @Test
    void fillPluginDefinition_javaPluginOrNonJsConfig_makesNoClientCall() {
        Datasource javaPlugin = Datasource.builder().id("ds").type("L3-6-java").detailConfig(new JsDatasourceConnectionConfig()).build();
        StepVerifier.create(helper.fillPluginDefinition(javaPlugin)).verifyComplete();

        Datasource otherConfig = Datasource.builder().id("ds").type(TYPE).detailConfig(mock(DatasourceConnectionConfig.class)).build();
        StepVerifier.create(helper.fillPluginDefinition(otherConfig)).verifyComplete();

        verifyNoInteractions(pluginClient);
        System.out.println("[JsDatasourceHelperTest] Java plugin / non-JS config -> no plugin definition fetched");
    }

    /** Catches a repeated plugin-definition fetch (:31): with everything present nothing is fetched. */
    @Test
    void fillPluginDefinition_withEverythingPresent_makesNoClientCall() {
        Datasource datasource = completeDatasource(definition(Map.of("id", "x")), new JsDatasourceConnectionConfig());

        StepVerifier.create(helper.fillPluginDefinition(datasource)).verifyComplete();

        verifyNoInteractions(pluginClient);
        System.out.println("[JsDatasourceHelperTest] complete datasource -> no fetch");
    }

    /**
     * Catches a config left without its definition or type (:31, :35-37): when any one of the datasource's plugin
     * definition, the config's definition or the config's type is missing, the definition is fetched once and stored
     * on the datasource and on the config, with the type.
     */
    @ParameterizedTest(name = "missing part #{0}")
    @ValueSource(ints = {0, 1, 2})
    void fillPluginDefinition_whenAnyPartIsMissing_fetchesOnceAndStoresEverywhere(int missing) {
        DatasourcePluginDefinition existing = definition(Map.of("id", "existing"));
        JsDatasourceConnectionConfig config = new JsDatasourceConnectionConfig();
        Datasource datasource = Datasource.builder().id("ds").type(TYPE).detailConfig(config).build();
        if (missing != 0) {
            datasource.setPluginDefinition(existing);
        }
        if (missing != 1) {
            config.setDefinition(existing);
        }
        if (missing != 2) {
            config.setType(TYPE);
        }
        DatasourcePluginDefinition fetched = definition(Map.of("id", "fetched"));
        when(pluginClient.getDatasourcePluginDefinition(TYPE)).thenReturn(Mono.just(fetched));

        StepVerifier.create(helper.fillPluginDefinition(datasource)).verifyComplete();

        verify(pluginClient).getDatasourcePluginDefinition(TYPE);
        assertThat(datasource.getPluginDefinition()).isSameAs(fetched);
        assertThat(config.getDefinition()).isSameAs(fetched);
        assertThat(config.getType()).isEqualTo(TYPE);
        System.out.println("[JsDatasourceHelperTest] part #" + missing + " missing -> fetched and stored on datasource and config");
    }

    /** Catches stale or partial data being stored when the client returns nothing. */
    @Test
    void fillPluginDefinition_emptyClientResult_storesNothing() {
        JsDatasourceConnectionConfig config = new JsDatasourceConnectionConfig();
        Datasource datasource = Datasource.builder().id("ds").type(TYPE).detailConfig(config).build();
        when(pluginClient.getDatasourcePluginDefinition(TYPE)).thenReturn(Mono.empty());

        StepVerifier.create(helper.fillPluginDefinition(datasource)).verifyComplete();

        assertThat(datasource.getPluginDefinition()).isNull();
        assertThat(config.getDefinition()).isNull();
        assertThat(config.getType()).isNull();
        System.out.println("[JsDatasourceHelperTest] empty client result -> nothing stored");
    }

    // ---------------------------------------------------------------- processDynamicDatasourceConfigExtra

    /** Catches dynamic calls for Java plugins (:46) and for definitions that are not dynamic (:52). */
    @Test
    void processDynamicDatasourceConfigExtra_javaPluginOrNonDynamicDefinition_makesNoDynamicCall() {
        when(metaInfoService.isJavaDatasourcePlugin("L3-6-java")).thenReturn(true);
        Datasource javaPlugin = Datasource.builder().id("ds").type("L3-6-java").build();
        javaPlugin.setPluginDefinition(datasourceExtraDynamic()); // even a dynamic definition must be ignored for Java plugins
        StepVerifier.create(helper.processDynamicDatasourceConfigExtra(javaPlugin)).verifyComplete();

        Datasource staticDefinition = completeDatasource(definition(Map.of("id", "static")), new JsDatasourceConnectionConfig());
        StepVerifier.create(helper.processDynamicDatasourceConfigExtra(staticDefinition)).verifyComplete();

        verify(pluginClient, never()).getPluginDynamicConfig(any());
        verify(pluginClient, never()).getDatasourcePluginDefinition(any());
        System.out.println("[JsDatasourceHelperTest] Java plugin / static definition -> no dynamic config call");
    }

    /** Catches the dynamic result stored under the wrong key (:66) or the wrong path or config being sent (:57-58). */
    @Test
    void processDynamicDatasourceConfigExtra_dynamicDefinition_storesASingleResultUnderExtra() {
        JsDatasourceConnectionConfig config = new JsDatasourceConnectionConfig();
        Datasource datasource = completeDatasource(datasourceExtraDynamic(), config);
        when(pluginClient.getPluginDynamicConfig(any())).thenReturn(Mono.just(List.of((Object) Map.of("options", "a,b"))));

        StepVerifier.create(helper.processDynamicDatasourceConfigExtra(datasource)).verifyComplete();

        ArgumentCaptor<List<GetPluginDynamicConfigRequestDTO>> request = ArgumentCaptor.forClass(List.class);
        verify(pluginClient).getPluginDynamicConfig(request.capture());
        assertThat(request.getValue()).hasSize(1);
        GetPluginDynamicConfigRequestDTO dto = request.getValue().get(0);
        assertThat(dto.getPluginName()).isEqualTo(TYPE);
        assertThat(dto.getPath()).isEqualTo("$.dataSourceConfig.extra");
        assertThat(dto.getDataSourceConfig()).isSameAs(config);
        assertThat(config.get("extra")).isEqualTo(Map.of("options", "a,b"));
        System.out.println("[JsDatasourceHelperTest] dynamic datasource config: one result stored under 'extra'");
    }

    /** Catches ambiguous or empty results being applied (:62): only exactly one result is stored. */
    @ParameterizedTest(name = "{0} results")
    @ValueSource(ints = {0, 2})
    void processDynamicDatasourceConfigExtra_notExactlyOneResult_changesNothing(int results) {
        JsDatasourceConnectionConfig config = new JsDatasourceConnectionConfig();
        Datasource datasource = completeDatasource(datasourceExtraDynamic(), config);
        when(pluginClient.getPluginDynamicConfig(any())).thenReturn(Mono.just(results == 0 ? List.of() : List.of((Object) "one", "two")));

        StepVerifier.create(helper.processDynamicDatasourceConfigExtra(datasource)).verifyComplete();

        assertThat(config).doesNotContainKey("extra");
        System.out.println("[JsDatasourceHelperTest] " + results + " results -> config unchanged");
    }

    // ---------------------------------------------------------------- processDynamicQueryConfig

    /** Catches dynamic query config calls for Java plugins (:74) and for definitions that are not dynamic (:80). */
    @Test
    void processDynamicQueryConfig_javaPluginOrNonDynamicDefinition_makesNoDynamicCall() {
        when(metaInfoService.isJavaDatasourcePlugin("L3-6-java")).thenReturn(true);
        Datasource javaPlugin = Datasource.builder().id("ds").type("L3-6-java").build();
        javaPlugin.setPluginDefinition(queryConfigDynamic()); // even a dynamic definition must be ignored for Java plugins
        StepVerifier.create(helper.processDynamicQueryConfig(javaPlugin)).verifyComplete();

        Datasource staticDefinition = completeDatasource(definition(Map.of("id", "static")), new JsDatasourceConnectionConfig());
        StepVerifier.create(helper.processDynamicQueryConfig(staticDefinition)).verifyComplete();

        verify(pluginClient, never()).getPluginDynamicConfigSafely(any());
        System.out.println("[JsDatasourceHelperTest] Java plugin / static query config -> no dynamic call");
    }

    /**
     * Catches the wrong path (:85), the unsafe client call being used (:88) and the result stored in the wrong place
     * (:92): the safe variant is used, and a single result replaces "queryConfig" in the plugin definition.
     */
    @Test
    void processDynamicQueryConfig_dynamicDefinition_usesTheSafeClientAndStoresTheResultInTheDefinition() {
        JsDatasourceConnectionConfig config = new JsDatasourceConnectionConfig();
        DatasourcePluginDefinition definition = queryConfigDynamic();
        Datasource datasource = completeDatasource(definition, config);
        Object resolved = Map.of("type", "static", "fields", List.of("a"));
        when(pluginClient.getPluginDynamicConfigSafely(any())).thenReturn(Mono.just(List.of(resolved)));

        StepVerifier.create(helper.processDynamicQueryConfig(datasource)).verifyComplete();

        ArgumentCaptor<List<GetPluginDynamicConfigRequestDTO>> request = ArgumentCaptor.forClass(List.class);
        verify(pluginClient).getPluginDynamicConfigSafely(request.capture());
        verify(pluginClient, never()).getPluginDynamicConfig(any());
        GetPluginDynamicConfigRequestDTO dto = request.getValue().get(0);
        assertThat(dto.getPluginName()).isEqualTo(TYPE);
        assertThat(dto.getPath()).isEqualTo("$.queryConfig");
        assertThat(dto.getDataSourceConfig()).isSameAs(config);
        assertThat(definition.get("queryConfig")).isSameAs(resolved);
        System.out.println("[JsDatasourceHelperTest] dynamic query config: safe client used, result stored in the definition");
    }

    /** Catches ambiguous or empty results being applied to the definition (:90). */
    @ParameterizedTest(name = "{0} results")
    @ValueSource(ints = {0, 2})
    void processDynamicQueryConfig_notExactlyOneResult_leavesTheDefinitionUnchanged(int results) {
        DatasourcePluginDefinition definition = queryConfigDynamic();
        Object before = definition.get("queryConfig");
        Datasource datasource = completeDatasource(definition, new JsDatasourceConnectionConfig());
        when(pluginClient.getPluginDynamicConfigSafely(any())).thenReturn(Mono.just(results == 0 ? List.of() : List.of((Object) "one", "two")));

        StepVerifier.create(helper.processDynamicQueryConfig(datasource)).verifyComplete();

        assertThat(definition.get("queryConfig")).isSameAs(before);
        System.out.println("[JsDatasourceHelperTest] " + results + " results -> definition unchanged");
    }
}
