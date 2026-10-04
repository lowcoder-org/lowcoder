package org.lowcoder.sdk.contract;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.introspect.AnnotatedClass;
import com.fasterxml.jackson.databind.jsontype.NamedType;
import org.junit.Test;
import org.lowcoder.sdk.config.JsonViews;
import org.lowcoder.sdk.plugin.common.ssl.SslConfig;
import org.lowcoder.sdk.plugin.restapi.auth.AuthConfig;
import org.lowcoder.sdk.util.JsonUtils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Polymorphism of the SDK's datasource config hierarchies {@link AuthConfig} ({@code @JsonTypeInfo} property
 * {@code type}) and {@link SslConfig} (property {@code sslCertVerificationType}), docs/API_PAYLOAD_TEST_PLAN.md §4.4,
 * task T7.1. Both declare their subtypes with {@code @JsonSubTypes}, {@code visible = true} and a {@code defaultImpl}.
 *
 * <p>For each base, the inputs of {@code polymorphism/<Base>.inputs.json} (one per registered id, plus an enum constant
 * that is no registered id, an unknown id and a missing id) are read with the production mapper as the base type, and
 * {@code polymorphism/<Base>.json} pins per input: the bound class or the exception class; what the production mapper
 * writes for the bound value as the base type with no view and under {@code Public} and {@code Internal}, the type-id
 * occurrences included (§4.4: the id and the visible property are two {@code type} keys, as O3 shows for
 * {@code AbstractAuthConfig}), and with the {@code SECRET-} values under {@code Public} checked absent (§4.5); the
 * written output read back and written again (a client sending a config back, O62); and the
 * class a bare {@code new ObjectMapper()} binds, since annotation-registered ids, unlike {@code JsonUtils}' registered
 * auth ids (E2), need no mapper configuration. {@link #registeredIdsAsPinned} pins the id → class registration.
 *
 * <p>Limits: the values are written as the base type, as the configs nested in a datasource config are; what a
 * datasource config itself writes and binds is {@code config-binding}'s (WP8).
 */
public class PluginConfigPolymorphismTest {

    static final String DIRECTORY = "polymorphism/";
    static final String INPUTS_SUFFIX = ".inputs.json";
    static final String OUTCOMES_SUFFIX = ".json";
    static final String SECRET_MARKER = "SECRET-";
    static final String CLASS = "class";
    static final String NO_VIEW = "noView";
    static final String PUBLIC = "Public";
    static final String INTERNAL = "Internal";
    static final String BARE_MAPPER = "bareMapperClass";
    static final String READ_BACK = "readBack";
    static final String FAILS_WITH = "failsWith ";

    private static final ObjectMapper MAPPER = JsonUtils.getObjectMapper();
    private static final ObjectMapper BARE = new ObjectMapper();
    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @Test
    public void authConfigCasesAsPinned() throws IOException {
        assertCases(AuthConfig.class);
    }

    @Test
    public void sslConfigCasesAsPinned() throws IOException {
        assertCases(SslConfig.class);
    }

    @Test
    public void registeredIdsAsPinned() throws IOException {
        Map<String, Map<String, String>> ids = new TreeMap<>();
        for (Class<?> base : List.of(AuthConfig.class, SslConfig.class)) {
            AnnotatedClass annotated = MAPPER.getDeserializationConfig().introspectClassAnnotations(base).getClassInfo();
            Map<String, String> byId = new TreeMap<>();
            for (NamedType subtype : MAPPER.getSubtypeResolver().collectAndResolveSubtypesByTypeId(MAPPER.getDeserializationConfig(), annotated)) {
                if (subtype.hasName()) {
                    byId.put(subtype.getName(), subtype.getType().getName());
                }
            }
            ids.put(base.getName(), byId);
        }
        System.out.println("[PluginConfigPolymorphismTest] registered ids " + ids);
        GOLDEN.assertJson(DIRECTORY + "registered-ids.json", MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(ids));
    }

    /**
     * Reads every input of {@code base}, and compares the outcomes, written as JSON text so that the written outputs
     * keep their duplicate keys, with {@code polymorphism/<Base>.json}.
     */
    private static void assertCases(Class<?> base) throws IOException {
        JsonNode inputs = BARE.readTree(GOLDEN.read(DIRECTORY + base.getSimpleName() + INPUTS_SUFFIX));
        List<String> cases = new ArrayList<>();
        Iterator<Map.Entry<String, JsonNode>> entries = inputs.fields();
        while (entries.hasNext()) {
            Map.Entry<String, JsonNode> entry = entries.next();
            String input = entry.getValue().toString();
            StringBuilder outcome = new StringBuilder("{").append(quote(BARE_MAPPER)).append(':').append(quote(boundClass(BARE, input, base)));
            Object bound;
            try {
                bound = MAPPER.readValue(input, base);
            } catch (IOException e) {
                outcome.append(',').append(quote(CLASS)).append(':').append(quote(FAILS_WITH + e.getClass().getName())).append('}');
                cases.add(quote(entry.getKey()) + ":" + outcome);
                System.out.println("[PluginConfigPolymorphismTest] " + base.getSimpleName() + " " + entry.getKey() + ": " + outcome);
                continue;
            }
            ObjectWriter writer = MAPPER.writerFor(base);
            String publicOutput = writer.withView(JsonViews.Public.class).writeValueAsString(bound);
            assertThat(publicOutput).as("§4.5: Public output of " + base.getSimpleName() + " " + entry.getKey()).doesNotContain(SECRET_MARKER);
            String output = writer.writeValueAsString(bound);
            outcome.append(',').append(quote(CLASS)).append(':').append(quote(bound.getClass().getName()))
                    .append(',').append(quote(NO_VIEW)).append(':').append(output)
                    .append(',').append(quote(READ_BACK)).append(':').append(readBack(writer, output, base))
                    .append(',').append(quote(PUBLIC)).append(':').append(publicOutput)
                    .append(',').append(quote(INTERNAL)).append(':').append(writer.withView(JsonViews.Internal.class).writeValueAsString(bound))
                    .append('}');
            System.out.println("[PluginConfigPolymorphismTest] " + base.getSimpleName() + " " + entry.getKey() + ": " + outcome);
            cases.add(quote(entry.getKey()) + ":" + outcome);
        }
        GOLDEN.assertJson(DIRECTORY + base.getSimpleName() + OUTCOMES_SUFFIX, "{" + String.join(",", cases) + "}");
    }

    /** {@code output} read again as {@code base} and written again: what a client that sends the output back gets. */
    private static String readBack(ObjectWriter writer, String output, Class<?> base) {
        try {
            Object again = MAPPER.readValue(output, base);
            return "{" + quote(CLASS) + ":" + quote(again.getClass().getName()) + "," + quote(NO_VIEW) + ":" + writer.writeValueAsString(again) + "}";
        } catch (IOException e) {
            return quote(FAILS_WITH + e.getClass().getName());
        }
    }

    private static String boundClass(ObjectMapper mapper, String input, Class<?> base) {
        try {
            return mapper.readValue(input, base).getClass().getName();
        } catch (IOException e) {
            return FAILS_WITH + e.getClass().getName();
        }
    }

    private static String quote(String text) {
        try {
            return BARE.writeValueAsString(text);
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }
}
