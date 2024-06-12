package org.lowcoder.api.authentication.dto;

import jakarta.annotation.Nullable;
import jakarta.validation.constraints.Null;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;

import java.util.HashMap;

import static org.lowcoder.sdk.util.IDUtils.generate;

public class AuthConfigRequest extends HashMap<String, Object> {

    /**
     * If the current auth config is new, the id should be absent, and we will generate a new one. In other word, if the id is present, the auth
     * config will be updated instead of creating a new one.
     */
    public String getId() {
        return ObjectUtils.firstNonNull(getString("id"), generate());
    }

    public String getAuthType() {
        return getString("authType");
    }

    public boolean isEnableRegister() {
        return MapUtils.getBoolean(this, "enableRegister", true);
    }

    /**
     * Additional configs for generic
     * config will be updated instead of creating a new one.
     */
    @Nullable
    public String getIssuerUri() {
        return getString("issuerUri");
    }

    @Nullable
    public String getAuthorizationEndpoint() {
        return getString("authorizationEndpoint");
    }

    @Nullable
    public String getTokenEndpoint() {
        return getString("tokenEndpoint");
    }

    @Nullable
    public String getUserInfoEndpoint() {
        return getString("userInfoEndpoint");
    }

    @Nullable
    public String getInstanceId() {
        return getString("instanceId");
    }

    @Nullable
    public String getClientId() {
        return getString("clientId");
    }

    @Nullable
    public String getClientSecret() {
        return getString("clientSecret");
    }

    @Nullable
    public String getScope() {
        return getString("scope");
    }

    public String getSource(String defaultValue) {
        String source = getString("source");
        if (StringUtils.isNotBlank(source)) {
            return source;
        }
        return defaultValue;
    }

    public String getSourceName(String defaultValue) {
        String sourceName = getString("sourceName");
        if (StringUtils.isNotBlank(sourceName)) {
            return sourceName;
        }
        return defaultValue;
    }

    public String getSourceDescription() {
        return getString("sourceDescription");
    }

    public String getSourceIcon() {
        return getString("sourceIcon");
    }

    public String getSourceCategory() {
        return getString("sourceCategory");
    }

    public HashMap<String, String> getSourceMappings() {
        return (HashMap<String, String>) MapUtils.getMap(this, "sourceMappings");
    }

    public String getString(String key) {
        return MapUtils.getString(this, key);
    }

}
