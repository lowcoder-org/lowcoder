package org.lowcoder.api.contract.support;

import com.fasterxml.jackson.core.JsonPointer;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.introspect.BeanPropertyDefinition;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.util.ClassUtil;
import org.lowcoder.api.contract.support.PayloadSamples.Sample;
import org.lowcoder.api.contract.support.PayloadTypeWalker.Direction;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.bundle.model.BundleApplication;
import org.lowcoder.sdk.contract.CanonicalJson;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The comparisons shared by the Layer A goldens (docs/API_PAYLOAD_TEST_PLAN.md §4) and the Layer B endpoint tests
 * (§5.2), which compare a captured request argument "using D1's rules": {@link #assertBindsTo}, the property access
 * the adequacy criteria and the goldens use ({@link #propertyValue}), the fixture editor that keeps number lexemes
 * ({@link #FIXTURE_EDITOR}), and the arrays without a stable order ({@link #UNORDERED_ARRAYS}).
 */
public final class PayloadAssertions {

    /** Edits fixture trees without touching number lexemes ({@code 1.50} stays {@code 1.50}); not for duplicate keys. */
    public static final ObjectMapper FIXTURE_EDITOR = new ObjectMapper().enable(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS)
            .setNodeFactory(JsonNodeFactory.withExactBigDecimals(true));

    /**
     * Type → JSON pointers (from the type's own output) of arrays that production writes from a {@code HashSet} of a
     * class without {@code hashCode}, so their element order changes from run to run (plan §9 O14).
     * {@code ResponsePayloadGoldensTest#unorderedArraysComeFromSetsWithoutStableOrder} keeps the list honest; it checks
     * {@code Application#getEditingQueries}, the one set behind both entries ({@code BundleApplication} nests an
     * {@code Application}, task T3.1).
     */
    public static final Map<String, List<String>> UNORDERED_ARRAYS = Map.of(Application.class.getName(), List.of("/editingQueries"),
            BundleApplication.class.getName(), List.of("/application/editingQueries"));

    private PayloadAssertions() {
    }

    /**
     * {@code json} with the elements of the arrays at {@code pointers} sorted by their text; unchanged when there are
     * none. Limits: the document goes through a tree, which keeps number lexemes ({@link #FIXTURE_EDITOR}) but not
     * duplicate keys or escape forms, so it is meant only for the {@link #UNORDERED_ARRAYS} types, which have neither.
     */
    public static String sortUnorderedArrays(String json, List<String> pointers) {
        if (pointers.isEmpty()) {
            return json;
        }
        try {
            JsonNode tree = FIXTURE_EDITOR.readTree(json);
            for (String pointer : pointers) {
                if (tree.at(JsonPointer.compile(pointer)) instanceof ArrayNode array) {
                    List<JsonNode> elements = new ArrayList<>();
                    array.forEach(elements::add);
                    elements.sort(Comparator.comparing(JsonNode::toString));
                    array.removeAll();
                    array.addAll(elements);
                }
            }
            return FIXTURE_EDITOR.writeValueAsString(tree);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("not JSON: " + json, e);
        }
    }

    /**
     * D1's comparison (docs/API_PAYLOAD_TEST_PLAN.md §4.2): {@code actual}, bound from JSON, equals the request
     * sample. A map type is compared with {@link CanonicalJson#assertSameJava} as a whole. A bean is compared with
     * AssertJ's recursive comparison with strict type checking, and every map, collection or {@code Object} property
     * again with {@code assertSameJava}, which also pins the container classes; a container of beans (a list of auth
     * configs) only by its class, because {@code assertSameJava} compares beans by {@code equals} and the recursive
     * comparison has compared their properties. Fields that back no deserialized
     * property (for example the {@code @JsonIgnore}d {@code Organization.logoAssetId}, which the sample sets for the
     * response side) are left out of the recursive comparison, and {@code Supplier} fields (§3.3,
     * {@code Application.editingQueries}) are compared through their getters instead, ignoring collection order: the
     * sets they compute hold objects without {@code hashCode} (plan §9 O14). A getter that hands out the
     * {@code Supplier} itself (Lombok's {@code LibraryQuery#getBaseQuerySupplier}, task T6.2) is compared by what the
     * supplier supplies, which runs its computation on both sides. Limit: unbound and {@code Supplier} fields are
     * excluded by name at the top level only, so a nested bean's unbound field must be equal on both sides, and a
     * nested bean's {@code Supplier} field is compared field by field (none of today's request samples has one).
     */
    public static void assertBindsTo(Sample sample, Object actual) {
        if (sample.type().isMapLikeType()) {
            CanonicalJson.assertSameJava(sample.value(), actual);
            return;
        }
        List<BeanPropertyDefinition> deserialized = PayloadTypeWalker.beanDescription(sample.type(), Direction.REQUEST).findProperties()
                .stream().filter(BeanPropertyDefinition::couldDeserialize).toList();
        Set<String> bound = deserialized.stream().map(BeanPropertyDefinition::getInternalName).collect(Collectors.toSet());
        List<Field> suppliers = new ArrayList<>();
        List<String> unbound = new ArrayList<>();
        for (Class<?> c = sample.type().getRawClass(); c != null && c != Object.class; c = c.getSuperclass()) {
            for (Field field : c.getDeclaredFields()) {
                if (Modifier.isStatic(field.getModifiers())) {
                    continue;
                }
                if (Supplier.class.isAssignableFrom(field.getType())) {
                    suppliers.add(field);
                } else if (!bound.contains(field.getName())) {
                    unbound.add(field.getName());
                }
            }
        }
        if (!unbound.isEmpty() || !suppliers.isEmpty()) {
            System.out.println("[RequestPayloadGoldensTest] " + sample.name() + ": fields not bound from JSON " + unbound
                    + ", Supplier fields compared through their getters " + suppliers.stream().map(Field::getName).toList());
        }
        // by name: ignoringFieldsOfTypes matches a value's exact class, so it misses Guava's memoizing suppliers, and the
        // comparison would descend into their lambdas, whose captured object reports every difference a second time
        List<String> ignored = new ArrayList<>(unbound);
        suppliers.forEach(supplier -> ignored.add(supplier.getName()));
        assertThat(actual).usingRecursiveComparison().withStrictTypeChecking().ignoringFields(ignored.toArray(String[]::new))
                .isEqualTo(sample.value());
        for (Field supplier : suppliers) {
            String getter = "get" + capitalized(supplier.getName());
            Object expected = supplied(invoke(sample.value(), getter));
            Object value = supplied(invoke(actual, getter));
            System.out.println("[RequestPayloadGoldensTest] " + sample.name() + "." + getter + "() = " + value);
            assertThat(value).as(sample.name() + "." + getter + "()").usingRecursiveComparison().withStrictTypeChecking()
                    .ignoringCollectionOrder().isEqualTo(expected);
        }
        for (BeanPropertyDefinition property : deserialized) {
            JavaType propertyType = property.getPrimaryType();
            Object expectedValue = propertyValue(sample.value(), property.getInternalName());
            Object actualValue = propertyValue(actual, property.getInternalName());
            if (propertyType.isContainerType() && holdsBeans(propertyType)) {
                // CanonicalJson compares beans by equals; the recursive comparison above has compared their properties
                assertThat(actualValue == null ? null : actualValue.getClass()).as(sample.name() + "." + property.getName() + " container class")
                        .isEqualTo(expectedValue == null ? null : expectedValue.getClass());
            } else if (propertyType.isContainerType() || propertyType.isJavaLangObject()) {
                CanonicalJson.assertSameJava(expectedValue, actualValue);
            }
        }
    }

    /**
     * The value of the Java property {@code internalName} of {@code bean}: through its record accessor or getter
     * when it has one, else its field.
     */
    public static Object propertyValue(Object bean, String internalName) {
        Class<?> type = bean.getClass();
        try {
            if (type.isRecord() && Arrays.stream(type.getRecordComponents()).anyMatch(c -> c.getName().equals(internalName))) {
                return type.getMethod(internalName).invoke(bean);
            }
            for (String getter : List.of("get" + capitalized(internalName), "is" + capitalized(internalName))) {
                Method method = Arrays.stream(type.getMethods())
                        .filter(candidate -> candidate.getName().equals(getter) && candidate.getParameterCount() == 0)
                        .findFirst().orElse(null);
                if (method != null) {
                    return method.invoke(bean);
                }
            }
            for (Class<?> c = type; c != null; c = c.getSuperclass()) {
                for (Field field : c.getDeclaredFields()) {
                    if (field.getName().equals(internalName)) {
                        field.setAccessible(true);
                        return field.get(bean);
                    }
                }
            }
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("cannot read " + type.getName() + "." + internalName, e);
        }
        throw new IllegalStateException(type.getName() + " has no property " + internalName);
    }

    /**
     * Whether a container's declared elements (a map's values) are beans: not {@code Object}, not containers, not enums,
     * and not JDK classes such as {@code String}, numbers and {@code java.time} values (task T4.2: a list of auth configs).
     */
    private static boolean holdsBeans(JavaType container) {
        JavaType content = container.getContentType();
        return content != null && !content.isJavaLangObject() && !content.isContainerType() && !content.isEnumType()
                && !ClassUtil.isJDKClass(content.getRawClass());
    }

    /** {@code value}, or what it supplies when it is a {@code Supplier}. */
    private static Object supplied(Object value) {
        return value instanceof Supplier<?> supplier ? supplier.get() : value;
    }

    private static Object invoke(Object bean, String method) {
        try {
            return bean.getClass().getMethod(method).invoke(bean);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("cannot call " + bean.getClass().getName() + "." + method + "()", e);
        }
    }

    private static String capitalized(String name) {
        return Character.toUpperCase(name.charAt(0)) + name.substring(1);
    }
}
