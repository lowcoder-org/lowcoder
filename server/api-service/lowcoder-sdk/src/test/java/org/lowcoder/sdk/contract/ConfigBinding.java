package org.lowcoder.sdk.contract;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.util.RawValue;
import org.lowcoder.sdk.config.JsonViews;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.util.JsonUtils;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Group {@code config-binding} of docs/API_PAYLOAD_TEST_PLAN.md §4.7 and §4.10: a datasource or query config map
 * becomes a config object through {@code fromJson(toJson(map), Type.class)}, so a Jackson upgrade that changes
 * creator selection, aliases, coercion of scalars, unknown properties or polymorphic type ids changes what a plugin
 * connects with or runs.
 *
 * <p>The input fixture is a JSON object of named <em>forms</em>, each one config map as the client sends it (for
 * example canonical names, alias names, scalars as strings). It is read by the production mapper, as the server
 * reads a request or MongoDB hands back a stored config. Each named entry point (the real {@code buildFrom},
 * {@code from}, {@code resolveConfig} or dispatch) is applied to each form, and the report pins, per entry point and
 * form:
 * <ul>
 *   <li>{@value #CLASS_KEY}, and the bound state read from the fields ({@link FieldTree}: {@value #FIELDS_KEY} and
 *       {@value #CLASSES_KEY}), so getter defaults cannot hide a binding change;</li>
 *   <li>the object written by the production mapper with no view, the {@code Public} view and the {@code Internal}
 *       view ({@value #NO_VIEW_KEY}, {@value #PUBLIC_KEY}, {@value #INTERNAL_KEY}), as the exact text it writes;</li>
 *   <li>or {@value #ERROR_KEY}, the exception of the entry point or of a write ({@link #errorText});</li>
 *   <li>{@value #UNKNOWN_PROPERTY_KEY}: the first form with the extra key {@value #UNKNOWN_PROPERTY} added, which
 *       must bind as without it while {@code FAIL_ON_UNKNOWN_PROPERTIES} stays off.</li>
 * </ul>
 * The report is compared with the golden by the §1.2 contract ({@link GoldenJson#assertJson}).
 *
 * <p>Limits: an entry point is called with a fresh copy of the form; what it does after binding (rendering,
 * connecting) is the business of other groups. The written text is embedded raw, so its number lexemes are pinned,
 * but the canonical comparison ignores member order.
 */
public final class ConfigBinding {

    public static final String CLASS_KEY = "class";
    public static final String FIELDS_KEY = "fields";
    public static final String CLASSES_KEY = "classes";
    public static final String NO_VIEW_KEY = "noView";
    public static final String PUBLIC_KEY = "Public";
    public static final String INTERNAL_KEY = "Internal";
    public static final String ERROR_KEY = "error";
    public static final String UNKNOWN_PROPERTY_KEY = "unknownProperty";
    public static final String UNKNOWN_PROPERTY = "contractUnknownProperty";
    public static final String UNKNOWN_PROPERTY_IGNORED = "ignored: binds as form ";
    private static final String REPORT_PREFIX = "[ConfigBinding] ";

    private static final ObjectMapper MAPPER = JsonUtils.getObjectMapper();

    private ConfigBinding() {
    }

    /**
     * Applies every entry point to every form of {@code inputFixture} and compares the report with
     * {@code reportFixture}. Returns the report, for further assertions.
     */
    public static Map<String, Object> assertBinding(GoldenJson golden, String inputFixture, String reportFixture,
            Map<String, Function<Map<String, Object>, ?>> entryPoints) {
        Map<String, Map<String, Object>> forms = forms(golden.read(inputFixture));
        Map<String, Object> report = report(forms, entryPoints);
        String actual = write(report);
        System.out.println(REPORT_PREFIX + inputFixture + " -> " + reportFixture + "\n" + actual);
        golden.assertJson(reportFixture, actual);
        return report;
    }

    /** Two named entry points of one config class, in this order. */
    public static Map<String, Function<Map<String, Object>, ?>> entryPoints(String firstName, Function<Map<String, Object>, ?> first,
            String secondName, Function<Map<String, Object>, ?> second) {
        Map<String, Function<Map<String, Object>, ?>> entryPoints = new LinkedHashMap<>();
        entryPoints.put(firstName, first);
        entryPoints.put(secondName, second);
        return entryPoints;
    }

    /** The named forms of an input fixture, read by the production mapper. */
    public static Map<String, Map<String, Object>> forms(String json) {
        try {
            return MAPPER.readValue(json, new TypeReference<LinkedHashMap<String, Map<String, Object>>>() {
            });
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("config-binding input is not an object of forms: " + e.getOriginalMessage(), e);
        }
    }

    /** {@code {entry point: {form: result, ..., "unknownProperty": ...}}}. */
    public static Map<String, Object> report(Map<String, Map<String, Object>> forms,
            Map<String, Function<Map<String, Object>, ?>> entryPoints) {
        if (forms.isEmpty() || entryPoints.isEmpty()) {
            throw new IllegalArgumentException("config-binding needs at least one form and one entry point");
        }
        Map<String, Object> report = new LinkedHashMap<>();
        entryPoints.forEach((name, entryPoint) -> {
            Map<String, Object> results = new LinkedHashMap<>();
            forms.forEach((form, config) -> results.put(form, result(entryPoint, config)));
            Map.Entry<String, Map<String, Object>> first = forms.entrySet().iterator().next();
            Map<String, Object> withUnknown = new LinkedHashMap<>(first.getValue());
            withUnknown.put(UNKNOWN_PROPERTY, RepresentativeInput.map());
            Map<String, Object> unknown = result(entryPoint, withUnknown);
            results.put(UNKNOWN_PROPERTY_KEY, write(unknown).equals(write(results.get(first.getKey())))
                    ? UNKNOWN_PROPERTY_IGNORED + first.getKey() : unknown);
            report.put(name, results);
        });
        return report;
    }

    /** The bound object of one entry point and form, or its error. */
    public static Map<String, Object> result(Function<Map<String, Object>, ?> entryPoint, Map<String, Object> config) {
        Map<String, Object> result = new LinkedHashMap<>();
        Object bound;
        try {
            bound = entryPoint.apply(new LinkedHashMap<>(config));
        } catch (RuntimeException e) {
            result.put(ERROR_KEY, errorText(e));
            return result;
        }
        result.put(CLASS_KEY, bound == null ? JavaValueWalker.NULL : bound.getClass().getName());
        Map<String, Object> state = FieldTree.of(bound);
        result.put(FIELDS_KEY, state.get(FieldTree.VALUES_KEY));
        result.put(CLASSES_KEY, state.get(FieldTree.CLASSES_KEY));
        result.put(NO_VIEW_KEY, written(bound, null));
        result.put(PUBLIC_KEY, written(bound, JsonViews.Public.class));
        result.put(INTERNAL_KEY, written(bound, JsonViews.Internal.class));
        return result;
    }

    /**
     * The text of a failure as tests pin it: a {@link PluginException} by its class, error and message key (its
     * message is localized), anything else by its class and message.
     */
    public static String errorText(Throwable error) {
        if (error instanceof PluginException plugin) {
            return plugin.getClass().getName() + ": " + plugin.getError() + " " + plugin.getMessageKey();
        }
        return error.getClass().getName() + ": " + error.getMessage();
    }

    /** The report as pretty-printed text of the production mapper. */
    public static String write(Object report) {
        try {
            return MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(report);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("cannot write config-binding report", e);
        }
    }

    private static Object written(Object bound, Class<?> view) {
        try {
            return new RawValue(view == null ? MAPPER.writeValueAsString(bound) : MAPPER.writerWithView(view).writeValueAsString(bound));
        } catch (JsonProcessingException | RuntimeException e) {
            return Map.of(ERROR_KEY, errorText(e));
        }
    }
}
