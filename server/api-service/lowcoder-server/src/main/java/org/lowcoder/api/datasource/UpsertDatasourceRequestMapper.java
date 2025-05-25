package org.lowcoder.api.datasource;

import static org.lowcoder.sdk.exception.BizError.INVALID_DATASOURCE_CONFIGURATION;
import static org.lowcoder.sdk.util.ExceptionUtils.ofException;

import com.github.f4b6a3.uuid.UuidCreator;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class UpsertDatasourceRequestMapper {

    @Autowired
    private DatasourceMetaInfoService datasourceMetaInfoService;

    public Datasource resolve(UpsertDatasourceRequest dto) {

        if (StringUtils.isBlank(dto.getName())) {
            throw ofException(INVALID_DATASOURCE_CONFIGURATION, "DATASOURCE_NAME_EMPTY");
        }

        if (StringUtils.isBlank(dto.getType())) {
            throw ofException(INVALID_DATASOURCE_CONFIGURATION, "INVALID_DATASOURCE_TYPE_0");
        }

        if (StringUtils.isBlank(dto.getOrganizationId())) {
            throw ofException(INVALID_DATASOURCE_CONFIGURATION, "INVALID_DATASOURCE_ORG_ID");
        }

        Datasource datasource = new Datasource();
        datasource.setId(dto.getId());
        datasource.setGid(dto.getGid());
        datasource.setName(dto.getName());
        datasource.setType(dto.getType());
        datasource.setOrganizationId(dto.getOrganizationId());
        datasource.setDatasourceStatus(dto.getStatus());
        if (datasourceMetaInfoService.isJsDatasourcePlugin(datasource.getType())) {
            datasource.setDetailConfig(JsonUtils.fromJson(JsonUtils.toJson(dto.getDatasourceConfig()), JsDatasourceConnectionConfig.class));
        } else {
            datasource.setDetailConfig(datasourceMetaInfoService.resolveDetailConfig(dto.getDatasourceConfig(), dto.getType()));
        }
        return datasource;
    }

}
