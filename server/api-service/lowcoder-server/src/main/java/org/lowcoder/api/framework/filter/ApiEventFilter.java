package org.lowcoder.api.framework.filter;

import com.google.common.hash.Hashing;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.infra.event.APICallEvent;
import org.lowcoder.plugin.api.event.LowcoderEvent;
import org.lowcoder.sdk.constants.Authentication;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.nio.charset.StandardCharsets;

import static org.lowcoder.sdk.constants.GlobalContext.CURRENT_ORG_MEMBER;
import static org.lowcoder.sdk.constants.GlobalContext.VISITOR_TOKEN;
import static org.springframework.http.HttpHeaders.writableHttpHeaders;

@Slf4j
@RequiredArgsConstructor
@Component
public class ApiEventFilter implements WebFilter {
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
                                emitEvent(exchange.getRequest(), token, orgMember);
                                return Mono.empty();
                            })
                            .subscribeOn(Schedulers.boundedElastic())
                            .subscribe();
                }
                return Mono.empty();
            })
        );
    }

    private void emitEvent(ServerHttpRequest request, String token, OrgMember orgMember) {
        MultiValueMap<String, String> headers = writableHttpHeaders(request.getHeaders());
        headers.remove("Cookie");
        String ipAddress = headers.remove("X-Real-IP").stream().findFirst().get();

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
        event.populateDetails();

        log.debug("API call event emitted for '{}' from org '{}' on URI: {}", orgMember.getUserId(), orgMember.getUserId(), request.getURI().getPath());
        applicationEventPublisher.publishEvent(event);
    }

}
