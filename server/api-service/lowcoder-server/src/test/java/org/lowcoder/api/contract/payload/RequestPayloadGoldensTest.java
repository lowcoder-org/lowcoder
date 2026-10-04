package org.lowcoder.api.contract.payload;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.BeanDescription;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.introspect.BeanPropertyDefinition;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.contract.support.PayloadSamples.Sample;
import org.lowcoder.api.contract.support.PayloadTypeWalker;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Closure;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Direction;
import org.lowcoder.api.contract.support.PayloadTypeWalker.PayloadType;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Property;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.util.JsonUtils;

import java.io.IOException;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Layer A request goldens (docs/API_PAYLOAD_TEST_PLAN.md §4.2) for every request-direction sample of
 * {@link PayloadSamples}, decoded with the production mapper:
 *
 * <ul>
 *   <li><b>D1:</b> {@code types/<type>.D1.json} binds to the sample, compared by
 *       {@link PayloadAssertions#assertBindsTo}. The fixture's top-level names must equal the walker's
 *       {@code deserializedProperties} (the gate's rule 4, here for every sample at once); a map type has no
 *       properties, its keys are data.</li>
 *   <li><b>D2:</b> where the type itself ignores input (its {@code @JsonIgnoreProperties}, or {@code @JsonIgnore}d
 *       properties), the D1 input plus an unknown property and a value for each ignored name binds to the same
 *       sample. The global {@code FAIL_ON_UNKNOWN_PROPERTIES} is pinned by the codec guard (§5.4).</li>
 *   <li><b>D3:</b> for the properties where null and absent can bind differently (creator and record parameters,
 *       primitives, {@code @Builder.Default}), the bound value with the property removed and with it set to
 *       {@code null}, pinned in {@code types/<type>.D3.json} as class and value.</li>
 * </ul>
 *
 * <p>Inputs for D2 and D3 are edited from the D1 fixture with a tree mapper that keeps decimal lexemes
 * ({@link PayloadAssertions#FIXTURE_EDITOR}), never with the production mapper. Limits: a property bound only through
 * a custom deserializer has no walker entry and is compared only through D1; the limits of the comparison itself are
 * {@link PayloadAssertions#assertBindsTo}'s.
 */
class RequestPayloadGoldensTest {

    static final String D1 = "D1";
    static final String D3 = "D3";
    static final String UNKNOWN_PROPERTY = "D2.unknownProperty";
    static final String IGNORED_VALUE = "D2.ignored";
    static final String ABSENT = "absent";
    static final String NULL = "null";
    static final String CLASS_KEY = "class";
    static final String VALUE_KEY = "value";
    static final String BUILDER_DEFAULT_PREFIX = "$default$";

    private static final ObjectMapper MAPPER = JsonUtils.getObjectMapper();
    private static final GoldenJson GOLDEN = GoldenJson.forModule();
    private static Closure closure;

    @BeforeAll
    static void walk() {
        closure = PayloadTypeWalker.walkCompiledApi();
    }

    static Stream<Sample> requestSamples() {
        return PayloadSamples.all().stream().filter(sample -> sample.directions().contains(Direction.REQUEST));
    }

    @Test
    void samplesServeTheWalkersDirections() {
        for (Sample sample : PayloadSamples.all()) {
            PayloadType walked = closure.types().get(sample.name());
            System.out.println("[RequestPayloadGoldensTest] sample " + sample.name() + " " + sample.directions()
                    + (walked == null ? " (extra root)" : " walker " + walked.directions()));
            if (walked != null) {
                assertThat(sample.directions()).as(sample.name()).isEqualTo(walked.directions());
            }
        }
    }

    @ParameterizedTest(name = "D1 {0}")
    @MethodSource("requestSamples")
    void d1BindsTheFixtureToTheSample(Sample sample) throws IOException {
        String fixture = GOLDEN.read(sample.fixture(D1));
        Object actual = MAPPER.readValue(fixture, sample.type());
        System.out.println("[RequestPayloadGoldensTest] D1 " + sample.name() + " bound to " + actual);
        PayloadAssertions.assertBindsTo(sample, actual);
        if (!sample.type().isMapLikeType()) {
            Set<String> expectedNames = deserializedProperties(sample.type()).stream().map(Property::name)
                    .collect(Collectors.toCollection(TreeSet::new));
            Set<String> fixtureNames = new TreeSet<>();
            PayloadAssertions.FIXTURE_EDITOR.readTree(fixture).fieldNames().forEachRemaining(fixtureNames::add);
            assertThat(fixtureNames).as("D1 names of " + sample.name()).isEqualTo(expectedNames);
        }
    }

    @ParameterizedTest(name = "D2 {0}")
    @MethodSource("requestSamples")
    void d2IgnoredInputBindsToTheSameSample(Sample sample) throws IOException {
        BeanDescription description = MAPPER.getDeserializationConfig().introspect(sample.type());
        JsonIgnoreProperties.Value ignorals = MAPPER.getDeserializationConfig()
                .getDefaultPropertyIgnorals(sample.type().getRawClass(), description.getClassInfo());
        // Jackson collects properties, and with them the ignored names, lazily
        description.findProperties();
        Set<String> ignored = new TreeSet<>(description.getIgnoredPropertyNames());
        ignored.addAll(ignorals.findIgnoredForDeserialization());
        boolean ignoreUnknown = ignorals.getIgnoreUnknown();
        System.out.println("[RequestPayloadGoldensTest] D2 " + sample.name() + ": ignoreUnknown=" + ignoreUnknown + ", ignored=" + ignored);
        if (!ignoreUnknown && ignored.isEmpty()) {
            System.out.println("[RequestPayloadGoldensTest] D2 " + sample.name() + ": the type ignores nothing itself; not applicable");
            return;
        }
        ObjectNode input = (ObjectNode) PayloadAssertions.FIXTURE_EDITOR.readTree(GOLDEN.read(sample.fixture(D1)));
        input.put(UNKNOWN_PROPERTY, IGNORED_VALUE);
        ignored.forEach(name -> input.put(name, IGNORED_VALUE));
        PayloadAssertions.assertBindsTo(sample, MAPPER.readValue(PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(input), sample.type()));
    }

    @ParameterizedTest(name = "D3 {0}")
    @MethodSource("requestSamples")
    void d3NullAndAbsentAsPinned(Sample sample) throws IOException {
        List<BeanPropertyDefinition> candidates = sample.type().isMapLikeType() ? List.of()
                : PayloadTypeWalker.beanDescription(sample.type(), Direction.REQUEST).findProperties().stream()
                        .filter(BeanPropertyDefinition::couldDeserialize)
                        .filter(property -> nullAndAbsentCanDiffer(sample.type(), property)).toList();
        System.out.println("[RequestPayloadGoldensTest] D3 " + sample.name() + ": "
                + candidates.stream().map(BeanPropertyDefinition::getName).toList());
        if (candidates.isEmpty()) {
            return;
        }
        String fixture = GOLDEN.read(sample.fixture(D1));
        Map<String, Map<String, Map<String, String>>> outcomes = new LinkedHashMap<>();
        for (BeanPropertyDefinition property : candidates) {
            ObjectNode absent = (ObjectNode) PayloadAssertions.FIXTURE_EDITOR.readTree(fixture);
            absent.remove(property.getName());
            ObjectNode explicitNull = (ObjectNode) PayloadAssertions.FIXTURE_EDITOR.readTree(fixture);
            explicitNull.putNull(property.getName());
            Map<String, Map<String, String>> outcome = new LinkedHashMap<>();
            outcome.put(ABSENT, describe(boundValue(sample, absent, property)));
            outcome.put(NULL, describe(boundValue(sample, explicitNull, property)));
            System.out.println("[RequestPayloadGoldensTest] D3 " + sample.name() + "." + property.getName() + " " + outcome);
            outcomes.put(property.getName(), outcome);
        }
        GOLDEN.assertJson(sample.fixture(D3), MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(outcomes));
    }

    /** Primitives, creator (and record) parameters and {@code @Builder.Default} fields: their absent value is not null. */
    private static boolean nullAndAbsentCanDiffer(JavaType type, BeanPropertyDefinition property) {
        return property.getPrimaryType().isPrimitive() || property.getConstructorParameter() != null
                || Arrays.stream(type.getRawClass().getDeclaredMethods())
                        .anyMatch(method -> method.getName().equals(BUILDER_DEFAULT_PREFIX + property.getInternalName()));
    }

    private static Object boundValue(Sample sample, ObjectNode input, BeanPropertyDefinition property) throws IOException {
        Object bound = MAPPER.readValue(PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(input), sample.type());
        return PayloadAssertions.propertyValue(bound, property.getInternalName());
    }

    private static Map<String, String> describe(Object value) {
        Map<String, String> description = new LinkedHashMap<>();
        description.put(CLASS_KEY, value == null ? NULL : value.getClass().getName());
        description.put(VALUE_KEY, String.valueOf(value));
        return description;
    }

    private static List<Property> deserializedProperties(JavaType type) {
        PayloadType walked = closure.types().get(type.getRawClass().getName());
        return (walked != null ? walked : PayloadTypeWalker.describe(type.getRawClass())).deserializedProperties();
    }
}
