package org.lowcoder.domain.datasource.repository;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceDO;
import org.lowcoder.domain.datasource.service.JsDatasourceHelper;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ConfigBinding;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.JavaValueWalker;
import org.lowcoder.sdk.contract.QueryResults;
import org.lowcoder.sdk.contract.RepresentativeInput;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.lowcoder.sdk.plugin.mysql.MysqlDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Group {@code persistence-roundtrip} (docs/API_PAYLOAD_TEST_PLAN.md §4.10, task T9.4): before a data source is stored,
 * {@code DatasourceRepository.save} encrypts its connection config and converts it into the stored {@code Map} as
 * {@code fromJsonMap(toJson(encryptedConfig))}. The real repository saves one data source per config of
 * {@link #CONFIGS}, with mocked collaborators, and the {@code Map} handed to the store is pinned: the class of every
 * value ({@link JavaValueWalker}) and the text the production mapper writes for it, in {@value #REPORT}. The SDK config
 * classes are bound by their {@code buildFrom} from the forms of {@value #INPUT}, copies of forms of their T8.1
 * {@code config-binding} input fixtures (the test-jar carries only the contract helpers, not those fixtures); the JS
 * plugin config holds the §4.6 representative input and a password parameter.
 *
 * <p>Key order: the stored map of a bean config (the SDK classes) has its members in the order the production mapper
 * writes the bean, which the JSON contract leaves out (plan §1.2) and which, for getter-only properties such as
 * {@code RestApiDatasourceConfig#getAuthType} and {@code #isOauth2InheritFromLogin}, the JVM does not fix (plan §9
 * O18): the pinned key order of these two flipped between two full builds. So their shape keeps the classes but not
 * the key order, and their written text is compared with member order only reported ({@code CanonicalJson}). The JS
 * plugin config is a map, whose stored key order is its own and is pinned.
 *
 * <p>Limits: encryption is a stand-in that marks the text it is given ({@value #ENCRYPTED_PREFIX}), since the real
 * cipher is random; the plugin configs of the plugin modules are not on this module's classpath, and only the stored map
 * is pinned, not its reading back ({@code DatasourceMetaInfoService.resolveDetailConfig}).
 */
class DatasourcePersistenceContractTest {

    static final String REPORT = "persistence-roundtrip/DatasourceRepository.storedConfigs.json";
    static final String INPUT = "persistence-roundtrip/DatasourceRepository.configs.input.json";
    static final String ENCRYPTED_PREFIX = "encrypted:";
    static final String SHAPE_KEY = "shape";
    static final String WRITTEN_KEY = "written";
    static final String CONFIG_CLASS_KEY = "configClass";
    static final String JS_PLUGIN_TYPE = "contractJsPlugin";
    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final Map<String, Supplier<DatasourceConnectionConfig>> CONFIGS = configs();

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @BoundarySites({
            "lowcoder-domain/src/main/java/org/lowcoder/domain/datasource/repository/DatasourceRepository.java#DatasourceRepository.encryptDataAndConvertToDataObject#toJson#1",
            "lowcoder-domain/src/main/java/org/lowcoder/domain/datasource/repository/DatasourceRepository.java#DatasourceRepository.encryptDataAndConvertToDataObject#fromJsonMap#1"})
    @Test
    void storedConfigsAsPinned() {
        Map<String, Object> report = new LinkedHashMap<>();
        CONFIGS.forEach((name, config) -> report.put(name, stored(config.get())));
        String actual = ConfigBinding.write(report);
        System.out.println("[DatasourcePersistenceContractTest] " + CONFIGS.size() + " configs\n" + actual);
        GOLDEN.assertJson(REPORT, actual);
    }

    /** The detail config map {@code DatasourceRepository.save} hands to the store for {@code config}, or the error. */
    private static Map<String, Object> stored(DatasourceConnectionConfig config) {
        DatasourceDORepository store = mock(DatasourceDORepository.class);
        when(store.save(any(DatasourceDO.class))).thenReturn(Mono.empty());
        JsDatasourceHelper jsDatasourceHelper = mock(JsDatasourceHelper.class);
        when(jsDatasourceHelper.fillPluginDefinition(any(Datasource.class))).thenReturn(Mono.empty());
        EncryptionService encryptionService = mock(EncryptionService.class);
        when(encryptionService.encryptString(any())).thenAnswer(call -> ENCRYPTED_PREFIX + call.getArgument(0));
        DatasourceRepository repository = new DatasourceRepository();
        ReflectionTestUtils.setField(repository, "repository", store);
        ReflectionTestUtils.setField(repository, "jsDatasourceHelper", jsDatasourceHelper);
        ReflectionTestUtils.setField(repository, "encryptionService", encryptionService);

        Datasource datasource = new Datasource();
        datasource.setName("contract");
        datasource.setDetailConfig(config);
        Map<String, Object> outcome = new LinkedHashMap<>();
        outcome.put(CONFIG_CLASS_KEY, config.getClass().getName());
        try {
            repository.save(datasource).block(TIMEOUT);
            ArgumentCaptor<DatasourceDO> saved = ArgumentCaptor.forClass(DatasourceDO.class);
            verify(store).save(saved.capture());
            Map<String, Object> detailConfig = saved.getValue().getDetailConfig();
            Map<String, Object> shape = JavaValueWalker.shape(detailConfig);
            if (!(config instanceof Map)) {
                // a bean config's stored map has the members in the mapper's write order (see the class comment)
                shape.remove(JavaValueWalker.KEY_ORDER_KEY);
            }
            outcome.put(SHAPE_KEY, shape);
            outcome.put(WRITTEN_KEY, QueryResults.written(detailConfig));
        } catch (RuntimeException e) {
            outcome.put(QueryResults.ERROR_KEY, ConfigBinding.errorText(e));
        }
        return outcome;
    }

    private static Map<String, Supplier<DatasourceConnectionConfig>> configs() {
        Map<String, Supplier<DatasourceConnectionConfig>> configs = new LinkedHashMap<>();
        configs.put("mysql", () -> MysqlDatasourceConfig.buildFrom(form("mysql")));
        configs.put("restApiBasicAuth", () -> RestApiDatasourceConfig.buildFrom(form("restApiBasicAuth")));
        configs.put("restApiBearerToken", () -> RestApiDatasourceConfig.buildFrom(form("restApiBearerToken")));
        configs.put("graphQLBasicAuth", () -> GraphQLDatasourceConfig.buildFrom(form("graphQLBasicAuth")));
        configs.put("jsPlugin", DatasourcePersistenceContractTest::jsConfig);
        return configs;
    }

    /** A JS plugin config: a password parameter of its definition, a dynamic password, and the §4.6 representative input. */
    private static DatasourceConnectionConfig jsConfig() {
        JsDatasourceConnectionConfig config = new JsDatasourceConnectionConfig();
        config.put("apiKey", "s3crét \"quoted\"");
        config.put("limit", 3_000_000_001L);
        config.put("ratio", new BigDecimal("1.50"));
        config.put("representative", RepresentativeInput.map());
        Map<String, Object> dynamicPassword = new LinkedHashMap<>();
        dynamicPassword.put("key", "token");
        dynamicPassword.put("type", "password");
        config.put("dynamicParamsDef", List.of(dynamicPassword));
        config.put("dynamicParamsConfig", new LinkedHashMap<>(Map.of("token", "t0ken")));
        config.setType(JS_PLUGIN_TYPE);
        config.setDefinition(Map.of("dataSourceConfig", Map.of("params", List.of(Map.of("key", "apiKey", "type", "password")))));
        return config;
    }

    /** One input form of {@value #INPUT}, read by the production mapper. */
    private static Map<String, Object> form(String name) {
        return ConfigBinding.forms(GOLDEN.read(INPUT)).get(name);
    }
}
