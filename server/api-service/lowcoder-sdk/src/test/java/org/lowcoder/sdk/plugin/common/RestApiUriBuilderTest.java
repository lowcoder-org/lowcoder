package org.lowcoder.sdk.plugin.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

import org.apache.http.client.utils.URIBuilder;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;

/** {@link RestApiUriBuilder}: how the url of a REST query is put together from prefix, suffix, parameters and mustache values. */
public class RestApiUriBuilderTest {

    private static final Map<String, Object> NO_PARAMS = Map.of();
    private static final Map<String, String> NO_URL_PARAMS = Map.of();

    @Test
    public void prefixAndSuffixAreTrimmedAndJoinedWithExactlyOneSlash() {
        assertEquals("https://h/x", RestApiUriBuilder.buildUri("https://h", "x", NO_PARAMS, NO_URL_PARAMS).toString());
        assertEquals("https://h/x", RestApiUriBuilder.buildUri("  https://h  ", "  x ", NO_PARAMS, NO_URL_PARAMS).toString());
        assertEquals("https://h/x", RestApiUriBuilder.buildUri("https://h", "/x", NO_PARAMS, NO_URL_PARAMS).toString());
        assertEquals("https://h/x", RestApiUriBuilder.buildUri("https://h/", "x", NO_PARAMS, NO_URL_PARAMS).toString(), "the doubled slash is collapsed");
        assertEquals("https://h", RestApiUriBuilder.buildUri("https://h", "", NO_PARAMS, NO_URL_PARAMS).toString());
        assertEquals("https://h/x", RestApiUriBuilder.buildUri("", "https://h/x", NO_PARAMS, NO_URL_PARAMS).toString(), "no prefix: the suffix is the url");
    }

    @Test
    public void anEmptyUrlIsRejectedWithItsOwnMessage() {
        PluginException failure = assertThrows(PluginException.class, () -> RestApiUriBuilder.buildUri("", " ", NO_PARAMS, NO_URL_PARAMS));
        PluginException direct = assertThrows(PluginException.class, () -> RestApiUriBuilder.buildUri("", NO_PARAMS, NO_URL_PARAMS));

        assertEquals("REQUEST_URL_EMPTY", failure.getMessageKey());
        assertEquals(PluginCommonError.QUERY_ARGUMENT_ERROR, failure.getError());
        assertEquals("REQUEST_URL_EMPTY", direct.getMessageKey());
    }

    @Test
    public void mustacheValuesAreRenderedIntoTheUrl() {
        URI uri = RestApiUriBuilder.buildUri("https://{{host}}/items/{{id}}", Map.of("host", "api.example.com", "id", 42), NO_URL_PARAMS);

        assertEquals("https://api.example.com/items/42", uri.toString());
    }

    @Test
    public void urlParametersAreAppendedInOrderAfterTheQueryOfTheUrlAndBlankNamesAreSkipped() throws Exception {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("a", "1");
        params.put("", "skipped");
        params.put("  ", "skipped too");
        params.put("b", "x y&z");

        URI uri = RestApiUriBuilder.buildUri("https://h/p?q=0", NO_PARAMS, params);

        System.out.println("[RestApiUriBuilderTest] " + uri);
        assertEquals("q=0&a=1&b=x+y%26z", uri.getRawQuery());
        assertEquals("x y&z", new URIBuilder(uri).getQueryParams().get(2).getValue(), "the value is encoded and decodes back to what was entered");
        assertEquals("/p", uri.getPath());
        assertEquals("h", uri.getHost());
    }

    @Test
    public void anUnparsableUrlIsRejectedAsInvalidRequestUrl() {
        for (String url : new String[] {"http://[bad", "http://a b/"}) {
            PluginException failure = assertThrows(PluginException.class, () -> RestApiUriBuilder.buildUri(url, NO_PARAMS, NO_URL_PARAMS), url);

            System.out.println("[RestApiUriBuilderTest] '" + url + "' -> " + failure.getMessageKey());
            assertEquals("INVALID_REQUEST_URL", failure.getMessageKey());
            assertEquals(PluginCommonError.QUERY_ARGUMENT_ERROR, failure.getError());
        }
    }
}
