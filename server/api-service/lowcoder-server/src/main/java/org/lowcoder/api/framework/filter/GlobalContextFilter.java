package org.lowcoder.api.framework.filter;

import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.api.framework.service.GlobalContextService;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.infra.serverlog.ServerLog;
import org.lowcoder.infra.serverlog.ServerLogService;
import org.lowcoder.infra.util.NetworkUtils;
import org.lowcoder.sdk.util.CookieHelper;
import org.lowcoder.sdk.util.UriUtils;
import org.springframework.core.Ordered;
import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;

import static java.util.Optional.ofNullable;
import static java.util.stream.Collectors.toMap;
import static org.lowcoder.api.framework.filter.FilterOrder.GLOBAL_CONTEXT;
import static org.lowcoder.sdk.constants.Authentication.isAnonymousUser;
import static org.lowcoder.sdk.constants.GlobalContext.*;
import static org.lowcoder.sdk.util.IDUtils.generate;

@Component
@RequiredArgsConstructor
@Slf4j
public class GlobalContextFilter implements WebFilter, Ordered {

    private static final String MDC_HEADER_PREFIX = "X-MDC-";
    private static final String REQUEST_ID_HEADER = "X-REQUEST-ID";

    public static final String CONTEXT_MAP = "context-map";

    private final SessionUserService sessionUserService;
    private final OrgMemberService orgMemberService;
    private final ServerLogService serverLogService;
    private final GlobalContextService globalContextService;
    private final CookieHelper cookieHelper;

    @Nonnull
    @Override
    public Mono<Void> filter(@Nonnull ServerWebExchange exchange, @Nonnull WebFilterChain chain) {

        return sessionUserService.getVisitorId()
                .flatMap(visitorId -> saveServerLog(exchange, visitorId))
                .flatMap(visitorId -> chain.filter(exchange)
                        .contextWrite(ctx -> {
                            Map<String, Object> contextMap = buildContextMap(exchange, visitorId);
                            for (Entry<String, Object> entry : contextMap.entrySet()) {
                                String key = entry.getKey();
                                Object value = entry.getValue();
                                ctx = ctx.put(key, value);
                            }
                            return ctx.put(CONTEXT_MAP, contextMap);
                        }));
    }

    private Mono<String> saveServerLog(ServerWebExchange exchange, String visitorId) {
        if (isAnonymousUser(visitorId)) {
            return Mono.just(visitorId);
        }

        return orgMemberService
                .getCurrentOrgMember(visitorId)
                .map(orgMember -> {
                    ServerLog serverLog = ServerLog.builder()
                            .orgId(orgMember.getOrgId())
                            .userId(visitorId)
                            .urlPath(exchange.getRequest().getPath().toString())
                            .httpMethod(Optional.ofNullable(exchange.getRequest().getMethod()).map(HttpMethod::name).orElse(""))
                            .createTime(System.currentTimeMillis())
                            .build();
                    serverLogService.record(serverLog);
                    return visitorId;
                });

    }

    private Map<String, Object> buildContextMap(ServerWebExchange serverWebExchange, String visitorId) {
        ServerHttpRequest request = serverWebExchange.getRequest();
        Map<String, Object> contextMap = request.getHeaders().toSingleValueMap().entrySet()
                .stream()
                .filter(x -> x.getKey().startsWith(MDC_HEADER_PREFIX))
                .collect(toMap(v -> v.getKey().substring((MDC_HEADER_PREFIX.length())), Map.Entry::getValue));
        contextMap.put(VISITOR_ID, visitorId);
        contextMap.put(CLIENT_IP, NetworkUtils.getRemoteIp(serverWebExchange));
        contextMap.put(REQUEST_ID_LOG, getOrCreateRequestId(request));
        contextMap.put(REQUEST_PATH, request.getPath().pathWithinApplication().value());
        contextMap.put(REQUEST, request);
        contextMap.put(REQUEST_METHOD, ofNullable(request.getMethod()).map(HttpMethod::name).orElse(""));
        contextMap.put(CLIENT_LOCALE, globalContextService.getClientLocale(request));
        contextMap.put(CURRENT_ORG_MEMBER, orgMemberService.getCurrentOrgMember(visitorId).cache());
        contextMap.put(VISITOR_TOKEN, cookieHelper.getCookieToken(serverWebExchange));
        contextMap.put(DOMAIN, UriUtils.getRefererDomainFromRequest(serverWebExchange));
        return contextMap;
    }

    @SuppressWarnings("ConstantConditions")
    private String getOrCreateRequestId(final ServerHttpRequest request) {
        if (!request.getHeaders().containsKey(REQUEST_ID_HEADER)) {
            request.mutate().header(REQUEST_ID_HEADER, generate()).build();
        }

        return request.getHeaders().get(REQUEST_ID_HEADER).get(0);
    }

    @Override
    public int getOrder() {
        return GLOBAL_CONTEXT.getOrder();
    }
}