package org.lowcoder.sdk.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.CommonConfig.Cookie;
import org.springframework.http.HttpCookie;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseCookie.ResponseCookieBuilder;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ServerWebExchange;

import java.util.Optional;

import static java.util.Optional.ofNullable;
import static org.lowcoder.sdk.util.IDUtils.generate;
import static org.lowcoder.sdk.util.UriUtils.getRefererURI;

@RequiredArgsConstructor
@Component
@Slf4j
public class CookieHelper {

    private final CommonConfig commonConfig;

    public void saveCookie(String token, ServerWebExchange exchange) {
        boolean isUsingHttps = Optional.ofNullable(getRefererURI(exchange.getRequest()))
                .map(a -> "https".equalsIgnoreCase(a.getScheme()))
                .orElse(false);
        ResponseCookieBuilder builder = ResponseCookie.from(getCookieName(), token)
                .path(exchange.getRequest().getPath().contextPath().value() + "/")
                .httpOnly(true)
                .secure(isUsingHttps)
                .sameSite(isUsingHttps ? "None" : "Lax");
        // set cookie max-age
        Cookie cookie = commonConfig.getCookie();
        if (cookie.getMaxAgeInSeconds() >= 0) {
            builder.maxAge(cookie.getMaxAgeInSeconds());
        }

        if (commonConfig.isCloud()) {
            String topPrivateDomain = UriUtils.getTopPrivateDomain(exchange);
            builder.domain(topPrivateDomain);
        }
        exchange.getResponse().addCookie(builder.build());
    }

    public String getCookieToken(ServerWebExchange exchange) {
        return getCookieValue(exchange, getCookieName(), "");
    }

    public String getCookieValue(ServerWebExchange exchange, String cookieName, String defaultValue) {
        MultiValueMap<String, HttpCookie> cookies = exchange.getRequest().getCookies();
        return ofNullable(cookies.getFirst(cookieName))
                .map(HttpCookie::getValue)
                .orElse(defaultValue);
    }

    public static String generateCookieToken() {
        return generate();
    }

    public String getCookieName() {
        return commonConfig.getCookieName();
    }
}
