package org.lowcoder.sdk.util;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpHeaders;
import org.springframework.util.CollectionUtils;
import org.springframework.util.LinkedCaseInsensitiveMap;
import org.springframework.util.MultiValueMap;

/**
 * {@link HttpHeaders} as a map. Since Spring 7 it is no longer a {@code MultiValueMap}, and its {@code asMultiValueMap()}
 * bridge is deprecated for removal, so the code that needs the headers as a {@code Map} (to remove a header, to hand them
 * over as a plain map, to write them as JSON) takes this copy.
 *
 * <p>Limits: it is a snapshot; changes to the copy do not reach the headers it was made from, and the reverse.
 */
public final class HttpHeaderMaps {

    private HttpHeaderMaps() {
    }

    /**
     * A writable copy of {@code headers} that compares header names without regard to case, as {@link HttpHeaders} does,
     * keeps their order and the case of the first spelling, and is a {@code Map<String, List<String>>}.
     */
    public static MultiValueMap<String, String> copyOf(HttpHeaders headers) {
        MultiValueMap<String, String> copy = CollectionUtils.toMultiValueMap(new LinkedCaseInsensitiveMap<List<String>>(Locale.ENGLISH));
        headers.forEach(copy::addAll);
        return copy;
    }
}
