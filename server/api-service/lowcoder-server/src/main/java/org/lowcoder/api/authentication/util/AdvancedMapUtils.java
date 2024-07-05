package org.lowcoder.api.authentication.util;

import java.util.Map;

public class AdvancedMapUtils {

    /**
     * Retrieves a string value from a nested map structure using a key format that supports array indices and nested objects.
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
                int endIdx = part.indexOf(']');
                String arrayKey = part.substring(0, startIdx);
                int index = Integer.parseInt(part.substring(startIdx + 1, endIdx));

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
}