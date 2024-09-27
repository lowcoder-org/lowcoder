package org.lowcoder.plugin.googlesheets.model;

import com.fasterxml.jackson.annotation.JsonView;
import com.google.common.base.MoreObjects;
import lombok.Builder;
import lombok.Getter;
import lombok.extern.jackson.Jacksonized;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.sdk.config.JsonViews;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;

import java.util.Map;
import java.util.function.Function;

import static org.lowcoder.sdk.util.ExceptionUtils.ofPluginException;
import static org.lowcoder.sdk.util.JsonUtils.fromJson;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

@Slf4j
@Getter
@Builder
@Jacksonized
public class GoogleSheetsDatasourceConfig implements DatasourceConnectionConfig {

    @JsonView(JsonViews.Internal.class)
    private String serviceAccount;

    public static GoogleSheetsDatasourceConfig buildFrom(Map<String, Object> requestMap) {
        GoogleSheetsDatasourceConfig result = fromJson(toJson(requestMap), GoogleSheetsDatasourceConfig.class);
        if (result == null) {
            throw ofPluginException(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, "GOOGLESHEETS_DATASOURCE_CONFIG_ERROR");
        }
        return result;
    }

    @Override
    public DatasourceConnectionConfig mergeWithUpdatedConfig(DatasourceConnectionConfig detailConfig) {
        if (!(detailConfig instanceof GoogleSheetsDatasourceConfig updatedConfig)) {
            throw ofPluginException(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, "GOOGLESHEETS_DATASOURCE_CONFIG_ERROR");
        }
        return new GoogleSheetsDatasourceConfig(MoreObjects.firstNonNull(updatedConfig.getServiceAccount(), serviceAccount));
    }

    @Override
    public DatasourceConnectionConfig doEncrypt(Function<String, String> encryptFunc) {
        try {
            serviceAccount = encryptFunc.apply(serviceAccount);
            return this;
        } catch (Exception e) {
            log.error("fail to encrypt password: {}", serviceAccount, e);
            return this;
        }
    }

    @Override
    public DatasourceConnectionConfig doDecrypt(Function<String, String> decryptFunc) {
        try {
            serviceAccount = decryptFunc.apply(serviceAccount);
            return this;
        } catch (Exception e) {
            log.error("fail to decrypt password: {}", serviceAccount, e);
            return this;
        }
    }
}
