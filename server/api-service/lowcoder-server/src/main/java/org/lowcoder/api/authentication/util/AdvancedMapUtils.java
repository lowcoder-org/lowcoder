package org.lowcoder.api.authentication.util;

import org.bson.Document;

import java.util.HashMap;
import java.util.Map;

public class AdvancedMapUtils {

    /** What {@link #parseIndex} answers for an index that is not a number between brackets. */
    private static final int MALFORMED_INDEX = -1;

    /**
     * Retrieves a string value from a nested map structure using a key format that supports array indices and nested objects.
     * <p>
     * A malformed index ({@code abc[x]}, {@code abc[]}, {@code abc[0} without the closing bracket, a number too large for an
     * int) finds nothing, like a missing key, instead of throwing (BF-074): the key is an admin's source mapping, read at
     * every login of the provider.
     * <p>
     * Limits: what follows the first closing bracket of a part is ignored, so {@code abc[0]x} and {@code abc[0][1]} read
     * {@code abc[0]}; a sign is accepted ({@code abc[+1]} reads index 1).
     *
     * @param map The map from which to retrieve the value.
     * @param key The key in the format "abc[0].def.hi".
     * @return The string value if found, otherwise null.
     */
    public static String getString(Map<String, Object> map, String key) {
        if(key == null || key.equals("false")) return null;
        String[] parts = key.split("\\.");
        Object current = map;

        for (String part : parts) {
            if (current == null) {
                return null;
            }

            if (part.contains("[")) {
                int startIdx = part.indexOf('[');
                String arrayKey = part.substring(0, startIdx);
                int index = parseIndex(part, startIdx);

                if (!(current instanceof Map)) {
                    return null;
                }

                current = ((Map<String, Object>) current).get(arrayKey);

                if (current instanceof java.util.List) {
                    java.util.List<?> list = (java.util.List<?>) current;
                    if (index < 0 || index >= list.size()) {
                        return null;
                    }
                    current = list.get(index);
                } else {
                    return null;
                }
            } else {
                if (!(current instanceof Map)) {
                    return null;
                }
                current = ((Map<String, Object>) current).get(part);
            }
        }

        return current!=null?current.toString():null;
    }

    /** The number between the bracket at {@code startIdx} and the next closing bracket, or {@link #MALFORMED_INDEX}. */
    private static int parseIndex(String part, int startIdx) {
        int endIdx = part.indexOf(']', startIdx);
        if (endIdx < 0) {
            return MALFORMED_INDEX;
        }
        try {
            return Integer.parseInt(part.substring(startIdx + 1, endIdx));
        } catch (NumberFormatException e) {
            return MALFORMED_INDEX;
        }
    }

    public static Map<String, Object> documentToMap(Document document) {
        if (document == null) {
            return new HashMap<>();
        }

        Map<String, Object> map = new HashMap<>();
        for (Map.Entry<String, Object> entry : document.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof Document) {
                // Recursively convert nested Document
                map.put(entry.getKey(), documentToMap((Document) value));
            } else {
                map.put(entry.getKey(), value);
            }
        }
        return map;
    }

}