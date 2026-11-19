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

    /** The query of GitHub issue #1929, as typed into the url field. */
    static final String ISSUE_1929_URL = "https://graph.microsoft.com/v1.0/devices?$filter=displayName eq 'computername'";

    /**
     * NEW-19 (GitHub #1929): spaces in the query, typed or from a {@code {{ }}} value, are sent as {@code %20} instead of
     * failing with INVALID_REQUEST_URL, and the query decodes back to what was entered. Catches: the url handed to the
     * parser unencoded.
     */
    @Test
    public void spacesInTheQueryAreSentPercentEncodedNEW19() {
        URI typed = RestApiUriBuilder.buildUri(ISSUE_1929_URL, NO_PARAMS, NO_URL_PARAMS);
        URI rendered = RestApiUriBuilder.buildUri("https://graph.microsoft.com/v1.0/devices?$filter={{f}}",
                Map.of("f", "displayName eq 'computername'"), NO_URL_PARAMS);

        System.out.println("[RestApiUriBuilderTest] NEW-19 typed -> " + typed + " ; rendered -> " + rendered);
        assertEquals("https://graph.microsoft.com/v1.0/devices?$filter=displayName%20eq%20'computername'", typed.toString());
        assertEquals(typed, rendered);
        assertEquals("$filter=displayName eq 'computername'", typed.getQuery());
    }

    /**
     * NEW-19: every character a URI cannot hold in the path, query or fragment is encoded once, a non-ASCII control or space
     * character as its UTF-8 bytes; an existing escape, reserved characters and non-ASCII letters are kept; a {@code %} that
     * starts no escape becomes {@code %25}; a second {@code #} is encoded.
     * Catches: double encoding, a character left out, the authority touched, a non-ASCII character encoded wrongly or at all.
     */
    @Test
    public void illegalCharactersAreEncodedOnceAndEscapesAndReservedCharactersAreKeptNEW19() {
        String[][] cases = {
                {"https://h/a b?q=x y#f g", "https://h/a%20b?q=x%20y#f%20g"},
                {"https://h/p?q=\"<>\\^`{|}[]", "https://h/p?q=%22%3C%3E%5C%5E%60%7B%7C%7D%5B%5D"},
                {"https://h/p?q=a%20b&r=50%&s=%2", "https://h/p?q=a%20b&r=50%25&s=%252"},
                {"https://h/p?q=a:b@c/d;e=f,g+h!$&'()*~._-", "https://h/p?q=a:b@c/d;e=f,g+h!$&'()*~._-"},
                {"https://h/p#a#b", "https://h/p#a%23b"},
                {"https://user:pw@h:8080/p?q=1\t2", "https://user:pw@h:8080/p?q=1%092"},
                {"https://h?q=a b", "https://h?q=a%20b"},
                {"https://h/p?q=a\u0085b\u00a0c\u3000d\u2028e", "https://h/p?q=a%C2%85b%C2%A0c%E3%80%80d%E2%80%A8e"},
                {"https://h/p?q=\u017e\u00e9", "https://h/p?q=\u017e\u00e9"},
        };
        for (String[] c : cases) {
            String encoded = RestApiUriBuilder.encodeIllegalCharacters(c[0]);
            System.out.println("[RestApiUriBuilderTest] NEW-19 '" + c[0] + "' -> '" + encoded + "'");
            assertEquals(c[1], encoded, c[0]);
            assertEquals(c[1], RestApiUriBuilder.encodeIllegalCharacters(encoded), "encoding is idempotent: " + c[0]);
            assertEquals(c[1], RestApiUriBuilder.buildUri(c[0], NO_PARAMS, NO_URL_PARAMS).toString(), "the parser accepts it: " + c[0]);
        }
        assertEquals("http://a b/x%20y", RestApiUriBuilder.encodeIllegalCharacters("http://a b/x y"), "the authority is left as typed");
    }

    /** NEW-19: with a Parameters table entry the typed query is re-encoded form-style, as before (T54); its spaces arrive as spaces. */
    @Test
    public void aSpaceTypedBeforeAParametersTableEntryDecodesBackNEW19() throws Exception {
        URI uri = RestApiUriBuilder.buildUri("https://h/p?typed=a b", NO_PARAMS, Map.of("p", "1"));

        System.out.println("[RestApiUriBuilderTest] NEW-19 with a table entry -> " + uri);
        assertEquals("typed=a+b&p=1", uri.getRawQuery());
        assertEquals("a b", new URIBuilder(uri).getQueryParams().get(0).getValue());
    }
}
