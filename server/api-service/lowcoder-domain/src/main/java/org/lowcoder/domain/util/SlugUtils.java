package org.lowcoder.domain.util;

public class SlugUtils {
    public static Boolean validate(String slug) {
        return slug.matches("^[a-zA-Z0-9_-]*$");
    }
}
