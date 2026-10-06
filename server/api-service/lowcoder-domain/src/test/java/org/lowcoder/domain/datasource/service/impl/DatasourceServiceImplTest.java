package org.lowcoder.domain.datasource.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.repository.ApplicationRepository;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceStatus;
import org.lowcoder.domain.datasource.repository.DatasourceRepository;
import org.lowcoder.domain.datasource.service.JsDatasourceHelper;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.plugin.client.DatasourcePluginClient;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.lowcoder.sdk.plugin.common.DatasourceConnector;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.util.LocaleUtils;
import org.springframework.dao.DuplicateKeyException;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@code DatasourceServiceImpl} (unit U11, task L3-2/L3-3 table row L3-3): static datasources, create/update validation
 * and persistence, connection test routing and the delete guard, with Mockito collaborators and StepVerifier.
 */
@SuppressWarnings({"rawtypes", "unchecked"})
class DatasourceServiceImplTest {

    private static final String JAVA_TYPE = "postgres";
    private static final String JS_TYPE = "jsPlugin";
    private static final String ORG_ID = "org-1";
    private static final String CREATOR_ID = "creator-1";
    private static final String DATASOURCE_ID = "ds-1";

    private DatasourceMetaInfoService metaInfoService;
    private ApplicationRepository applicationRepository;
    private ResourcePermissionService resourcePermissionService;
    private DatasourceRepository repository;
    private DatasourcePluginClient pluginClient;
    private JsDatasourceHelper jsDatasourceHelper;
    private DatasourceConnector connector;
    private DatasourceServiceImpl service;

    @BeforeEach
    void setUp() {
        metaInfoService = mock(DatasourceMetaInfoService.class);
        applicationRepository = mock(ApplicationRepository.class);
        resourcePermissionService = mock(ResourcePermissionService.class);
        repository = mock(DatasourceRepository.class);
        pluginClient = mock(DatasourcePluginClient.class);
        jsDatasourceHelper = mock(JsDatasourceHelper.class);
        connector = mock(DatasourceConnector.class);
        service = new DatasourceServiceImpl(metaInfoService, applicationRepository, resourcePermissionService, repository,
                pluginClient, jsDatasourceHelper);

        when(metaInfoService.isJsDatasourcePlugin(JS_TYPE)).thenReturn(true);
        when(metaInfoService.getDatasourceConnector(JAVA_TYPE)).thenReturn(connector);
        when(connector.doValidateConfig(any())).thenReturn(Set.of());
        when(connector.doTestConnection(any())).thenReturn(Mono.just(DatasourceTestResult.testSuccess()));
        when(jsDatasourceHelper.fillPluginDefinition(any())).thenReturn(Mono.empty());
        when(repository.save(any(Datasource.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(resourcePermissionService.addDataSourcePermissionToUser(any(), anyString(), any())).thenReturn(Mono.just(true));
    }

    private static Datasource datasource(String id, String name, String type, DatasourceConnectionConfig config) {
        return Datasource.builder().id(id).name(name).type(type).organizationId(ORG_ID).detailConfig(config).build();
    }

    private static void assertBizError(Throwable error, BizError expected, Object... args) {
        assertThat(error).isInstanceOf(BizException.class);
        BizException biz = (BizException) error;
        assertThat(biz.getError()).isEqualTo(expected);
        if (args.length > 0) {
            assertThat(biz.getArgs()).containsExactly(args);
        }
    }

    // ---------------------------------------------------------------- getById / getByIds

    /** Catches a system-static datasource getting lost (:88/:92/:96): each static id yields its shared constant. */
    @Test
    void getById_staticIds_returnTheSharedStaticDatasourceWithoutTouchingTheRepository() {
        StepVerifier.create(service.getById(Datasource.QUICK_REST_API_ID)).expectNext(Datasource.QUICK_REST_API).verifyComplete();
        StepVerifier.create(service.getById(Datasource.QUICK_GRAPHQL_ID)).expectNext(Datasource.QUICK_GRAPHQL_API).verifyComplete();
        StepVerifier.create(service.getById(Datasource.JS_CODE_ID)).expectNext(Datasource.JS_CODE).verifyComplete();
        verifyNoInteractions(repository);

        Datasource stored = datasource(DATASOURCE_ID, "db", JAVA_TYPE, null);
        when(repository.findById(DATASOURCE_ID)).thenReturn(Mono.just(stored));
        StepVerifier.create(service.getById(DATASOURCE_ID)).expectNext(stored).verifyComplete();
        System.out.println("[DatasourceServiceImplTest] static ids served from constants, others from the repository");
    }

    /**
     * Pins the real order of getByIds (the analysis said "preserving order", which is wrong): the static datasources
     * come first, in input order, then the repository result; the repository only receives the non-static ids
     * (:110, :133).
     */
    @Test
    void getByIds_staticFirstThenRepositoryResult_repositoryGetsOnlyNonStaticIds() {
        Datasource db1 = datasource("db1", "one", JAVA_TYPE, null);
        Datasource db2 = datasource("db2", "two", JAVA_TYPE, null);
        when(repository.findByIds(any())).thenReturn(Flux.just(db1, db2));

        StepVerifier.create(service.getByIds(List.of("db1", Datasource.QUICK_REST_API_ID, "db2", Datasource.JS_CODE_ID)))
                .expectNext(Datasource.QUICK_REST_API, Datasource.JS_CODE, db1, db2)
                .verifyComplete();

        org.mockito.ArgumentCaptor<Collection<String>> ids = org.mockito.ArgumentCaptor.forClass(Collection.class);
        verify(repository).findByIds(ids.capture());
        assertThat(ids.getValue()).containsExactly("db1", "db2");
        System.out.println("[DatasourceServiceImplTest] getByIds order: static first, then repository; repository saw only db1, db2");
    }

    // ---------------------------------------------------------------- create

    /** Catches a client-chosen id overwriting a row (:61). */
    @Test
    void create_withId_failsInvalidParameterAndNeverSaves() {
        StepVerifier.create(service.create(datasource("client-id", "n", JAVA_TYPE, null), CREATOR_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_PARAMETER, FieldName.ID))
                .verify();
        verify(repository, never()).save(any(Datasource.class));
        System.out.println("[DatasourceServiceImplTest] create with an id -> INVALID_PARAMETER(id)");
    }

    /** Catches an invalid datasource being persisted: org id (:146), name (:150) and type (:154) are required. */
    @Test
    void create_missingOrganizationNameOrType_failsAsErrorSignalAndNeverSaves() {
        Datasource noOrg = Datasource.builder().name("n").type(JAVA_TYPE).build();
        StepVerifier.create(service.create(noOrg, CREATOR_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_PARAMETER, FieldName.ORGANIZATION_ID)).verify();

        for (String blank : new String[] {null, "", "  "}) {
            StepVerifier.create(service.create(datasource(null, blank, JAVA_TYPE, null), CREATOR_ID))
                    .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_PARAMETER, FieldName.NAME)).verify();
        }

        StepVerifier.create(service.create(datasource(null, "n", null, null), CREATOR_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.DATASOURCE_PLUGIN_ID_NOT_GIVEN)).verify();
        verify(repository, never()).save(any(Datasource.class));
        System.out.println("[DatasourceServiceImplTest] missing org / blank name / missing type rejected before saving");
    }

    /** Catches connector validation being applied to JS plugins (:158): they are validated by the node side only. */
    @Test
    void create_jsPlugin_skipsConnectorValidation() {
        JsDatasourceConnectionConfig config = new JsDatasourceConnectionConfig();
        StepVerifier.create(service.create(datasource(null, "js", JS_TYPE, config), CREATOR_ID))
                .assertNext(saved -> assertThat(saved.getType()).isEqualTo(JS_TYPE))
                .verifyComplete();
        verify(metaInfoService, never()).getDatasourceConnector(anyString());
        System.out.println("[DatasourceServiceImplTest] JS plugin datasource saved without connector validation");
    }

    /** Catches unvalidated configs being saved, and the localised messages not being joined (:172-174). */
    @Test
    void create_javaPlugin_connectorValidationErrorsAreJoinedAndNothingIsSaved() {
        DatasourceConnectionConfig config = mock(DatasourceConnectionConfig.class);
        when(connector.doValidateConfig(config)).thenReturn(Set.of("DATASOURCE_TEST_TIMEOUT_ERROR", "INTERNAL_SERVER_ERROR"));
        String first = LocaleUtils.getMessage(java.util.Locale.ENGLISH, "DATASOURCE_TEST_TIMEOUT_ERROR");
        String second = LocaleUtils.getMessage(java.util.Locale.ENGLISH, "INTERNAL_SERVER_ERROR");

        StepVerifier.create(service.create(datasource(null, "pg", JAVA_TYPE, config), CREATOR_ID))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(BizException.class);
                    BizException biz = (BizException) error;
                    assertThat(biz.getError()).isEqualTo(BizError.INVALID_DATASOURCE_CONFIGURATION);
                    assertThat(((String) biz.getArgs()[0]).split("\n")).containsExactlyInAnyOrder(first, second);
                })
                .verify();
        verify(repository, never()).save(any(Datasource.class));
        System.out.println("[DatasourceServiceImplTest] connector validation errors joined with newline, nothing saved");
    }

    /**
     * Catches a plugin check running on the request thread: a connector's validation may block (the Mongo loopback check
     * resolves host names, BF-023), so it runs on the shared plugin scheduler ({@code plugin-executor} threads), never on
     * the thread that subscribed.
     */
    @Test
    void create_javaPlugin_connectorValidationRunsOnThePluginScheduler() {
        DatasourceConnectionConfig config = mock(DatasourceConnectionConfig.class);
        List<String> validatingThreads = new ArrayList<>();
        when(connector.doValidateConfig(config)).thenAnswer(invocation -> {
            validatingThreads.add(Thread.currentThread().getName());
            return Set.of("INTERNAL_SERVER_ERROR");
        });
        String subscribingThread = Thread.currentThread().getName();

        StepVerifier.create(service.create(datasource(null, "pg", JAVA_TYPE, config), CREATOR_ID))
                .expectError(BizException.class)
                .verify(Duration.ofSeconds(10));

        System.out.println("[DatasourceServiceImplTest] validation ran on " + validatingThreads + ", subscribed on " + subscribingThread);
        assertThat(validatingThreads).singleElement().asString().startsWith("plugin-executor").isNotEqualTo(subscribingThread);
    }

    /** Catches a datasource nobody can manage: the creator gets OWNER after the save (:68), and the saved row is returned. */
    @Test
    void create_success_savesThenGrantsCreatorOwnerAndReturnsTheSavedDatasource() {
        List<String> events = new ArrayList<>();
        Datasource saved = datasource(DATASOURCE_ID, "pg", JAVA_TYPE, mock(DatasourceConnectionConfig.class));
        when(repository.save(any(Datasource.class))).thenReturn(Mono.fromSupplier(() -> {
            events.add("save");
            return saved;
        }));
        when(resourcePermissionService.addDataSourcePermissionToUser(DATASOURCE_ID, CREATOR_ID, ResourceRole.OWNER))
                .thenReturn(Mono.fromSupplier(() -> {
                    events.add("grant");
                    return true;
                }));

        StepVerifier.create(service.create(datasource(null, "pg", JAVA_TYPE, mock(DatasourceConnectionConfig.class)), CREATOR_ID))
                .expectNext(saved)
                .verifyComplete();
        assertThat(events).containsExactly("save", "grant");

        when(resourcePermissionService.addDataSourcePermissionToUser(any(), anyString(), any()))
                .thenReturn(Mono.error(new IllegalStateException("grant failed")));
        StepVerifier.create(service.create(datasource(null, "pg", JAVA_TYPE, mock(DatasourceConnectionConfig.class)), CREATOR_ID))
                .expectError(IllegalStateException.class)
                .verify();
        System.out.println("[DatasourceServiceImplTest] create: save, then OWNER grant, saved row emitted; failed grant fails create");
    }

    /** Catches a 500 on a duplicate name (:186) and swallowed or rewritten other errors, for create and update. */
    @Test
    void save_duplicateKeyBecomesDuplicateDatabaseName_otherErrorsPassThrough() {
        when(repository.save(any(Datasource.class))).thenReturn(Mono.error(new DuplicateKeyException("index")));
        StepVerifier.create(service.create(datasource(null, "same-name", JAVA_TYPE, null), CREATOR_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.DUPLICATE_DATABASE_NAME, "same-name"))
                .verify();

        IllegalStateException failure = new IllegalStateException("mongo down");
        when(repository.save(any(Datasource.class))).thenReturn(Mono.error(failure));
        when(repository.findById(DATASOURCE_ID)).thenReturn(Mono.just(datasource(DATASOURCE_ID, "old", JAVA_TYPE, mock(DatasourceConnectionConfig.class))));
        StepVerifier.create(service.update(DATASOURCE_ID, datasource(null, "new", JAVA_TYPE, mock(DatasourceConnectionConfig.class))))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(failure))
                .verify();
        System.out.println("[DatasourceServiceImplTest] DuplicateKey -> DUPLICATE_DATABASE_NAME; other save errors unchanged");
    }

    // ---------------------------------------------------------------- update

    /** Catches a null id reaching the repository (:75) and an unknown id producing a value. */
    @Test
    void update_nullId_failsInvalidParameter_unknownIdIsEmpty() {
        StepVerifier.create(service.update(null, datasource(null, "n", JAVA_TYPE, null)))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.INVALID_PARAMETER, FieldName.ID)).verify();

        when(repository.findById("missing")).thenReturn(Mono.empty());
        StepVerifier.create(service.update("missing", datasource(null, "n", JAVA_TYPE, null))).verifyComplete();
        verify(repository, never()).save(any(Datasource.class));
        System.out.println("[DatasourceServiceImplTest] update(null) -> INVALID_PARAMETER; unknown id -> empty, nothing saved");
    }

    /**
     * Catches a merge on a datasource without its plugin definition (:80) and a skipped merge (:81): the stored row
     * gets the plugin definition filled, then the update merged into it, then validated and saved.
     */
    @Test
    void update_fillsPluginDefinitionThenMergesValidatesAndSaves() {
        DatasourceConnectionConfig currentConfig = mock(DatasourceConnectionConfig.class);
        DatasourceConnectionConfig updatedConfig = mock(DatasourceConnectionConfig.class);
        DatasourceConnectionConfig mergedConfig = mock(DatasourceConnectionConfig.class);
        when(currentConfig.mergeWithUpdatedConfig(updatedConfig)).thenReturn(mergedConfig);
        Datasource current = datasource(DATASOURCE_ID, "old", JAVA_TYPE, currentConfig);
        Datasource update = datasource(null, "new", JAVA_TYPE, updatedConfig);
        update.setDatasourceStatus(DatasourceStatus.DELETED);
        when(repository.findById(DATASOURCE_ID)).thenReturn(Mono.just(current));

        StepVerifier.create(service.update(DATASOURCE_ID, update))
                .assertNext(saved -> {
                    assertThat(saved).isSameAs(current);
                    assertThat(saved.getName()).isEqualTo("new");
                    assertThat(saved.getDatasourceStatus()).isEqualTo(DatasourceStatus.DELETED);
                    assertThat(saved.getDetailConfig()).isSameAs(mergedConfig);
                })
                .verifyComplete();

        org.mockito.InOrder order = inOrder(repository, jsDatasourceHelper, connector);
        order.verify(repository).findById(DATASOURCE_ID);
        order.verify(jsDatasourceHelper).fillPluginDefinition(current);
        order.verify(connector).doValidateConfig(mergedConfig);
        order.verify(repository).save(current);
        System.out.println("[DatasourceServiceImplTest] update: find, fill definition, merge, validate merged config, save");
    }

    /**
     * Pins the plan section 9 row "Datasource.mergeWith NPE on a null config" (Datasource.java:103,
     * {@code Optional.of(getDetailConfig())}) as it is reached through update(): a stored datasource without a detail
     * config fails with a NullPointerException instead of taking the update's config (the else branch is dead). A fix
     * changes this test on purpose.
     */
    @Test
    void update_storedDatasourceWithoutDetailConfig_failsWithNullPointerException() {
        when(repository.findById(DATASOURCE_ID)).thenReturn(Mono.just(datasource(DATASOURCE_ID, "old", JAVA_TYPE, null)));

        StepVerifier.create(service.update(DATASOURCE_ID, datasource(null, "new", JAVA_TYPE, mock(DatasourceConnectionConfig.class))))
                .expectError(NullPointerException.class)
                .verify();
        verify(repository, never()).save(any(Datasource.class));
        System.out.println("[DatasourceServiceImplTest] pins the section 9 row: mergeWith on a null stored config -> NPE");
    }

    // ---------------------------------------------------------------- testDatasource

    /** Catches the given datasource not being tested as is when it has no id (:197). */
    @Test
    void testDatasource_withoutId_testsTheGivenDatasourceWithoutLookup() {
        DatasourceConnectionConfig config = mock(DatasourceConnectionConfig.class);

        StepVerifier.create(service.testDatasource(datasource(null, "pg", JAVA_TYPE, config)))
                .expectNext(DatasourceTestResult.testSuccess())
                .verifyComplete();
        verify(connector).doTestConnection(config);
        verifyNoInteractions(repository);
        System.out.println("[DatasourceServiceImplTest] test without id: given config tested, no lookup");
    }

    /** Catches testing with credentials the user may not use (:199): an unknown id is NOT_AUTHORIZED. */
    @Test
    void testDatasource_unknownId_failsNotAuthorized() {
        when(repository.findById("missing")).thenReturn(Mono.empty());

        StepVerifier.create(service.testDatasource(datasource("missing", "pg", JAVA_TYPE, mock(DatasourceConnectionConfig.class))))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.NOT_AUTHORIZED))
                .verify();
        verify(connector, never()).doTestConnection(any());
        System.out.println("[DatasourceServiceImplTest] test with an unknown id -> NOT_AUTHORIZED");
    }

    /** Catches the stored credentials not being merged in before validation and test (:201). */
    @Test
    void testDatasource_knownId_mergesTheStoredDatasourceBeforeTesting() {
        DatasourceConnectionConfig currentConfig = mock(DatasourceConnectionConfig.class);
        DatasourceConnectionConfig updatedConfig = mock(DatasourceConnectionConfig.class);
        DatasourceConnectionConfig mergedConfig = mock(DatasourceConnectionConfig.class);
        when(currentConfig.mergeWithUpdatedConfig(updatedConfig)).thenReturn(mergedConfig);
        when(repository.findById(DATASOURCE_ID)).thenReturn(Mono.just(datasource(DATASOURCE_ID, "old", JAVA_TYPE, currentConfig)));

        StepVerifier.create(service.testDatasource(datasource(DATASOURCE_ID, "new", JAVA_TYPE, updatedConfig)))
                .expectNext(DatasourceTestResult.testSuccess())
                .verifyComplete();
        verify(connector).doValidateConfig(mergedConfig);
        verify(connector).doTestConnection(mergedConfig);
        System.out.println("[DatasourceServiceImplTest] test with a known id: merged config validated and tested");
    }

    /** Catches the wrong test path per plugin kind (:207): JS plugins go to the node client, Java plugins to the connector. */
    @Test
    void testDatasource_jsPluginGoesToTheNodeClient_javaPluginToTheLocalConnector() {
        JsDatasourceConnectionConfig jsConfig = new JsDatasourceConnectionConfig();
        DatasourceTestResult nodeResult = DatasourceTestResult.testFail("from node");
        when(pluginClient.test(JS_TYPE, jsConfig)).thenReturn(Mono.just(nodeResult));

        StepVerifier.create(service.testDatasource(datasource(null, "js", JS_TYPE, jsConfig))).expectNext(nodeResult).verifyComplete();
        verify(connector, never()).doTestConnection(any());

        StepVerifier.create(service.testDatasource(datasource(null, "pg", JAVA_TYPE, mock(DatasourceConnectionConfig.class))))
                .expectNext(DatasourceTestResult.testSuccess()).verifyComplete();
        verify(pluginClient).test(eq(JS_TYPE), any());
        System.out.println("[DatasourceServiceImplTest] test routing: JS -> node client, Java -> local connector");
    }

    /** Catches a connector failure surfacing as an error signal (:218): it must become a failed test result. */
    @Test
    void testDatasource_connectorError_becomesAFailedResultNotAnError() {
        when(connector.doTestConnection(any())).thenReturn(Mono.error(new IllegalStateException("boom")));

        StepVerifier.create(service.testDatasource(datasource(null, "pg", JAVA_TYPE, mock(DatasourceConnectionConfig.class))))
                .assertNext(result -> {
                    assertThat(result.isSuccess()).isFalse();
                    assertThat(result.getInvalidMessage(java.util.Locale.ENGLISH)).contains("boom");
                })
                .verifyComplete();
        System.out.println("[DatasourceServiceImplTest] connector error -> failed DatasourceTestResult");
    }

    /** Catches a hanging connector blocking the request (:217): after 10 seconds (virtual time) the test fails as a timeout. */
    @Test
    void testDatasource_connectorNeverAnswers_failsAsTimeoutAfterTenSeconds() {
        when(connector.doTestConnection(any())).thenReturn(Mono.never());

        StepVerifier.withVirtualTime(() -> service.testDatasource(datasource(null, "pg", JAVA_TYPE, mock(DatasourceConnectionConfig.class))))
                .expectSubscription()
                .expectNoEvent(Duration.ofSeconds(9))
                .thenAwait(Duration.ofSeconds(1))
                .assertNext(result -> {
                    assertThat(result.isSuccess()).isFalse();
                    assertThat(result.getInvalidMessage(java.util.Locale.ENGLISH))
                            .isEqualTo(LocaleUtils.getMessage(java.util.Locale.ENGLISH, "DATASOURCE_TEST_TIMEOUT_ERROR"));
                })
                .expectComplete()
                .verify(Duration.ofSeconds(5));
        System.out.println("[DatasourceServiceImplTest] connector without answer -> timeout result after 10 s");
    }

    // ---------------------------------------------------------------- shared static datasource (section 9 candidate)

    /**
     * Pins the plan section 9 row "testDatasource merges into the shared static datasource": for a system-static id,
     * {@code getById} returns the shared constant and {@code mergeWith} (:201) mutates it, so a connection test changes
     * the global QUICK_REST_API for every later caller. The shared constant is restored in {@code finally}. A fix (merge
     * into a copy) changes this test on purpose.
     */
    @Test
    void testDatasource_staticId_mutatesTheSharedStaticDatasource() {
        Datasource shared = Datasource.QUICK_REST_API;
        String originalName = shared.getName();
        DatasourceStatus originalStatus = shared.getDatasourceStatus();
        DatasourceConnectionConfig originalConfig = shared.getDetailConfig();
        try {
            Datasource request = datasource(Datasource.QUICK_REST_API_ID, "hijacked-name", shared.getType(), RestApiDatasourceConfig.EMPTY_CONFIG);
            request.setDatasourceStatus(DatasourceStatus.DELETED);

            // the static datasource has no organization id, so validation fails after the merge: the outcome is not the point
            StepVerifier.create(service.testDatasource(request)).expectError(BizException.class).verify();

            assertThat(shared.getName()).as("the shared constant was mutated by the test request").isEqualTo("hijacked-name");
            assertThat(shared.getDatasourceStatus()).isEqualTo(DatasourceStatus.DELETED);
        } finally {
            shared.setName(originalName);
            shared.setDatasourceStatus(originalStatus);
            shared.setDetailConfig(originalConfig);
        }
        assertThat(Datasource.QUICK_REST_API.getName()).isEqualTo(originalName);
        System.out.println("[DatasourceServiceImplTest] pins the section 9 row: static datasource mutated by testDatasource, restored");
    }

    // ---------------------------------------------------------------- removePasswordTypeKeys...

    private static JsDatasourceConnectionConfig jsConfigWithPasswordParam() {
        JsDatasourceConnectionConfig config = new JsDatasourceConnectionConfig();
        config.setDefinition(Map.of("dataSourceConfig", Map.of("params", List.of(
                Map.of("type", "password", "key", "secret"),
                Map.of("type", "input", "key", "host")))));
        config.put("secret", "s3cr3t");
        config.put("host", "db.example.com");
        return config;
    }

    /** Catches secrets going unmasked to the client (:231): JS plugin password-type keys are removed, others kept. */
    @Test
    void removePasswordTypeKeys_jsPlugin_removesPasswordKeysAfterFillingTheDefinition() {
        JsDatasourceConnectionConfig config = jsConfigWithPasswordParam();
        Datasource datasource = datasource(DATASOURCE_ID, "js", JS_TYPE, config);

        StepVerifier.create(service.removePasswordTypeKeysFromJsDatasourcePluginConfig(datasource)).verifyComplete();

        assertThat(config).doesNotContainKey("secret").containsEntry("host", "db.example.com");
        verify(jsDatasourceHelper).fillPluginDefinition(datasource);
        System.out.println("[DatasourceServiceImplTest] JS plugin: password-type keys removed, other keys kept");
    }

    /** Catches passwords being removed even when filling the definition fails (doFinally), and for non-JS plugins (:229). */
    @Test
    void removePasswordTypeKeys_removesEvenWhenFillFails_andNeverForJavaPlugins() {
        JsDatasourceConnectionConfig failing = jsConfigWithPasswordParam();
        Datasource failingDatasource = datasource(DATASOURCE_ID, "js", JS_TYPE, failing);
        when(jsDatasourceHelper.fillPluginDefinition(failingDatasource)).thenReturn(Mono.error(new IllegalStateException("node down")));
        StepVerifier.create(service.removePasswordTypeKeysFromJsDatasourcePluginConfig(failingDatasource))
                .expectError(IllegalStateException.class).verify();
        assertThat(failing).doesNotContainKey("secret");

        JsDatasourceConnectionConfig notRemoved = jsConfigWithPasswordParam();
        Datasource javaDatasource = datasource(DATASOURCE_ID, "pg", JAVA_TYPE, notRemoved);
        StepVerifier.create(service.removePasswordTypeKeysFromJsDatasourcePluginConfig(javaDatasource)).verifyComplete();
        assertThat(notRemoved).as("a Java plugin config is not touched").containsKey("secret");
        System.out.println("[DatasourceServiceImplTest] passwords removed in doFinally; Java plugin config untouched");
    }

    // ---------------------------------------------------------------- retain / delete

    /** Catches a repository call for an empty or null id collection (:253). */
    @Test
    void retainNoneExist_emptyOrNullCollection_returnsEmptyWithoutRepository_otherwiseDelegates() {
        StepVerifier.create(service.retainNoneExistAndNonCurrentOrgDatasourceIds(List.of(), ORG_ID)).verifyComplete();
        StepVerifier.create(service.retainNoneExistAndNonCurrentOrgDatasourceIds(null, ORG_ID)).verifyComplete();
        verifyNoInteractions(repository);

        when(repository.retainNoneExistAndNonCurrentOrgDatasourceIds(List.of("a", "b"), ORG_ID)).thenReturn(Flux.just("b"));
        StepVerifier.create(service.retainNoneExistAndNonCurrentOrgDatasourceIds(List.of("a", "b"), ORG_ID)).expectNext("b").verifyComplete();
        System.out.println("[DatasourceServiceImplTest] retain: empty/null short-circuit, otherwise delegated");
    }

    private static Application application(ApplicationStatus status) {
        return Application.builder().applicationStatus(status).build();
    }

    /** Counts subscriptions: production builds markDatasourceAsDeleted(...) eagerly inside then(...), only a subscription writes. */
    private AtomicInteger countDeleteSubscriptions() {
        AtomicInteger subscriptions = new AtomicInteger();
        when(repository.markDatasourceAsDeleted(DATASOURCE_ID)).thenReturn(Mono.fromSupplier(() -> {
            subscriptions.incrementAndGet();
            return true;
        }));
        return subscriptions;
    }

    /** Catches deleting a datasource that live applications still use (:263): their queries would break. */
    @ParameterizedTest
    @EnumSource(value = ApplicationStatus.class, names = {"NORMAL", "RECYCLED"})
    void delete_stillUsedByANonDeletedApplication_failsAndDoesNotMarkDeleted(ApplicationStatus status) {
        AtomicInteger subscriptions = countDeleteSubscriptions();
        when(applicationRepository.findByDatasourceId(DATASOURCE_ID)).thenReturn(Flux.just(application(ApplicationStatus.DELETED), application(status)));

        StepVerifier.create(service.delete(DATASOURCE_ID))
                .expectErrorSatisfies(error -> assertBizError(error, BizError.DATASOURCE_DELETE_FAIL_DUE_TO_REMAINING_QUERIES))
                .verify();
        assertThat(subscriptions.get()).isZero();
        System.out.println("[DatasourceServiceImplTest] delete refused while a " + status + " application uses the datasource");
    }

    /** Catches deleted applications blocking the delete (:275), and the delete not being executed once allowed. */
    @Test
    void delete_unusedOrOnlyUsedByDeletedApplications_marksDeletedOnce() {
        AtomicInteger subscriptions = countDeleteSubscriptions();
        when(applicationRepository.findByDatasourceId(DATASOURCE_ID)).thenReturn(Flux.just(application(ApplicationStatus.DELETED)));
        StepVerifier.create(service.delete(DATASOURCE_ID)).expectNext(true).verifyComplete();
        assertThat(subscriptions.get()).isEqualTo(1);

        when(applicationRepository.findByDatasourceId(DATASOURCE_ID)).thenReturn(Flux.empty());
        StepVerifier.create(service.delete(DATASOURCE_ID)).expectNext(true).verifyComplete();
        assertThat(subscriptions.get()).isEqualTo(2);
        System.out.println("[DatasourceServiceImplTest] delete allowed for unused / only-deleted-app datasources");
    }
}
