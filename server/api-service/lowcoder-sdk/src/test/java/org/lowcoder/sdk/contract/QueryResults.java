package org.lowcoder.sdk.contract;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.util.RawValue;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.util.JsonUtils;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * The §4.6 producer pin of docs/API_PAYLOAD_TEST_PLAN.md: what a plugin puts into {@link QueryExecutionResult} and
 * what the production mapper writes for it. The server wraps the result in {@code QueryResultView} (its own pin is
 * task T5.3); this one is the plugin side, where the Java values are made.
 *
 * <p>{@link #report} gives {@code {"queryCode", "messageKey", "headers", "dataShape", "written"}}:
 * <ul>
 *   <li>{@value #MESSAGE_KEY_KEY} (error results): the message key, which the mapper does not write (its arguments,
 *       which can hold hosts and ports, are not pinned);</li>
 *   <li>{@value #DATA_SHAPE_KEY}: the class of every value of {@code data} by JSON pointer and the key order of
 *       every object ({@link JavaValueWalker}), so a value that changes class while its JSON stays the same is seen;
 *   </li>
 *   <li>{@value #WRITTEN_KEY}: the exact text the production mapper writes for the whole result;</li>
 *   <li>{@value #HEADERS_KEY} (REST and GraphQL results) with the given volatile header names removed, from the
 *       headers and from the written text.</li>
 * </ul>
 *
 * <p>Limits: the walk descends maps, lists and JSON trees; any other value (arrays, JDBC objects, Google API response
 * objects) is one leaf recorded by its class, and its content is pinned through the written text only.
 */
public final class QueryResults {

    public static final String QUERY_CODE_KEY = "queryCode";
    public static final String MESSAGE_KEY_KEY = "messageKey";
    public static final String HEADERS_KEY = "headers";
    public static final String DATA_SHAPE_KEY = "dataShape";
    public static final String WRITTEN_KEY = "written";
    public static final String ERROR_KEY = "error";
    /** The header every answer of the JDK server carries with the current time. */
    public static final String DATE_HEADER = "Date";

    private QueryResults() {
    }

    /** The report of one result, with {@code volatileHeaders} removed from its headers first. */
    public static Map<String, Object> report(QueryExecutionResult result, Set<String> volatileHeaders) {
        if (result.getHeaders() instanceof ObjectNode headers) {
            volatileHeaders.forEach(headers::remove);
        }
        Map<String, Object> report = new LinkedHashMap<>();
        report.put(QUERY_CODE_KEY, result.getQueryCode());
        if (result.getLocaleMessage() != null) {
            report.put(MESSAGE_KEY_KEY, result.getLocaleMessage().messageKey());
        }
        if (result.getHeaders() != null) {
            report.put(HEADERS_KEY, result.getHeaders());
        }
        report.put(DATA_SHAPE_KEY, JavaValueWalker.shape(result.getData()));
        report.put(WRITTEN_KEY, written(result));
        return report;
    }

    /** The report of a result without headers. */
    public static Map<String, Object> report(QueryExecutionResult result) {
        return report(result, Set.of());
    }

    /** The text the production mapper writes for {@code value}, embedded raw, or the error of the write. */
    public static Object written(Object value) {
        try {
            return new RawValue(JsonUtils.getObjectMapper().writeValueAsString(value));
        } catch (JsonProcessingException | RuntimeException e) {
            return Map.of(ERROR_KEY, ConfigBinding.errorText(e));
        }
    }
}
