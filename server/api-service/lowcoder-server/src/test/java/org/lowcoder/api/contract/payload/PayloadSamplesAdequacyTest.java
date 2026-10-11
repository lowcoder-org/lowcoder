package org.lowcoder.api.contract.payload;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.introspect.AnnotatedClass;
import com.fasterxml.jackson.databind.introspect.BeanPropertyDefinition;
import com.fasterxml.jackson.databind.jsontype.NamedType;
import com.fasterxml.jackson.databind.node.TextNode;
import lombok.Getter;
import lombok.Setter;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.application.ApplicationEndpoints.CreateApplicationRequest;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.contract.support.PayloadSamples.Sample;
import org.lowcoder.api.contract.support.PayloadTypeWalker;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Closure;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Direction;
import org.lowcoder.api.contract.support.PayloadTypeWalker.PayloadType;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Property;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.util.JsonUtils;

import java.lang.reflect.Modifier;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The adequacy criteria of docs/API_PAYLOAD_TEST_PLAN.md §3.3 (C6-A5, C7-A2), checked mechanically on every sample
 * of {@link PayloadSamples}, property by property along the walker's list ({@code deserializedProperties} for the
 * request direction, {@code serializedProperties} for the response direction):
 *
 * <ol>
 *   <li>every property value is non-null (S2 covers nulls); for a map type, every entry. A {@code null} nested in
 *       dynamic content is data, not a missing property, and is allowed;</li>
 *   <li>every collection or array has at least two elements and every map at least two keys, also nested inside map
 *       and collection values;</li>
 *   <li>every property declared {@code Object} or {@code JsonNode} holds the §4.6 representative input, bound to its
 *       declared type ({@link PayloadSamples#representative}): equal by {@code equals} for a {@code JsonNode}, by
 *       {@link CanonicalJson#compareJava} (values and their Java classes) for an {@code Object}. Rule 2 does not look
 *       inside such a value, because the representative input has empty containers on purpose. A map type's entries
 *       are its data, not {@code Object} properties, so rule 3 does not apply to them;</li>
 *   <li>for a property whose declared type has registered subtypes, the runtime classes across all samples equal the
 *       concrete classes {@code SubtypeResolver.collectAndResolveSubtypesByClass} returns. Not for rule-3 properties:
 *       for {@code Object} that call returns every registered subtype of the mapper;</li>
 *   <li>numbers: {@code long}/{@code Long} above {@code Integer.MAX_VALUE}, {@code int}/{@code Integer} above
 *       {@code Short.MAX_VALUE}, {@code double}/{@code float} with a fractional part, {@code BigDecimal} with a
 *       trailing-zero scale.</li>
 * </ol>
 *
 * <p>A map type (such as {@code AuthConfigRequest}) has no properties: its entries are checked as values. Nested beans
 * are not entered; they are samples of their own. {@link #inadequateSamplesAreReported} feeds the checks broken
 * samples so that every rule is seen failing in every build; {@link DynamicProbe} stands in for the closure's
 * {@code Object} and {@code JsonNode} properties, whose samples later WPs write.
 */
class PayloadSamplesAdequacyTest {

    static final int MINIMUM_ELEMENTS = 2;
    /**
     * Rule 5 does not apply to these properties: their getter answers a constant, which no sample can choose. Each
     * must hold exactly that constant ({@code QueryResultView#getCode}, task T5.2), and each must name a current
     * property of a sample ({@link #constantPropertiesNameCurrentProperties}).
     */
    static final Map<String, Object> CONSTANT_PROPERTIES = Map.of("QueryResultView.code", 1);
    /** Rule-3 messages quote the first difference up to this length; the representative input is long. */
    static final int MAX_DETAIL = 160;

    private static final ObjectMapper MAPPER = JsonUtils.getObjectMapper();
    private static Closure closure;

    /** A test-only type with one property of each rule-3 kind. */
    @Getter
    @Setter
    public static class DynamicProbe {
        private Object value;
        private JsonNode node;
    }

    @BeforeAll
    static void walk() {
        closure = PayloadTypeWalker.walkCompiledApi();
    }

    @Test
    void everySampleIsAdequate() {
        List<String> violations = new ArrayList<>();
        for (Sample sample : PayloadSamples.all()) {
            List<String> found = violations(sample);
            System.out.println("[PayloadSamplesAdequacyTest] " + sample.name() + ": " + (found.isEmpty() ? "adequate" : found));
            violations.addAll(found);
        }
        violations.addAll(subtypeViolations(PayloadSamples.all()));
        assertThat(violations).isEmpty();
    }

    @Test
    void inadequateSamplesAreReported() {
        Folder folder = PayloadSamples.folder();
        folder.setName(null);
        Map<String, Object> dsl = new LinkedHashMap<>();
        dsl.put("only", List.of("one element"));
        CreateApplicationRequest request = new CreateApplicationRequest("orgId", "gid", "name", (int) Short.MAX_VALUE, dsl,
                "folderId", Boolean.TRUE, Boolean.FALSE);
        AuthConfigRequest authConfig = new AuthConfigRequest();
        authConfig.put("authType", null);
        List<String> found = new ArrayList<>();
        found.addAll(violations(sample(Folder.class, folder)));
        found.addAll(violations(sample(CreateApplicationRequest.class, request)));
        found.addAll(violations(sample(AuthConfigRequest.class, authConfig)));
        DynamicProbe notRepresentative = new DynamicProbe();
        notRepresentative.setValue(Map.of("key", 1, "other", 2));
        notRepresentative.setNode(TextNode.valueOf("not the representative input"));
        found.addAll(violations(sample(DynamicProbe.class, notRepresentative)));
        found.forEach(violation -> System.out.println("[PayloadSamplesAdequacyTest] broken sample: " + violation));
        assertThat(found).anySatisfy(v -> assertThat(v).contains("Folder.name: rule 1"))
                .anySatisfy(v -> assertThat(v).contains("CreateApplicationRequest.editingApplicationDSL: rule 2"))
                .anySatisfy(v -> assertThat(v).contains("CreateApplicationRequest.editingApplicationDSL.only: rule 2"))
                .anySatisfy(v -> assertThat(v).contains("CreateApplicationRequest.applicationType: rule 5"))
                .anySatisfy(v -> assertThat(v).contains("AuthConfigRequest: rule 2"))
                .anySatisfy(v -> assertThat(v).contains("AuthConfigRequest.authType: rule 1"))
                .anySatisfy(v -> assertThat(v).contains("DynamicProbe.value: rule 3"))
                .anySatisfy(v -> assertThat(v).contains("DynamicProbe.node: rule 3"));
        Set<String> authConfigs = concreteSubtypes(MAPPER.constructType(AbstractAuthConfig.class));
        System.out.println("[PayloadSamplesAdequacyTest] concrete subtypes of AbstractAuthConfig: " + authConfigs);
        assertThat(authConfigs).containsExactlyInAnyOrder("EmailAuthConfig", "Oauth2GenericAuthConfig",
                "Oauth2KeycloakAuthConfig", "Oauth2OryAuthConfig", "Oauth2SimpleAuthConfig");
        assertThat(compareSubtypes(Map.of("Probe.config", authConfigs), Map.of("Probe.config", Set.of("EmailAuthConfig"))))
                .singleElement().satisfies(v -> assertThat(v).contains("Probe.config: rule 4"));
    }

    @Test
    void theRepresentativeInputIsAdequateForObjectAndJsonNodeProperties() {
        List<String> found = violations(representativeProbe());
        found.forEach(violation -> System.out.println("[PayloadSamplesAdequacyTest] representative probe: " + violation));
        assertThat(found).as("the representative input passes rule 3, and rule 2 does not look inside it").isEmpty();
    }

    @Test
    void ruleFourSkipsObjectAndJsonNodeProperties() {
        System.out.println("[PayloadSamplesAdequacyTest] registered subtypes of Object: " + concreteSubtypes(MAPPER.constructType(Object.class)));
        assertThat(subtypeViolations(List.of(representativeProbe()))).as("rule 4 does not apply to Object and JsonNode properties").isEmpty();
    }

    private static Sample representativeProbe() {
        DynamicProbe representative = new DynamicProbe();
        representative.setValue(PayloadSamples.representative(MAPPER.constructType(Object.class)));
        representative.setNode((JsonNode) PayloadSamples.representative(MAPPER.constructType(JsonNode.class)));
        return sample(DynamicProbe.class, representative);
    }

    private static Sample sample(Class<?> type, Object value) {
        return new Sample(type.getName(), MAPPER.constructType(type), value, Set.of(Direction.REQUEST));
    }

    /** Rules 1, 2, 3 and 5 for one sample. */
    static List<String> violations(Sample sample) {
        List<String> violations = new ArrayList<>();
        String owner = sample.type().getRawClass().getSimpleName();
        if (sample.type().isMapLikeType()) {
            ((Map<?, ?>) sample.value()).forEach((key, entry) -> {
                if (entry == null) {
                    violations.add(owner + "." + key + ": rule 1, null");
                }
            });
            checkValue(owner, sample.value(), violations);
            return violations;
        }
        for (Map.Entry<String, BeanPropertyDefinition> property : properties(sample).entrySet()) {
            String path = owner + "." + property.getKey();
            Object value = PayloadAssertions.propertyValue(sample.value(), property.getValue().getInternalName());
            if (value == null) {
                violations.add(path + ": rule 1, null");
                continue;
            }
            JavaType declared = property.getValue().getPrimaryType();
            if (isDynamic(declared)) {
                checkRepresentative(path, declared, value, violations);
                continue;
            }
            if (CONSTANT_PROPERTIES.containsKey(path)) {
                if (!CONSTANT_PROPERTIES.get(path).equals(value)) {
                    violations.add(path + ": rule 5 exemption, not the constant " + CONSTANT_PROPERTIES.get(path) + " (" + value + ")");
                }
                continue;
            }
            checkNumber(path, declared, value, violations);
            checkValue(path, value, violations);
        }
        return violations;
    }

    @Test
    void constantPropertiesNameCurrentProperties() {
        Set<String> paths = new TreeSet<>();
        PayloadSamples.all().stream().filter(sample -> !sample.type().isMapLikeType()).forEach(sample -> properties(sample).keySet()
                .forEach(name -> paths.add(sample.type().getRawClass().getSimpleName() + "." + name)));
        System.out.println("[PayloadSamplesAdequacyTest] rule 5 exemptions " + CONSTANT_PROPERTIES);
        assertThat(paths).as("properties of the samples").containsAll(CONSTANT_PROPERTIES.keySet());
    }

    /** The walker's properties of the sample's directions, by JSON name, with Jackson's definitions. */
    private static Map<String, BeanPropertyDefinition> properties(Sample sample) {
        PayloadType walked = closure.types().get(sample.name());
        PayloadType described = walked != null ? walked : PayloadTypeWalker.describe(sample.type().getRawClass());
        Map<String, BeanPropertyDefinition> properties = new LinkedHashMap<>();
        for (Direction direction : sample.directions()) {
            List<Property> listed = direction == Direction.REQUEST ? described.deserializedProperties() : described.serializedProperties();
            Map<String, BeanPropertyDefinition> definitions = new LinkedHashMap<>();
            PayloadTypeWalker.beanDescription(sample.type(), direction).findProperties()
                    .forEach(definition -> definitions.put(definition.getName(), definition));
            listed.forEach(property -> properties.putIfAbsent(property.name(), definitions.get(property.name())));
        }
        return properties;
    }

    /** A property rule 3 applies to: declared {@code Object} or a {@code JsonNode} type. */
    static boolean isDynamic(JavaType declared) {
        return declared.getRawClass() == Object.class || JsonNode.class.isAssignableFrom(declared.getRawClass());
    }

    /** Rule 3: the value equals the representative input bound to the declared type. */
    private static void checkRepresentative(String path, JavaType declared, Object value, List<String> violations) {
        Object representative = PayloadSamples.representative(declared);
        List<String> differences = value instanceof JsonNode
                ? (value.equals(representative) ? List.of() : List.of("JsonNode differs"))
                : CanonicalJson.compareJava(representative, value);
        if (!differences.isEmpty()) {
            String detail = differences.get(0);
            violations.add(path + ": rule 3, not the §4.6 representative input: "
                    + (detail.length() > MAX_DETAIL ? detail.substring(0, MAX_DETAIL) + "…" : detail));
        }
    }

    /** Rule 2 inside a value: every map and collection, however deep, needs two entries. */
    private static void checkValue(String path, Object value, List<String> violations) {
        if (value instanceof Map<?, ?> map) {
            if (map.size() < MINIMUM_ELEMENTS) {
                violations.add(path + ": rule 2, map with " + map.size() + " key(s)");
            }
            map.forEach((key, entry) -> checkValue(path + "." + key, entry, violations));
        } else if (value instanceof Collection<?> collection) {
            if (collection.size() < MINIMUM_ELEMENTS) {
                violations.add(path + ": rule 2, collection with " + collection.size() + " element(s)");
            }
            int index = 0;
            for (Object element : collection) {
                checkValue(path + "[" + index++ + "]", element, violations);
            }
        } else if (value != null && value.getClass().isArray() && !value.getClass().getComponentType().isPrimitive()) {
            checkValue(path, List.of((Object[]) value), violations);
        }
    }

    /** Rule 5, by the property's declared type. */
    private static void checkNumber(String path, JavaType declared, Object value, List<String> violations) {
        Class<?> raw = declared.getRawClass();
        String problem = null;
        if ((raw == long.class || raw == Long.class) && ((Number) value).longValue() <= Integer.MAX_VALUE) {
            problem = "long not above Integer.MAX_VALUE";
        } else if ((raw == int.class || raw == Integer.class) && ((Number) value).intValue() <= Short.MAX_VALUE) {
            problem = "int not above Short.MAX_VALUE";
        } else if ((raw == double.class || raw == Double.class || raw == float.class || raw == Float.class)
                && ((Number) value).doubleValue() == Math.rint(((Number) value).doubleValue())) {
            problem = "decimal without a fractional part";
        } else if (raw == BigDecimal.class && !hasTrailingZeroScale((BigDecimal) value)) {
            problem = "BigDecimal without a trailing-zero scale";
        }
        if (problem != null) {
            violations.add(path + ": rule 5, " + problem + " (" + value + ")");
        }
    }

    private static boolean hasTrailingZeroScale(BigDecimal value) {
        return value.scale() > 0 && value.unscaledValue().mod(BigInteger.TEN).signum() == 0;
    }

    /** Rule 4 across all samples. */
    static List<String> subtypeViolations(List<Sample> samples) {
        Map<String, Set<String>> expected = new TreeMap<>();
        Map<String, Set<String>> actual = new TreeMap<>();
        for (Sample sample : samples) {
            if (sample.type().isMapLikeType()) {
                continue;
            }
            for (Map.Entry<String, BeanPropertyDefinition> property : properties(sample).entrySet()) {
                if (isDynamic(property.getValue().getPrimaryType())) {
                    continue;
                }
                Set<String> concrete = concreteSubtypes(property.getValue().getPrimaryType());
                if (concrete.size() < MINIMUM_ELEMENTS) {
                    continue;
                }
                String path = sample.type().getRawClass().getSimpleName() + "." + property.getKey();
                expected.put(path, concrete);
                Object value = PayloadAssertions.propertyValue(sample.value(), property.getValue().getInternalName());
                if (value != null) {
                    actual.computeIfAbsent(path, k -> new TreeSet<>()).add(value.getClass().getSimpleName());
                }
            }
        }
        System.out.println("[PayloadSamplesAdequacyTest] rule 4: polymorphic properties " + expected.keySet());
        return compareSubtypes(expected, actual);
    }

    static List<String> compareSubtypes(Map<String, Set<String>> expected, Map<String, Set<String>> actual) {
        List<String> violations = new ArrayList<>();
        expected.forEach((path, classes) -> {
            Set<String> seen = actual.getOrDefault(path, Set.of());
            if (!seen.equals(classes)) {
                violations.add(path + ": rule 4, samples have " + seen + ", registered subtypes are " + classes);
            }
        });
        return violations;
    }

    private static Set<String> concreteSubtypes(JavaType declared) {
        AnnotatedClass annotated = MAPPER.getSerializationConfig().introspectClassAnnotations(declared).getClassInfo();
        Set<String> classes = new TreeSet<>();
        for (NamedType subtype : MAPPER.getSubtypeResolver().collectAndResolveSubtypesByClass(MAPPER.getSerializationConfig(), annotated)) {
            Class<?> type = subtype.getType();
            if (!type.isInterface() && !Modifier.isAbstract(type.getModifiers())) {
                classes.add(type.getSimpleName());
            }
        }
        return classes;
    }
}
