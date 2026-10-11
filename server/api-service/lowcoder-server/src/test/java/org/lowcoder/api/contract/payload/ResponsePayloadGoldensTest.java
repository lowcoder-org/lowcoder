package org.lowcoder.api.contract.payload;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.exception.ExceptionUtils;
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
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.sdk.config.JsonViews;
import org.lowcoder.sdk.contract.CanonicalJson;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.util.JsonUtils;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.lang.reflect.RecordComponent;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Layer A response goldens (docs/API_PAYLOAD_TEST_PLAN.md §4.1, §4.5) for every response-direction sample of
 * {@link PayloadSamples}, written with the production mapper:
 *
 * <ul>
 *   <li><b>S1:</b> the sample, written without a view, equals {@code types/<type>.S1.json} canonically, values
 *       included.</li>
 *   <li><b>S3:</b> the S1 top-level names equal the walker's {@code serializedProperties}, so a write-only property
 *       (the sample sets it) is absent; not for a map or collection type, whose keys are data.</li>
 *   <li><b>S2:</b> every field of the sample that can hold null is set to null, and the output equals
 *       {@code types/<type>.S2.json}. A field whose null makes the writer throw (a computed getter such as
 *       {@code Oauth2KeycloakAuthConfig#getAuthorizeUrl}) is found by nulling one field at a time; it keeps its
 *       sample value in S2, and its failures are pinned in {@code types/<type>.S2Throwing.json}: per field, every
 *       JSON path whose writing throws, with the root cause's class. The order in which Jackson writes properties is
 *       unspecified, and that of getter-only properties changed between two runs (plan §9 O18), so instead of the
 *       first failure the test collects all of them ({@link #failures}, whose limits apply): after each one, the
 *       failing property is ignored on the class that holds it and the probe written again. A map or collection type (a
 *       {@code HashMap} subclass such as {@code OrganizationCommonSettings}) has no properties to null and no S2
 *       (task T4.2).</li>
 *   <li><b>Views (§4.5):</b> the sample written under {@code JsonViews.Public} and {@code JsonViews.Internal}. Where
 *       the output differs from S1 it is pinned in {@code types/<type>.S1Public.json} or {@code .S1Internal.json};
 *       where it does not, that fixture must not exist. {@code Public} output never contains
 *       {@link PayloadSamples#SECRET_MARKER}; the {@link PayloadSamples#KNOWN_EXPOSURE_MARKER} values it contains
 *       are printed (owner decision O1).</li>
 * </ul>
 *
 * <p>{@link PayloadAssertions#UNORDERED_ARRAYS} lists the arrays whose element order production does not determine
 * (plan §9 O14); their elements are sorted by their text before the comparison, as in the fixture, and
 * {@link #unorderedArraysComeFromSetsWithoutStableOrder} keeps that list honest. Limits: the sorting's limits are
 * {@link PayloadAssertions#sortUnorderedArrays}'s; a field is nulled only at the top level of the sample (nested beans
 * are samples of their own).
 */
class ResponsePayloadGoldensTest {

    static final String S1 = "S1";
    static final String S2 = "S2";
    static final String S2_THROWING = "S2Throwing";
    static final Map<String, Class<?>> VIEWS = viewsByCase();
    static final String PATH_SEPARATOR = ".";
    static final String INDEX_OPEN = "[";
    static final String INDEX_CLOSE = "]";

    private static final ObjectMapper MAPPER = JsonUtils.getObjectMapper();
    private static final GoldenJson GOLDEN = GoldenJson.forModule();
    private static Closure closure;

    private static Map<String, Class<?>> viewsByCase() {
        Map<String, Class<?>> views = new LinkedHashMap<>();
        views.put("S1Public", JsonViews.Public.class);
        views.put("S1Internal", JsonViews.Internal.class);
        return views;
    }

    @BeforeAll
    static void walk() {
        closure = PayloadTypeWalker.walkCompiledApi();
    }

    static Stream<Sample> responseSamples() {
        return PayloadSamples.all().stream().filter(sample -> sample.directions().contains(Direction.RESPONSE));
    }

    @ParameterizedTest(name = "S1 {0}")
    @MethodSource("responseSamples")
    void s1WritesTheSample(Sample sample) throws JsonProcessingException {
        String output = write(sample, sample.value(), null);
        System.out.println("[ResponsePayloadGoldensTest] S1 " + sample.name() + " " + output);
        GOLDEN.assertJson(sample.fixture(S1), output);
        if (sample.type().isContainerType()) {
            // as gate rule 4: a map or collection type has no properties, its keys are data
            System.out.println("[ResponsePayloadGoldensTest] S3 skips " + sample.name() + ": a map or collection type");
            return;
        }
        Set<String> names = topLevelNames(output);
        Set<String> expected = serializedProperties(sample).stream().map(Property::name).collect(Collectors.toCollection(TreeSet::new));
        assertThat(names).as("S3 names of " + sample.name()).isEqualTo(expected);
    }

    @ParameterizedTest(name = "views {0}")
    @MethodSource("responseSamples")
    void viewsArePinnedWhereTheyChangeTheOutput(Sample sample) throws JsonProcessingException {
        String withoutView = write(sample, sample.value(), null);
        for (Map.Entry<String, Class<?>> view : VIEWS.entrySet()) {
            String output = write(sample, sample.value(), view.getValue());
            String fixture = sample.fixture(view.getKey());
            boolean differs = !CanonicalJson.compare(withoutView, output).equivalent();
            System.out.println("[ResponsePayloadGoldensTest] " + view.getKey() + " " + sample.name()
                    + (differs ? " differs from S1: " + output : " equals S1"));
            // the marker checks come first: a view that no longer hides a secret must fail as such
            if (view.getValue() == JsonViews.Public.class) {
                assertThat(output).as("Public output of " + sample.name()).doesNotContain(PayloadSamples.SECRET_MARKER);
                List<String> exposed = markedValues(output, PayloadSamples.KNOWN_EXPOSURE_MARKER);
                if (!exposed.isEmpty()) {
                    System.out.println("[ResponsePayloadGoldensTest] O1: Public output of " + sample.name() + " exposes " + exposed);
                }
            }
            if (differs) {
                GOLDEN.assertJson(fixture, output);
            } else {
                assertThat(Files.exists(GOLDEN.resolve(fixture))).as(fixture + " must not exist: the output equals S1").isFalse();
            }
        }
    }

    @ParameterizedTest(name = "S2 {0}")
    @MethodSource("responseSamples")
    void s2NullsAsPinned(Sample sample) throws JsonProcessingException {
        if (sample.type().isContainerType()) {
            // a map or collection type has no properties to null: its entries are data, and S1 pins them
            System.out.println("[ResponsePayloadGoldensTest] S2 skips " + sample.name() + ": a map or collection type");
            assertThat(Files.exists(GOLDEN.resolve(sample.fixture(S2)))).as(sample.fixture(S2) + " must not exist: no properties to null").isFalse();
            return;
        }
        List<String> nullable = nullableFields(sample.value().getClass());
        Map<String, Map<String, String>> throwing = new LinkedHashMap<>();
        for (String field : nullable) {
            Map<String, String> failures = failures(withNulls(fresh(sample), Set.of(field)));
            if (!failures.isEmpty()) {
                System.out.println("[ResponsePayloadGoldensTest] S2 " + sample.name() + "." + field + " = null throws " + failures);
                throwing.put(field, failures);
            }
        }
        Set<String> nulled = new HashSet<>(nullable);
        nulled.removeAll(throwing.keySet());
        String output = write(sample, withNulls(fresh(sample), nulled), null);
        System.out.println("[ResponsePayloadGoldensTest] S2 " + sample.name() + " with " + new TreeSet<>(nulled) + " null: " + output);
        GOLDEN.assertJson(sample.fixture(S2), output);
        String throwingFixture = sample.fixture(S2_THROWING);
        if (throwing.isEmpty()) {
            assertThat(Files.exists(GOLDEN.resolve(throwingFixture))).as(throwingFixture + " must not exist: no null throws").isFalse();
        } else {
            GOLDEN.assertJson(throwingFixture, MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(throwing));
        }
    }

    /**
     * {@link #failures} finds every failure below the root too, whatever the order of the properties: two getters of
     * a nested bean and one of a list element, with distinct root causes.
     */
    @Test
    void failuresAreCollectedAtEveryDepth() throws JsonProcessingException {
        Map<String, String> failures = failures(new FailingHolder());
        System.out.println("[ResponsePayloadGoldensTest] failures of FailingHolder: " + failures);
        assertThat(failures).containsExactlyEntriesOf(new TreeMap<>(Map.of(
                "nested.first", IllegalStateException.class.getName(),
                "nested.second", UnsupportedOperationException.class.getName(),
                "elements[0].value", ArithmeticException.class.getName())));
    }

    /** Two failing getter-only properties. */
    public static final class FailingNested {
        public String getFirst() {
            throw new IllegalStateException("first");
        }

        public String getSecond() {
            throw new UnsupportedOperationException("second");
        }
    }

    /** One failing getter-only property, as a list element. */
    public static final class FailingElement {
        public String getValue() {
            throw new ArithmeticException("value");
        }
    }

    /** A root that does not fail itself, holding a {@link FailingNested} and a list of one {@link FailingElement}. */
    public static final class FailingHolder {
        public String getName() {
            return "FailingHolder";
        }

        public FailingNested getNested() {
            return new FailingNested();
        }

        public List<FailingElement> getElements() {
            return List.of(new FailingElement());
        }
    }

    /**
     * The exemption of {@link PayloadAssertions#UNORDERED_ARRAYS} holds only while production builds those arrays from a
     * {@code HashSet} of a class that does not override {@code hashCode}: then their order follows identity hash
     * codes and changes from run to run. When production gives the class a {@code hashCode} or the set an order, this
     * fails and the exemption must go.
     */
    @Test
    void unorderedArraysComeFromSetsWithoutStableOrder() throws ReflectiveOperationException {
        assertThat(PayloadAssertions.UNORDERED_ARRAYS.keySet()).as("every listed type has a response sample")
                .allMatch(name -> responseSamples().anyMatch(sample -> sample.name().equals(name)));
        Application application = (Application) PayloadSamples.of(Application.class).value();
        Set<?> queries = application.getEditingQueries();
        Class<?> element = queries.iterator().next().getClass();
        Class<?> hashCodeOwner = element.getMethod("hashCode").getDeclaringClass();
        System.out.println("[ResponsePayloadGoldensTest] Application.editingQueries is a " + queries.getClass().getName() + " of "
                + element.getName() + ", hashCode from " + hashCodeOwner.getName());
        assertThat(queries.getClass()).isEqualTo(HashSet.class);
        assertThat(hashCodeOwner).isEqualTo(Object.class);
    }

    /**
     * Every failure of writing {@code probe} with the production mapper, as JSON path ({@link #jsonPath}) to the root
     * cause's class, sorted by path. After each failure, the property that failed is ignored on the class that holds
     * it, in a copy of the mapper, and the probe written again, so the result does not depend on the order in which
     * Jackson writes the properties, at any depth. Limits: a property ignored on its class is ignored in every
     * instance of that class, so where the same property of one class fails at several paths only the first is
     * found; a failure that is not inside a property (a list element's own serializer) fails the test.
     */
    static Map<String, String> failures(Object probe) throws JsonProcessingException {
        Map<String, String> failures = new TreeMap<>();
        Map<Class<?>, Set<String>> ignored = new LinkedHashMap<>();
        ObjectMapper mapper = MAPPER;
        while (true) {
            try {
                mapper.writeValueAsString(probe);
                return failures;
            } catch (JsonMappingException e) {
                List<JsonMappingException.Reference> references = e.getPath();
                String path = jsonPath(references);
                JsonMappingException.Reference failing = references.isEmpty() ? null : references.get(references.size() - 1);
                assertThat(failing != null && failing.getFieldName() != null && failing.getFrom() != null)
                        .as("the failure at '" + path + "' is not inside a property: " + e.getOriginalMessage()).isTrue();
                Class<?> owner = failing.getFrom() instanceof Class<?> type ? type : failing.getFrom().getClass();
                assertThat(ignored.computeIfAbsent(owner, ignoredOwner -> new TreeSet<>()).add(failing.getFieldName()))
                        .as("ignoring " + owner.getName() + "." + failing.getFieldName() + " did not remove its failure at " + path).isTrue();
                failures.put(path, ExceptionUtils.getRootCause(e).getClass().getName());
                mapper = MAPPER.copy();
                for (Map.Entry<Class<?>, Set<String>> entry : ignored.entrySet()) {
                    mapper.configOverride(entry.getKey()).setIgnorals(JsonIgnoreProperties.Value.forIgnoredProperties(entry.getValue()));
                }
            }
        }
    }

    /**
     * A Jackson reference path relative to the root: property names joined by {@value #PATH_SEPARATOR}, list and
     * array elements as {@code [index]}. Limit: a map key is written as a property name, so a key containing
     * {@value #PATH_SEPARATOR} reads like two levels.
     */
    static String jsonPath(List<JsonMappingException.Reference> references) {
        StringBuilder path = new StringBuilder();
        for (JsonMappingException.Reference reference : references) {
            if (reference.getFieldName() == null) {
                path.append(INDEX_OPEN).append(reference.getIndex()).append(INDEX_CLOSE);
            } else {
                path.append(path.isEmpty() ? "" : PATH_SEPARATOR).append(reference.getFieldName());
            }
        }
        return path.toString();
    }

    /** The sample written with {@code view} ({@code null}: none), its {@link PayloadAssertions#UNORDERED_ARRAYS} sorted. */
    private static String write(Sample sample, Object value, Class<?> view) throws JsonProcessingException {
        String output = view == null ? MAPPER.writeValueAsString(value) : MAPPER.writerWithView(view).writeValueAsString(value);
        return PayloadAssertions.sortUnorderedArrays(output, PayloadAssertions.UNORDERED_ARRAYS.getOrDefault(sample.name(), List.of()));
    }

    private static Set<String> topLevelNames(String json) {
        CanonicalJson.ObjectValue object = (CanonicalJson.ObjectValue) CanonicalJson.parse(json);
        return object.members().stream().map(CanonicalJson.Member::key).collect(Collectors.toCollection(TreeSet::new));
    }

    private static List<String> markedValues(String output, String marker) {
        List<String> values = new ArrayList<>();
        for (int i = output.indexOf(marker); i >= 0; i = output.indexOf(marker, i + 1)) {
            values.add(output.substring(i, output.indexOf('"', i)));
        }
        return values;
    }

    private static List<Property> serializedProperties(Sample sample) {
        PayloadType walked = closure.types().get(sample.name());
        return (walked != null ? walked : PayloadTypeWalker.describe(sample.type().getRawClass())).serializedProperties();
    }

    /** A new value of the sample, so that nulling its fields leaves the others alone. */
    private static Object fresh(Sample sample) {
        return PayloadSamples.of(sample.type().getRawClass()).value();
    }

    /**
     * The instance fields (record components) of {@code type} and its superclasses that can hold null; a
     * {@code Supplier} field is computed from the others and stays.
     */
    static List<String> nullableFields(Class<?> type) {
        if (type.isRecord()) {
            return Arrays.stream(type.getRecordComponents()).filter(c -> !c.getType().isPrimitive()).map(RecordComponent::getName).toList();
        }
        List<String> fields = new ArrayList<>();
        for (Class<?> c = type; c != null && c != Object.class; c = c.getSuperclass()) {
            for (Field field : c.getDeclaredFields()) {
                if (!Modifier.isStatic(field.getModifiers()) && !field.getType().isPrimitive()
                        && !Supplier.class.isAssignableFrom(field.getType())) {
                    fields.add(field.getName());
                }
            }
        }
        return fields;
    }

    /** {@code value} with {@code names} set to null: by reflection, or for a record through its canonical constructor. */
    static Object withNulls(Object value, Set<String> names) {
        Class<?> type = value.getClass();
        try {
            if (type.isRecord()) {
                RecordComponent[] components = type.getRecordComponents();
                Object[] arguments = new Object[components.length];
                for (int i = 0; i < components.length; i++) {
                    arguments[i] = names.contains(components[i].getName()) ? null : components[i].getAccessor().invoke(value);
                }
                Constructor<?> canonical = type.getDeclaredConstructor(Arrays.stream(components).map(RecordComponent::getType).toArray(Class<?>[]::new));
                canonical.setAccessible(true);
                return canonical.newInstance(arguments);
            }
            for (Class<?> c = type; c != null && c != Object.class; c = c.getSuperclass()) {
                for (Field field : c.getDeclaredFields()) {
                    if (names.contains(field.getName()) && !Modifier.isStatic(field.getModifiers())) {
                        field.setAccessible(true);
                        field.set(value, null);
                    }
                }
            }
            return value;
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("cannot null " + names + " of " + type.getName(), e);
        }
    }
}
