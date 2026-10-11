package org.lowcoder.plugin.mysql;

import org.junit.jupiter.api.function.Executable;

import java.util.MissingResourceException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Pins the plan section 9 row "mysqlPlugin's empty locale.properties and locale_en.properties shadow the sdk bundle"
 * (D-6: fix deferred): where a PluginException is expected, constructing it throws a MissingResourceException with key
 * INTERNAL_SERVER_ERROR instead. A fix (removing the two files) changes the tests that use this on purpose, and also the
 * "empty" case of the fixture {@code config-binding/MysqlQueryConfig.json} pinned by {@code MysqlConfigBindingContractTest}
 * (it records the missing-resource text today): whoever fixes it regenerates that fixture. Kept apart from
 * {@link MysqlContainerSupport} so the tests that need no server do not start the container. Not a test.
 */
final class EmptyLocaleBundle {

    static final String KEY = "INTERNAL_SERVER_ERROR";

    private EmptyLocaleBundle() {
    }

    static MissingResourceException assertThrown(Executable action) {
        MissingResourceException thrown = assertThrows(MissingResourceException.class, action);
        assertEquals(KEY, thrown.getKey(), thrown.getMessage());
        return thrown;
    }
}
