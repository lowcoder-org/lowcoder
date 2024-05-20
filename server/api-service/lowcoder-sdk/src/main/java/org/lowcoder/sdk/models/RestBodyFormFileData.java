package org.lowcoder.sdk.models;

import org.lowcoder.sdk.plugin.restapi.DataUtils.MultipartFormDataType;
import org.lowcoder.sdk.plugin.restapi.MultipartFormData;

import java.util.List;

public class RestBodyFormFileData extends Property {

    private List<MultipartFormData> fileData;

    public RestBodyFormFileData(String key, String value) {
        super(key, value);
    }

    public RestBodyFormFileData(String key, String value, String type) {
        super(key, value, type);
    }

    public RestBodyFormFileData(String key, List<MultipartFormData> fileData) {
        super(key, null, MultipartFormDataType.FILE.name());
        this.fileData = fileData;
    }

    public List<MultipartFormData> getFileData() {
        return fileData;
    }
}
