package org.lowcoder.api.contract.payload;

import com.fasterxml.jackson.databind.BeanDescription;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.introspect.BeanPropertyDefinition;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadTypeWalker;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Closure;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Direction;
import org.lowcoder.api.contract.support.PayloadTypeWalker.PayloadType;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.bundle.model.BundleStatus;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.material.model.MaterialType;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.util.JsonUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * D5 of docs/API_PAYLOAD_TEST_PLAN.md §4.2: how the production mapper coerces every scalar input into every scalar
 * target type, per binding mechanism, pinned in {@code json-contract/coercion/D5.<mechanism>.json} as the bound value's
 * class and value or the exception class.
 *
 * <ul>
 *   <li><b>Mechanisms:</b> the three the closure's request types use, each by a test-only probe that binds the way
 *       the production types do: {@link SetterProbe} (Lombok setters, like {@code Folder}), {@link RecordProbe} (a
 *       record, like {@code CreateApplicationRequest}) and {@link BuilderProbe} ({@code @Jacksonized @SuperBuilder},
 *       like every builder type of the closure).</li>
 *   <li><b>Targets:</b> every scalar type and enum that a deserialized closure property has; each probe has one
 *       property per target. {@link #theProbesCoverEveryTargetAndMechanismOfTheClosure} fails when the closure gains a
 *       (target, mechanism) pair the probes do not have.</li>
 *   <li><b>Inputs:</b> {@link #INPUTS}; for an enum also {@link #ENUM_INPUTS}: its first constant's name exactly and in
 *       lower case, an unknown name and the index {@code 0}.</li>
 * </ul>
 *
 * <p>Limits: {@code JacksonAnnotationGuard} (gate rule 6) keeps per-property annotations from changing coercion
 * outside these probes; a custom deserializer registered on the mapper for one of these targets would apply to the
 * probes too and show here. Exception messages are not pinned, only classes.
 */
class ScalarCoercionContractTest {

    static final List<String> INPUTS = List.of("\"1\"", "1", "1.5", "\"1.5\"", "1e2", "-0", "\" 1 \"", "true", "\"true\"",
            "\"\"", "\"null\"", "null", "[]", "[\"1\"]", "{}");
    static final String UNKNOWN_ENUM_NAME = "\"D5_UNKNOWN\"";
    static final String ENUM_INDEX = "0";
    static final String FIXTURE = "coercion/D5.%s.json";
    static final String EXCEPTION_KEY = "exception";
    static final String CLASS_KEY = "class";
    static final String VALUE_KEY = "value";
    static final String NULL = "null";

    private static final ObjectMapper MAPPER = JsonUtils.getObjectMapper();
    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    enum Mechanism {
        SETTER("field-setter", SetterProbe.class), CREATOR("creator", RecordProbe.class), BUILDER("builder", BuilderProbe.class);

        final String label;
        final Class<?> probe;

        Mechanism(String label, Class<?> probe) {
            this.label = label;
            this.probe = probe;
        }
    }

    @Getter
    @Setter
    public static class SetterProbe {
        private String string;
        private Integer boxedInteger;
        private Boolean boxedBoolean;
        private boolean primitiveBoolean;
        private Instant instant;
        private Object object;
        private ApplicationStatus applicationStatus;
        private BundleStatus bundleStatus;
        private DatasourceStatus datasourceStatus;
        private MaterialType materialType;
        private OrganizationState organizationState;
    }

    public record RecordProbe(String string, Integer boxedInteger, Boolean boxedBoolean, boolean primitiveBoolean,
            Instant instant, Object object, ApplicationStatus applicationStatus, BundleStatus bundleStatus,
            DatasourceStatus datasourceStatus, MaterialType materialType, OrganizationState organizationState) {
    }

    @Getter
    @Jacksonized
    @SuperBuilder
    public static class BuilderProbe {
        private String string;
        private Integer boxedInteger;
        private Boolean boxedBoolean;
        private boolean primitiveBoolean;
        private Instant instant;
        private Object object;
        private ApplicationStatus applicationStatus;
        private BundleStatus bundleStatus;
        private DatasourceStatus datasourceStatus;
        private MaterialType materialType;
        private OrganizationState organizationState;
    }

    /** The mechanism Jackson binds {@code property} of a request type with (see the class comment). */
    static Mechanism mechanism(JavaType owner, BeanPropertyDefinition property) {
        if (MAPPER.getDeserializationConfig().introspect(owner).findPOJOBuilder() != null) {
            return Mechanism.BUILDER;
        }
        return property.getConstructorParameter() != null ? Mechanism.CREATOR : Mechanism.SETTER;
    }

    /** A scalar target: not a container, and a primitive, an enum, {@code Object} or a JDK value type. */
    static boolean isScalar(JavaType type) {
        Class<?> raw = type.getRawClass();
        return !type.isContainerType() && !type.isReferenceType()
                && (raw.isPrimitive() || raw.isEnum() || raw == Object.class || raw.getName().startsWith("java."));
    }

    @Test
    void theProbesCoverEveryTargetAndMechanismOfTheClosure() {
        Closure closure = PayloadTypeWalker.walkCompiledApi();
        Set<String> needed = new TreeSet<>();
        for (PayloadType type : closure.types().values()) {
            if (!type.directions().contains(Direction.REQUEST) || type.type().isEnum()) {
                continue;
            }
            JavaType javaType = MAPPER.constructType(type.type());
            BeanDescription description = PayloadTypeWalker.beanDescription(javaType, Direction.REQUEST);
            for (BeanPropertyDefinition property : description.findProperties()) {
                if (property.couldDeserialize() && isScalar(property.getPrimaryType())) {
                    needed.add(property.getPrimaryType().getRawClass().getName() + " @ " + mechanism(javaType, property).label);
                }
            }
        }
        Set<String> covered = new TreeSet<>();
        for (Mechanism mechanism : Mechanism.values()) {
            JavaType probe = MAPPER.constructType(mechanism.probe);
            for (BeanPropertyDefinition property : PayloadTypeWalker.beanDescription(probe, Direction.REQUEST).findProperties()) {
                assertThat(mechanism(probe, property)).as("binding mechanism of " + mechanism.probe.getSimpleName() + "."
                        + property.getName()).isEqualTo(mechanism);
                covered.add(property.getPrimaryType().getRawClass().getName() + " @ " + mechanism.label);
            }
        }
        System.out.println("[ScalarCoercionContractTest] closure pairs " + needed.size() + ": " + needed);
        System.out.println("[ScalarCoercionContractTest] probe pairs " + covered.size());
        Set<String> uncovered = new TreeSet<>(needed);
        uncovered.removeAll(covered);
        assertThat(uncovered).as("(target @ mechanism) pairs of the closure without a probe property").isEmpty();
    }

    @ParameterizedTest(name = "D5 {0}")
    @EnumSource(Mechanism.class)
    void d5CoercionsAsPinned(Mechanism mechanism) throws Exception {
        JavaType probe = MAPPER.constructType(mechanism.probe);
        Map<String, Map<String, Map<String, String>>> outcomes = new LinkedHashMap<>();
        for (BeanPropertyDefinition property : PayloadTypeWalker.beanDescription(probe, Direction.REQUEST).findProperties()) {
            Class<?> target = property.getPrimaryType().getRawClass();
            Map<String, Map<String, String>> byInput = new LinkedHashMap<>();
            for (String input : inputs(target)) {
                byInput.put(input, outcome(probe, property, input));
            }
            outcomes.put(target.getName(), byInput);
        }
        System.out.println("[ScalarCoercionContractTest] D5 " + mechanism.label + ": " + outcomes.size() + " targets, "
                + outcomes.values().stream().mapToInt(Map::size).sum() + " outcomes");
        GOLDEN.assertJson(FIXTURE.formatted(mechanism.label), MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(outcomes));
    }

    static List<String> inputs(Class<?> target) {
        List<String> inputs = new ArrayList<>(INPUTS);
        if (target.isEnum()) {
            String first = ((Enum<?>) target.getEnumConstants()[0]).name();
            inputs.add("\"" + first + "\"");
            inputs.add("\"" + first.toLowerCase(Locale.ROOT) + "\"");
            inputs.add(UNKNOWN_ENUM_NAME);
            inputs.add(ENUM_INDEX);
        }
        return inputs;
    }

    private static Map<String, String> outcome(JavaType probe, BeanPropertyDefinition property, String input) {
        Map<String, String> outcome = new LinkedHashMap<>();
        try {
            Object bound = MAPPER.readValue("{\"" + property.getName() + "\": " + input + "}", probe);
            Object value = PayloadAssertions.propertyValue(bound, property.getInternalName());
            outcome.put(CLASS_KEY, value == null ? NULL : value.getClass().getName());
            outcome.put(VALUE_KEY, String.valueOf(value));
        } catch (Exception e) {
            outcome.put(EXCEPTION_KEY, e.getClass().getName());
        }
        return outcome;
    }
}
