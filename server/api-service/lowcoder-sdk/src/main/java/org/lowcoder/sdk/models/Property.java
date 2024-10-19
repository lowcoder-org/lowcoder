package org.lowcoder.sdk.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import lombok.extern.jackson.Jacksonized;
import org.lowcoder.sdk.plugin.restapi.DataUtils.MultipartFormDataType;

@ToString
@EqualsAndHashCode
@Builder
@Jacksonized
public class Property {

    private final String key;
    private final String value;
    private String type;

    @JsonCreator
    public Property(String key, String value) {
        this(key, value, null);
    }

    public Property(String key, String value, String type) {
        this.key = key;
        this.value = value;
        this.type = type;
    }

    public String getKey() {
        return key;
    }

    public String getValue() {
        return value;
    }

    public String getType() {
        return type;
    }

    public boolean isMultipartFileType() {
        return MultipartFormDataType.FILE.name().equalsIgnoreCase(type);
    }

    public void setType(String type) {
        this.type = type;
    }
}
