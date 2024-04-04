package org.lowcoder.plugin.redis.model;

import static org.apache.commons.lang3.ObjectUtils.firstNonNull;
import static org.lowcoder.sdk.exception.BizError.INVALID_DATASOURCE_CONFIG_TYPE;
import static org.lowcoder.sdk.exception.PluginCommonError.DATASOURCE_ARGUMENT_ERROR;
import static org.lowcoder.sdk.util.ExceptionUtils.ofException;
import static org.lowcoder.sdk.util.ExceptionUtils.ofPluginException;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

import java.util.Map;
import java.util.function.Function;

import lombok.extern.jackson.Jacksonized;
import org.lowcoder.sdk.config.SerializeConfig.JsonViews;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Builder;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Getter
@Builder
@Jacksonized
public class RedisDatasourceConfig implements DatasourceConnectionConfig {

    private final String host;
    private final Long port;
    private final boolean usingSsl;
    private final String username;
    @JsonView(JsonViews.Internal.class)
    private String password;
    private final boolean usingUri;
    @JsonView(JsonViews.Internal.class)
    private String uri;

    public static RedisDatasourceConfig buildFrom(Map<String, Object> requestMap) {
        RedisDatasourceConfig result = fromJson(toJson(requestMap), RedisDatasourceConfig.class);
        if (result == null) {
            throw ofPluginException(DATASOURCE_ARGUMENT_ERROR, "INVALID_REDIS_CONFIG");
        }
        return result;
    }

    @Override
    public DatasourceConnectionConfig doEncrypt(Function<String, String> encryptFunc) {
        try {
            password = encryptFunc.apply(password);
            uri = encryptFunc.apply(uri);
            return this;
        } catch (Exception e) {
            log.error("fail to encrypt password: {}", password, e);
            return this;
        }
    }

    @Override
    public DatasourceConnectionConfig doDecrypt(Function<String, String> decryptFunc) {
        try {
            password = decryptFunc.apply(password);
            uri = decryptFunc.apply(uri);
            return this;
        } catch (Exception e) {
            log.error("fail to encrypt password: {}", password, e);
            return this;
        }
    }

    @Override
    public DatasourceConnectionConfig mergeWithUpdatedConfig(DatasourceConnectionConfig updatedConfig) {

        if (!(updatedConfig instanceof RedisDatasourceConfig updatedRedisConfig)) {
            throw ofException(INVALID_DATASOURCE_CONFIG_TYPE, "INVALID_DATASOURCE_CONFIG_TYPE", updatedConfig.getClass().getSimpleName());
        }

        if (updatedRedisConfig.isUsingUri()) {
            return RedisDatasourceConfig.builder()
                    .usingUri(true)
                    .uri(firstNonNull(updatedRedisConfig.getUri(), getUri()))
                    .build();
        }

        return RedisDatasourceConfig.builder()
                .usingUri(false)
                .usingSsl(updatedRedisConfig.isUsingSsl())
                .host(updatedRedisConfig.getHost())
                .port(updatedRedisConfig.getPort())
                .username(updatedRedisConfig.getUsername())
                .password(firstNonNull(updatedRedisConfig.getPassword(), this.getPassword()))
                .build();
    }
}
