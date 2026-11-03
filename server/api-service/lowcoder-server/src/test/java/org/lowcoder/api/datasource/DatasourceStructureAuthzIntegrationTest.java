package org.lowcoder.api.datasource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.plugin.DatasourceMetaInfoConstants.REST_API;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.datasource.model.DatasourceStructureDO;
import org.lowcoder.domain.datasource.repository.DatasourceDORepository;
import org.lowcoder.domain.datasource.repository.DatasourceRepository;
import org.lowcoder.domain.datasource.repository.DatasourceStructureRepository;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.ActiveProfiles;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * NEW-114: {@code GET /api/datasources/{id}/structure} (and the {@code /api/v1} mount) through the real
 * {@link DatasourceController} bean: the real key conversion, the real permission check and the real structure service over
 * the test database, with no HTTP layer and no security filter chain.
 *
 * <p>The stored datasources are {@code restApi}: such a datasource has no structure info, so a read that is allowed completes
 * with an empty structure and opens no connection (the structure service answers it before any connection). A cached structure
 * is stored directly in the structure collection for the two cases that need one. Every case stores its own fresh datasources
 * (random ids and names), grants and cache rows, and removes them afterwards.
 *
 * <p>These cases show who is refused and who is served. That a refusal comes before the cache or a connection is touched is
 * shown by the unit class {@code DatasourceApiServiceImplStructureAuthzTest} ({@code verifyNoInteractions}), not here: S4 adds
 * only that a stored cache row is not served to a refused user.
 *
 * <p>Not covered: the production security filter chain and the HTTP routing (this class calls the controller bean).
 */
@SpringBootTest
@ActiveProfiles("test")
class DatasourceStructureAuthzIntegrationTest {

    private static final String LOG_PREFIX = "[DatasourceStructureAuthzIntegrationTest] ";

    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final String ORG_ID = "org01";
    private static final String ORG_ADMIN = "user01";
    private static final String GRANTED_MEMBER = "user02";
    private static final String UNGRANTED_MEMBER = "user03";
    private static final String OUTSIDER = "user04";
    private static final String DATASOURCE_NAME_PREFIX = "structure-authz-it-";
    private static final String CACHED_TABLE_NAME = "structure_authz_cached_table";
    private static final String CACHED_TABLE_SCHEMA = "public";
    private static final boolean IGNORE_CACHE = true;
    private static final boolean USE_CACHE = false;
    private static final String NOT_AUTHORIZED_KEY = "NOT_AUTHORIZED";
    /** The field of {@link DatasourceStructureDO} the structure service upserts by. */
    private static final String DATASOURCE_ID_FIELD = "datasourceId";

    @Autowired
    private DatasourceController datasourceController;
    @Autowired
    private DatasourceRepository datasourceRepository;
    @Autowired
    private DatasourceDORepository datasourceDORepository;
    @Autowired
    private DatasourceStructureRepository datasourceStructureRepository;
    @Autowired
    private ResourcePermissionService resourcePermissionService;
    @Autowired
    private ReactiveMongoTemplate mongo;
    @Autowired
    private InitData initData;

    private final List<String> storedDatasourceIds = new ArrayList<>();
    private final List<String> cachedDatasourceIds = new ArrayList<>();

    @BeforeEach
    void seed() {
        initData.init();
        storedDatasourceIds.clear();
        cachedDatasourceIds.clear();
    }

    /**
     * Removes what the case stored, each step on its own: a failing step does not stop the next, and the failures after the
     * first are attached to it as suppressed.
     */
    @AfterEach
    void removeWhatTheCaseStored() {
        RuntimeException failure = null;
        for (String datasourceId : storedDatasourceIds) {
            failure = run(failure, () -> {
                List<ResourcePermission> grants = resourcePermissionService.getByDataSourceId(datasourceId).block(TIMEOUT);
                Flux.fromIterable(grants)
                        .concatMap(grant -> resourcePermissionService.removeById(grant.getId())
                                .doOnNext(removed -> assertThat(removed).as("grant %s removed", grant.getId()).isTrue()))
                        .blockLast(TIMEOUT);
                say("removed %d grant(s) of %s", grants.size(), datasourceId);
            });
        }
        for (String datasourceId : cachedDatasourceIds) {
            failure = run(failure, () -> {
                long removed = mongo.remove(Query.query(Criteria.where(DATASOURCE_ID_FIELD).is(datasourceId)), DatasourceStructureDO.class)
                        .block(TIMEOUT).getDeletedCount();
                say("removed %d cache row(s) of %s", removed, datasourceId);
                assertThat(removed).as("cache rows of %s removed", datasourceId).isEqualTo(1);
            });
        }
        if (!storedDatasourceIds.isEmpty()) {
            failure = run(failure, () -> {
                datasourceDORepository.deleteAllById(storedDatasourceIds).block(TIMEOUT);
                long left = datasourceDORepository.findAllById(storedDatasourceIds).count().block(TIMEOUT);
                say("removed the %d datasource(s) the case stored, %d left", storedDatasourceIds.size(), left);
                assertThat(left).as("stored datasources left").isZero();
            });
        }
        if (failure != null) {
            throw failure;
        }
    }

    private static RuntimeException run(RuntimeException first, Runnable step) {
        try {
            step.run();
            return first;
        } catch (RuntimeException | Error failure) {
            RuntimeException wrapped = failure instanceof RuntimeException runtime ? runtime : new IllegalStateException(failure);
            if (first == null) {
                return wrapped;
            }
            first.addSuppressed(wrapped);
            return first;
        }
    }

    // ------------------------------------------------------------------ allowed

    @Test
    @WithMockUser(id = GRANTED_MEMBER)
    void aGrantedMemberReadsTheStructureNEW114() {
        Datasource datasource = storeDatasource(ORG_ID);
        grantViewer(datasource, GRANTED_MEMBER);

        assertServed("S1 granted member", datasource.getId(), IGNORE_CACHE, new DatasourceStructure());
    }

    @Test
    @WithMockUser(id = ORG_ADMIN)
    void anOrgAdminReadsTheStructureWithoutAGrantNEW114() {
        Datasource datasource = storeDatasource(ORG_ID);

        assertServed("S2 org admin without a grant", datasource.getId(), IGNORE_CACHE, new DatasourceStructure());
    }

    @Test
    @WithMockUser(id = GRANTED_MEMBER)
    void aGrantedMemberGetsTheCachedStructureNEW114() {
        Datasource datasource = storeDatasource(ORG_ID);
        grantViewer(datasource, GRANTED_MEMBER);
        storeCachedStructure(datasource);

        assertServed("S8 granted member, cached", datasource.getId(), USE_CACHE, cachedStructure());
    }

    @Test
    @WithMockUser(id = UNGRANTED_MEMBER)
    void aSystemStaticDatasourcePassesForAnyMemberNEW114() {
        // Pins the stated limit: the system static ids are OWNER for every visitor (DatasourcePermissionHandler).
        assertServed("S9 system static id", Datasource.QUICK_REST_API_ID, IGNORE_CACHE, new DatasourceStructure());
    }

    // ------------------------------------------------------------------ refused

    @Test
    @WithMockUser(id = UNGRANTED_MEMBER)
    void anUngrantedMemberIsRefusedNEW114() {
        Datasource datasource = storeDatasource(ORG_ID);

        assertNotAuthorized("S3 ungranted member", datasource.getId(), IGNORE_CACHE);
    }

    @Test
    @WithMockUser(id = UNGRANTED_MEMBER)
    void anUngrantedMemberIsRefusedTheCachedStructureNEW114() {
        Datasource datasource = storeDatasource(ORG_ID);
        storeCachedStructure(datasource);

        assertNotAuthorized("S4 ungranted member, cached", datasource.getId(), USE_CACHE);
    }

    @Test
    @WithMockUser(id = OUTSIDER)
    void aUserOutsideTheOrganizationIsRefusedNEW114() {
        Datasource datasource = storeDatasource(ORG_ID);

        assertNotAuthorized("S5 user outside the organization", datasource.getId(), IGNORE_CACHE);
    }

    @Test
    @WithMockUser(id = ORG_ADMIN)
    void anOrgAdminIsRefusedAnotherOrganizationsDatasourceNEW114() {
        // an organization nobody belongs to
        Datasource foreign = storeDatasource(new ObjectId().toHexString());

        assertNotAuthorized("S6 org admin, another organization's datasource", foreign.getId(), IGNORE_CACHE);
    }

    @Test
    @WithMockUser(id = UNGRANTED_MEMBER)
    void anUnknownIdIsRefusedNEW114() {
        assertNotAuthorized("S7 unknown id", new ObjectId().toHexString(), IGNORE_CACHE);
    }

    // ------------------------------------------------------------------ helpers

    private Datasource storeDatasource(String organizationId) {
        Datasource datasource = new Datasource();
        datasource.setName(DATASOURCE_NAME_PREFIX + UUID.randomUUID());
        datasource.setType(REST_API);
        datasource.setOrganizationId(organizationId);
        datasource.setDatasourceStatus(DatasourceStatus.NORMAL);
        datasource.setDetailConfig(RestApiDatasourceConfig.EMPTY_CONFIG);
        Datasource stored = datasourceRepository.save(datasource).block(TIMEOUT);
        assertThat(stored).as("stored datasource").isNotNull();
        assertThat(stored.getId()).as("stored datasource id").isNotBlank();
        storedDatasourceIds.add(stored.getId());
        say("stored datasource %s in organization %s", stored.getId(), organizationId);
        return stored;
    }

    private void grantViewer(Datasource datasource, String userId) {
        Boolean granted = resourcePermissionService.addDataSourcePermissionToUser(datasource.getId(), userId, ResourceRole.VIEWER)
                .block(TIMEOUT);
        say("VIEWER grant of %s for %s: %s", datasource.getId(), userId, granted);
        assertThat(granted).as("grant stored").isTrue();
    }

    private static DatasourceStructure cachedStructure() {
        DatasourceStructure.Table table = new DatasourceStructure.Table(DatasourceStructure.TableType.TABLE,
                CACHED_TABLE_SCHEMA, CACHED_TABLE_NAME, new ArrayList<>(), new ArrayList<>(), new ArrayList<>());
        return new DatasourceStructure(new ArrayList<>(List.of(table)));
    }

    private void storeCachedStructure(Datasource datasource) {
        DatasourceStructureDO cache = new DatasourceStructureDO();
        cache.setDatasourceId(datasource.getId());
        cache.setStructure(cachedStructure());
        DatasourceStructureDO saved = datasourceStructureRepository.save(cache).block(TIMEOUT);
        assertThat(saved).as("cache row stored").isNotNull();
        cachedDatasourceIds.add(datasource.getId());
        say("stored a cache row for %s with table %s", datasource.getId(), CACHED_TABLE_NAME);
    }

    private void assertServed(String scenario, String datasourceId, boolean ignoreCache, DatasourceStructure expected) {
        say("%s: id=%s ignoreCache=%s, expecting %d table(s)", scenario, datasourceId, ignoreCache, tableCount(expected));
        Mono<ResponseView<DatasourceStructure>> result = datasourceController.getStructure(datasourceId, ignoreCache);
        StepVerifier.create(logSignal(scenario, result))
                .assertNext(response -> {
                    assertThat(response.isSuccess()).as("%s: successful response", scenario).isTrue();
                    assertThat(tableNames(response.getData())).as("%s: table names", scenario).isEqualTo(tableNames(expected));
                })
                .expectComplete()
                .verify(TIMEOUT);
    }

    private void assertNotAuthorized(String scenario, String datasourceId, boolean ignoreCache) {
        say("%s: id=%s ignoreCache=%s, expecting NOT_AUTHORIZED", scenario, datasourceId, ignoreCache);
        Mono<ResponseView<DatasourceStructure>> result = datasourceController.getStructure(datasourceId, ignoreCache);
        StepVerifier.create(logSignal(scenario, result))
                .expectErrorSatisfies(error -> {
                    assertThat(error).as("%s: error type", scenario).isInstanceOf(BizException.class);
                    BizException bizException = (BizException) error;
                    assertThat(bizException.getError()).as("%s: BizError", scenario).isEqualTo(BizError.NOT_AUTHORIZED);
                    assertThat(bizException.getMessageKey()).as("%s: key", scenario).isEqualTo(NOT_AUTHORIZED_KEY);
                })
                .verify(TIMEOUT);
    }

    private static List<String> tableNames(DatasourceStructure structure) {
        if (structure == null || structure.getTables() == null) {
            return List.of();
        }
        return structure.getTables().stream().map(DatasourceStructure.Table::getName).toList();
    }

    private static int tableCount(DatasourceStructure structure) {
        return tableNames(structure).size();
    }

    private static <T> Mono<T> logSignal(String scenario, Mono<T> result) {
        return result
                .doOnNext(value -> say("[%s] onNext: %s", scenario, value))
                .doOnError(error -> say("[%s] onError: %s: %s", scenario, error.getClass().getName(), error.getMessage()));
    }

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }
}
