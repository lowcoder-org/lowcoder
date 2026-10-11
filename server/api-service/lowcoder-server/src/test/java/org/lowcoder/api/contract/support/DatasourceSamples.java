package org.lowcoder.api.contract.support;

import org.lowcoder.api.datasource.DatasourceEndpoints.BatchAddPermissionRequest;
import org.lowcoder.api.datasource.DatasourceEndpoints.UpdatePermissionRequest;
import org.lowcoder.api.datasource.DatasourceView;
import org.lowcoder.api.datasource.UpsertDatasourceRequest;
import org.lowcoder.api.permission.view.CommonPermissionView;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.permission.model.ResourceHolder;
import org.lowcoder.domain.plugin.client.dto.DatasourcePluginDefinition;
import org.lowcoder.domain.plugin.client.dto.GetPluginDynamicConfigRequestDTO;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceStructure.Column;
import org.lowcoder.sdk.models.DatasourceStructure.ForeignKey;
import org.lowcoder.sdk.models.DatasourceStructure.PrimaryKey;
import org.lowcoder.sdk.models.DatasourceStructure.Table;
import org.lowcoder.sdk.models.DatasourceStructure.TableType;
import org.lowcoder.sdk.models.DatasourceStructure.Template;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Samples of the datasource types (docs/API_PAYLOAD_TEST_PLAN.md §3.3, task T5.1), with the conventions of
 * {@link PayloadSamples}. Permission roles are real {@code ResourceRole} values, because {@code DatasourceController}
 * rejects others.
 *
 * <p>A datasource's {@code detailConfig} is declared as the interface {@code DatasourceConnectionConfig}; the samples
 * hold the test-only {@link ViewMarkedConnectionConfig} (§5.5), whose {@code Internal} member the {@code Public}
 * endpoints must not write. The connection settings a client sends ({@code datasourceConfig} of the requests) are a
 * {@code Map<String, Object>} with realistic content: values as Jackson binds JSON into it.
 */
public final class DatasourceSamples {

    /** {@code Datasource#creationSource}, an {@code int}: above {@code Short.MAX_VALUE} (adequacy check 5). */
    public static final int CREATION_SOURCE = 40_501;
    /** When the sample datasource was created: {@code Datasource#getCreateTime} writes it in milliseconds. */
    public static final Instant DATASOURCE_CREATED_AT = ApplicationSamples.instant(500);
    /** Above {@code Integer.MAX_VALUE}: inside a {@code Map<String, Object>}, JSON binding must give a {@code Long}. */
    public static final long CONFIG_LONG = 3_000_000_502L;
    public static final int CONFIG_INT = 40_503;
    public static final double CONFIG_DECIMAL = 2.5;

    private DatasourceSamples() {
    }

    /** {@code DatasourceEndpoints#create}, {@code #update} and {@code #testDatasource}. */
    public static UpsertDatasourceRequest upsertDatasourceRequest() {
        UpsertDatasourceRequest request = new UpsertDatasourceRequest();
        request.setId("UpsertDatasourceRequest.id");
        request.setGid("UpsertDatasourceRequest.gid");
        request.setName("UpsertDatasourceRequest.name");
        request.setType("UpsertDatasourceRequest.type");
        request.setOrganizationId("UpsertDatasourceRequest.organizationId");
        request.setStatus(DatasourceStatus.DELETED);
        request.setDatasourceConfig(connectionSettings("UpsertDatasourceRequest.datasourceConfig"));
        return request;
    }

    public static BatchAddPermissionRequest batchAddPermissionRequest() {
        return new BatchAddPermissionRequest(ApplicationSamples.EDITOR_ROLE,
                new HashSet<>(List.of("DatasourceEndpoints.BatchAddPermissionRequest.userIds[0]", "DatasourceEndpoints.BatchAddPermissionRequest.userIds[1]")),
                new HashSet<>(List.of("DatasourceEndpoints.BatchAddPermissionRequest.groupIds[0]", "DatasourceEndpoints.BatchAddPermissionRequest.groupIds[1]")));
    }

    public static UpdatePermissionRequest updatePermissionRequest() {
        return new UpdatePermissionRequest(ApplicationSamples.VIEWER_ROLE);
    }

    /** One element of {@code DatasourceEndpoints#getPluginDynamicConfig}'s request list. */
    public static GetPluginDynamicConfigRequestDTO getPluginDynamicConfigRequestDTO() {
        return GetPluginDynamicConfigRequestDTO.builder()
                .dataSourceId("GetPluginDynamicConfigRequestDTO.dataSourceId")
                .pluginName("GetPluginDynamicConfigRequestDTO.pluginName")
                .path("GetPluginDynamicConfigRequestDTO.path")
                .dataSourceConfig(connectionSettings("GetPluginDynamicConfigRequestDTO.dataSourceConfig"))
                .build();
    }

    /**
     * The datasource of the {@code Public} endpoints. {@code createdAt} is {@code @JsonIgnore}d but read by
     * {@code getCreateTime}; {@code updatedAt} and {@code modifiedBy}, also ignored, stay unset.
     */
    public static Datasource datasource() {
        return datasource("Datasource");
    }

    static Datasource datasource(String prefix) {
        Datasource datasource = Datasource.builder()
                .id(prefix + ".id")
                .createdBy(prefix + ".createdBy")
                .gid(prefix + ".gid")
                .name(prefix + ".name")
                .type(prefix + ".type")
                .organizationId(prefix + ".organizationId")
                .creationSource(CREATION_SOURCE)
                .datasourceStatus(DatasourceStatus.DELETED)
                .pluginDefinition(pluginDefinition(prefix + ".pluginDefinition"))
                .detailConfig(new ViewMarkedConnectionConfig(prefix + ".detailConfig.host",
                        PayloadSamples.SECRET_MARKER + prefix + ".detailConfig.password"))
                .build();
        datasource.setCreatedAt(DATASOURCE_CREATED_AT);
        return datasource;
    }

    /** The concrete element of {@code listOrgDataSources} and {@code listAppDataSources} (Appendix A). */
    public static DatasourceView datasourceView() {
        return new DatasourceView(datasource("DatasourceView.datasource"), true, "DatasourceView.creatorName");
    }

    public static CommonPermissionView commonPermissionView() {
        return CommonPermissionView.builder()
                .orgName("CommonPermissionView.orgName")
                .groupPermissions(new ArrayList<>(List.of(ApplicationSamples.permissionItemView("CommonPermissionView.groupPermissions[0]", ResourceHolder.GROUP),
                        ApplicationSamples.permissionItemView("CommonPermissionView.groupPermissions[1]", ResourceHolder.GROUP))))
                .userPermissions(new ArrayList<>(List.of(ApplicationSamples.permissionItemView("CommonPermissionView.userPermissions[0]", ResourceHolder.USER),
                        ApplicationSamples.permissionItemView("CommonPermissionView.userPermissions[1]", ResourceHolder.USER))))
                .creatorId("CommonPermissionView.creatorId")
                .build();
    }

    public static DatasourceStructure datasourceStructure() {
        return new DatasourceStructure(new ArrayList<>(List.of(table("DatasourceStructure.tables[0]", TableType.TABLE),
                table("DatasourceStructure.tables[1]", TableType.VIEW))));
    }

    public static Table table() {
        return table("Table", TableType.COLLECTION);
    }

    /**
     * A table with both key kinds: {@code keys} is declared as the interface {@code Key} (an {@code EXCLUDED_TYPES}
     * entry), and each implementation writes its own members and its constant {@code type}. {@code templates} is
     * {@code @JsonIgnore}d; it is set, so S1 shows it absent.
     */
    static Table table(String prefix, TableType type) {
        return new Table(type, prefix + ".schema", prefix + ".name",
                new ArrayList<>(List.of(column(prefix + ".columns[0]"), column(prefix + ".columns[1]"))),
                new ArrayList<>(List.of(new PrimaryKey(prefix + ".keys[0].name", new ArrayList<>(List.of(prefix + ".keys[0].columnNames[0]", prefix + ".keys[0].columnNames[1]"))),
                        new ForeignKey(prefix + ".keys[1].name", new ArrayList<>(List.of(prefix + ".keys[1].fromColumns[0]", prefix + ".keys[1].fromColumns[1]")),
                                new ArrayList<>(List.of(prefix + ".keys[1].toColumns[0]", prefix + ".keys[1].toColumns[1]"))))),
                new ArrayList<>(List.of(new Template(prefix + ".templates[0].title", prefix + ".templates[0].body"))));
    }

    public static Column column() {
        return column("Column");
    }

    static Column column(String prefix) {
        return new Column(prefix + ".name", prefix + ".type", prefix + ".defaultValue", Boolean.TRUE);
    }

    /**
     * Connection settings as a client sends them for a JS datasource plugin, bound into {@code Map<String, Object>}:
     * {@code LinkedHashMap} objects, {@code ArrayList} arrays, {@code Integer} or {@code Long} by magnitude,
     * {@code Double} decimals.
     */
    public static Map<String, Object> connectionSettings(String prefix) {
        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("region", prefix + ".extra.region");
        extra.put("retries", CONFIG_INT);
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("host", prefix + ".host");
        settings.put("port", CONFIG_INT);
        settings.put("timeoutMillis", CONFIG_LONG);
        settings.put("ratio", CONFIG_DECIMAL);
        settings.put("ssl", Boolean.TRUE);
        settings.put("databases", new ArrayList<>(List.of(prefix + ".databases[0]", prefix + ".databases[1]")));
        settings.put("extra", extra);
        return settings;
    }

    /** A JS plugin's definition as the node service describes it: a {@code HashMap} subclass, written as a map. */
    static DatasourcePluginDefinition pluginDefinition(String prefix) {
        DatasourcePluginDefinition definition = new DatasourcePluginDefinition();
        definition.put("id", prefix + ".id");
        definition.put("name", prefix + ".name");
        Map<String, Object> dataSourceConfig = new LinkedHashMap<>();
        dataSourceConfig.put("type", prefix + ".dataSourceConfig.type");
        dataSourceConfig.put("params", new ArrayList<>(List.of(prefix + ".dataSourceConfig.params[0]", prefix + ".dataSourceConfig.params[1]")));
        definition.put("dataSourceConfig", dataSourceConfig);
        return definition;
    }
}
