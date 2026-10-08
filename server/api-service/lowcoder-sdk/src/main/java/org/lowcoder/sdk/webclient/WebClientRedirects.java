package org.lowcoder.sdk.webclient;

import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.annotation.Nullable;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

/**
 * Following an HTTP redirect by hand (the REST API and GraphQL executors follow {@code 3xx} answers themselves):
 * where the next request goes, and which credentials it may carry.
 */
public final class WebClientRedirects {

    private static final String HTTP = "http";
    private static final String HTTPS = "https";
    private static final int HTTP_DEFAULT_PORT = 80;
    private static final int HTTPS_DEFAULT_PORT = 443;
    private static final int NO_PORT = -1;

    /**
     * The only default headers a request to another origin keeps: they describe the content and the client, never
     * credentials. Lower case, compared without case.
     */
    private static final Set<String> HEADERS_KEPT_FOR_ANOTHER_ORIGIN = Set.of(
            HttpHeaders.ACCEPT.toLowerCase(Locale.ROOT),
            HttpHeaders.ACCEPT_LANGUAGE.toLowerCase(Locale.ROOT),
            HttpHeaders.CONTENT_TYPE.toLowerCase(Locale.ROOT),
            HttpHeaders.USER_AGENT.toLowerCase(Locale.ROOT));

    private WebClientRedirects() {
    }

    /**
     * The {@code Location} a {@code 3xx} answer redirects to: its first {@code Location} value, or null when the answer is
     * not a {@code 3xx} or has no {@code Location} that is not blank (a {@code 304 Not Modified}, a {@code 300 Multiple
     * Choices} without a preferred choice), which the caller then reads as an answer like any other (BF-113: it was read
     * as a redirect, and the empty header list failed with "Index: 0").
     */
    @Nullable
    public static String redirectLocation(ClientResponse response) {
        if (!response.statusCode().is3xxRedirection()) {
            return null;
        }
        List<String> locations = response.headers().header(HttpHeaders.LOCATION);
        return locations.isEmpty() || StringUtils.isBlank(locations.get(0)) ? null : locations.get(0);
    }

    /**
     * The target of a redirect: the {@code Location} value resolved against the URI that answered, so a relative
     * location goes to the server that redirected (and through the client's host checks) instead of becoming a
     * host-less URI.
     *
     * @throws URISyntaxException when the location is not a URI, or resolves to a URI without a host
     */
    public static URI resolveLocation(URI requestUri, String location) throws URISyntaxException {
        URI reference = new URI(location);
        URI resolved = isQueryOnly(reference) ? withQuery(requestUri, location) : requestUri.resolve(reference);
        if (resolved.getHost() == null) {
            throw new URISyntaxException(location, "the redirect target has no host");
        }
        return resolved;
    }

    /**
     * Whether two URIs have the same origin: scheme and host compared without case, the port with the scheme's default
     * port filled in.
     */
    public static boolean isSameOrigin(URI first, URI second) {
        return equalsIgnoreCase(first.getScheme(), second.getScheme())
                && equalsIgnoreCase(first.getHost(), second.getHost())
                && effectivePort(first) == effectivePort(second);
    }

    /**
     * A copy of the client for a redirect to another origin: of the default headers it keeps only {@code Accept},
     * {@code Accept-Language}, {@code Content-Type} and {@code User-Agent}, and it has no default cookies. The datasource's
     * and the query's headers ({@code Authorization}, an API-key header, any custom header) and the forwarded cookies
     * are therefore not sent to a host the datasource does not name.
     * <p>
     * Limits: it removes default headers and default cookies only, which is where the REST API and GraphQL executors put
     * them; a header added per request is the caller's to drop.
     */
    public static WebClient forAnotherOrigin(WebClient webClient) {
        return webClient.mutate()
                .defaultHeaders(headers -> {
                    List<String> dropped = headers.keySet().stream()
                            .filter(name -> !HEADERS_KEPT_FOR_ANOTHER_ORIGIN.contains(name.toLowerCase(Locale.ROOT)))
                            .toList();
                    dropped.forEach(headers::remove);
                })
                .defaultCookies(MultiValueMap::clear)
                .build();
    }

    /**
     * {@link URI#resolve} follows RFC 2396 for a reference that is only a query ({@code ?page=2}) and drops the last path
     * segment; RFC 3986 keeps the whole path and replaces the query.
     */
    private static boolean isQueryOnly(URI reference) {
        return reference.getScheme() == null && reference.getRawAuthority() == null
                && reference.getRawPath() != null && reference.getRawPath().isEmpty() && reference.getRawQuery() != null;
    }

    private static URI withQuery(URI requestUri, String queryReference) throws URISyntaxException {
        return new URI(requestUri.getScheme() + "://" + requestUri.getRawAuthority() + requestUri.getRawPath() + queryReference);
    }

    private static boolean equalsIgnoreCase(String first, String second) {
        return Objects.equals(lowerCase(first), lowerCase(second));
    }

    private static String lowerCase(String value) {
        return value == null ? null : value.toLowerCase(Locale.ROOT);
    }

    private static int effectivePort(URI uri) {
        if (uri.getPort() != NO_PORT) {
            return uri.getPort();
        }
        String scheme = lowerCase(uri.getScheme());
        if (HTTP.equals(scheme)) {
            return HTTP_DEFAULT_PORT;
        }
        if (HTTPS.equals(scheme)) {
            return HTTPS_DEFAULT_PORT;
        }
        return NO_PORT;
    }
}
