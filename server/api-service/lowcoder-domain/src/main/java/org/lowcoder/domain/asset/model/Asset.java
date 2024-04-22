package org.lowcoder.domain.asset.model;

import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.http.MediaType;

import com.fasterxml.jackson.annotation.JsonCreator;

@Document
@Jacksonized
@SuperBuilder
@NoArgsConstructor
public class Asset extends HasIdAndAuditing {

    private String contentType;

    private byte[] data;

    public static Asset from(MediaType mediaType, byte[] data) {
        return Asset.builder()
                .contentType(mediaType == null ? null : mediaType.toString())
                .data(data)
                .build();
    }

    public String getContentType() {
        return contentType;
    }

    public byte[] getData() {
        return data;
    }
}
