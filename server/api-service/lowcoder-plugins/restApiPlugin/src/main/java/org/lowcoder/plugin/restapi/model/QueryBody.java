package org.lowcoder.plugin.restapi.model;

import tools.jackson.databind.JsonNode;

/**
 * value is either JsonNode or String
 */
public record QueryBody(Object value, boolean isJsonContent, boolean isSpecialJson) {

    public JsonNode getJsonValue() {
        return (JsonNode) value;
    }

}