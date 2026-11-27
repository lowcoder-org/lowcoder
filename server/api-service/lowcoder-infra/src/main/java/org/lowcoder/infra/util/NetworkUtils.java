package org.lowcoder.infra.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.Strings;
import org.lowcoder.sdk.util.HttpHeaderMaps;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.server.ServerWebExchange;

import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.util.Optional;
import java.util.Set;

@Slf4j
public class NetworkUtils {

    private static final String[] CLIENT_IP_HEADERS = { "X-Forwarded-For", "X-Real-IP" };
    public static String getRemoteIp(ServerWebExchange serverWebExchange) {
        ServerHttpRequest request = serverWebExchange.getRequest();
        HttpHeaders headers = request.getHeaders();

        /** Try to find remote id in headers **/
        String foundHeader;
        for (String header : CLIENT_IP_HEADERS) {
            foundHeader = getMatchingKey(header, headers.headerNames());
            if (foundHeader != null) {
                log.debug("Found client IP in header: {}", foundHeader);
                return headers.getFirst(foundHeader);
            }
        }

        log.debug("get remote ip from remoteAddress , header {}", JsonUtils.toJson(HttpHeaderMaps.copyOf(headers)));
        return Optional.ofNullable(serverWebExchange.getRequest().getRemoteAddress())
                .map(InetSocketAddress::getAddress)
                .map(InetAddress::getHostAddress)
                .orElse("");
    }

    private static String getMatchingKey(String key, Set<String> keys) {
        return keys.stream()
                .filter(headerKey -> Strings.CI.equals(key, headerKey))
                .findFirst()
                .orElse(null);
    }
}
