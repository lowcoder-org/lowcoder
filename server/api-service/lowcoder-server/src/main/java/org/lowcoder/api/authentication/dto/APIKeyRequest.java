package org.lowcoder.api.authentication.dto;

import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.ObjectUtils;

import java.util.HashMap;

import static org.lowcoder.sdk.util.IDUtils.generate;

public class APIKeyRequest extends HashMap<String, Object> {

    public String getId() {
        return ObjectUtils.firstNonNull(getString("id"), generate());
    }

    public String getName() {
        return getString("name");
    }

    public String getDescription() {
        return getString("description");
    }

    public String getString(String key) {
        return MapUtils.getString(this, key);
    }
}
