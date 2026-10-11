package org.lowcoder.api.datasource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link UpsertDatasourceRequestMapper#resolve}: the three required fields, the copy of the scalar fields and the two
 * ways the connection config is resolved (JS plugin: parsed into a {@link JsDatasourceConnectionConfig}; any other type:
 * resolved by {@link DatasourceMetaInfoService#resolveDetailConfig}). {@code UpsertDatasourceContractTest} pins the
 * JSON shape of the request, not these decisions.
 */
@ExtendWith(MockitoExtension.class)
class UpsertDatasourceRequestMapperTest {

    private static final String LOG_PREFIX = "[UpsertDatasourceRequestMapperTest] ";
    private static final String JS_TYPE = "js-plugin";
    private static final String SQL_TYPE = "mysql";
    private static final String ORG_ID = "org-1";

    @Mock
    private DatasourceMetaInfoService datasourceMetaInfoService;

    @InjectMocks
    private UpsertDatasourceRequestMapper mapper;

    private static UpsertDatasourceRequest request(String name, String type, String orgId) {
        UpsertDatasourceRequest request = new UpsertDatasourceRequest();
        request.setId("ds-1");
        request.setGid("gid-1");
        request.setName(name);
        request.setType(type);
        request.setOrganizationId(orgId);
        request.setStatus(DatasourceStatus.DELETED);
        request.setDatasourceConfig(new HashMap<>(Map.of("host", "db.example", "port", 3306)));
        return request;
    }

    static Stream<Arguments> invalidRequests() {
        return Stream.of(
                Arguments.of("name null", null, SQL_TYPE, ORG_ID, "DATASOURCE_NAME_EMPTY"),
                Arguments.of("name empty", "", SQL_TYPE, ORG_ID, "DATASOURCE_NAME_EMPTY"),
                Arguments.of("name blank", "   ", SQL_TYPE, ORG_ID, "DATASOURCE_NAME_EMPTY"),
                Arguments.of("type null", "n", null, ORG_ID, "INVALID_DATASOURCE_TYPE_0"),
                Arguments.of("type blank", "n", " ", ORG_ID, "INVALID_DATASOURCE_TYPE_0"),
                Arguments.of("org id null", "n", SQL_TYPE, null, "INVALID_DATASOURCE_ORG_ID"),
                Arguments.of("org id blank", "n", SQL_TYPE, "  ", "INVALID_DATASOURCE_ORG_ID"),
                Arguments.of("everything missing: the name is reported first", null, null, null, "DATASOURCE_NAME_EMPTY"),
                Arguments.of("type and org id missing: the type is reported first", "n", null, null, "INVALID_DATASOURCE_TYPE_0"));
    }

    /**
     * Catches a datasource saved without a name, type or organization (each is INVALID_DATASOURCE_CONFIGURATION with its
     * own message key, checked in that order) and any config resolution running before the validation.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("invalidRequests")
    void resolve_missingNameTypeOrOrganization_isRejectedBeforeAnyResolution(String label, String name, String type,
            String orgId, String expectedKey) {
        assertThatThrownBy(() -> mapper.resolve(request(name, type, orgId)))
                .isInstanceOfSatisfying(BizException.class, error -> {
                    assertThat(error.getError()).isEqualTo(BizError.INVALID_DATASOURCE_CONFIGURATION);
                    assertThat(error.getMessageKey()).isEqualTo(expectedKey);
                });
        verifyNoInteractions(datasourceMetaInfoService);
        System.out.println(LOG_PREFIX + label + " -> INVALID_DATASOURCE_CONFIGURATION " + expectedKey);
    }

    /**
     * Catches a JS plugin datasource whose config is resolved by the wrong parser: the request's entries are parsed into
     * a {@code JsDatasourceConnectionConfig} and {@code resolveDetailConfig} is not used; the scalar fields (id, gid,
     * name, type, organization, status) are copied from the request.
     */
    @Test
    void resolve_jsPluginType_parsesTheConfigIntoAJsConnectionConfig() {
        when(datasourceMetaInfoService.isJsDatasourcePlugin(JS_TYPE)).thenReturn(true);
        UpsertDatasourceRequest request = request("js ds", JS_TYPE, ORG_ID);
        request.setDatasourceConfig(new HashMap<>(Map.of("api-key", "k", "extra", Map.of("x", 2))));

        Datasource datasource = mapper.resolve(request);

        assertThat(datasource.getDetailConfig()).isInstanceOf(JsDatasourceConnectionConfig.class);
        JsDatasourceConnectionConfig config = (JsDatasourceConnectionConfig) datasource.getDetailConfig();
        assertThat(config).containsEntry("api-key", "k").containsEntry("extra", Map.of("x", 2));
        assertScalarFieldsCopied(datasource, "js ds", JS_TYPE);
        verify(datasourceMetaInfoService, never()).resolveDetailConfig(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
        System.out.println(LOG_PREFIX + "JS plugin type: config parsed as JsDatasourceConnectionConfig " + config);
    }

    /**
     * Catches any other datasource type resolved without the meta-info service: the config is whatever
     * {@code resolveDetailConfig(config, type)} returns for the request's config map and type.
     */
    @Test
    void resolve_otherType_usesTheMetaInfoServiceToResolveTheConfig() {
        when(datasourceMetaInfoService.isJsDatasourcePlugin(SQL_TYPE)).thenReturn(false);
        DatasourceConnectionConfig resolved = mock(DatasourceConnectionConfig.class);
        UpsertDatasourceRequest request = request("sql ds", SQL_TYPE, ORG_ID);
        when(datasourceMetaInfoService.resolveDetailConfig(request.getDatasourceConfig(), SQL_TYPE)).thenReturn(resolved);

        Datasource datasource = mapper.resolve(request);

        assertThat(datasource.getDetailConfig()).isSameAs(resolved);
        assertScalarFieldsCopied(datasource, "sql ds", SQL_TYPE);
        System.out.println(LOG_PREFIX + "type " + SQL_TYPE + ": config resolved by the meta-info service");
    }

    private static void assertScalarFieldsCopied(Datasource datasource, String name, String type) {
        assertThat(datasource.getId()).isEqualTo("ds-1");
        assertThat(datasource.getGid()).isEqualTo("gid-1");
        assertThat(datasource.getType()).isEqualTo(type);
        assertThat(datasource.getOrganizationId()).isEqualTo(ORG_ID);
        assertThat(datasource.getDatasourceStatus()).isEqualTo(DatasourceStatus.DELETED);
        assertThat(datasource.getName()).isEqualTo(name);
    }
}
