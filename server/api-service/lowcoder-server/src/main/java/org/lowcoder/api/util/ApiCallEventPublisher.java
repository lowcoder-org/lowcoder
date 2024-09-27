package org.lowcoder.api.util;

import com.google.common.hash.Hashing;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.lowcoder.api.framework.filter.ReactiveRequestContextHolder;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.infra.event.APICallEvent;
import org.lowcoder.plugin.api.event.LowcoderEvent.EventType;
import org.lowcoder.sdk.constants.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

import static org.springframework.http.HttpHeaders.writableHttpHeaders;

@Slf4j
//@Aspect
@RequiredArgsConstructor
//@Component
public class ApiCallEventPublisher {

    private final ApplicationEventPublisher applicationEventPublisher;
    private final SessionUserService sessionUserService;

    @Pointcut("@annotation(org.springframework.web.bind.annotation.GetMapping)")
    public void getMapping(){}

    @Pointcut("@annotation(org.springframework.web.bind.annotation.PostMapping)")
    public void postMapping(){}

    @Pointcut("@annotation(org.springframework.web.bind.annotation.PutMapping)")
    public void putMapping(){}

    @Pointcut("@annotation(org.springframework.web.bind.annotation.DeleteMapping)")
    public void deleteMapping(){}

    @Pointcut("@annotation(org.springframework.web.bind.annotation.PatchMapping)")
    public void patchMapping(){}

    @Around("(getMapping() || postMapping() || putMapping() || deleteMapping() || patchMapping())")
    public Object handleAPICallEvent(ProceedingJoinPoint joinPoint) throws Throwable {

        return sessionUserService.getVisitorToken()
                .zipWith(sessionUserService.getVisitorOrgMemberCacheSilent().defaultIfEmpty(OrgMember.NOT_EXIST))
                .zipWith(ReactiveRequestContextHolder.getRequest())
                .doOnNext(
                        tuple -> {
                            String token = tuple.getT1().getT1();
                            OrgMember orgMember = tuple.getT1().getT2();
                            ServerHttpRequest request = tuple.getT2();
                            if (orgMember == OrgMember.NOT_EXIST) {
                                return;
                            }
                            MultiValueMap<String, String> headers = writableHttpHeaders(request.getHeaders());
                            headers.remove("Cookie");
                            String ipAddress = headers.remove("X-Real-IP").stream().findFirst().get();
                            APICallEvent event = APICallEvent.builder()
                                    .userId(orgMember.getUserId())
                                    .orgId(orgMember.getOrgId())
                                    .type(EventType.API_CALL_EVENT)
                                    .isAnonymous(Authentication.isAnonymousUser(orgMember.getUserId()))
                                    .sessionHash(Hashing.sha512().hashString(token, StandardCharsets.UTF_8).toString())
                                    .httpMethod(request.getMethod().name())
                                    .requestUri(request.getURI().getPath())
                                    .headers(headers)
                                    .queryParams(request.getQueryParams())
                                    .ipAddress(ipAddress)
                                    .build();
                            event.populateDetails();
                            applicationEventPublisher.publishEvent(event);
                        })
                .onErrorResume(throwable -> {
                    log.error("handleAPICallEvent error {} for: {} ", joinPoint.getSignature().getName(), EventType.API_CALL_EVENT, throwable);
                    return Mono.empty();
                })
                .then((Mono) joinPoint.proceed());
    }

}
