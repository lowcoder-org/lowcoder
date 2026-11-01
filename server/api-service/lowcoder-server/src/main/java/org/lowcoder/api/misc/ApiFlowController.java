package org.lowcoder.api.misc;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang.StringUtils;
import org.lowcoder.api.authentication.request.AuthException;
import org.lowcoder.api.subscription.WorkspaceSeatSyncService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.server.i18n.AcceptHeaderLocaleContextResolver;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Objects;
import java.util.function.Consumer;

import static org.lowcoder.api.authentication.util.AuthenticationUtils.mapToAuthToken;
import static org.lowcoder.sdk.plugin.common.constant.Constants.HTTP_TIMEOUT;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

@RequiredArgsConstructor
@RestController
public class ApiFlowController implements ApiFlowEndpoints
{
    /** The request field named by the INVALID_PARAMETER answer of {@link #flow}. */
    static final String METHOD_PARAMETER = "method";

    private final WorkspaceSeatSyncService seatSyncService;

    /**
     * Relays a flow request to the flow service, or runs the seat sync for its own path.
     *
     * <p>Outside the seat-sync path a blank {@code method} (null, empty or whitespace only, as {@code StringUtils.isBlank}
     * decides) answers INVALID_PARAMETER "method" before any request is built, and absent {@code headers} add none.
     * Limits: a null request is not checked; the seat-sync path checks its method itself (only {@code post}), so a blank
     * method there is refused as another method is; a method of characters {@code StringUtils.isBlank} does not count as
     * whitespace (a no-break space, for one) is not blank and is passed on as before, as is any other non-blank name;
     * header names and values are given to {@code HttpHeaders.add} unchecked, a null value included.
     */
    @Override
    public Mono<String> flow(FlowRequest flowRequest) {
        if (WorkspaceSeatSyncService.FLOW_PATH.equals(flowRequest.path())) {
            if (!"post".equalsIgnoreCase(flowRequest.method())) {
                return Mono.error(new ResponseStatusException(HttpStatus.METHOD_NOT_ALLOWED));
            }
            Object orgId = flowRequest.data() == null ? null : flowRequest.data().get("orgId");
            return seatSyncService.synchronize(orgId instanceof String ? (String) orgId : "");
        }
        if (StringUtils.isBlank(flowRequest.method())) {
            return ofError(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", METHOD_PARAMETER);
        }
        try {
            String url = "https://flow.lowcoder.cloud/" + flowRequest.path();
            ObjectMapper objectMapper = new ObjectMapper();
            String jsonBody = objectMapper.writeValueAsString(flowRequest.data());
            return WebClientBuildHelper.builder()
                    .systemProxy()
                    .timeoutMs(HTTP_TIMEOUT)
                    .build()
                    .method(HttpMethod.valueOf(flowRequest.method().toUpperCase(java.util.Locale.ROOT)))
                    .uri(url)
                    .body(BodyInserters.fromValue(jsonBody))
                    .headers(httpHeaders -> Objects.requireNonNullElse(flowRequest.headers(), Map.<String, String>of()).forEach(httpHeaders::add))
                    .retrieve()
                    .bodyToMono(String.class)
                    .onErrorResume(Mono::error)
                    .retryWhen(Retry.backoff(Objects.requireNonNullElse(flowRequest.retries(), 0),
                                    Duration.of(Objects.requireNonNullElse(flowRequest.timeout(), HTTP_TIMEOUT), ChronoUnit.SECONDS))
                            .onRetryExhaustedThrow(((retryBackoffSpec, retrySignal) -> new BizException(BizError.FLOW_ERROR, "FLOW_ERROR", retrySignal.failure().getMessage()))));
        } catch (Exception e) {
            return Mono.error(e);
        }
    }

}
