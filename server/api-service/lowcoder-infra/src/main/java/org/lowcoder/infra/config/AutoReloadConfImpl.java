package org.lowcoder.infra.config;

import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.config.dynamic.Conf;

import java.util.function.Function;

import static org.apache.commons.lang3.ObjectUtils.firstNonNull;

/**
 * A configuration value read from {@link AutoReloadConfigFactory} and resolved from its string form, which is resolved
 * again only when the string changes. An absent string, a string the resolver cannot resolve (it throws) and a string it
 * resolves to null all give the default, on every read until the string changes (BF-082: a string that could not be
 * resolved used to give the default on the first read only and then the value resolved from the string before it).
 * <p>
 * Limits: the resolution of one string is not shared between threads that read it for the first time at once, so the
 * resolver can run more than once for it; a resolver failure is not logged here.
 */
class AutoReloadConfImpl<T> implements Conf<T> {

    private final String confKey;
    private final T defaultValue;
    private final Function<String, T> valueResolver;
    private final AutoReloadConfigFactory autoReloadConfigFactory;

    /** The last string read and what it resolved to (null when it could not be resolved), replaced together. */
    private volatile Resolved<T> resolved;

    public AutoReloadConfImpl(String confKey, T defaultValue,
            AutoReloadConfigFactory autoReloadConfigFactory,
            Function<String, T> strValueResolver) {
        this.confKey = confKey;
        this.defaultValue = defaultValue;
        this.autoReloadConfigFactory = autoReloadConfigFactory;
        this.valueResolver = strValueResolver;
    }

    @Override
    public T get() {
        String currentStrValue = autoReloadConfigFactory.getValue(confKey);
        if (currentStrValue == null) {
            return defaultValue;
        }

        Resolved<T> last = resolved;
        if (last != null && StringUtils.equals(last.strValue(), currentStrValue)) {
            return firstNonNull(last.value(), defaultValue);
        }

        Resolved<T> current = new Resolved<>(currentStrValue, resolve(currentStrValue));
        resolved = current;
        return firstNonNull(current.value(), defaultValue);
    }

    /** The value of {@code strValue}, or null when the resolver throws. */
    private T resolve(String strValue) {
        try {
            return valueResolver.apply(strValue);
        } catch (Exception e) {
            return null;
        }
    }

    private record Resolved<T>(String strValue, T value) {
    }
}
