package org.lowcoder.plugin.graphql.model;

import static org.apache.commons.collections4.ListUtils.emptyIfNull;
import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_QUERY_SETTINGS;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

import java.util.List;
import java.util.Map;

import lombok.Builder;
import lombok.extern.jackson.Jacksonized;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.Property;
import org.springframework.http.HttpMethod;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.Getter;

@Getter
@Builder
@Jacksonized
public class GraphQLQueryConfig {
    private final HttpMethod httpMethod = HttpMethod.POST;
    private final String body;
    private final String path;
    private final List<Property> params;
    private final List<Property> headers;
    private final List<Property> bodyFormData;


    private final List<Property> variables;

    private final boolean disableEncodingParams = false;

    @JsonCreator
    private GraphQLQueryConfig(String body, String path,
            List<Property> params, List<Property> headers, List<Property> bodyFormData, List<Property> variables) {
        this.body = body;
        this.path = path;
        this.params = params;
        this.headers = headers;
        this.bodyFormData = bodyFormData;
        this.variables = variables;
    }

    public static GraphQLQueryConfig from(Map<String, Object> queryConfigs) {
        GraphQLQueryConfig queryConfig = fromJson(toJson(queryConfigs), GraphQLQueryConfig.class);
        if (queryConfig == null) {
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

    /**
     * The GraphQL variables, empty when the query config has no {@code variables} key, as the other lists are (BF-161: the
     * executor iterated a null list, a raw NullPointerException). The client's GraphQL form always writes the key, so only
     * a query config written outside it lacks it.
     */
    public List<Property> getVariables() {
        return emptyIfNull(variables);
    }
}
