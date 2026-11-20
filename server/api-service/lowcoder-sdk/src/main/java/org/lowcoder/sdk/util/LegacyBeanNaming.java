package org.lowcoder.sdk.util;

import tools.jackson.databind.PropertyNamingStrategy;
import tools.jackson.databind.cfg.MapperConfig;
import tools.jackson.databind.introspect.AnnotatedMethod;

/**
 * Names the properties of getters and setters as Jackson 2 did.
 *
 * <p>Jackson 2 lower-cased the whole leading run of upper-case letters of an accessor name ({@code getSQLTypeName} became
 * {@code sqltypeName}, {@code getURL} became {@code url}); Jackson 3 follows the JavaBeans rule and keeps a name that
 * starts with two upper-case letters ({@code SQLTypeName}, {@code URL}). The strategy receives the Jackson 3 name and
 * lower-cases that leading run, which gives the Jackson 2 name in every case. Field names and constructor parameter
 * names are left as they are, as they were in Jackson 2.
 *
 * <p>Limit: it renames only properties that Jackson names implicitly. A name given with {@code @JsonProperty} is never
 * passed through it.
 */
public final class LegacyBeanNaming extends PropertyNamingStrategy {

    @Override
    public String nameForGetterMethod(MapperConfig<?> config, AnnotatedMethod method, String defaultName) {
        return lowerCaseLeadingRun(defaultName);
    }

    @Override
    public String nameForSetterMethod(MapperConfig<?> config, AnnotatedMethod method, String defaultName) {
        return lowerCaseLeadingRun(defaultName);
    }

    /** {@code SQLTypeName} to {@code sqltypeName}; a name that does not start with an upper-case letter is returned as it is. */
    static String lowerCaseLeadingRun(String name) {
        int end = 0;
        while (end < name.length() && Character.isUpperCase(name.charAt(end))) {
            end++;
        }
        if (end == 0) {
            return name;
        }
        return name.substring(0, end).toLowerCase() + name.substring(end);
    }
}
