package org.lowcoder.domain.asset.model;

import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.http.MediaType;

import com.fasterxml.jackson.annotation.JsonCreator;

@Document
public class Asset extends HasIdAndAuditing {

    private final String contentType;

    private final byte[] data;

    @JsonCreator
    private Asset(String contentType, byte[] data) {
        this.contentType = contentType;
        this.data = data;
    }

    public static Asset from(MediaType mediaType, byte[] data) {
        return new Asset(mediaType == null ? null : mediaType.toString(), data);
    }

    public String getContentType() {
        return contentType;
    }

    public byte[] getData() {
        return data;
    }
}
