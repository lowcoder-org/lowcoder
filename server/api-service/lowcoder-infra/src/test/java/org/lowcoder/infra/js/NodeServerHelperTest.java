package org.lowcoder.infra.js;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.CommonConfigHelper;
import org.lowcoder.sdk.config.dynamic.ConfigCenterForTest;

class NodeServerHelperTest {

    private static final String HOST = "http://node-host:6060";
    private static final String EXPECTED_BASE = HOST + "/node-service/api/";

    private static NodeServerHelper helper(String host, Map<String, Object> overrides) throws ReflectiveOperationException {
        CommonConfig config = new CommonConfig();
        config.getJsExecutor().setHost(host);
        NodeServerHelper helper = new NodeServerHelper();
        Field field = NodeServerHelper.class.getDeclaredField("commonConfigHelper");
        field.setAccessible(true);
        field.set(helper, new CommonConfigHelper(config, new ConfigCenterForTest(overrides)));
        return helper;
    }

    @ParameterizedTest(name = "{0} -> path {1}")
    @CsvSource({"plain, plain", "/leading, leading", "trailing/, trailing", "/both/, both", "a/b, a/b", "//double, /double"})
    void createUriTrimsOneLeadingAndOneTrailingSlash(String path, String expectedPath) throws ReflectiveOperationException {
        String uri = helper(HOST, Map.of()).createUri(path).toString();

        System.out.println("[NodeServerHelperTest] " + path + " -> " + uri);
        assertThat(uri).isEqualTo(EXPECTED_BASE + expectedPath);
    }

    @Test
    void createUriUsesTheConfiguredHostAndAnOverrideOfIt() throws ReflectiveOperationException {
        assertThat(helper(HOST, Map.of()).createUri("x").toString()).isEqualTo(HOST + "/node-service/api/x");
        assertThat(helper(HOST, Map.of("js-executor.host", "https://other:1")).createUri("x").toString())
                .isEqualTo("https://other:1/node-service/api/x");
    }
}
