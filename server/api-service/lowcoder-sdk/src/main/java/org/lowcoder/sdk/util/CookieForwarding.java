package org.lowcoder.sdk.util;

import java.util.List;
import java.util.Set;

import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpCookie;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

/**
 * Which of a request's cookies a datasource may receive (NEW-18, GitHub #2053): the cookies the datasource selects, or all
 * of them when it asks for that, and never Lowcoder's own session cookie.
 *
 * <p>Limits: nothing is forwarded unless the datasource selects it (default off); names match exactly and case-sensitively,
 * as the server reads its session cookie ({@code CookieHelper}); only the session cookie is excluded, so any other cookie
 * the browser sent is forwarded when selected; there is no domain or path scoping, because a Cookie request header carries
 * neither: a kept cookie goes to whatever host the datasource calls, the editor's choice; values are passed as the server
 * parsed them, unchecked, and node-service does not check them either (T156c plans a check of the Cookie header node
 * builds, which would not cover a value a query places elsewhere);
 * a blank session cookie name forwards nothing, since the cookie to exclude is then unknown.
 */
public final class CookieForwarding {

    private CookieForwarding() {
    }

    /**
     * @param requestCookies the request's cookies by name, null for none
     * @param forwardAll whether every cookie but the session cookie is wanted
     * @param forwardNames the names wanted when {@code forwardAll} is false, null for none
     * @param sessionCookieName the name of Lowcoder's session cookie, which is never kept; blank gives an empty result
     * @return a new map in request order, every value of a kept name in order; a null name, list or element is skipped
     */
    public static MultiValueMap<String, HttpCookie> select(MultiValueMap<String, HttpCookie> requestCookies, boolean forwardAll,
            Set<String> forwardNames, String sessionCookieName) {
        MultiValueMap<String, HttpCookie> selected = new LinkedMultiValueMap<>();
        if (requestCookies == null || StringUtils.isBlank(sessionCookieName)) {
            return selected;
        }
        for (var entry : requestCookies.entrySet()) {
            String name = entry.getKey();
            List<HttpCookie> cookies = entry.getValue();
            if (name == null || cookies == null || name.equals(sessionCookieName)) {
                continue;
            }
            if (!forwardAll && (forwardNames == null || !forwardNames.contains(name))) {
                continue;
            }
            for (HttpCookie cookie : cookies) {
                if (cookie != null) {
                    selected.add(name, cookie);
                }
            }
        }
        return selected;
    }
}
