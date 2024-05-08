package org.lowcoder.plugin.graphql.model;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.annotation.Nullable;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.plugin.restapi.auth.AuthConfig;
import org.lowcoder.sdk.query.QueryExecutionContext;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpMethod;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Builder
public class GraphQLQueryExecutionContext extends QueryExecutionContext {
    private String url;
    private HttpMethod httpMethod;

    @Setter
    private Map<String, String> headers;
    @Setter
    private Map<String, String> urlParams;
    private List<Property> bodyParams;

    private JsonNode variablesParams;
    @Setter
    private Object queryBody;
    private String contentType;
    private boolean encodeParams;

    private Set<String> forwardCookies;
    private boolean forwardAllCookies;
    private MultiValueMap<String, HttpCookie> requestCookies;
    @Nullable
    private AuthConfig authConfig;
    @Getter
    private Mono<List<Property>> authTokenMono;

    public String getUrl() {
        return url;
    }

    public Object getQueryBody() {
        return queryBody;
    }

    public String getContentType() {
        return contentType;
    }

    public HttpMethod getHttpMethod() {
        return httpMethod;
    }

    public boolean isEncodeParams() {
        return encodeParams;
    }

    public Map<String, String> getHeaders() {
        return headers;
    }

    public Map<String, String> getUrlParams() {
        return urlParams;
    }

    public List<Property> getBodyParams() {
        return bodyParams;
    }

    public JsonNode getVariablesParams() {
        return variablesParams;
    }

    public Set<String> getForwardCookies() {
        return forwardCookies;
    }

    public boolean isForwardAllCookies() {
        return forwardAllCookies;
    }

    public MultiValueMap<String, HttpCookie> getRequestCookies() {
        return requestCookies;
    }

    @Nullable
    public AuthConfig getAuthConfig() {
        return authConfig;
    }
}
