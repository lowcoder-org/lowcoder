package org.lowcoder.sdk.contract;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The Java shape of a value read from JSON (docs/API_PAYLOAD_TEST_PLAN.md §4.6, §4.9): the class of every value by
 * JSON pointer (RFC 6901), and the iteration order of every object's keys. The canonical JSON comparison ignores both,
 * so a test that depends on which Java class a number or a container becomes pins this shape in a fixture.
 *
 * <p>Limits: maps, lists and {@link JsonNode} containers are descended; any other object, a bean included, is one
 * leaf recorded by its class.
 */
public final class JavaValueWalker {

    public static final String ROOT_POINTER = "";
    public static final String NULL = "null";
    public static final String CLASSES_KEY = "classes";
    public static final String KEY_ORDER_KEY = "keyOrder";

    private JavaValueWalker() {
    }

    /** {@code {"classes": {pointer: class}, "keyOrder": {pointer: [keys]}}} of {@code value}, in walk order. */
    public static Map<String, Object> shape(Object value) {
        Map<String, String> classes = new LinkedHashMap<>();
        Map<String, List<String>> keyOrder = new LinkedHashMap<>();
        walk(ROOT_POINTER, value, classes, keyOrder);
        Map<String, Object> shape = new LinkedHashMap<>();
        shape.put(CLASSES_KEY, classes);
        shape.put(KEY_ORDER_KEY, keyOrder);
        return shape;
    }

    /** Records the class of {@code value} at {@code pointer}, and recurses into maps, lists and JSON containers. */
    public static void walk(String pointer, Object value, Map<String, String> classes, Map<String, List<String>> keyOrder) {
        classes.put(pointer, value == null ? NULL : value.getClass().getName());
        if (value instanceof Map<?, ?> map) {
            List<String> keys = new ArrayList<>();
            map.forEach((key, entry) -> {
                keys.add(String.valueOf(key));
                walk(pointer + "/" + escape(String.valueOf(key)), entry, classes, keyOrder);
            });
            keyOrder.put(pointer, keys);
        } else if (value instanceof List<?> list) {
            for (int i = 0; i < list.size(); i++) {
                walk(pointer + "/" + i, list.get(i), classes, keyOrder);
            }
        } else if (value instanceof JsonNode node && node.isObject()) {
            List<String> keys = new ArrayList<>();
            for (Iterator<Map.Entry<String, JsonNode>> fields = node.fields(); fields.hasNext(); ) {
                Map.Entry<String, JsonNode> field = fields.next();
                keys.add(field.getKey());
                walk(pointer + "/" + escape(field.getKey()), field.getValue(), classes, keyOrder);
            }
            keyOrder.put(pointer, keys);
        } else if (value instanceof JsonNode node && node.isArray()) {
            for (int i = 0; i < node.size(); i++) {
                walk(pointer + "/" + i, node.get(i), classes, keyOrder);
            }
        }
    }

    /** RFC 6901 escaping of one reference token. */
    public static String escape(String token) {
        return token.replace("~", "~0").replace("/", "~1");
    }
}
