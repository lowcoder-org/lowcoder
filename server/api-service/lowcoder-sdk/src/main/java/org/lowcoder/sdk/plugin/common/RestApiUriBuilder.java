package org.lowcoder.sdk.plugin.common;

import org.apache.commons.lang3.StringUtils;
import org.apache.http.client.utils.URIBuilder;
import org.lowcoder.sdk.exception.PluginException;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Map;
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
