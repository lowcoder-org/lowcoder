package org.lowcoder.plugin.restapi.model;

import static org.apache.commons.collections4.ListUtils.emptyIfNull;
import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_QUERY_SETTINGS;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

import java.util.List;
import java.util.Map;

import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.Property;
import org.springframework.http.HttpMethod;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.Builder;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Getter
@Builder
public class RestApiQueryConfig {

    private final HttpMethod httpMethod;
    private boolean disableEncodingParams;
    private final String body;
    private final String path;
    private final List<Property> params;
    private final List<Property> headers;
    private final List<Property> bodyFormData;
    private final long timeoutMs;

    @JsonCreator
    private RestApiQueryConfig(HttpMethod httpMethod, boolean disableEncodingParams, String body, String path,
            List<Property> params, List<Property> headers, List<Property> bodyFormData, long timeoutMs) {
        this.httpMethod = httpMethod;
        this.disableEncodingParams = disableEncodingParams;
        this.body = body;
        this.path = path;
        this.params = params;
        this.headers = headers;
        this.bodyFormData = bodyFormData;
        this.timeoutMs = timeoutMs;
    }

    public static RestApiQueryConfig from(Map<String, Object> queryConfigs) {
        RestApiQueryConfig queryConfig = fromJson(toJson(queryConfigs), RestApiQueryConfig.class);
        if (queryConfig == null) {
            log.error("deserialize query config fail:{}", toJson(queryConfigs));
            throw new PluginException(INVALID_QUERY_SETTINGS, "INVALID_RESTAPI");
        }
        return queryConfig;
    }

    public List<Property> getHeaders() {
        return emptyIfNull(headers);
    }

    public List<Property> getParams() {
        return emptyIfNull(params);
    }

    public List<Property> getBodyFormData() {
        return emptyIfNull(bodyFormData);
    }
}
