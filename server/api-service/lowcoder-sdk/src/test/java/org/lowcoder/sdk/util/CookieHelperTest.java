package org.lowcoder.sdk.util;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Guards the contract that {@link CookieHelper#clearCookie(ServerWebExchange)} really deletes the cookie that
 * {@link CookieHelper#saveCookie(String, ServerWebExchange)} wrote. A browser matches a stored cookie on
 * (name, domain, path) only, and rejects SameSite=None without Secure, so any drift between the two makes logout
 * silently leave the cookie in place.
 */
public class CookieHelperTest {

    private static final String COOKIE_NAME = "TEST-TOKEN";
    private static final String TOKEN_VALUE = "session-token-value";
    private static final String HTTPS_REFERER = "https://app.example.com/apps/1";
    private static final String HTTP_REFERER = "http://localhost:3000/apps/1";
    private static final String CLOUD_REQUEST_URL = "https://app.example.com/api/auth/logout";
    private static final String CONTEXT_PATH = "/lowcoder";
    private static final Duration DEFAULT_MAX_AGE = Duration.ofHours(24);

    private CookieHelper cookieHelper(boolean cloud) {
        CommonConfig commonConfig = new CommonConfig();
        commonConfig.setCookieName(COOKIE_NAME);
        commonConfig.setCloud(cloud);
        return new CookieHelper(commonConfig);
    }

    private MockServerWebExchange exchange(String referer) {
        MockServerHttpRequest.BaseBuilder<?> builder = MockServerHttpRequest.post("");
        if (referer != null) {
            builder.header(HttpHeaders.REFERER, referer);
        }
        return MockServerWebExchange.from(builder.build());
    }

    private ResponseCookie onlyCookie(ServerWebExchange exchange) {
        ResponseCookie cookie = exchange.getResponse().getCookies().getFirst(COOKIE_NAME);
        assertNotNull(cookie, "expected a Set-Cookie for " + COOKIE_NAME);
        return cookie;
    }

    @Test
    public void saveCookieUsesConfiguredNameAndMaxAge() {
        MockServerWebExchange exchange = exchange(HTTP_REFERER);

        cookieHelper(false).saveCookie(TOKEN_VALUE, exchange);

        ResponseCookie cookie = onlyCookie(exchange);
        assertEquals(COOKIE_NAME, cookie.getName());
        assertEquals(TOKEN_VALUE, cookie.getValue());
        assertEquals("/", cookie.getPath());
        assertTrue(cookie.isHttpOnly());
        assertFalse(cookie.isSecure());
        assertEquals("Lax", cookie.getSameSite());
        assertEquals(DEFAULT_MAX_AGE, cookie.getMaxAge());
        assertNull(cookie.getDomain());
    }

    @Test
    public void saveCookieUsesSecureNoneWhenRefererIsHttps() {
        MockServerWebExchange exchange = exchange(HTTPS_REFERER);

        cookieHelper(false).saveCookie(TOKEN_VALUE, exchange);

        ResponseCookie cookie = onlyCookie(exchange);
        assertTrue(cookie.isSecure());
        assertEquals("None", cookie.getSameSite());
    }

    @Test
    public void clearCookieHasEmptyValueAndZeroMaxAge() {
        MockServerWebExchange exchange = exchange(HTTP_REFERER);

        cookieHelper(false).clearCookie(exchange);

        ResponseCookie cookie = onlyCookie(exchange);
        assertEquals(COOKIE_NAME, cookie.getName());
        assertEquals("", cookie.getValue());
        assertEquals(Duration.ZERO, cookie.getMaxAge());
    }

    /**
     * The core guarantee: every attribute a browser uses to match the stored cookie is identical between save and
     * clear. Checked for each branch of the referer-derived attributes.
     */
    @Test
    public void clearCookieMirrorsSaveCookieAttributes() {
        assertSaveAndClearAgree(null);
        assertSaveAndClearAgree(HTTP_REFERER);
        assertSaveAndClearAgree(HTTPS_REFERER);
    }

    private void assertSaveAndClearAgree(String referer) {
        MockServerWebExchange saveExchange = exchange(referer);
        MockServerWebExchange clearExchange = exchange(referer);

        CookieHelper helper = cookieHelper(false);
        helper.saveCookie(TOKEN_VALUE, saveExchange);
        helper.clearCookie(clearExchange);

        ResponseCookie saved = onlyCookie(saveExchange);
        ResponseCookie cleared = onlyCookie(clearExchange);

        String context = "referer=" + referer;
        assertEquals(saved.getName(), cleared.getName(), context);
        assertEquals(saved.getPath(), cleared.getPath(), context);
        assertEquals(saved.getDomain(), cleared.getDomain(), context);
        assertEquals(saved.isHttpOnly(), cleared.isHttpOnly(), context);
        assertEquals(saved.isSecure(), cleared.isSecure(), context);
        assertEquals(saved.getSameSite(), cleared.getSameSite(), context);
        assertEquals(Duration.ZERO, cleared.getMaxAge(), context);
    }

    /**
     * SameSite=None is rejected outright by browsers unless Secure is also set, so the cleared cookie must keep both.
     */
    @Test
    public void clearCookieKeepsHttpsAttributes() {
        MockServerWebExchange exchange = exchange(HTTPS_REFERER);

        cookieHelper(false).clearCookie(exchange);

        ResponseCookie cookie = onlyCookie(exchange);
        assertTrue(cookie.isSecure());
        assertEquals("None", cookie.getSameSite());
    }

    @Test
    public void clearCookieUsesTopPrivateDomainInCloud() {
        MockServerWebExchange saveExchange = MockServerWebExchange.from(
                MockServerHttpRequest.post(CLOUD_REQUEST_URL).header(HttpHeaders.REFERER, HTTPS_REFERER).build());
        MockServerWebExchange clearExchange = MockServerWebExchange.from(
                MockServerHttpRequest.post(CLOUD_REQUEST_URL).header(HttpHeaders.REFERER, HTTPS_REFERER).build());

        CookieHelper helper = cookieHelper(true);
        helper.saveCookie(TOKEN_VALUE, saveExchange);
        helper.clearCookie(clearExchange);

        assertEquals("example.com", onlyCookie(saveExchange).getDomain());
        assertEquals("example.com", onlyCookie(clearExchange).getDomain());
    }

    /**
     * ResponseCookie emits Expires alongside Max-Age for a non-negative age, which is what actually deletes the
     * cookie in browsers that ignore one or the other.
     */
    @Test
    public void clearCookieSerialisesAsExpired() {
        MockServerWebExchange exchange = exchange(HTTP_REFERER);

        cookieHelper(false).clearCookie(exchange);

        String serialised = onlyCookie(exchange).toString();
        assertTrue(serialised.contains("Max-Age=0"), serialised);
        assertTrue(serialised.contains("Expires="), serialised);
    }

    @Test
    public void cookiePathHonoursContextPath() {
        MockServerWebExchange saveExchange = MockServerWebExchange.from(
                MockServerHttpRequest.post(CONTEXT_PATH + "/api/auth/logout").contextPath(CONTEXT_PATH).build());
        MockServerWebExchange clearExchange = MockServerWebExchange.from(
                MockServerHttpRequest.post(CONTEXT_PATH + "/api/auth/logout").contextPath(CONTEXT_PATH).build());

        CookieHelper helper = cookieHelper(false);
        helper.saveCookie(TOKEN_VALUE, saveExchange);
        helper.clearCookie(clearExchange);

        assertEquals(CONTEXT_PATH + "/", onlyCookie(saveExchange).getPath());
        assertEquals(CONTEXT_PATH + "/", onlyCookie(clearExchange).getPath());
    }
}
