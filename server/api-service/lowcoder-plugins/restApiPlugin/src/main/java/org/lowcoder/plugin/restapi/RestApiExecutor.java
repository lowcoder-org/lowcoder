/**
 * Copyright 2021 Appsmith Inc.
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * <p>
 */

// adapted for rest api queries

package org.lowcoder.plugin.restapi;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.ImmutableMap;
import jakarta.annotation.Nullable;
import lombok.Builder;
import lombok.Getter;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.tuple.Pair;
import org.lowcoder.plugin.restapi.constants.ResponseDataType;
import org.lowcoder.plugin.restapi.helpers.AuthHelper;
import org.lowcoder.plugin.restapi.helpers.BufferingFilter;
import org.lowcoder.plugin.restapi.model.QueryBody;
import org.lowcoder.plugin.restapi.model.RestApiQueryConfig;
import org.lowcoder.plugin.restapi.model.RestApiQueryExecutionContext;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.models.RestBodyFormFileData;
import org.lowcoder.sdk.plugin.common.QueryExecutor;
import org.lowcoder.sdk.plugin.common.RestApiUriBuilder;
import org.lowcoder.sdk.plugin.restapi.DataUtils;
import org.lowcoder.sdk.plugin.restapi.MultipartFormData;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.auth.AuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.BasicAuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType;
import org.lowcoder.sdk.query.QueryVisitorContext;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.lowcoder.sdk.webclient.WebClientRedirects;
import org.pf4j.Extension;
import org.springframework.http.*;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.util.*;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.google.common.base.MoreObjects.firstNonNull;
import static org.apache.commons.collections4.MapUtils.emptyIfNull;
import static org.apache.commons.lang3.StringUtils.trimToEmpty;
import static org.lowcoder.plugin.restapi.RestApiError.REST_API_EXECUTION_ERROR;
import static org.lowcoder.plugin.restapi.helpers.ContentTypeHelper.*;
import static org.lowcoder.sdk.exception.PluginCommonError.*;
import static org.lowcoder.sdk.plugin.restapi.DataUtils.convertToMultiformFileValue;
import static org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType.DIGEST_AUTH;
import static org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN;
import static org.lowcoder.sdk.util.ExceptionUtils.propagateError;
import static org.lowcoder.sdk.util.JsonUtils.readTree;
import static org.lowcoder.sdk.util.JsonUtils.toJsonThrows;
import static org.lowcoder.sdk.util.MustacheHelper.renderMustacheJson;
import static org.lowcoder.sdk.util.MustacheHelper.renderMustacheString;
import static org.lowcoder.sdk.util.StreamUtils.collectList;

@Extension
public class RestApiExecutor implements QueryExecutor<RestApiDatasourceConfig, Object, RestApiQueryExecutionContext> {

    private static final Consumer<HttpHeaders> DEFAULT_HEADERS_CONSUMER = httpHeaders -> {};
    private static final String DEFAULT_REST_ERROR_CODE = "REST_API_EXECUTION_ERROR";
    private static final int MAX_REDIRECTS = 7;
    private final DataUtils dataUtils = DataUtils.getInstance();
    private final CommonConfig commonConfig;

    // Set an unlimited buffer size, because query payload limit will be handled in webFilter
    private final ExchangeStrategies exchangeStrategies = ExchangeStrategies
            .builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(-1))
            .build();

    public RestApiExecutor(CommonConfig commonConfig) {
        this.commonConfig = commonConfig;
    }

    @Override
    public RestApiQueryExecutionContext buildQueryExecutionContext(RestApiDatasourceConfig datasourceConfig,
            Map<String, Object> queryConfigMap,
            Map<String, Object> requestParams, QueryVisitorContext queryVisitorContext) {

        RestApiQueryConfig queryConfig = RestApiQueryConfig.from(queryConfigMap);

        // from datasource config
        String urlDomain = datasourceConfig.getUrl();
        List<Property> datasourceHeaders = datasourceConfig.getHeaders();
        List<Property> datasourceUrlParams = datasourceConfig.getParams();
        List<Property> datasourceBodyFormData = datasourceConfig.getBodyFormData();
        Set<String> forwardCookies = datasourceConfig.getForwardCookies();
        boolean forwardAllCookies = datasourceConfig.isForwardAllCookies();

        // from query config
        HttpMethod httpMethod = queryConfig.getHttpMethod();
        boolean encodeParams = !queryConfig.isDisableEncodingParams();

        String queryBody = trimToEmpty(queryConfig.getBody());
        String bodyType = trimToEmpty(queryConfig.getBodyType());
        String queryPath = trimToEmpty(queryConfig.getPath());
        List<Property> queryParams = queryConfig.getParams();
        List<Property> queryHeaders = queryConfig.getHeaders();
        List<Property> queryBodyParams = queryConfig.getBodyFormData();

        String updatedQueryPath = renderMustacheString(queryPath, requestParams);

        List<Property> updatedQueryParams = renderMustacheValueInProperties(queryParams, requestParams);
        List<Property> updatedQueryHeaders = renderMustacheValueInProperties(queryHeaders, requestParams);

        Map<String, String> allHeaders = buildHeaders(datasourceHeaders, updatedQueryHeaders);
        String contentType = parseContentType(allHeaders).toLowerCase();
        if (!isValidContentType(contentType)) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, "INVALID_CONTENT_TYPE", contentType);
        }
        // No Content-Type header (BF-057: the body was dropped silently). The editor's body type decides, as the editor
        // shows the query: a content-type body type (the header was removed by hand) stands in for the header; "None"
        // sends no body, even when the query still holds text from a body type chosen before; no body type (a query not
        // saved by the editor) sends the body text as it is, without a Content-Type. Limit: in that last case form fields
        // (bodyFormData) are not sent, as a form cannot be encoded without its content type.
        if (isNoneContentType(contentType)) {
            if (RestApiQueryConfig.CONTENT_TYPE_BODY_TYPES.contains(bodyType)) {
                contentType = bodyType;
                allHeaders = withContentType(allHeaders, contentType);
            } else if (RestApiQueryConfig.BODY_TYPE_NONE.equals(bodyType)) {
                queryBody = "";
            }
        }

        List<Property> updatedQueryBodyParams = renderMustacheValueForQueryBody(queryBodyParams, requestParams, contentType);

        // string | jsonNode
        QueryBody updatedQueryBody;
        Pair<Boolean, Boolean> jsonContentType = isJsonContentType(contentType);
        boolean isJsonContent = jsonContentType.getLeft();
        Boolean isSpecialJsonContent = jsonContentType.getRight();
        if (isJsonContent) {
            updatedQueryBody = new QueryBody(renderMustacheJson(queryBody, requestParams), true, isSpecialJsonContent);
        } else {
            updatedQueryBody = new QueryBody(renderMustacheString(queryBody, requestParams), false, false);
        }

        Map<String, String> urlParams = buildUrlParams(datasourceUrlParams, updatedQueryParams);
        List<Property> bodyParams = mergeBody(datasourceBodyFormData, updatedQueryBodyParams);

        Function<Map<String, String>, URI> uriForUrlParams = params -> RestApiUriBuilder.buildUri(urlDomain, updatedQueryPath, requestParams, params);
        URI uri = uriForUrlParams.apply(urlParams);

        QueryBody mergedQueryBody = mergeBody(updatedQueryBody, datasourceBodyFormData);
        return RestApiQueryExecutionContext.builder()
                .httpMethod(httpMethod)
                .uri(uri)
                .uriForUrlParams(uriForUrlParams)
                .headers(allHeaders)
                .contentType(contentType)
                .urlParams(urlParams)
                .bodyParams(bodyParams)
                .encodeParams(encodeParams)
                .queryBody(mergedQueryBody)
                .forwardCookies(forwardCookies)
                .forwardAllCookies(forwardAllCookies)
                .requestCookies(queryVisitorContext.getCookies())
                .authConfig(datasourceConfig.getAuthConfig())
                .sslConfig(datasourceConfig.getSslConfig())
                .authTokenMono(queryVisitorContext.getAuthTokenMono())
                .timeoutMs(queryConfig.getTimeoutMs())
                .build();
    }

    private List<Property> renderMustacheValueForQueryBody(List<Property> queryBodyParams, Map<String, Object> paramMap,
            String contentType) {
        return queryBodyParams.stream()
                .map(it -> {
                    String renderedKey = renderMustacheString(it.getKey(), paramMap);
                    if (MediaType.MULTIPART_FORM_DATA_VALUE.equals(contentType) && it.isMultipartFileType()) {
                        List<MultipartFormData> multiformFileData = convertToMultiformFileValue(it.getValue(), paramMap);
                        return new RestBodyFormFileData(renderedKey, multiformFileData);
                    }

                    String renderedStringValue = renderMustacheString(it.getValue(), paramMap);
                    return new Property(renderedKey, renderedStringValue, it.getType());
                })
                .toList();
    }


    private QueryBody mergeBody(QueryBody queryBody, List<Property> datasourceBody) {
        if (!queryBody.isJsonContent() || CollectionUtils.isEmpty(datasourceBody)) {
            return queryBody;
        }
        JsonNode jsonNode = queryBody.getJsonValue();
        if (jsonNode instanceof ObjectNode objectNode) {
            for (Property property : datasourceBody) {
                objectNode.put(property.getKey(), property.getValue());
            }
            return queryBody;
        }

        return queryBody;
    }

    @Override
    public Mono<QueryExecutionResult> executeQuery(Object webClientFilter, RestApiQueryExecutionContext context) {

        return Mono.defer(() -> authByOauth2InheritFromLogin(context))
                .then(Mono.defer(() -> {
                    WebClient.Builder webClientBuilder = WebClientBuildHelper.builder()
                            .systemProxy()
                            .disallowedHosts(commonConfig.getDisallowedHosts())
                            .sslConfig(context.getSslConfig())
                            .timeoutMs(context.getTimeoutMs())
                            .toWebClientBuilder();

                    Map<String, String> allHeaders = context.getHeaders();
                    String contentType = context.getContentType();
                    allHeaders.forEach(webClientBuilder::defaultHeader);

                    //basic auth
                    AuthConfig authConfig = context.getAuthConfig();
                    if (authConfig != null && authConfig.getType() == RestApiAuthType.BASIC_AUTH) {
                        webClientBuilder.defaultHeaders(AuthHelper.basicAuth((BasicAuthConfig) authConfig));
                    }

                    if (MediaType.MULTIPART_FORM_DATA_VALUE.equals(contentType)) {
                        webClientBuilder.filter(new BufferingFilter());
                    }

                    webClientBuilder.defaultCookies(injectCookies(context));
                    WebClient client = webClientBuilder
                            .exchangeStrategies(exchangeStrategies)
                            .build();

                    BodyInserter<?, ? super ClientHttpRequest> bodyInserter = buildBodyInserter(
                            context.getHttpMethod(),
                            context.isEncodeParams(),
                            contentType,
                            context.getQueryBody(),
                            context.getBodyParams());

                    return httpCall(client, context.getHttpMethod(), context.getUri(), bodyInserter, 0, authConfig, DEFAULT_HEADERS_CONSUMER, false)
                            .map(this::convertToQueryExecutionResult)
                            .onErrorResume(e -> propagateError(REST_API_EXECUTION_ERROR, DEFAULT_REST_ERROR_CODE, e));
                }));
    }

    /**
     * Sends the request, follows a redirect up to {@code MAX_REDIRECTS} requests, and answers a digest challenge once per
     * request: {@code digestAnswered} is true for the request that carries the answer, so a new challenge to it, the server's
     * answer to wrong credentials, is returned as the 401 it is (BF-078: every challenge was answered again until the request
     * limit, and the query failed with the redirect-limit error). A followed redirect is a new request and may be answered.
     * <p>
     * Limits: the flag is not kept per URI, so a redirect back to an answered URI is answered again (within MAX_REDIRECTS);
     * a challenge with {@code stale=true} (an expired nonce, right credentials) is not answered a second time; it gets the 401.
     */
    private Mono<ResponseEntity<byte[]>> httpCall(WebClient webClient, HttpMethod httpMethod,
            URI uri,
            BodyInserter<?, ? super ClientHttpRequest> requestBody,
            int iteration,
            @Nullable AuthConfig authConfig,
            Consumer<HttpHeaders> headersConsumer,
            boolean digestAnswered) {
        if (iteration == MAX_REDIRECTS) {
            return Mono.error(new PluginException(QUERY_EXECUTION_ERROR, "REACH_REDIRECT_LIMIT", MAX_REDIRECTS));
        }

        return webClient
                .method(httpMethod)
                .uri(uri)
                .headers(headersConsumer)
                .body(requestBody)
                .exchangeToMono(response -> {
                    String redirectUrl = WebClientRedirects.redirectLocation(response); // BF-113: null for a 3xx without a Location
                    if (redirectUrl != null) {
                        URI redirectUri;
                        try {
                            redirectUri = WebClientRedirects.resolveLocation(uri, redirectUrl);
                        } catch (URISyntaxException e) {
                            return propagateError(REST_API_EXECUTION_ERROR, DEFAULT_REST_ERROR_CODE, e);
                        }
                        if (WebClientRedirects.isSameOrigin(uri, redirectUri)) {
                            return httpCall(webClient, httpMethod, redirectUri, requestBody, iteration + 1, authConfig, headersConsumer, false);
                        }
                        // another origin: only content headers, no forwarded cookies, no digest answer
                        return httpCall(WebClientRedirects.forAnotherOrigin(webClient), httpMethod, redirectUri, requestBody,
                                iteration + 1, null, DEFAULT_HEADERS_CONSUMER, false);
                    }
                    //digest auth
                    if (!digestAnswered && authConfig != null && authConfig.getType() == DIGEST_AUTH && AuthHelper.shouldDigestAuth(response)) {
                        try {
                            return httpCall(webClient, httpMethod, uri, requestBody, iteration + 1, authConfig,
                                    headersConsumer.andThen(
                                            AuthHelper.digestAuth((BasicAuthConfig) authConfig, response, httpMethod, uri.getPath())), true);
                        } catch (ParseException e) {
                            return propagateError(REST_API_EXECUTION_ERROR, DEFAULT_REST_ERROR_CODE, e);
                        }
                    }

                    return response.toEntity(byte[].class);
                });
    }

    private Mono<Void> authByOauth2InheritFromLogin(RestApiQueryExecutionContext context) {
        if (context.getAuthConfig() == null || context.getAuthConfig().getType() != OAUTH2_INHERIT_FROM_LOGIN) {
            return Mono.empty();
        }
        return context.getAuthTokenMono()
                .doOnNext(properties -> {
                    Map<String, List<Property>> propertyMap = properties.stream()
                            .collect(Collectors.groupingBy(Property::getType));

                    List<Property> params = propertyMap.get("param");
                    if (CollectionUtils.isNotEmpty(params)) {
                        Map<String, String> paramMap = new HashMap<>(emptyIfNull(context.getUrlParams()));
                        for (Property param : params) {
                            paramMap.put(param.getKey(), param.getValue());
                        }
                        context.setUrlParams(ImmutableMap.copyOf(paramMap));
                        // the URI was built from the parameters before the token's (BF-058: they never reached the URL)
                        context.setUri(context.uriForUrlParams(context.getUrlParams()));
                    }

                    List<Property> headers = propertyMap.get("header");
                    if (CollectionUtils.isNotEmpty(headers)) {
                        Map<String, String> headerMap = new HashMap<>(emptyIfNull(context.getHeaders()));
                        for (Property header : headers) {
                            headerMap.put(header.getKey(), header.getValue());
                        }
                        context.setHeaders(ImmutableMap.copyOf(headerMap));
                    }
                })
                .switchIfEmpty(Mono.error(new PluginException(REST_API_EXECUTION_ERROR, DEFAULT_REST_ERROR_CODE,
                        "$ACCESS_TOKEN parameter missing.")))
                .onErrorResume(throwable -> propagateError(REST_API_EXECUTION_ERROR, DEFAULT_REST_ERROR_CODE, throwable))
                .then();
    }

    private Consumer<MultiValueMap<String, String>> injectCookies(RestApiQueryExecutionContext request) {
        return currentCookies -> {
            Set<String> forwardCookies = request.getForwardCookies();
            MultiValueMap<String, HttpCookie> requestCookies = request.getRequestCookies();
            if (requestCookies == null) {
                return;
            }

            if (request.isForwardAllCookies()) {
                requestCookies.forEach((cookieName, httpCookies) -> {
                    if (StringUtils.equals(cookieName, commonConfig.getCookieName())) {
                        return;
                    }
                    currentCookies.addAll(cookieName, collectList(httpCookies, HttpCookie::getValue));
                });
                return;
            }

            requestCookies.entrySet()
                    .stream()
                    .filter(it -> forwardCookies.contains(it.getKey()))
                    .filter(it -> ObjectUtils.notEqual(it.getKey(), commonConfig.getCookieName()))
                    .forEach(entry -> {
                        String cookieName = entry.getKey();
                        List<HttpCookie> httpCookies = entry.getValue();
                        currentCookies.addAll(cookieName, collectList(httpCookies, HttpCookie::getValue));
                    });
        };
    }

    private QueryExecutionResult convertToQueryExecutionResult(ResponseEntity<byte[]> responseEntity) {
        HttpHeaders headers = responseEntity.getHeaders();
        MediaType contentType = firstNonNull(headers.getContentType(), MediaType.TEXT_PLAIN); // text type if null
        byte[] body = responseEntity.getBody();
        HttpStatus statusCode = HttpStatus.resolve(responseEntity.getStatusCode().value());
        JsonNode resultHeaders = parseExecuteResultHeaders(headers);

        if (body == null) {
            return QueryExecutionResult.ofRestApiResult(statusCode, resultHeaders, statusCode.toString());
        }

        ResponseBodyData responseBodyData = parseResponseDataInfo(body, contentType);
        ObjectNode headersObjectNode = (ObjectNode) resultHeaders;
        return QueryExecutionResult.ofRestApiResult(statusCode, headersObjectNode, responseBodyData.getBody());
    }

    @Getter
    @Builder
    private static class ResponseBodyData {
        private ResponseDataType dataType;
        private Object body;

    }

    private ResponseBodyData parseResponseDataInfo(byte[] body, MediaType contentType) {

        if (isJson(contentType)) {
            try {
                return ResponseBodyData.builder()
                        .body(readTree(body))
                        .dataType(ResponseDataType.JSON)
                        .build();

            } catch (IOException e) {
                throw new PluginException(REST_API_EXECUTION_ERROR, "INVALID_JSON_FROM_RESPONSE");
            }
        }

        if (isPicture(contentType)) {
            return ResponseBodyData.builder()
                    .body(Base64.getEncoder().encode(body))
                    .dataType(ResponseDataType.IMAGE)
                    .build();
        }
        if (isBinary(contentType)) {
            return ResponseBodyData.builder()
                    .body(body)
                    .dataType(ResponseDataType.BINARY)
                    .build();
        }

        return ResponseBodyData.builder()
                .body(new String(body, StandardCharsets.UTF_8).trim())
                .dataType(ResponseDataType.TEXT)
                .build();
    }

    private JsonNode parseExecuteResultHeaders(HttpHeaders headers) {
        // Convert the headers into json tree to store in the results
        String headerInJsonString;
        try {
            headerInJsonString = toJsonThrows(headers);
        } catch (JsonProcessingException e) {
            throw new PluginException(QUERY_EXECUTION_ERROR, DEFAULT_REST_ERROR_CODE, e.getMessage());
        }

        // Set headers in the result now
        try {
            return (readTree(headerInJsonString));
        } catch (IOException e) {
            throw new PluginException(JSON_PARSE_ERROR, "JSON_PARSE_ERROR", headerInJsonString, e.getMessage());
        }
    }

    private List<Property> mergeBody(List<Property> datasourceBodyFormData, List<Property> updatedQueryBodyParams) {
        Set<String> keySet = updatedQueryBodyParams.stream()
                .map(Property::getKey)
                .collect(Collectors.toCollection(HashSet::new));
        List<Property> merge = new ArrayList<>(updatedQueryBodyParams);
        for (Property property : datasourceBodyFormData) {
            if (!keySet.contains(property.getKey())) {
                merge.add(property);
                keySet.add(property.getKey());
            }
        }
        return merge;
    }

    private Map<String, String> buildUrlParams(List<Property> datasourceUrlParams, List<Property> updatedQueryParams) {
        return Stream.concat(datasourceUrlParams.stream(),
                        updatedQueryParams.stream())
                .collect(Collectors.toUnmodifiableMap(Property::getKey,
                        Property::getValue,
                        (oldValue, newValue) -> newValue));
    }

    /**
     * The headers with the given Content-Type added, for a query whose editor body type stands in for the missing header
     * (BF-057): the request then goes out as if the editor had set the header, as it does when the body type is chosen.
     */
    private static Map<String, String> withContentType(Map<String, String> headers, String contentType) {
        Map<String, String> withContentType = new HashMap<>(headers);
        withContentType.put(HttpHeaders.CONTENT_TYPE, contentType);
        return Collections.unmodifiableMap(withContentType);
    }

    private Map<String, String> buildHeaders(List<Property> datasourceHeaders, List<Property> updatedQueryHeaders) {
        return Stream.concat(datasourceHeaders.stream(),
                        updatedQueryHeaders.stream())
                .filter(it -> StringUtils.isNotBlank(it.getKey()) && StringUtils.isNotBlank(it.getValue()))
                .collect(Collectors.toUnmodifiableMap(property -> property.getKey().trim(),
                        Property::getValue,
                        (oldValue, newValue) -> newValue));
    }

    private BodyInserter<?, ? super ClientHttpRequest> buildBodyInserter(HttpMethod httpMethod,
            boolean isEncodeParams,
            String requestContentType,
            QueryBody queryBody,
            List<Property> bodyFormData) {

        if (HttpMethod.GET.equals(httpMethod)) {
            return BodyInserters.fromValue(new byte[0]);
        }

        if (isNoneContentType(requestContentType)) {
            // no Content-Type: the body as typed, as bytes, so that no encoder adds a Content-Type (BF-057: it was dropped)
            return BodyInserters.fromValue(String.valueOf(queryBody.value()).getBytes(StandardCharsets.UTF_8));
        }

        if (queryBody.isSpecialJson()) {
            return BodyInserters.fromValue(queryBody.getJsonValue().toString());
        }

        if (queryBody.isJsonContent()) {
            return BodyInserters.fromValue(queryBody.getJsonValue());
        }

        if (MediaType.APPLICATION_FORM_URLENCODED_VALUE.equals(requestContentType)
                || MediaType.MULTIPART_FORM_DATA_VALUE.equals(requestContentType)) {
            return dataUtils.buildBodyInserter(bodyFormData, requestContentType, isEncodeParams);
        }
        return BodyInserters.fromValue(queryBody.value());
    }

    private boolean isNoneContentType(String requestContentType) {
        return StringUtils.isBlank(requestContentType);
    }

    private List<Property> renderMustacheValueInProperties(List<Property> properties, Map<String, Object> paramMap) {
        return properties.stream()
                .map(it -> {
                    Property newProperty = new Property(renderMustacheString(it.getKey(), paramMap),
                            renderMustacheString(it.getValue(), paramMap));
                    newProperty.setType(it.getType());
                    return newProperty;
                })
                .toList();
    }

}