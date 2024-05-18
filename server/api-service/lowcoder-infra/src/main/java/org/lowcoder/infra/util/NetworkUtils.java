package org.lowcoder.infra.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.server.ServerWebExchange;

import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.util.Optional;

@Slf4j
public class NetworkUtils {

    public static String getRemoteIp(ServerWebExchange serverWebExchange) {
        ServerHttpRequest request = serverWebExchange.getRequest();
        HttpHeaders headers = request.getHeaders();
        String xRealIp = headers.getFirst("X-Real-IP");
        if (StringUtils.isNotBlank(xRealIp)) {
            return xRealIp;
        }
        String remoteIp = headers.getFirst("RemoteIp");
        if (StringUtils.isNotBlank(remoteIp)) {
            return remoteIp;
        }
        log.debug("get remote ip from remoteAddress , header {}", JsonUtils.toJson(headers));
        return Optional.ofNullable(serverWebExchange.getRequest().getRemoteAddress())
                .map(InetSocketAddress::getAddress)
                .map(InetAddress::getHostAddress)
                .orElse("");
    }

}
