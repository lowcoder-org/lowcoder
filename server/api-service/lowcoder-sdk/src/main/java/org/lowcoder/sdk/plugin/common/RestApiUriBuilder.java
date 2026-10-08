package org.lowcoder.sdk.plugin.common;

import org.apache.commons.lang3.StringUtils;
import org.apache.http.client.utils.URIBuilder;
import org.lowcoder.sdk.exception.PluginException;

import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;
import static org.lowcoder.sdk.util.ExceptionUtils.wrapException;
import static org.lowcoder.sdk.util.MustacheHelper.renderMustacheString;

public final class RestApiUriBuilder {

    /** A run of slashes, except the one after a scheme: the doubled slash a join of host and path leaves behind. */
    private static final Pattern REDUNDANT_SLASHES = Pattern.compile("(?<!http:|https:)/{2,}");
    private static final String SLASH = "/";
    /** The characters that end the path of a URL: the start of its query and of its fragment. */
    private static final String PATH_END_CHARS = "?#";

    /** A scheme and the {@code //} that starts an authority, as at the start of an absolute url. */
    private static final Pattern SCHEME_AND_AUTHORITY_START = Pattern.compile("^[A-Za-z][A-Za-z0-9+.-]*://");
    /** The characters that end an authority: the start of its path, its query and its fragment. */
    private static final String AUTHORITY_END_CHARS = "/?#";
    /** ASCII characters a URI cannot hold in its path, query or fragment (besides space and control characters). */
    private static final String ILLEGAL_URI_CHARS = "\"<>\\^`{|}[]";
    private static final char PERCENT = '%';
    private static final char FRAGMENT_START = '#';
    private static final int ESCAPE_LENGTH = 3;
    private static final int BYTE_MASK = 0xff;
    private static final int HEX_RADIX = 16;

    private RestApiUriBuilder() {
    }

    public static URI buildUri(String urlPrefix, String urlSuffix, Map<String, Object> paramsMap,
            Map<String, String> urlParams) {
        String trimmedPrefix = urlPrefix.trim();
        String trimmedSuffix = urlSuffix.trim();

        String url;
        if (StringUtils.isNotEmpty(trimmedPrefix) &&
                StringUtils.isNotEmpty(trimmedSuffix) && !trimmedSuffix.startsWith("/")) {
            url = trimmedPrefix + "/" + trimmedSuffix;
        } else {
            url = trimmedPrefix + trimmedSuffix;
        }
        return buildUri(url, paramsMap, urlParams);
    }

    public static URI buildUri(String url, Map<String, Object> paramsMap, Map<String, String> urlParams) {
        if (StringUtils.isEmpty(url)) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, "REQUEST_URL_EMPTY");
        }

        url = renderMustacheString(url, paramsMap);
        url = collapseRedundantSlashes(url);
        url = encodeIllegalCharacters(url);

        URIBuilder uriBuilder;
        try {
            uriBuilder = new URIBuilder(url);
        } catch (URISyntaxException e) {
            throw wrapException(QUERY_ARGUMENT_ERROR, "INVALID_REQUEST_URL", e);
        }

        urlParams.forEach((param, value) -> {
            if (StringUtils.isBlank(param)) {
                return;
            }
            uriBuilder.addParameter(param, value);
        });
        try {
            return uriBuilder.build();
        } catch (URISyntaxException e) {
            throw wrapException(QUERY_ARGUMENT_ERROR, "INVALID_REQUEST_URL", e);
        }
    }

    /**
     * The url with the ASCII characters a URI cannot hold in its path, query and fragment percent-encoded (NEW-19, GitHub
     * #1929: {@code ?$filter=displayName eq 'x'}, typed or from a {@code {{ }}} value, failed with INVALID_REQUEST_URL): a
     * space or control character, ASCII or not (what {@link URI} refuses: {@link Character#isSpaceChar} and
     * {@link Character#isISOControl}, e.g. a tab, U+0085 or U+00A0), {@code " < > \ ^ ` { | } [ ]}, a {@code %} that does
     * not start a {@code %XX} escape, and every {@code #} after the first, each as its UTF-8 bytes. Existing escapes,
     * reserved characters and other non-ASCII characters stay as they are, so nothing is encoded twice.
     * <p>
     * Limits: the scheme and the authority (up to the first {@code /}, {@code ?} or {@code #} after {@code ://}) are left
     * as they are, so a space in a host is still INVALID_REQUEST_URL; a url without a scheme is treated as path onward;
     * non-ASCII letters are left for the URI to send as it does without this method.
     * Applying it twice gives the same url (the GraphQL executor parses its url with it before building the request).
     */
    public static String encodeIllegalCharacters(String url) {
        int start = 0;
        Matcher scheme = SCHEME_AND_AUTHORITY_START.matcher(url);
        if (scheme.find()) {
            int authorityEnd = StringUtils.indexOfAny(url.substring(scheme.end()), AUTHORITY_END_CHARS);
            start = authorityEnd < 0 ? url.length() : scheme.end() + authorityEnd;
        }
        StringBuilder encoded = new StringBuilder(url.substring(0, start));
        boolean inFragment = false;
        for (int i = start; i < url.length(); i++) {
            char c = url.charAt(i);
            boolean illegal = Character.isSpaceChar(c) || Character.isISOControl(c) || ILLEGAL_URI_CHARS.indexOf(c) >= 0
                    || (c == PERCENT && !startsAnEscape(url, i))
                    || (c == FRAGMENT_START && inFragment);
            if (c == FRAGMENT_START) {
                inFragment = true;
            }
            if (illegal) {
                for (byte b : String.valueOf(c).getBytes(StandardCharsets.UTF_8)) {
                    encoded.append(PERCENT).append(String.format("%02X", b & BYTE_MASK));
                }
            } else {
                encoded.append(c);
            }
        }
        return encoded.toString();
    }

    private static boolean startsAnEscape(String url, int percentIndex) {
        return percentIndex + ESCAPE_LENGTH <= url.length()
                && Character.digit(url.charAt(percentIndex + 1), HEX_RADIX) >= 0
                && Character.digit(url.charAt(percentIndex + 2), HEX_RADIX) >= 0;
    }

    /**
     * The url with each run of slashes in its scheme, host and path made one slash, the {@code //} after {@code http:} and
     * {@code https:} kept. The query and the fragment, from the first {@code ?} or {@code #} on, are left as they are: a
     * double slash there is part of a value (BF-059: {@code ?v=http://x//y} was sent as {@code ?v=http://x/y}).
     * <p>
     * Limits: a {@code ?} or {@code #} that a {@code {{ }}} value puts into the path ends the clean-up there, as it ends the
     * path for the URI parser too; the scheme exception covers {@code http} and {@code https} only.
     */
    static String collapseRedundantSlashes(String url) {
        int pathEnd = StringUtils.indexOfAny(url, PATH_END_CHARS);
        if (pathEnd < 0) {
            pathEnd = url.length();
        }
        return REDUNDANT_SLASHES.matcher(url.substring(0, pathEnd)).replaceAll(SLASH) + url.substring(pathEnd);
    }
}
