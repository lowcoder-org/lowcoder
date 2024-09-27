package org.lowcoder.api.misc;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang.StringUtils;
import org.lowcoder.api.authentication.request.AuthException;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.function.Consumer;

import static org.lowcoder.api.authentication.util.AuthenticationUtils.mapToAuthToken;
import static org.lowcoder.sdk.plugin.common.constant.Constants.HTTP_TIMEOUT;

@RequiredArgsConstructor
@RestController
public class ApiFlowController implements ApiFlowEndpoints
{
    @Override
    public Mono<String> flow(FlowRequest flowRequest) {
        try {
            String url = "https://flow.lowcoder.cloud/" + flowRequest.path();
            ObjectMapper objectMapper = new ObjectMapper();
            String jsonBody = objectMapper.writeValueAsString(flowRequest.data());
            return WebClientBuildHelper.builder()
                    .systemProxy()
                    .timeoutMs(HTTP_TIMEOUT)
                    .build()
                    .method(HttpMethod.valueOf(flowRequest.method().toUpperCase()))
                    .uri(url)
                    .body(BodyInserters.fromValue(jsonBody))
                    .headers(httpHeaders -> flowRequest.headers().forEach(httpHeaders::add))
                    .retrieve()
                    .bodyToMono(String.class);
        } catch (Exception e) {
            return Mono.error(e);
        }
    }

}
