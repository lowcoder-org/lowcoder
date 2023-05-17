package org.lowcoder.domain.datasource.model;

import static org.lowcoder.domain.datasource.model.DatasourceCreationSource.LEGACY_WORKSPACE_PREDEFINED;
import static org.lowcoder.domain.datasource.model.DatasourceCreationSource.SYSTEM_STATIC;
import static org.lowcoder.domain.plugin.DatasourceMetaInfoConstants.GRAPHQL_API;
import static org.lowcoder.domain.plugin.DatasourceMetaInfoConstants.REST_API;

import java.util.Locale;
import java.util.Optional;
import java.util.Set;

import javax.annotation.Nullable;

import org.apache.commons.lang3.ObjectUtils;
import org.lowcoder.domain.plugin.DatasourceMetaInfoConstants;
import org.lowcoder.domain.plugin.client.dto.DatasourcePluginDefinition;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.lowcoder.sdk.plugin.lowcoderapi.LowcoderApiDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.util.LocaleUtils;
import org.springframework.data.annotation.Transient;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Datasource extends HasIdAndAuditing {

    private static final DatasourceStatus DEFAULT_STATUS = DatasourceStatus.NORMAL;
    public static final String QUICK_REST_API_ID = "#QUICK_REST_API";
    public static final String QUICK_GRAPHQL_ID = "#QUICK_GRAPHQL";
    public static final String LOWCODER_API_ID = "#LOWCODER_API";

    private static final Set<String> SYSTEM_STATIC_IDS = Set.of(QUICK_REST_API_ID,
            QUICK_GRAPHQL_ID, LOWCODER_API_ID);

    public static final Datasource QUICK_REST_API;
    public static final Datasource QUICK_GRAPHQL_API;
    public static final Datasource LOWCODER_API;

    static {
        QUICK_REST_API = new Datasource();
        QUICK_REST_API.setId(QUICK_REST_API_ID);
        QUICK_REST_API.setName("REST API");
        QUICK_REST_API.setType(REST_API);
        QUICK_REST_API.setCreationSource(SYSTEM_STATIC.getValue());
        QUICK_REST_API.setDetailConfig(RestApiDatasourceConfig.EMPTY_CONFIG);

        QUICK_GRAPHQL_API = new Datasource();
        QUICK_GRAPHQL_API.setId(QUICK_GRAPHQL_ID);
        QUICK_GRAPHQL_API.setName("GraphQL API");
        QUICK_GRAPHQL_API.setType(GRAPHQL_API);
        QUICK_GRAPHQL_API.setCreationSource(SYSTEM_STATIC.getValue());
        QUICK_GRAPHQL_API.setDetailConfig(GraphQLDatasourceConfig.EMPTY_CONFIG);

        LOWCODER_API = new Datasource();
        LOWCODER_API.setId(LOWCODER_API_ID);
        LOWCODER_API.setName("Lowcoder API");
        LOWCODER_API.setType(DatasourceMetaInfoConstants.LOWCODER_API);
        LOWCODER_API.setCreationSource(SYSTEM_STATIC.getValue());
        LOWCODER_API.setDetailConfig(LowcoderApiDatasourceConfig.INSTANCE);
    }

    private String name;
    private String type;
    private String organizationId;
    private int creationSource;
    private DatasourceStatus datasourceStatus;
    // for js data source plugin
    @Nullable
    @Transient
    private DatasourcePluginDefinition pluginDefinition;

    @JsonProperty(value = "datasourceConfig")
    private DatasourceConnectionConfig detailConfig;

    public Datasource mergeWith(Datasource updatedDatasource) {
        setName(updatedDatasource.getName());
        Optional.of(getDetailConfig())
                .ifPresentOrElse(currentDetailConfig -> {
                            if (updatedDatasource.getDetailConfig() instanceof JsDatasourceConnectionConfig jsDatasourceConnectionConfig) {
                                jsDatasourceConnectionConfig.setType(updatedDatasource.getType());
                            }
                            DatasourceConnectionConfig updatedDetailConfig =
                                    currentDetailConfig.mergeWithUpdatedConfig(updatedDatasource.getDetailConfig());
                            setDetailConfig(updatedDetailConfig);
                        },
                        () -> setDetailConfig(updatedDatasource.getDetailConfig()));
        return this;
    }

    @JsonIgnore
    public boolean isSystemStatic() {
        return creationSource == SYSTEM_STATIC.getValue();
    }

    public static String getDisplayName(String datasourceId, Locale locale) {
        if (QUICK_REST_API_ID.equals(datasourceId)) {
            return LocaleUtils.getMessage(locale, "QUICK_REST_DATASOURCE_NAME");
        }

        if (QUICK_GRAPHQL_ID.equals(datasourceId)) {
            return LocaleUtils.getMessage(locale, "QUICK_GRAPHQL_DATASOURCE_NAME");
        }

        if (LOWCODER_API_ID.equals(datasourceId)) {
            return LocaleUtils.getMessage(locale, "LOWCODER_DATASOURCE_NAME");
        }
        return "";
    }

    @JsonIgnore
    public boolean isLegacyQuickRestApi() {
        return REST_API.equals(type) && creationSource == LEGACY_WORKSPACE_PREDEFINED.getValue();
    }

    @JsonIgnore
    public boolean isLegacyLowcoderApi() {
        return !REST_API.equals(type) && creationSource == LEGACY_WORKSPACE_PREDEFINED.getValue();
    }

    public String getOrganizationId() {
        return organizationId;
    }

    public long getCreateTime() {
        return createdAt.toEpochMilli();
    }

    public DatasourceStatus getDatasourceStatus() {
        return ObjectUtils.firstNonNull(this.datasourceStatus, DEFAULT_STATUS);
    }

    public static boolean isSystemStaticId(String datasourceId) {
        return SYSTEM_STATIC_IDS.contains(datasourceId);
    }

    public static boolean isNotSystemStaticId(String datasourceId) {
        return !isSystemStaticId(datasourceId);
    }
}
