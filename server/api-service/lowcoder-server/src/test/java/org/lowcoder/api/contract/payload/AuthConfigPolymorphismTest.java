package org.lowcoder.api.contract.payload;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.InvalidTypeIdException;
import com.fasterxml.jackson.databind.introspect.AnnotatedClass;
import com.fasterxml.jackson.databind.jsontype.NamedType;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.util.JsonUtils;

import java.io.IOException;
import java.util.Map;
import java.util.TreeMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Polymorphism of {@link AbstractAuthConfig} (docs/API_PAYLOAD_TEST_PLAN.md §4.4), which is
 * {@code @JsonTypeInfo(use = NAME, property = "authType", visible = true)} with its subtypes registered by name in
 * {@code JsonUtils}:
 *
 * <ul>
 *   <li>the registered ids and their classes are pinned in {@value #IDS_FIXTURE};</li>
 *   <li>every id resolves: the D1 fixture of its class, with {@code authType} set to the id, binds to that class
 *       and keeps the id as {@code authType} ({@code visible = true});</li>
 *   <li>an unknown id and a missing id fail with {@link InvalidTypeIdException};</li>
 *   <li>a bare {@code new ObjectMapper()} resolves none of the ids (E2).</li>
 * </ul>
 *
 * <p>The written type ids, including the duplicate {@code authType} key with the first registered id of a class
 * (O3), are pinned by the S1 goldens of each class ({@code ResponsePayloadGoldensTest}). Limits: the SDK's
 * {@code AuthConfig} and {@code SslConfig} hierarchies are pinned by {@code PluginConfigPolymorphismTest} in
 * {@code lowcoder-sdk} (task T7.1).
 */
class AuthConfigPolymorphismTest {

    static final String IDS_FIXTURE = "types/org.lowcoder.sdk.auth.AbstractAuthConfig.ids.json";
    static final String TYPE_PROPERTY = "authType";
    static final String UNKNOWN_ID = "AUTH_CONFIG_POLYMORPHISM_UNKNOWN";
    static final String D1 = "D1";

    private static final ObjectMapper MAPPER = JsonUtils.getObjectMapper();
    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @Test
    void registeredIdsAsPinned() throws IOException {
        Map<String, String> ids = registeredIds();
        System.out.println("[AuthConfigPolymorphismTest] registered ids " + ids);
        GOLDEN.assertJson(IDS_FIXTURE, MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(ids));
    }

    @Test
    void everyIdResolvesToItsClass() throws IOException {
        for (Map.Entry<String, String> id : registeredIds().entrySet()) {
            AbstractAuthConfig config = MAPPER.readValue(withId(id.getValue(), id.getKey()), AbstractAuthConfig.class);
            System.out.println("[AuthConfigPolymorphismTest] " + id.getKey() + " -> " + config.getClass().getName()
                    + ", authType " + config.getAuthType());
            assertThat(config.getClass().getName()).isEqualTo(id.getValue());
            assertThat(config.getAuthType()).isEqualTo(id.getKey());
        }
    }

    @Test
    void unknownAndMissingIdsFail() throws IOException {
        String anyFixture = withId(registeredIds().values().iterator().next(), UNKNOWN_ID);
        assertThatThrownBy(() -> MAPPER.readValue(anyFixture, AbstractAuthConfig.class)).isInstanceOf(InvalidTypeIdException.class)
                .satisfies(e -> System.out.println("[AuthConfigPolymorphismTest] unknown id: " + ((InvalidTypeIdException) e).getOriginalMessage()));
        ObjectNode missing = (ObjectNode) PayloadAssertions.FIXTURE_EDITOR.readTree(anyFixture);
        missing.remove(TYPE_PROPERTY);
        String withoutId = PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(missing);
        assertThatThrownBy(() -> MAPPER.readValue(withoutId, AbstractAuthConfig.class)).isInstanceOf(InvalidTypeIdException.class)
                .satisfies(e -> System.out.println("[AuthConfigPolymorphismTest] missing id: " + ((InvalidTypeIdException) e).getOriginalMessage()));
    }

    @Test
    void aBareMapperResolvesNoId() throws IOException {
        ObjectMapper bare = new ObjectMapper();
        for (Map.Entry<String, String> id : registeredIds().entrySet()) {
            String input = withId(id.getValue(), id.getKey());
            assertThatThrownBy(() -> bare.readValue(input, AbstractAuthConfig.class)).isInstanceOf(InvalidTypeIdException.class)
                    .satisfies(e -> System.out.println("[AuthConfigPolymorphismTest] E2 " + id.getKey() + ": "
                            + ((InvalidTypeIdException) e).getOriginalMessage()));
        }
    }

    /** Registered id → class name, as the production mapper resolves them for {@link AbstractAuthConfig}. */
    static Map<String, String> registeredIds() {
        AnnotatedClass base = MAPPER.getDeserializationConfig().introspectClassAnnotations(AbstractAuthConfig.class).getClassInfo();
        Map<String, String> ids = new TreeMap<>();
        for (NamedType subtype : MAPPER.getSubtypeResolver().collectAndResolveSubtypesByTypeId(MAPPER.getDeserializationConfig(), base)) {
            if (subtype.hasName()) {
                ids.put(subtype.getName(), subtype.getType().getName());
            }
        }
        return ids;
    }

    /** The D1 fixture of {@code className} with {@value #TYPE_PROPERTY} set to {@code id}. */
    private static String withId(String className, String id) throws IOException {
        ObjectNode input = (ObjectNode) PayloadAssertions.FIXTURE_EDITOR.readTree(GOLDEN.read("types/" + className + "." + D1 + ".json"));
        input.put(TYPE_PROPERTY, id);
        return PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(input);
    }
}
