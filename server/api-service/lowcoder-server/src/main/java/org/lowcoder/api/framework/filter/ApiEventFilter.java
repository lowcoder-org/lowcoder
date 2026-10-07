
package org.lowcoder.api.framework.filter;

import com.google.common.hash.Hashing;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.infra.event.APICallEvent;
import org.lowcoder.plugin.api.event.LowcoderEvent;
import org.lowcoder.sdk.constants.Authentication;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.util.context.ContextView;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.lowcoder.sdk.constants.GlobalContext.CURRENT_ORG_MEMBER;
import static org.lowcoder.sdk.constants.GlobalContext.VISITOR_TOKEN;
import static org.springframework.http.HttpHeaders.writableHttpHeaders;

@Slf4j
@RequiredArgsConstructor
@Component
public class ApiEventFilter implements WebFilter {
    private static final String X_REAL_IP = "X-Real-IP";

    private final ApplicationEventPublisher applicationEventPublisher;
    private final SessionUserService sessionUserService;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        return chain.filter(exchange).then(
            Mono.deferContextual(contextView -> {
                if (exchange.getResponse().getStatusCode().is2xxSuccessful()) {
                    String token = contextView.get(VISITOR_TOKEN);
                    ((Mono<OrgMember>) contextView.get(CURRENT_ORG_MEMBER))
                            .flatMap(orgMember -> {
                                emitEvent(exchange.getRequest(), token, orgMember, contextView);
                                return Mono.empty();
                            })
                            .subscribeOn(Schedulers.boundedElastic())
                            .subscribe();
                }
                return Mono.empty();
            })
        );
    }

    private void emitEvent(ServerHttpRequest request, String token, OrgMember orgMember, ContextView contextView) {
        MultiValueMap<String, String> headers = writableHttpHeaders(request.getHeaders());
        headers.remove(HttpHeaders.COOKIE);
        String ipAddress = firstValueOrEmpty(headers.remove(X_REAL_IP));

        APICallEvent event = APICallEvent.builder()
                .userId(orgMember.getUserId())
                .orgId(orgMember.getOrgId())
                .type(LowcoderEvent.EventType.API_CALL_EVENT)
                .isAnonymous(Authentication.isAnonymousUser(orgMember.getUserId()))
                .sessionHash(Hashing.sha512().hashString(token, StandardCharsets.UTF_8).toString())
                .httpMethod(request.getMethod().name())
                .requestUri(request.getURI().getPath())
                .headers(headers)
                .queryParams(request.getQueryParams())
                .ipAddress(ipAddress)
                .build();
        event.populateDetails(contextView);

        log.debug("API call event emitted for '{}' from org '{}' on URI: {}", orgMember.getUserId(), orgMember.getUserId(), request.getURI().getPath());
        applicationEventPublisher.publishEvent(event);
    }

    /**
     * The first value of a removed header, or empty when the request did not have it (BF-038: {@code remove} answers null for an
     * absent header, and the NullPointerException on it was swallowed by the fire-and-forget subscription, so no event was
     * published for a request without {@code X-Real-IP}).
     * <p>
     * Limits: the ip address is the one the proxy put in {@code X-Real-IP}; without a proxy it stays empty, the remote address of
     * the connection is not used.
     */
    private static String firstValueOrEmpty(@Nullable List<String> values) {
        return values == null ? "" : values.stream().findFirst().orElse("");
    }

}
