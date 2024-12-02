package org.lowcoder.domain.query.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginException;

public class QueryTimeoutUtilsTest {

    private static final int MAX_QUERY_TIMEOUT = 30; // 30 seconds

    private final QueryTimeoutUtils queryTimeoutUtils = new QueryTimeoutUtils();
    @BeforeEach
    public void setUp() {
        // Set the default query timeout to 10 seconds (10000 milliseconds)
        queryTimeoutUtils.setDefaultQueryTimeoutMillis(10);
    }

    @Test
    public void testParseQueryTimeoutMs_withValidSeconds() {
        // Test parsing a valid timeout in seconds
        int timeout = QueryTimeoutUtils.parseQueryTimeoutMs("5s", MAX_QUERY_TIMEOUT);
        assertEquals(5000, timeout);
    }

    @Test
    public void testParseQueryTimeoutMs_withValidMilliseconds() {
        // Test parsing a valid timeout in milliseconds
        int timeout = QueryTimeoutUtils.parseQueryTimeoutMs("500ms", MAX_QUERY_TIMEOUT);
        assertEquals(500, timeout);
    }

    @Test
    public void testParseQueryTimeoutMs_withDefaultTimeout() {
        // Test when the timeout string is null or blank, should return default timeout
        int timeout = QueryTimeoutUtils.parseQueryTimeoutMs("", MAX_QUERY_TIMEOUT);
        assertEquals(10000, timeout); // Default is 10 seconds (10000 milliseconds)
    }

    @Test
    public void testParseQueryTimeoutMs_withExceedingMaxTimeout() {
        // Test when the timeout exceeds the maximum allowed timeout
        assertThrows(PluginException.class, () -> {
            QueryTimeoutUtils.parseQueryTimeoutMs("60s", MAX_QUERY_TIMEOUT);
        });
    }

    @Test
    public void testParseQueryTimeoutMs_withInvalidTimeout() {
        // Test when the timeout string is invalid
        assertThrows(PluginException.class, () -> {
            QueryTimeoutUtils.parseQueryTimeoutMs("invalid", MAX_QUERY_TIMEOUT);
        });
    }

    @Test
    public void testParseQueryTimeoutMs_withTemplateString() {
        // Test parsing a template string that includes a parameter
        Map<String, Object> params = new HashMap<>();
        params.put("timeoutValue", 5); // 5 seconds

        int timeout = QueryTimeoutUtils.parseQueryTimeoutMs("{{timeoutValue}}s", params, MAX_QUERY_TIMEOUT);
        assertEquals(5000, timeout);
    }

    @Test
    public void testParseQueryTimeoutMs_withDefaultTimeoutExceedingMax() {
        // Test when the default timeout exceeds the maximum allowed timeout
        queryTimeoutUtils.setDefaultQueryTimeoutMillis(40); // Set default to 40 seconds

        int timeout = QueryTimeoutUtils.parseQueryTimeoutMs("", MAX_QUERY_TIMEOUT);
        assertEquals(30000, timeout); // Max query timeout is 30 seconds (30000 milliseconds)
    }
}