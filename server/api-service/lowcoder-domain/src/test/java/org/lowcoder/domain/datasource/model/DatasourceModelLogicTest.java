package org.lowcoder.domain.datasource.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Locale;
import java.util.NoSuchElementException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.util.LocaleUtils;

/**
 * Decisions of the datasource model (unit U4a, task L3-7): display names, the legacy predicates, the status default
 * the creation-source table and {@code copy}. {@code mergeWith} and the shared static datasources are tested in
 * DatasourceServiceImplTest (plan section 9 rows) and are not repeated here.
 */
class DatasourceModelLogicTest {

    private static final String UNKNOWN_ID = "someDatasourceId";
    private static final String CHINESE_REST_NAME = "休息查询";
    private static final String COPIED_ID = "ds-1";
    private static final String COPIED_GID = "gid-1";
    private static final String COPIED_TYPE = "restApi";
    private static final String COPIED_ORG_ID = "org-1";
    private static final String ORIGINAL_NAME = "original-name";
    private static final String UPDATED_NAME = "updated";
    private static final String ORIGINAL_URL = "http://original.example";
    private static final String UPDATED_URL = "http://updated.example";

    private static Datasource datasource(String type, DatasourceCreationSource source) {
        Datasource datasource = new Datasource();
        datasource.setType(type);
        datasource.setCreationSource(source.getValue());
        return datasource;
    }

    /** Catches: the REST and GraphQL quick datasources swapping their message keys, or the locale being ignored. */
    @Test
    void displayNameOfTheQuickDatasourcesComesFromTheirOwnMessageKeyPerLocale() {
        String restEn = Datasource.getDisplayName(Datasource.QUICK_REST_API_ID, Locale.ENGLISH);
        String graphQlEn = Datasource.getDisplayName(Datasource.QUICK_GRAPHQL_ID, Locale.ENGLISH);
        String restZh = Datasource.getDisplayName(Datasource.QUICK_REST_API_ID, Locale.CHINESE);
        System.out.println("[DatasourceModelLogicTest] display names: rest=" + restEn + " graphql=" + graphQlEn + " restZh=" + restZh);

        assertThat(restEn).isEqualTo(LocaleUtils.getMessage(Locale.ENGLISH, "QUICK_REST_DATASOURCE_NAME")).isEqualTo("REST Query");
        assertThat(graphQlEn).isEqualTo(LocaleUtils.getMessage(Locale.ENGLISH, "QUICK_GRAPHQL_DATASOURCE_NAME")).isEqualTo("GraphQL Query");
        assertThat(restZh).isEqualTo(CHINESE_REST_NAME).isNotEqualTo(restEn);
    }

    /** Catches: an ordinary datasource id being given a quick datasource's display name instead of the empty string. */
    @Test
    void displayNameOfAnyOtherIdIsEmpty() {
        assertThat(Datasource.getDisplayName(UNKNOWN_ID, Locale.ENGLISH)).isEmpty();
        assertThat(Datasource.getDisplayName(null, Locale.ENGLISH)).isEmpty();
        System.out.println("[DatasourceModelLogicTest] unknown and null ids render as empty");
    }

    /** Catches: the two legacy predicates confused, or the creation source not being part of the decision. */
    @ParameterizedTest(name = "type={0} source={1} -> legacyQuickRest={2} legacyLowcoder={3}")
    @CsvSource({
            "restApi,LEGACY_WORKSPACE_PREDEFINED,true,false",
            "graphql,LEGACY_WORKSPACE_PREDEFINED,false,true",
            "restApi,USER_CREATED,false,false",
            "graphql,USER_CREATED,false,false",
            "restApi,SYSTEM_STATIC,false,false"
    })
    void legacyPredicatesNeedBothTheTypeAndTheLegacyCreationSource(String type, DatasourceCreationSource source,
            boolean legacyQuickRest, boolean legacyLowcoder) {
        Datasource datasource = datasource(type, source);
        System.out.println("[DatasourceModelLogicTest] " + type + "/" + source + " -> quickRest="
                + datasource.isLegacyQuickRestApi() + " lowcoder=" + datasource.isLegacyLowcoderApi());

        assertThat(datasource.isLegacyQuickRestApi()).isEqualTo(legacyQuickRest);
        assertThat(datasource.isLegacyLowcoderApi()).isEqualTo(legacyLowcoder);
    }

    /** Catches: a datasource without a stored status being treated as deleted or null. */
    @Test
    void statusDefaultsToNormalAndKeepsAnExplicitValue() {
        Datasource datasource = new Datasource();
        assertThat(datasource.getDatasourceStatus()).isEqualTo(DatasourceStatus.NORMAL);

        datasource.setDatasourceStatus(DatasourceStatus.DELETED);
        assertThat(datasource.getDatasourceStatus()).isEqualTo(DatasourceStatus.DELETED);
        System.out.println("[DatasourceModelLogicTest] status default NORMAL, explicit DELETED kept");
    }

    /** Catches: a wrong value table. Note {@code fromValue} is an instance method of the enum, not static. */
    @ParameterizedTest
    @CsvSource({"0,USER_CREATED", "1,CLONE_FROM_TEMPLATE", "2,LEGACY_WORKSPACE_PREDEFINED", "3,SYSTEM_STATIC"})
    void creationSourceFromValueRoundTrips(int value, DatasourceCreationSource expected) {
        DatasourceCreationSource found = DatasourceCreationSource.USER_CREATED.fromValue(value);
        System.out.println("[DatasourceModelLogicTest] fromValue(" + value + ") = " + found);
        assertThat(found).isEqualTo(expected);
        assertThat(found.getValue()).isEqualTo(value);
    }

    /** Catches: an unknown stored value silently mapping to a default source. */
    @Test
    void creationSourceFromAnUnknownValueThrows() {
        assertThatThrownBy(() -> DatasourceCreationSource.USER_CREATED.fromValue(99))
                .isInstanceOf(NoSuchElementException.class);
    }

    /**
     * Catches a copy that is the original or misses a field (BF-014): every copied field is equal, and merging into the
     * copy leaves the original's name, status and config object unchanged.
     */
    @Test
    void copyCarriesTheFieldsAndAMergeIntoItLeavesTheOriginalUnchanged() {
        Datasource original = new Datasource();
        original.setId(COPIED_ID);
        original.setGid(COPIED_GID);
        original.setName(ORIGINAL_NAME);
        original.setType(COPIED_TYPE);
        original.setOrganizationId(COPIED_ORG_ID);
        original.setCreationSource(DatasourceCreationSource.SYSTEM_STATIC.getValue());
        original.setDatasourceStatus(DatasourceStatus.NORMAL);
        RestApiDatasourceConfig originalConfig = RestApiDatasourceConfig.builder().url(ORIGINAL_URL).build();
        original.setDetailConfig(originalConfig);

        Datasource copy = original.copy();

        assertThat(copy).isNotSameAs(original);
        assertThat(copy).usingRecursiveComparison()
                .comparingOnlyFields("id", "gid", "name", "type", "organizationId", "creationSource", "datasourceStatus",
                        "detailConfig")
                .isEqualTo(original);

        Datasource update = new Datasource();
        update.setName(UPDATED_NAME);
        update.setDatasourceStatus(DatasourceStatus.DELETED);
        update.setDetailConfig(RestApiDatasourceConfig.builder().url(UPDATED_URL).build());
        copy.mergeWith(update);

        assertThat(copy.getName()).isEqualTo(UPDATED_NAME);
        assertThat(original.getName()).isEqualTo(ORIGINAL_NAME);
        assertThat(original.getDatasourceStatus()).isEqualTo(DatasourceStatus.NORMAL);
        assertThat(original.getDetailConfig()).isSameAs(originalConfig);
        assertThat(originalConfig.getUrl()).isEqualTo(ORIGINAL_URL);
        System.out.println("[DatasourceModelLogicTest] copy -> equal fields, merge into the copy leaves the original unchanged");
    }
}
