package org.lowcoder.domain.organization.model;

import com.fasterxml.jackson.core.type.TypeReference;
import lombok.Getter;
import lombok.Setter;
import org.lowcoder.domain.mongodb.MongodbInterceptorContext;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.config.JsonViews;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.data.annotation.Transient;

import java.util.ArrayList;
import java.util.List;

public class OrganizationDomain implements EnterpriseConnectionConfig {

    @Getter
    @Setter
    private String domain;

    @Setter
    @Getter
    @Transient
    private List<AbstractAuthConfig> configs = new ArrayList<>();

    /**
     * Only used for mongodb (de)serialization
     */
    private List<Object> authConfigs = new ArrayList<>();

    void beforeMongodbWrite(MongodbInterceptorContext context) {
        this.configs.forEach(authConfig -> authConfig.doEncrypt(s -> context.encryptionService().encryptString(s)));
        authConfigs = JsonUtils.fromJsonSafely(JsonUtils.toJsonSafely(configs, JsonViews.Internal.class), new TypeReference<>() {
        }, new ArrayList<>());
    }

    void afterMongodbRead(MongodbInterceptorContext context) {
        this.configs = JsonUtils.fromJsonSafely(JsonUtils.toJson(authConfigs), new TypeReference<>() {
        }, new ArrayList<>());
        this.configs.forEach(authConfig -> authConfig.doDecrypt(s -> context.encryptionService().decryptString(s)));
    }
}
