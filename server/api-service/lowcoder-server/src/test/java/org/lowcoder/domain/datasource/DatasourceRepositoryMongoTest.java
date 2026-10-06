package org.lowcoder.domain.datasource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceCreationSource;
import org.lowcoder.domain.datasource.model.DatasourceDO;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.datasource.repository.DatasourceRepository;
import org.lowcoder.domain.plugin.client.DatasourcePluginClient;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.lowcoder.sdk.util.IDUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import reactor.core.publisher.Mono;

/**
 * DatasourceRepository against the MongoDB test container (unit U14, task L3-11c). The plugin connectors are not available
 * in this module's surefire context, so the class has a Spring context of its own (extra property, hence its own database)
 * with a mocked DatasourceMetaInfoService (every type is a "JS" datasource whose config is the stored map) and a mocked
 * DatasourcePluginClient (no plugin definition). Every test works under ids and organisations it generates. Not repeated:
 * DatasourcePersistenceContractTest (the stored shape of save), the L1-3 row on DatasourceApiServiceImpl.getPluginDynamicConfig,
 * the L3-3 row on Datasource.mergeWith.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
@TestPropertySource(properties = "l3_11c.context=datasource-repository")
class DatasourceRepositoryMongoTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final String JS_TYPE = "someJsPlugin";
    private static final String BROKEN_TYPE = "brokenPlugin";

    @MockBean
    private DatasourceMetaInfoService datasourceMetaInfoService;
    @MockBean
    private DatasourcePluginClient datasourcePluginClient;
    @Autowired
    private DatasourceRepository repository;
    @Autowired
    private ReactiveMongoTemplate mongo;

    @BeforeEach
    void everyTypeIsAJsDatasourceWithoutADefinition() {
        when(datasourceMetaInfoService.isJsDatasourcePlugin(anyString())).thenReturn(true);
        when(datasourceMetaInfoService.isJsDatasourcePlugin(BROKEN_TYPE)).thenThrow(new IllegalStateException("no connector"));
        when(datasourcePluginClient.getDatasourcePluginDefinition(anyString())).thenReturn(Mono.empty());
    }

    private static String org() {
        return "org-" + IDUtils.generate();
    }

    private Datasource save(String orgId, String type, DatasourceCreationSource source) {
        JsDatasourceConnectionConfig config = new JsDatasourceConnectionConfig();
        config.put("host", "db.example");
        Datasource datasource = Datasource.builder().organizationId(orgId).name("ds-" + IDUtils.generate()).type(type)
                .gid(UUID.randomUUID().toString()).creationSource(source.getValue()).datasourceStatus(DatasourceStatus.NORMAL)
                .detailConfig(config).build();
        return repository.save(datasource).block(TIMEOUT);
    }

    private Datasource save(String orgId) {
        return save(orgId, JS_TYPE, DatasourceCreationSource.USER_CREATED);
    }

    private static List<String> ids(List<Datasource> datasources) {
        return datasources.stream().map(Datasource::getId).toList();
    }

    /** Catches: the gid lookup broken, a lost field in the DO-to-domain conversion, an unknown key not completing empty. */
    @Test
    void saveThenFindByIdAndByGidRoundTripsTheFields() {
        String orgId = org();
        Datasource saved = save(orgId);

        Datasource byId = repository.findById(saved.getId()).block(TIMEOUT);
        Datasource byGid = repository.findById(saved.getGid()).block(TIMEOUT);

        System.out.println("[DatasourceRepositoryMongoTest] saved " + saved.getId() + " gid " + saved.getGid());
        for (Datasource found : List.of(byId, byGid)) {
            assertThat(found.getId()).isEqualTo(saved.getId());
            assertThat(found.getGid()).isEqualTo(saved.getGid());
            assertThat(found.getName()).isEqualTo(saved.getName());
            assertThat(found.getType()).isEqualTo(JS_TYPE);
            assertThat(found.getOrganizationId()).isEqualTo(orgId);
            assertThat(found.getCreationSource()).isEqualTo(DatasourceCreationSource.USER_CREATED.getValue());
            assertThat(found.getDatasourceStatus()).isEqualTo(DatasourceStatus.NORMAL);
            assertThat(found.getDetailConfig()).isNotNull();
        }
        assertThat(repository.findById(IDUtils.generate()).blockOptional(TIMEOUT)).isEmpty();
        assertThat(repository.findById(UUID.randomUUID().toString()).blockOptional(TIMEOUT)).isEmpty();
    }

    /** Catches: findByIds querying the wrong key type for a homogeneous list; an empty list failing. */
    @Test
    void findByIdsAnswersHomogeneousIdOrGidListsAndNothingForAnEmptyList() {
        String orgId = org();
        Datasource a = save(orgId);
        Datasource b = save(orgId);
        save(orgId);

        assertThat(ids(repository.findByIds(List.of(a.getId(), b.getId())).collectList().block(TIMEOUT)))
                .containsExactlyInAnyOrder(a.getId(), b.getId());
        assertThat(ids(repository.findByIds(List.of(a.getGid(), b.getGid())).collectList().block(TIMEOUT)))
                .containsExactlyInAnyOrder(a.getId(), b.getId());
        assertThat(repository.findByIds(List.of()).collectList().block(TIMEOUT)).isEmpty();
    }

    /**
     * Pins plan section 9 row "DatasourceRepository.findByIds picks id or gid from one element and drops the other kind
     * (:65-72)": the key type of the whole list is decided by one element (findAny, the first of a list), so a mixed list
     * only returns the datasources of that element's kind. Reach: MetaController.getDatasourceMetas (MetaController:50) passes
     * the client's datasource id list through DatasourceServiceImpl.getByIds (:134) unchanged. A fix (query both kinds, as
     * findAllById does) changes this test on purpose.
     */
    @Test
    void findByIdsOfAMixedListDropsTheOtherKind_pinsTheSection9Row() {
        String orgId = org();
        Datasource a = save(orgId);
        Datasource b = save(orgId);

        List<String> idFirst = ids(repository.findByIds(List.of(a.getId(), b.getGid())).collectList().block(TIMEOUT));
        List<String> gidFirst = ids(repository.findByIds(List.of(b.getGid(), a.getId())).collectList().block(TIMEOUT));

        System.out.println("[DatasourceRepositoryMongoTest] PINNED mixed list: id first -> " + idFirst.size() + ", gid first -> " + gidFirst.size());
        assertThat(idFirst).containsExactly(a.getId());
        assertThat(gidFirst).containsExactly(b.getId());
    }

    /** Catches: findAllById dropping one key kind (it is the variant that must handle mixed lists). */
    @Test
    void findAllByIdAnswersMixedIdAndGidListsInFull() {
        String orgId = org();
        Datasource a = save(orgId);
        Datasource b = save(orgId);
        Datasource c = save(orgId);

        assertThat(ids(repository.findAllById(List.of(a.getId(), b.getGid(), c.getId())).collectList().block(TIMEOUT)))
                .containsExactlyInAnyOrder(a.getId(), b.getId(), c.getId());
        assertThat(ids(repository.findAllById(List.of(a.getId(), c.getId())).collectList().block(TIMEOUT)))
                .containsExactlyInAnyOrder(a.getId(), c.getId());
        assertThat(ids(repository.findAllById(List.of(b.getGid())).collectList().block(TIMEOUT))).containsExactly(b.getId());
        assertThat(repository.findAllById(List.of()).collectList().block(TIMEOUT)).isEmpty();
    }

    /** Catches: a cross-org leak or a wrong creation-source / type match in the organisation queries. */
    @Test
    void organisationQueriesAreScopedToTheOrgTypeAndCreationSource() {
        String orgId = org();
        String otherOrg = org();
        Datasource own1 = save(orgId);
        Datasource own2 = save(orgId);
        save(otherOrg);
        Datasource predefined = save(orgId, "legacyType", DatasourceCreationSource.LEGACY_WORKSPACE_PREDEFINED);
        save(otherOrg, "legacyType", DatasourceCreationSource.LEGACY_WORKSPACE_PREDEFINED);
        save(orgId, "legacyType", DatasourceCreationSource.USER_CREATED);

        assertThat(ids(repository.findAllByOrganizationId(orgId).collectList().block(TIMEOUT)))
                .contains(own1.getId(), own2.getId(), predefined.getId()).hasSize(4);
        assertThat(repository.countByOrganizationId(orgId).block(TIMEOUT)).isEqualTo(4L);
        assertThat(repository.countByOrganizationId(org()).block(TIMEOUT)).isZero();
        assertThat(repository.findWorkspacePredefinedDatasourceByOrgIdAndType(orgId, "legacyType").block(TIMEOUT).getId())
                .isEqualTo(predefined.getId());
        assertThat(repository.findWorkspacePredefinedDatasourceByOrgIdAndType(orgId, JS_TYPE).blockOptional(TIMEOUT)).isEmpty();
        System.out.println("[DatasourceRepositoryMongoTest] org queries scoped to " + orgId);
    }

    /** Catches: the delete marker wiping other fields, or not being stored. */
    @Test
    void markDatasourceAsDeletedOnlyChangesTheStatus() {
        Datasource saved = save(org());

        assertThat(repository.markDatasourceAsDeleted(saved.getId()).block(TIMEOUT)).isTrue();

        DatasourceDO raw = mongo.findById(saved.getId(), DatasourceDO.class).block(TIMEOUT);
        assertThat(raw.getDatasourceStatus()).isEqualTo(DatasourceStatus.DELETED);
        assertThat(raw.getName()).isEqualTo(saved.getName());
        assertThat(raw.getOrganizationId()).isEqualTo(saved.getOrganizationId());
        assertThat(raw.getDetailConfig()).isNotEmpty();
    }

    /** Catches: other orgs' ids reported as usable, own org's ids reported as missing, an empty input failing. */
    @Test
    void retainReturnsTheIdsThatAreMissingOrBelongToAnotherOrg() {
        String orgId = org();
        Datasource own = save(orgId);
        Datasource foreign = save(org());
        String missing = IDUtils.generate();

        List<String> retained = repository.retainNoneExistAndNonCurrentOrgDatasourceIds(
                List.of(own.getId(), foreign.getId(), missing), orgId).collectList().block(TIMEOUT);

        System.out.println("[DatasourceRepositoryMongoTest] retained " + retained.size() + " of 3 ids");
        assertThat(retained).containsExactlyInAnyOrder(foreign.getId(), missing);
        assertThat(repository.retainNoneExistAndNonCurrentOrgDatasourceIds(List.of(own.getId()), orgId).collectList().block(TIMEOUT)).isEmpty();
        assertThat(repository.retainNoneExistAndNonCurrentOrgDatasourceIds(List.of(), orgId).collectList().block(TIMEOUT)).isEmpty();
    }

    /**
     * BF-002 (was the pin of plan section 9 row "retainNoneExistAndNonCurrentOrgDatasourceIds reports existing current-org
     * datasources as missing when given gids"): a current-org datasource asked by its gid is no longer reported, so the
     * callers (the application edit check and the library query listing) no longer treat it as needing no use permission.
     * Catches the gid lookup removing found datasources by their object id only.
     */
    @Test
    void retainOfGidsLeavesOutExistingCurrentOrgDatasources() {
        String orgId = org();
        Datasource own = save(orgId);
        Datasource foreign = save(org());

        List<String> byId = repository.retainNoneExistAndNonCurrentOrgDatasourceIds(List.of(own.getId()), orgId).collectList().block(TIMEOUT);
        List<String> byGid = repository.retainNoneExistAndNonCurrentOrgDatasourceIds(List.of(own.getGid(), foreign.getGid()), orgId)
                .collectList().block(TIMEOUT);

        System.out.println("[DatasourceRepositoryMongoTest] by id -> " + byId + ", by gid -> " + byGid);
        assertThat(byId).as("the datasource asked by its id is not reported").isEmpty();
        assertThat(byGid).as("asked by gid, only the other org's datasource is reported").containsExactly(foreign.getGid());
    }

    /**
     * Catches a list mixing ids and gids being looked up by the kind of its first entry only: every entry is looked up by
     * its own kind, and only the missing and other-org entries are reported, under the key they were given by.
     */
    @Test
    void retainOfAMixedListLooksUpEachEntryByItsKind() {
        String orgId = org();
        Datasource ownById = save(orgId);
        Datasource ownByGid = save(orgId);
        Datasource foreign = save(org());
        String missingId = IDUtils.generate();
        String missingGid = UUID.randomUUID().toString();
        List<String> keys = List.of(ownByGid.getGid(), ownById.getId(), foreign.getId(), foreign.getGid(), missingId, missingGid);

        List<String> retained = repository.retainNoneExistAndNonCurrentOrgDatasourceIds(keys, orgId).collectList().block(TIMEOUT);

        System.out.println("[DatasourceRepositoryMongoTest] mixed " + keys + " -> retained " + retained);
        assertThat(retained).containsExactlyInAnyOrder(foreign.getId(), foreign.getGid(), missingId, missingGid);
    }

    /** Catches a missing organization id failing the lookup: no datasource is of "no organization", so every key is reported. */
    @Test
    void retainWithoutAnOrganizationReportsEveryKey() {
        Datasource stored = save(org());
        List<String> keys = List.of(stored.getId(), stored.getGid());

        List<String> retained = repository.retainNoneExistAndNonCurrentOrgDatasourceIds(keys, null).collectList().block(TIMEOUT);

        System.out.println("[DatasourceRepositoryMongoTest] no org " + keys + " -> retained " + retained);
        assertThat(retained).containsExactlyInAnyOrderElementsOf(keys);
    }

    /**
     * Catches a gid not mapped to its datasource's object id, a datasource of another org left out, or an unknown key
     * mapped to something: each found id or gid maps to the object id, whatever the org; unknown keys are not in the map.
     */
    @Test
    void findObjectIdsByIdOrGidMapsEachFoundKeyToTheObjectId() {
        Datasource own = save(org());
        Datasource foreign = save(org());
        String missingId = IDUtils.generate();
        String missingGid = UUID.randomUUID().toString();

        Map<String, String> objectIds = repository.findObjectIdsByIdOrGid(
                List.of(own.getId(), own.getGid(), foreign.getGid(), missingId, missingGid)).block(TIMEOUT);

        System.out.println("[DatasourceRepositoryMongoTest] object ids " + objectIds);
        assertThat(objectIds).containsOnly(
                Map.entry(own.getId(), own.getId()),
                Map.entry(own.getGid(), own.getId()),
                Map.entry(foreign.getGid(), foreign.getId()));
        assertThat(repository.findObjectIdsByIdOrGid(List.of()).block(TIMEOUT)).isEmpty();
    }

    /**
     * Behaviour (candidate D3): a config that cannot be resolved is swallowed (convertToDomainObjectAndDecrypt ends with
     * onErrorResume), so the datasource is returned WITHOUT a config and without an error; Datasource.mergeWith then hits the
     * L3-3 NullPointerException row.
     */
    @Test
    void aDatasourceWhoseConfigCannotBeResolvedComesBackWithoutAConfig() {
        String orgId = org();
        Datasource broken = save(orgId);
        // the type is switched in the stored document afterwards, because saving a datasource of that type already needs the connector
        mongo.updateFirst(Query.query(Criteria.where("_id").is(broken.getId())), Update.update("type", BROKEN_TYPE), DatasourceDO.class)
                .block(TIMEOUT);

        assertThat(broken.getId()).isNotBlank();
        Datasource found = repository.findById(broken.getId()).block(TIMEOUT);
        System.out.println("[DatasourceRepositoryMongoTest] unresolvable config: datasource returned, config=" + found.getDetailConfig());
        assertThat(found.getName()).isEqualTo(broken.getName());
        assertThat(found.getDetailConfig()).isNull();
    }
}
