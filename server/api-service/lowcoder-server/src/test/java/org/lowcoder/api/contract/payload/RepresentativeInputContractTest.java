package org.lowcoder.api.contract.payload;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.lowcoder.api.authentication.dto.APIKeyRequest;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.JavaValueWalker;
import org.lowcoder.sdk.contract.RepresentativeInput;
import org.lowcoder.sdk.util.JsonUtils;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The parse direction of docs/API_PAYLOAD_TEST_PLAN.md §4.6 (task T1.3): the hand-written
 * {@code json-contract/dynamic/representative.input.json} is read by the production mapper into each declared dynamic
 * shape of the API, and for each {@link Target} the test pins
 * <ul>
 *   <li>the Java class of every value, by JSON pointer, and the iteration order of every object's keys, in
 *       {@code dynamic/representative.read.json};</li>
 *   <li>the re-serialized text, canonically against {@code dynamic/representative.output.json}, the same for every
 *       target (for {@link Target#LIST} inside the one-element array it reads).</li>
 * </ul>
 *
 * <p>{@link Target#LIST} reads the input wrapped in an array, {@code [<input>]}, because the input is an object;
 * its nested arrays are read by the same untyped deserializer as a top-level {@code List<Object>} element. Key order
 * is pinned separately because the canonical comparison ignores it (§1.2). Limits: the fixtures pin today's classes;
 * which of them a consumer depends on is the business of the consumer's tests (WP7–WP9).
 */
class RepresentativeInputContractTest {

    static final String READ_FIXTURE = "dynamic/representative.read.json";
    static final String OUTPUT_FIXTURE = PayloadSamples.REPRESENTATIVE_OUTPUT;

    private static final ObjectMapper MAPPER = JsonUtils.getObjectMapper();
    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    /** The declared shapes §4.6 reads the representative input into. */
    enum Target {
        MAP(new TypeReference<Map<String, Object>>() {}),
        LIST(new TypeReference<List<Object>>() {}),
        OBJECT(new TypeReference<Object>() {}),
        JSON_NODE(new TypeReference<JsonNode>() {}),
        ORGANIZATION_COMMON_SETTINGS(new TypeReference<OrganizationCommonSettings>() {}),
        AUTH_CONFIG_REQUEST(new TypeReference<AuthConfigRequest>() {}),
        API_KEY_REQUEST(new TypeReference<APIKeyRequest>() {});

        final JavaType type;

        Target(TypeReference<?> reference) {
            this.type = MAPPER.getTypeFactory().constructType(reference);
        }

        String input() {
            String text = PayloadSamples.representativeInputText();
            return this == LIST ? "[" + text + "]" : text;
        }

        Object read() throws IOException {
            return MAPPER.readValue(input(), type);
        }
    }

    @Test
    void classesAndKeyOrderAsPinned() throws IOException {
        Map<String, Map<String, Object>> read = new LinkedHashMap<>();
        for (Target target : Target.values()) {
            Object value = target.read();
            Map<String, Object> pinned = JavaValueWalker.shape(value);
            Map<?, ?> classes = (Map<?, ?>) pinned.get(JavaValueWalker.CLASSES_KEY);
            Map<?, ?> keyOrder = (Map<?, ?>) pinned.get(JavaValueWalker.KEY_ORDER_KEY);
            System.out.println("[RepresentativeInputContractTest] " + target + " (" + target.type.toCanonical() + "): "
                    + classes.size() + " values, root " + classes.get(JavaValueWalker.ROOT_POINTER) + ", root keys "
                    + keyOrder.get(JavaValueWalker.ROOT_POINTER));
            read.put(target.name(), pinned);
        }
        GOLDEN.assertJson(READ_FIXTURE, MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(read));
    }

    @ParameterizedTest(name = "re-serialized {0}")
    @EnumSource(Target.class)
    void reSerializedTextAsPinned(Target target) throws IOException {
        String json = MAPPER.writeValueAsString(target.read());
        System.out.println("[RepresentativeInputContractTest] " + target + " -> " + json);
        if (target == Target.LIST) {
            CanonicalJson.assertEquivalent("[" + GOLDEN.read(OUTPUT_FIXTURE) + "]", json);
        } else {
            GOLDEN.assertJson(OUTPUT_FIXTURE, json);
        }
    }

    @Test
    void theRepresentativeOfASampleIsANewEqualValue() throws IOException {
        Object first = PayloadSamples.representative(Target.OBJECT.type);
        Object second = PayloadSamples.representative(Target.OBJECT.type);
        assertThat(first).isNotSameAs(second);
        CanonicalJson.assertSameJava(first, second);
        assertThat(PayloadSamples.representative(Target.JSON_NODE.type)).isEqualTo(Target.JSON_NODE.read());
    }

    /**
     * The other modules read the same input from the {@code lowcoder-sdk} test-jar ({@link RepresentativeInput}); a
     * copy that drifts from this fixture would test them with a different input.
     */
    @Test
    void theSdkCopyIsThisInputByteForByte() {
        String input = PayloadSamples.representativeInputText();
        System.out.println("[RepresentativeInputContractTest] " + PayloadSamples.REPRESENTATIVE_INPUT + ": " + input.length()
                + " characters; lowcoder-sdk " + RepresentativeInput.RESOURCE + ": " + RepresentativeInput.TEXT.length());
        assertThat(RepresentativeInput.TEXT).isEqualTo(input);
    }
}
