package org.lowcoder.sdk.contract;

import com.fasterxml.jackson.databind.JsonNode;

import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * The Java state of a bound object, read from its fields, not its getters (docs/API_PAYLOAD_TEST_PLAN.md §4.7): what
 * Jackson put into the object, before any getter default ({@code getPort()} returning the default port for a
 * {@code null} field, {@code trimToEmpty}, {@code emptyIfNull}) hides it.
 *
 * <p>{@link #of} gives {@code {"values": tree, "classes": {pointer: class}}}:
 * <ul>
 *   <li>objects of {@link #DESCENDED_PACKAGE} classes and records become maps of their instance fields, declared
 *       class first, superclass fields after, in declaration order, with {@value #CLASS_KEY} naming the class;</li>
 *   <li>maps keep their iteration order; lists and arrays their order; other collections (sets) are sorted by the
 *       text of their elements, so a hash order does not reach a fixture;</li>
 *   <li>strings, numbers, booleans, enums (by name), {@code byte[]} and {@link JsonNode} are leaves as they are; any
 *       other object is a leaf by its {@code toString()};</li>
 *   <li>{@code classes} records the class of every original value by JSON pointer (RFC 6901), sets and beans
 *       included, so a value that changes class while keeping its text is caught.</li>
 * </ul>
 *
 * <p>Limits: static, synthetic and {@code @Slf4j} logger fields are skipped, and so is a superclass field hidden by a
 * subclass field of the same name; a value met again on the current path
 * (a cycle) is the leaf {@value #CYCLE}; objects outside {@link #DESCENDED_PACKAGE} are not descended, so their
 * private state is pinned only as far as {@code toString()} shows it.
 */
public final class FieldTree {

    public static final String VALUES_KEY = "values";
    public static final String CLASSES_KEY = JavaValueWalker.CLASSES_KEY;
    public static final String CLASS_KEY = "@class";
    public static final String DESCENDED_PACKAGE = "org.lowcoder.";
    public static final String CYCLE = "<cycle>";
    private static final String LOGGER_FIELD = "log";

    private FieldTree() {
    }

    /** The values and classes of {@code value}, as described above. */
    public static Map<String, Object> of(Object value) {
        Map<String, String> classes = new LinkedHashMap<>();
        Object tree = convert(JavaValueWalker.ROOT_POINTER, value, classes, Collections.newSetFromMap(new IdentityHashMap<>()));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put(VALUES_KEY, tree);
        result.put(CLASSES_KEY, classes);
        return result;
    }

    private static Object convert(String pointer, Object value, Map<String, String> classes, Set<Object> path) {
        classes.put(pointer, value == null ? JavaValueWalker.NULL : value.getClass().getName());
        if (value == null || value instanceof String || value instanceof Number || value instanceof Boolean
                || value instanceof byte[] || value instanceof JsonNode) {
            return value;
        }
        if (value instanceof Enum<?> constant) {
            return constant.name();
        }
        if (!path.add(value)) {
            return CYCLE;
        }
        try {
            if (value instanceof Map<?, ?> map) {
                Map<String, Object> converted = new LinkedHashMap<>();
                map.forEach((key, entry) -> converted.put(String.valueOf(key),
                        convert(pointer + "/" + JavaValueWalker.escape(String.valueOf(key)), entry, classes, path)));
                return converted;
            }
            if (value instanceof List<?> list) {
                return elements(pointer, list, classes, path);
            }
            if (value instanceof Collection<?> collection) {
                List<Object> sorted = new ArrayList<>(collection);
                sorted.sort(Comparator.comparing(String::valueOf));
                return elements(pointer, sorted, classes, path);
            }
            if (value.getClass().isArray()) {
                List<Object> elements = new ArrayList<>();
                for (int i = 0; i < Array.getLength(value); i++) {
                    elements.add(Array.get(value, i));
                }
                return elements(pointer, elements, classes, path);
            }
            if (value.getClass().getName().startsWith(DESCENDED_PACKAGE) || value.getClass().isRecord()) {
                return fields(pointer, value, classes, path);
            }
            return String.valueOf(value);
        } finally {
            path.remove(value);
        }
    }

    private static List<Object> elements(String pointer, List<?> elements, Map<String, String> classes, Set<Object> path) {
        List<Object> converted = new ArrayList<>();
        for (int i = 0; i < elements.size(); i++) {
            converted.add(convert(pointer + "/" + i, elements.get(i), classes, path));
        }
        return converted;
    }

    private static Map<String, Object> fields(String pointer, Object bean, Map<String, String> classes, Set<Object> path) {
        Map<String, Object> converted = new LinkedHashMap<>();
        converted.put(CLASS_KEY, bean.getClass().getName());
        for (Class<?> type = bean.getClass(); type != null && type != Object.class; type = type.getSuperclass()) {
            for (Field field : type.getDeclaredFields()) {
                if (Modifier.isStatic(field.getModifiers()) || field.isSynthetic() || LOGGER_FIELD.equals(field.getName())
                        || converted.containsKey(field.getName())) {
                    continue;
                }
                field.setAccessible(true);
                try {
                    converted.put(field.getName(), convert(pointer + "/" + JavaValueWalker.escape(field.getName()), field.get(bean), classes, path));
                } catch (IllegalAccessException e) {
                    throw new IllegalStateException("cannot read field " + type.getName() + "." + field.getName(), e);
                }
            }
        }
        return converted;
    }
}
