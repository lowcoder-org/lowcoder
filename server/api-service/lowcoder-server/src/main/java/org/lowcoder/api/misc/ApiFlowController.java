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
    /** The request fields named by the INVALID_PARAMETER answer of {@link #outOfRangeParameter}. */
    static final String RETRIES_PARAMETER = "retries";
    static final String TIMEOUT_PARAMETER = "timeout";

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
     *
     * <p>A {@code retries} outside 0 to {@link #MAX_RETRIES} or a {@code timeout} outside 0 to {@link #MAX_TIMEOUT} seconds
     * answers INVALID_PARAMETER naming the field, on the seat-sync path too, before any request is built or sync started
     * (NEW-92); a relay that has not answered after {@link #RELAY_DEADLINE} answers FLOW_ERROR ({@link #withinDeadline}).
     */
    @Override
    public Mono<String> flow(FlowRequest flowRequest) {
        if (WorkspaceSeatSyncService.FLOW_PATH.equals(flowRequest.path())) {
            if (!"post".equalsIgnoreCase(flowRequest.method())) {
                return Mono.error(new ResponseStatusException(HttpStatus.METHOD_NOT_ALLOWED));
            }
            String seatSyncOutOfRange = outOfRangeParameter(flowRequest);
            if (seatSyncOutOfRange != null) {
                return ofError(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", seatSyncOutOfRange);
            }
            Object orgId = flowRequest.data() == null ? null : flowRequest.data().get("orgId");
            return seatSyncService.synchronize(orgId instanceof String ? (String) orgId : "");
        }
        if (StringUtils.isBlank(flowRequest.method())) {
            return ofError(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", METHOD_PARAMETER);
        }
        String outOfRange = outOfRangeParameter(flowRequest);
        if (outOfRange != null) {
            return ofError(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", outOfRange);
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
                    .uri(flowUriOf(url))
                    .body(BodyInserters.fromValue(jsonBody))
                    .headers(httpHeaders -> Objects.requireNonNullElse(flowRequest.headers(), Map.<String, String>of()).forEach(httpHeaders::add))
                    .retrieve()
                    .bodyToMono(String.class)
                    .onErrorResume(Mono::error)
                    .retryWhen(retrySpec(flowRequest))
                    .transform(ApiFlowController::withinDeadline);
        } catch (Exception e) {
            return Mono.error(e);
        }
    }

    /** The retry count of {@link #retrySpec} when the request has no {@code retries}: no retry. */
    static final int DEFAULT_RETRIES = 0;

    /** The largest {@code retries} a request may ask for (NEW-92). */
    static final int MAX_RETRIES = 3;

    /** The largest {@code timeout} a request may ask for, in {@link #TIMEOUT_UNIT} (NEW-92). */
    static final int MAX_TIMEOUT = 10;

    /** The time the whole relay, attempts and backoffs together, may take before {@link #withinDeadline} ends it (NEW-92). */
    static final Duration RELAY_DEADLINE = Duration.ofSeconds(60);

    /** The argument of the FLOW_ERROR that {@link #withinDeadline} answers. */
    static final String DEADLINE_MESSAGE = "the flow relay did not answer within 60 s";

    /** The unit of a request's {@code timeout}, which {@link #retrySpec} reads as the first retry's minimum backoff. */
    static final ChronoUnit TIMEOUT_UNIT = ChronoUnit.SECONDS;

    /**
     * The minimum backoff of {@link #retrySpec} when the request has no {@code timeout}: {@code HTTP_TIMEOUT} read as
     * milliseconds, as {@code WebClientBuildHelper.timeoutMs} reads it for the request itself (10 s).
     */
    static final Duration DEFAULT_RETRY_BACKOFF = Duration.ofMillis(HTTP_TIMEOUT);

    /**
     * The retry of a relayed flow request: {@code Retry.backoff} with at most {@code retries} retries ({@link #DEFAULT_RETRIES}
     * when absent) and a minimum backoff of {@code timeout} in {@link #TIMEOUT_UNIT} ({@link #DEFAULT_RETRY_BACKOFF} when
     * absent); once the retries are exhausted, FLOW_ERROR with the last failure's message.
     *
     * <p>Limits: {@code flow} refuses a {@code retries} or {@code timeout} out of range before this spec is built (see
     * {@link #outOfRangeParameter}); {@code timeout} sets only the backoff, not the request's own
     * timeout, which stays {@code HTTP_TIMEOUT} milliseconds; the backoff is Reactor's minimum, which its default jitter does not go under (read from Reactor's backoff rule, not run: the delays themselves are not tested) and the maximum backoff is Reactor's default; a
     * null request is not checked.
     */
    static reactor.util.retry.RetryBackoffSpec retrySpec(FlowRequest flowRequest) {
        Duration minBackoff = flowRequest.timeout() == null ? DEFAULT_RETRY_BACKOFF : Duration.of(flowRequest.timeout(), TIMEOUT_UNIT);
        return Retry.backoff(Objects.requireNonNullElse(flowRequest.retries(), DEFAULT_RETRIES), minBackoff)
                .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) -> new BizException(BizError.FLOW_ERROR, "FLOW_ERROR", retrySignal.failure().getMessage()));
    }

    /**
     * The request field that is out of range, or null (NEW-92): {@code retries} outside 0 to {@link #MAX_RETRIES}, then
     * {@code timeout} outside 0 to {@link #MAX_TIMEOUT} seconds; a null value is in range and keeps its default. Limits:
     * only the first field out of range is named; {@code timeout} is still the first retry's minimum backoff before
     * Reactor's jitter, not a timeout of the request.
     */
    static String outOfRangeParameter(FlowRequest flowRequest) {
        Integer retries = flowRequest.retries();
        if (retries != null && (retries < 0 || retries > MAX_RETRIES)) {
            return RETRIES_PARAMETER;
        }
        Integer timeout = flowRequest.timeout();
        if (timeout != null && (timeout < 0 || timeout > MAX_TIMEOUT)) {
            return TIMEOUT_PARAMETER;
        }
        return null;
    }

    /**
     * The relay, attempts and backoffs together, ended after {@link #RELAY_DEADLINE} with FLOW_ERROR (NEW-92: {@code HTTP_TIMEOUT}
     * bounds each network step, not the relay). Limits: the deadline is fixed, not derived from {@code retries} and
     * {@code timeout}, so a long retry chain is cut short; the source is cancelled by Reactor's timeout, but that the
     * network exchange in flight stops is not tested; the seat-sync path has no such deadline (it does not relay through it).
     */
    static Mono<String> withinDeadline(Mono<String> relay) {
        return relay.timeout(RELAY_DEADLINE, Mono.error(() -> new BizException(BizError.FLOW_ERROR, "FLOW_ERROR", DEADLINE_MESSAGE)));
    }

    /**
     * The flow URL, parsed as before (a {@code ?} starts the query; the {@code a?x=1} control pins it) but not expanded as a
     * template (NEW-91: a {@code {name}} in the path failed the request before it was sent). Limits: the path is not
     * checked; it follows the fixed prefix's {@code /}, so it cannot change the host, but it chooses any path and query of
     * the flow service.
     */
    static java.net.URI flowUriOf(String url) {
        return org.springframework.web.util.UriComponentsBuilder.fromUriString(url).build().encode().toUri();
    }

}
