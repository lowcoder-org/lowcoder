package org.lowcoder.api.contract.payload;

import com.fasterxml.jackson.databind.BeanDescription;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.introspect.BeanPropertyDefinition;
import com.fasterxml.jackson.databind.jsontype.TypeSerializer;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.payload.ScalarCoercionContractTest.Mechanism;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadTypeWalker;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Direction;
import org.lowcoder.api.contract.support.PayloadTypeWalker.PayloadType;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.util.JsonUtils;

import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * D6 of docs/API_PAYLOAD_TEST_PLAN.md §4.2: how the production mapper binds every container input into every container
 * shape that a deserialized closure property has, pinned in {@code json-contract/coercion/D6.json}.
 *
 * <ul>
 *   <li><b>Shapes:</b> the declared generic type of a deserialized property of a request-direction closure type that
 *       is a map, a collection, an array or {@code Object}, per binding mechanism (as in D5: field/setter, creator,
 *       builder), because a builder can copy a collection into another class. Each (shape, mechanism) pair is bound
 *       through one representative property of the closure: the first by owner and property name. A pair the closure
 *       gains appears as a key the fixture lacks.</li>
 *   <li><b>Inputs:</b> {@link #INPUTS}.</li>
 *   <li><b>Pinned per outcome:</b> the exception class, or the bound value's concrete class, the Java class of each
 *       element (of each entry's value for a map) and the value re-serialized by the production mapper.</li>
 * </ul>
 *
 * <p>The bound value is read from the owner's field when it has one, so the class is Jackson's and not a getter's
 * copy; otherwise through its accessor. A polymorphic owner (an {@code AbstractAuthConfig}) gets its own type id in the
 * body, as Jackson requires even for the concrete class. Limits: the representative owner's other properties stay absent, so a type
 * whose constructor rejects that would fail for every input (none does today: every outcome differs by input); an
 * exception's message is not pinned.
 */
class ContainerCoercionContractTest {

    /** §4.2's inputs, plus one non-empty object, so that a map's value coercion is pinned too. */
    static final List<String> INPUTS = List.of("[]", "[\"a\",\"a\"]", "[\"a\",null]", "[1, true]", "\"a\"", "\"\"", "null", "{}",
            "{\"a\": 1, \"b\": true, \"c\": null, \"d\": 1.5}");
    static final String FIXTURE = "coercion/D6.json";
    static final String EXCEPTION_KEY = "exception";
    static final String CLASS_KEY = "class";
    static final String ELEMENTS_KEY = "elementClasses";
    static final String JSON_KEY = "json";
    static final String NULL = "null";

    private static final ObjectMapper MAPPER = JsonUtils.getObjectMapper();
    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    /** One (shape, mechanism) pair and the closure property that represents it. */
    record Representative(String shape, Mechanism mechanism, JavaType owner, BeanPropertyDefinition property) {
        /** The request body that sets only this property to {@code input}, with the owner's type id if it has one. */
        String body(String input) {
            // the serializer's resolver maps a class to its registered id; the deserializer's only ids to classes
            TypeSerializer typed;
            try {
                typed = MAPPER.getSerializerProviderInstance().findTypeSerializer(owner);
            } catch (Exception e) {
                throw new IllegalStateException("type serializer of " + owner, e);
            }
            String typeId = typed == null ? ""
                    : "\"" + typed.getPropertyName() + "\": \"" + typed.getTypeIdResolver().idFromValueAndType(null, owner.getRawClass()) + "\", ";
            return "{" + typeId + "\"" + property.getName() + "\": " + input + "}";
        }

        String key() {
            return shape + " @ " + mechanism.label + " (" + owner.getRawClass().getSimpleName() + "." + property.getName() + ")";
        }
    }

    /** A container target: a map, collection or array, or {@code Object}. */
    static boolean isContainer(JavaType type) {
        return type.isContainerType() || type.getRawClass() == Object.class;
    }

    static List<Representative> representatives() {
        Map<String, Representative> byPair = new TreeMap<>();
        List<PayloadType> types = new ArrayList<>(PayloadTypeWalker.walkCompiledApi().types().values());
        types.sort(Comparator.comparing(type -> type.type().getName()));
        for (PayloadType type : types) {
            if (!type.directions().contains(Direction.REQUEST) || type.type().isEnum()) {
                continue;
            }
            JavaType owner = MAPPER.constructType(type.type());
            BeanDescription description = PayloadTypeWalker.beanDescription(owner, Direction.REQUEST);
            List<BeanPropertyDefinition> properties = new ArrayList<>(description.findProperties());
            properties.sort(Comparator.comparing(BeanPropertyDefinition::getName));
            for (BeanPropertyDefinition property : properties) {
                JavaType declared = property.getPrimaryType();
                if (property.couldDeserialize() && isContainer(declared)) {
                    Mechanism mechanism = ScalarCoercionContractTest.mechanism(owner, property);
                    byPair.putIfAbsent(declared.toCanonical() + " @ " + mechanism.label,
                            new Representative(declared.toCanonical(), mechanism, owner, property));
                }
            }
        }
        return List.copyOf(byPair.values());
    }

    @Test
    void d6ContainerBindingAsPinned() throws Exception {
        Map<String, Map<String, Map<String, Object>>> outcomes = new LinkedHashMap<>();
        for (Representative representative : representatives()) {
            Map<String, Map<String, Object>> byInput = new LinkedHashMap<>();
            for (String input : INPUTS) {
                byInput.put(input, outcome(representative, input));
            }
            outcomes.put(representative.key(), byInput);
        }
        System.out.println("[ContainerCoercionContractTest] D6: " + outcomes.size() + " (shape, mechanism) pairs: " + outcomes.keySet());
        GOLDEN.assertJson(FIXTURE, MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(outcomes));
    }

    @Test
    void everyOutcomeDependsOnTheInput() {
        for (Representative representative : representatives()) {
            List<Map<String, Object>> distinct = INPUTS.stream().map(input -> outcome(representative, input)).distinct().toList();
            assertThat(distinct.size()).as("distinct outcomes of " + representative.key()).isGreaterThan(1);
        }
    }

    private static Map<String, Object> outcome(Representative representative, String input) {
        Map<String, Object> outcome = new LinkedHashMap<>();
        try {
            Object bound = MAPPER.readValue(representative.body(input), representative.owner());
            Object value = boundValue(bound, representative.property().getInternalName());
            outcome.put(CLASS_KEY, value == null ? NULL : value.getClass().getName());
            outcome.put(ELEMENTS_KEY, elementClasses(value));
            outcome.put(JSON_KEY, MAPPER.writeValueAsString(value));
        } catch (Exception e) {
            outcome.put(EXCEPTION_KEY, e.getClass().getName());
            System.out.println("[ContainerCoercionContractTest] " + representative.key() + " " + input + ": "
                    + e.getMessage().lines().findFirst().orElse(""));
        }
        return outcome;
    }

    /** The owner's field when it has one (the instance Jackson built), else the accessor. */
    private static Object boundValue(Object bean, String internalName) throws IllegalAccessException {
        for (Class<?> c = bean.getClass(); c != null; c = c.getSuperclass()) {
            for (Field field : c.getDeclaredFields()) {
                if (field.getName().equals(internalName)) {
                    field.setAccessible(true);
                    return field.get(bean);
                }
            }
        }
        return PayloadAssertions.propertyValue(bean, internalName);
    }

    /** The Java class of each element, or of each entry's value for a map; empty for a scalar. */
    private static List<String> elementClasses(Object value) {
        Collection<?> elements;
        if (value instanceof Map<?, ?> map) {
            elements = map.values();
        } else if (value instanceof Collection<?> collection) {
            elements = collection;
        } else if (value != null && value.getClass().isArray()) {
            List<Object> array = new ArrayList<>();
            for (int i = 0; i < Array.getLength(value); i++) {
                array.add(Array.get(value, i));
            }
            elements = array;
        } else {
            return List.of();
        }
        return elements.stream().map(element -> element == null ? NULL : element.getClass().getName()).toList();
    }
}
