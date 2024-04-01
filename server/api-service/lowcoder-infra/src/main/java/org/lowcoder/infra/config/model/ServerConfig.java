package org.lowcoder.infra.config.model;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.Builder;

@SuperBuilder
@Jacksonized
@Document
@AllArgsConstructor
@NoArgsConstructor
public class ServerConfig extends HasIdAndAuditing {

    private String key;
    private Object value;

    public String getKey() {
        return key;
    }

    public Object getValue() {
        return value;
    }

}
