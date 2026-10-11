package org.lowcoder.api.contract.payload;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The request side of docs/API_PAYLOAD_TEST_PLAN.md §4.3: every deserialized {@code Instant} property of a request
 * sample bound from an integer, a decimal and an ISO-8601 input, each edited into the type's D1 fixture with the
 * lexeme-keeping {@link PayloadAssertions#FIXTURE_EDITOR}. The bound instants are pinned in
 * {@code types/<type>.D1Instant.json} ({@code READ_DATE_TIMESTAMPS_AS_NANOSECONDS} is on, E4: an integer is
 * seconds). The written lexeme of every {@code Instant} is part of the S1 goldens ({@code ResponsePayloadGoldensTest}).
 * {@link #everyDeserializedInstantHasARequestSample} keeps the list complete over the closure.
 */
class InstantContractTest {

    static final String D1 = "D1";
    static final String D1_INSTANT = "D1Instant";
    static final String INSTANT_TYPE = Instant.class.getName();
    /** Input label → JSON text: epoch seconds as an integer and as a decimal with nanoseconds, and ISO-8601. */
    static final Map<String, String> INPUTS = inputs();

    private static final ObjectMapper MAPPER = JsonUtils.getObjectMapper();
    private static final GoldenJson GOLDEN = GoldenJson.forModule();
    private static Closure closure;

    private static Map<String, String> inputs() {
        Map<String, String> inputs = new LinkedHashMap<>();
        inputs.put("integer", "1767225650");
        inputs.put("decimal", "1767225650.123456789");
        inputs.put("iso", "\"2026-01-01T00:00:50.123456789Z\"");
        return inputs;
    }

    @BeforeAll
    static void walk() {
        closure = PayloadTypeWalker.walkCompiledApi();
    }

    static Stream<Sample> samplesWithInstants() {
        return PayloadSamples.all().stream().filter(sample -> sample.directions().contains(Direction.REQUEST))
                .filter(sample -> !instantProperties(sample.name()).isEmpty());
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("samplesWithInstants")
    void instantsBindFromEveryInputForm(Sample sample) throws IOException {
        String fixture = GOLDEN.read(sample.fixture(D1));
        Map<String, Map<String, String>> bound = new LinkedHashMap<>();
        for (String property : instantProperties(sample.name())) {
            Map<String, String> byInput = new LinkedHashMap<>();
            for (Map.Entry<String, String> input : INPUTS.entrySet()) {
                ObjectNode edited = (ObjectNode) PayloadAssertions.FIXTURE_EDITOR.readTree(fixture);
                edited.set(property, PayloadAssertions.FIXTURE_EDITOR.readTree(input.getValue()));
                Object value = PayloadAssertions.propertyValue(
                        MAPPER.readValue(PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(edited), sample.type()), property);
                System.out.println("[InstantContractTest] " + sample.name() + "." + property + " from " + input.getValue() + " -> " + value);
                assertThat(value).isInstanceOf(Instant.class);
                byInput.put(input.getKey(), value.toString());
            }
            bound.put(property, byInput);
        }
        GOLDEN.assertJson(sample.fixture(D1_INSTANT), MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(bound));
    }

    @Test
    void everyDeserializedInstantHasARequestSample() {
        Set<String> withInstants = closure.types().values().stream().filter(type -> type.directions().contains(Direction.REQUEST))
                .map(type -> type.type().getName()).filter(name -> !instantProperties(name).isEmpty())
                .collect(Collectors.toCollection(TreeSet::new));
        Set<String> sampled = samplesWithInstants().map(Sample::name).collect(Collectors.toCollection(TreeSet::new));
        System.out.println("[InstantContractTest] request types with Instant properties " + withInstants + ", sampled " + sampled);
        assertThat(sampled).isEqualTo(withInstants);
    }

    private static List<String> instantProperties(String typeName) {
        PayloadType walked = closure.types().get(typeName);
        return walked == null ? List.of() : walked.deserializedProperties().stream()
                .filter(property -> property.type().equals(INSTANT_TYPE)).map(Property::name).toList();
    }
}
