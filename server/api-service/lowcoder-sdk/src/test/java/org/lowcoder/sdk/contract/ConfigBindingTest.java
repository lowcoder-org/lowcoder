package org.lowcoder.sdk.contract;

import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.util.RawValue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.lowcoder.sdk.config.JsonViews;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.util.JsonUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.function.Function;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Self-test of {@link ConfigBinding}: views, errors, the unknown-property probe, and a golden that no longer matches
 * the bound state failing.
 */
public class ConfigBindingTest {

    static final String INPUT = "config-binding/Sample.input.json";
    static final String REPORT = "config-binding/Sample.json";
    static final String ENTRY = "fromJson";
    static final String FORMS = "{\"canonical\":{\"host\":\"h\",\"port\":5432,\"secret\":\"s\"},\"empty\":{}}";

    /** A config with an {@code Internal}-only secret, bound as the plugins bind theirs. */
    public static class Sample {
        public String host;
        public Long port;
        @JsonView(JsonViews.Internal.class)
        public String secret;
    }

    @TempDir
    Path folder;

    static final Function<Map<String, Object>, ?> FROM_JSON = map -> {
        if (map.isEmpty()) {
            throw new PluginException(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, "DATASOURCE_CONFIG_ERROR");
        }
        return JsonUtils.fromJson(JsonUtils.toJson(map), Sample.class);
    };

    @Test
    @SuppressWarnings("unchecked")
    public void reportPinsStateViewsErrorsAndUnknownProperty() {
        Map<String, Object> report = ConfigBinding.report(ConfigBinding.forms(FORMS), Map.of(ENTRY, FROM_JSON));
        System.out.println("[ConfigBindingTest] " + ConfigBinding.write(report));
        Map<String, Object> results = (Map<String, Object>) report.get(ENTRY);
        Map<String, Object> canonical = (Map<String, Object>) results.get("canonical");
        assertThat(canonical.get(ConfigBinding.CLASS_KEY)).isEqualTo(Sample.class.getName());
        assertThat(((Map<String, String>) canonical.get(ConfigBinding.CLASSES_KEY))).containsEntry("/port", Long.class.getName());
        assertThat(((RawValue) canonical.get(ConfigBinding.PUBLIC_KEY)).rawValue()).isEqualTo("{\"host\":\"h\",\"port\":5432}");
        assertThat(((RawValue) canonical.get(ConfigBinding.INTERNAL_KEY)).rawValue()).isEqualTo("{\"host\":\"h\",\"port\":5432,\"secret\":\"s\"}");
        assertThat(results.get("empty")).isEqualTo(Map.of(ConfigBinding.ERROR_KEY,
                PluginException.class.getName() + ": DATASOURCE_ARGUMENT_ERROR DATASOURCE_CONFIG_ERROR"));
        assertThat(results.get(ConfigBinding.UNKNOWN_PROPERTY_KEY)).isEqualTo(ConfigBinding.UNKNOWN_PROPERTY_IGNORED + "canonical");
    }

    /** An unknown property that changes the result is reported with that result, not as ignored. */
    @Test
    @SuppressWarnings("unchecked")
    public void unknownPropertyThatChangesTheResultIsReported() {
        Function<Map<String, Object>, ?> strict = map -> {
            if (map.containsKey(ConfigBinding.UNKNOWN_PROPERTY)) {
                throw new IllegalArgumentException("unknown property");
            }
            return FROM_JSON.apply(map);
        };
        Map<String, Object> report = ConfigBinding.report(ConfigBinding.forms(FORMS), Map.of(ENTRY, strict));
        Object unknown = ((Map<String, Object>) report.get(ENTRY)).get(ConfigBinding.UNKNOWN_PROPERTY_KEY);
        System.out.println("[ConfigBindingTest] strict entry point: " + unknown);
        assertThat(unknown).isEqualTo(Map.of(ConfigBinding.ERROR_KEY, IllegalArgumentException.class.getName() + ": unknown property"));
    }

    /** The golden of one binding no longer matches when the binding changes the Java class of a value. */
    @Test
    public void bindingChangeFailsTheGolden() throws IOException {
        Path root = Files.createDirectory(folder.resolve("fixtures"));
        write(root.resolve(INPUT), FORMS);
        GoldenJson golden = new GoldenJson(root, null, false);
        String pinned = ConfigBinding.write(ConfigBinding.report(ConfigBinding.forms(FORMS), Map.of(ENTRY, FROM_JSON)));
        write(root.resolve(REPORT), pinned);
        ConfigBinding.assertBinding(golden, INPUT, REPORT, Map.of(ENTRY, FROM_JSON));

        Function<Map<String, Object>, ?> intPort = map -> {
            Sample sample = (Sample) FROM_JSON.apply(map);
            return Map.of("host", sample.host, "port", sample.port == null ? 0 : sample.port.intValue());
        };
        assertThatThrownBy(() -> ConfigBinding.assertBinding(golden, INPUT, REPORT, Map.of(ENTRY, intPort)))
                .isInstanceOf(AssertionError.class).hasMessageContaining("$.fromJson.canonical.class");
    }

    @Test
    public void inputMustBeAnObjectOfForms() {
        assertThatThrownBy(() -> ConfigBinding.forms("[1]")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> ConfigBinding.report(Map.of(), Map.of(ENTRY, FROM_JSON))).isInstanceOf(IllegalArgumentException.class);
    }

    private static void write(Path file, String content) throws IOException {
        Files.createDirectories(file.getParent());
        Files.writeString(file, content, StandardCharsets.UTF_8);
    }
}
