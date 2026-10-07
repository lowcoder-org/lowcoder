package org.lowcoder.plugin.restapi.model;

import static org.apache.commons.collections4.ListUtils.emptyIfNull;
import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_QUERY_SETTINGS;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

import java.util.List;
import java.util.Map;
import java.util.Set;

import lombok.extern.jackson.Jacksonized;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.Property;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.Builder;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Getter
@Builder
@Jacksonized
public class RestApiQueryConfig {

    /** The body type of the editor's "None": the query has no body, whatever text it still holds. */
    public static final String BODY_TYPE_NONE = "none";
    /** The body types of the editor that are content types (JSON, Raw, x-www-form-urlencoded, Form Data). */
    public static final Set<String> CONTENT_TYPE_BODY_TYPES = Set.of(MediaType.APPLICATION_JSON_VALUE, MediaType.TEXT_PLAIN_VALUE,
            MediaType.APPLICATION_FORM_URLENCODED_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE);

    private final HttpMethod httpMethod;
    private boolean disableEncodingParams;
    private final String body;
    private final String path;
    private final List<Property> params;
    private final List<Property> headers;
    private final List<Property> bodyFormData;
    private final long timeoutMs;
    /**
     * The body type chosen in the query editor: one of {@link #CONTENT_TYPE_BODY_TYPES} or {@link #BODY_TYPE_NONE}; null for
     * a query not saved by the editor. The editor sets the Content-Type header to it, so it matters only when that header is
     * missing (BF-057).
     */
    private final String bodyType;

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
