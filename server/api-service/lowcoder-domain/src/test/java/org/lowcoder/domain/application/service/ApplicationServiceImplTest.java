package org.lowcoder.domain.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.app;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.appWithGid;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.appWithSlug;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.counted;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.dslWithModules;
import static org.lowcoder.domain.application.service.ApplicationServiceImplTestSupport.version;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.ArgumentCaptor;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * ApplicationServiceImpl with mocked collaborators (unit U12, task L3-12; the NonEmptyMono aspect is not applied, see
 * ApplicationServiceImplTestSupport). Not repeated: the L1-8 row (findByIdWithoutDsl routing of a slug and the audit event),
 * the L3-11b hyphenated-slug row, and the candidate pins in ApplicationServiceImplFindByIdInPinTest and
 * ApplicationServiceImplIdKindFamilyPinTest. ApplicationApiServiceImpl is L1-2's.
 */
class ApplicationServiceImplTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);
    private static final String USER = "user-1";

    private final ApplicationServiceImplTestSupport s = new ApplicationServiceImplTestSupport();
    private final ApplicationServiceImpl service = s.service;

    private static BizException failure(Runnable call) {
        return assertThrows(BizException.class, call::run);
    }

    /** Catches: a null id passing through, an unknown id not failing, the not-found key changed. */
    @Test
    void findByIdFailsForNullAndUnknownAndAnswersTheApplication() {
        Application found = app("a1");
        when(s.repository.findByIdWithDsl("a1")).thenReturn(Mono.just(found));

        assertThat(service.findById("a1").block(TIMEOUT)).isSameAs(found);
        assertThat(failure(() -> service.findById(null).block(TIMEOUT)).getError()).isEqualTo(BizError.INVALID_PARAMETER);
        BizException unknown = failure(() -> service.findById("nope").block(TIMEOUT));
        assertThat(unknown.getError()).isEqualTo(BizError.NO_RESOURCE_FOUND);
        assertThat(unknown.getMessageKey()).isEqualTo("CANT_FIND_APPLICATION");
    }

    /**
     * Catches: the slug / gid / id routing of findByIdWithoutDsl (:65-71) changed: a slug hit stops the lookup, a "-" routes to
     * the gid query only, anything else to the id query only. The audit-event consequence of the slug route is the L1-8 row and
     * the hyphen heuristic's consequence the L3-11b row, neither is re-pinned here.
     */
    @Test
    void findByIdWithoutDslRoutesSlugThenGidOrId() {
        Application bySlug = app("by-slug");
        Application byGid = app("g1");
        Application byId = app("i1");
        AtomicInteger gidQueries = new AtomicInteger();
        AtomicInteger idQueries = new AtomicInteger();
        when(s.repository.findBySlug("my-slug")).thenReturn(Flux.just(bySlug));
        when(s.repository.findByGid("abc-def")).thenReturn(counted(Flux.just(byGid), gidQueries));
        when(s.repository.findById("plainid")).thenReturn(counted(Mono.just(byId), idQueries));

        assertThat(service.findByIdWithoutDsl("my-slug").block(TIMEOUT)).isSameAs(bySlug);
        assertThat(gidQueries.get() + idQueries.get()).as("a slug hit stops the lookup").isZero();

        assertThat(service.findByIdWithoutDsl("abc-def").block(TIMEOUT)).isSameAs(byGid);
        assertThat(gidQueries.get()).isEqualTo(1);
        assertThat(idQueries.get()).isZero();

        assertThat(service.findByIdWithoutDsl("plainid").block(TIMEOUT)).isSameAs(byId);
        assertThat(gidQueries.get()).isEqualTo(1);
        assertThat(idQueries.get()).isEqualTo(1);

        BizException unknown = failure(() -> service.findByIdWithoutDsl("unknown").block(TIMEOUT));
        assertThat(unknown.getError()).isEqualTo(BizError.NO_RESOURCE_FOUND);
        assertThat(failure(() -> service.findByIdWithoutDsl(null).block(TIMEOUT)).getError()).isEqualTo(BizError.INVALID_PARAMETER);
    }

    /** Catches: updateById not rejecting null, not delegating the application and id. */
    @Test
    void updateByIdRejectsNullAndOtherwiseDelegates() {
        Application patch = app("x");
        when(s.mongoUpsertHelper.updateById(patch, "a1")).thenReturn(Mono.just(true));

        assertThat(service.updateById("a1", patch).block(TIMEOUT)).isTrue();
        assertThat(failure(() -> service.updateById(null, patch).block(TIMEOUT)).getError()).isEqualTo(BizError.INVALID_PARAMETER);
    }

    /** Catches: the editing user cleared when editing is not finished, not cleared when it is, an unknown id not failing. */
    @Test
    void updateEditStateClearsTheEditingUserOnlyWhenEditingIsFinished() {
        when(s.repository.findByIdWithDsl("a1")).thenReturn(Mono.just(app("a1")));
        when(s.mongoUpsertHelper.updateById(any(Application.class), eq("a1"))).thenReturn(Mono.just(true));

        assertThat(service.updateEditState("a1", false).block(TIMEOUT)).isTrue();
        verify(s.mongoUpsertHelper, never()).updateById(any(Application.class), anyString());

        assertThat(service.updateEditState("a1", true).block(TIMEOUT)).isTrue();
        ArgumentCaptor<Application> patch = ArgumentCaptor.forClass(Application.class);
        verify(s.mongoUpsertHelper).updateById(patch.capture(), eq("a1"));
        assertThat(patch.getValue().getEditingUserId()).isEmpty();

        assertThat(failure(() -> service.updateEditState("nope", true).block(TIMEOUT)).getError()).isEqualTo(BizError.NO_RESOURCE_FOUND);
    }

    /** Catches: the owner permission granted before the save or to the wrong id, user, role or type, a failing grant not failing create. */
    @Test
    void createSavesThenGrantsOwnerAndFailsWhenTheGrantFails() {
        Application newApplication = app(null);
        Application saved = app("saved-id");
        AtomicBoolean saveSubscribed = new AtomicBoolean();
        when(s.repository.save(newApplication)).thenReturn(Mono.just(saved).doOnSubscribe(x -> saveSubscribed.set(true)));
        when(s.resourcePermissionService.addResourcePermissionToUser("saved-id", USER, ResourceRole.OWNER, ResourceType.APPLICATION))
                .thenAnswer(invocation -> {
                    assertThat(saveSubscribed).as("the grant runs after the save").isTrue();
                    return Mono.just(true);
                });

        assertThat(service.create(newApplication, USER).block(TIMEOUT)).isSameAs(saved);
        verify(s.resourcePermissionService).addResourcePermissionToUser("saved-id", USER, ResourceRole.OWNER, ResourceType.APPLICATION);

        when(s.resourcePermissionService.addResourcePermissionToUser("saved-id", "bad-user", ResourceRole.OWNER, ResourceType.APPLICATION))
                .thenReturn(Mono.error(new IllegalStateException("grant failed")));
        assertThrows(IllegalStateException.class, () -> service.create(newApplication, "bad-user").block(TIMEOUT));
    }

    /** Catches: a listing or count delegated to a neighbouring repository method. */
    @Test
    void listingsAndCountsUseTheIntendedRepositoryMethods() {
        Application a = app("a");
        when(s.repository.findByOrganizationIdWithDsl("o")).thenReturn(Flux.just(a, app("b")));
        when(s.repository.findByOrganizationId("o")).thenReturn(Flux.just(a));
        when(s.repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrue()).thenReturn(Flux.just(app("m1"), app("m2"), app("m3")));
        when(s.repository.findByPublicToAllIsTrueAndAgencyProfileIsTrue()).thenReturn(Flux.just(app("g1"), app("g2"), app("g3"), app("g4")));
        when(s.repository.countByOrganizationIdAndApplicationStatus("o", ApplicationStatus.RECYCLED)).thenReturn(Mono.just(7L));
        when(s.repository.findAll()).thenReturn(Flux.just(a, a, a, a, a));

        assertThat(service.findByOrganizationIdWithDsl("o").collectList().block(TIMEOUT)).hasSize(2);
        assertThat(service.findByOrganizationIdWithoutDsl("o").collectList().block(TIMEOUT)).hasSize(1);
        assertThat(service.findAllMarketplaceApps().collectList().block(TIMEOUT)).hasSize(3);
        assertThat(service.findAllAgencyProfileApps().collectList().block(TIMEOUT)).hasSize(4);
        assertThat(service.countByOrganizationId("o", ApplicationStatus.RECYCLED).block(TIMEOUT)).isEqualTo(7L);
        assertThat(service.findAll().collectList().block(TIMEOUT)).hasSize(5);
    }

    /**
     * Catches: the findByIdIn routing changed for homogeneous lists (BF-154, BF-155, BF-156): every list asks the slugs once;
     * the keys no slug matched go to the id query (plain keys) or the gid query (keys with a hyphen), each only when the list
     * has keys of it, so an empty list asks the slugs only. The mixed lists are in ApplicationServiceImplFindByIdInPinTest
     * and ApplicationServiceImplIdKindFamilyPinTest.
     */
    @Test
    void findByIdInAsksTheSlugsThenTheIdsOrGidsOfTheRest() {
        AtomicInteger slugQueries = new AtomicInteger();
        AtomicInteger idQueries = new AtomicInteger();
        AtomicInteger gidQueries = new AtomicInteger();
        when(s.repository.findBySlugIn(anyCollection())).thenReturn(counted(Flux.empty(), slugQueries));
        when(s.repository.findByIdIn(anyCollection())).thenReturn(counted(Flux.just(app("i1")), idQueries));
        when(s.repository.findByGidIn(anyCollection())).thenReturn(counted(Flux.just(app("g1")), gidQueries));

        assertThat(service.findByIdIn(List.of()).collectList().block(TIMEOUT)).isEmpty();
        assertThat(slugQueries.get()).isEqualTo(1);
        assertThat(idQueries.get()).isZero();

        assertThat(service.findByIdIn(List.of("plain1", "plain2")).collectList().block(TIMEOUT)).extracting(Application::getId).containsExactly("i1");
        assertThat(slugQueries.get()).isEqualTo(2);
        assertThat(idQueries.get()).isEqualTo(1);
        assertThat(gidQueries.get()).isZero();

        assertThat(service.findByIdIn(List.of("gid-1", "gid-2")).collectList().block(TIMEOUT)).extracting(Application::getId).containsExactly("g1");
        assertThat(gidQueries.get()).isEqualTo(1);
        assertThat(slugQueries.get()).isEqualTo(3);
        assertThat(idQueries.get()).isEqualTo(1);

        when(s.repository.findBySlugIn(anyCollection())).thenReturn(counted(Flux.just(appWithSlug("s1", "plain1")), slugQueries));
        assertThat(service.findByIdIn(List.of("plain1")).collectList().block(TIMEOUT)).extracting(Application::getId).containsExactly("s1");
        assertThat(idQueries.get()).as("a key a slug matched is not looked up again").isEqualTo(1);
    }

    private static Collection<String> anyCollection() {
        return org.mockito.ArgumentMatchers.anyCollection();
    }

    /** Catches: a DSL without modules not answering an empty list, an unknown id not failing. */
    @Test
    void anApplicationWithoutModulesHasNoDependentModules() {
        when(s.repository.findByIdWithDsl("root")).thenReturn(Mono.just(app("root", new HashMap<>())));

        assertThat(service.getAllDependentModulesFromApplicationId("root", true).block(TIMEOUT)).isEmpty();
        assertThat(service.getAllDependentModulesFromApplicationId("root", false).block(TIMEOUT)).isEmpty();
        assertThat(failure(() -> service.getAllDependentModulesFromApplicationId("nope", true).block(TIMEOUT)).getError())
                .isEqualTo(BizError.NO_RESOURCE_FOUND);
    }

    /** Catches: the nested module not expanded (expandDeep), a circular or self reference not ending, a module listed twice. */
    @Test
    void dependentModulesAreExpandedDeepAndCircularReferencesEnd() {
        Application root = app("root", dslWithModules("m1", "m2"));
        Application m1 = app("m1", dslWithModules("m3", "root"));
        Application m2 = app("m2", dslWithModules("m2"));
        Application m3 = app("m3", new HashMap<>());
        when(s.repository.findByIdWithDsl("root")).thenReturn(Mono.just(root));
        when(s.repository.findByIdIn(any())).thenAnswer(invocation -> {
            Collection<String> requested = invocation.getArgument(0);
            return Flux.fromIterable(List.of(m1, m2, m3, root)).filter(a -> requested.contains(a.getId()));
        });

        List<Application> modules = service.getAllDependentModulesFromApplicationId("root", false).block(TIMEOUT);

        System.out.println("[ApplicationServiceImplTest] dependent modules: " + modules.stream().map(Application::getId).toList());
        assertThat(modules).extracting(Application::getId)
                .as("the root is listed too: the circular set is seeded from the root's DSL only, so a module that refers back to the root returns it once")
                .containsExactlyInAnyOrder("m1", "m2", "m3", "root");
    }

    /** Catches: a module reached from two parents listed twice (the circular set must be extended with every module found below the root). */
    @Test
    void aModuleReferencedFromTwoParentsIsListedOnce() {
        Application root = app("root", dslWithModules("m1", "m2"));
        Application m1 = app("m1", dslWithModules("m3"));
        Application m2 = app("m2", dslWithModules("m3"));
        Application m3 = app("m3", new HashMap<>());
        when(s.repository.findByIdWithDsl("root")).thenReturn(Mono.just(root));
        when(s.repository.findByIdIn(any())).thenAnswer(invocation -> {
            Collection<String> requested = invocation.getArgument(0);
            return Flux.fromIterable(List.of(m1, m2, m3)).filter(a -> requested.contains(a.getId()));
        });

        List<Application> modules = service.getAllDependentModulesFromApplicationId("root", false).block(TIMEOUT);

        assertThat(modules).extracting(Application::getId).containsExactlyInAnyOrder("m1", "m2", "m3");
    }

    /**
     * Behaviour (observed): the onErrorContinue of getAllDependentModulesFromDsl (:169) does not make a failing first-level
     * lookup skippable: the repository error reaches the caller and the whole expansion fails, although the code logs "on error
     * continue". Only a database failure triggers it; no user input does.
     */
    @Test
    void aFailingFirstLevelModuleLookupFailsTheWholeExpansion() {
        Application root = app("root", dslWithModules("bad", "ok"));
        when(s.repository.findBySlugIn(any())).thenReturn(Flux.error(new IllegalStateException("lookup failed")));
        when(s.repository.findByIdWithDsl("root")).thenReturn(Mono.just(root));

        IllegalStateException failure = assertThrows(IllegalStateException.class,
                () -> service.getAllDependentModulesFromApplicationId("root", false).block(TIMEOUT));

        System.out.println("[ApplicationServiceImplTest] first-level lookup failure reaches the caller: " + failure.getMessage());
        assertThat(failure).hasMessage("lookup failed");
    }

    /** Behaviour (observed): the onErrorContinue one level down (:180) does not skip a failing lookup either, the error reaches the caller. */
    @Test
    void aFailingSecondLevelModuleLookupFailsTheWholeExpansionToo() {
        Application root = app("root", dslWithModules("m1"));
        Application m1 = app("m1", dslWithModules("m2"));
        when(s.repository.findByIdWithDsl("root")).thenReturn(Mono.just(root));
        when(s.repository.findByIdIn(argThat(keys -> keys != null && List.copyOf(keys).equals(List.of("m1"))))).thenReturn(Flux.just(m1));
        when(s.repository.findBySlugIn(List.of("m2"))).thenReturn(Flux.error(new IllegalStateException("lookup failed")));

        IllegalStateException failure = assertThrows(IllegalStateException.class,
                () -> service.getAllDependentModulesFromApplicationId("root", false).block(TIMEOUT));

        System.out.println("[ApplicationServiceImplTest] second-level lookup failure reaches the caller: " + failure.getMessage());
        assertThat(failure).hasMessage("lookup failed");
    }

    /** Catches: view mode reading the editing DSL, edit mode reading the live one. */
    @Test
    void viewModeUsesTheLiveDslAndEditModeTheEditingDsl() {
        Application root = app("root", dslWithModules("editingmodule"));
        Application liveModule = app("livemodule");
        Application editingModule = app("editingmodule");
        when(s.applicationRecordService.getLatestRecordByApplicationId("root")).thenReturn(Mono.just(version(dslWithModules("livemodule"))));
        when(s.repository.findByIdIn(any())).thenAnswer(invocation -> {
            Collection<String> requested = invocation.getArgument(0);
            return Flux.fromIterable(List.of(liveModule, editingModule)).filter(a -> requested.contains(a.getId()));
        });

        assertThat(service.getAllDependentModulesFromApplication(root, true).block(TIMEOUT)).extracting(Application::getId).containsExactly("livemodule");
        assertThat(service.getAllDependentModulesFromApplication(root, false).block(TIMEOUT)).extracting(Application::getId).containsExactly("editingmodule");
    }

    /** Catches: a flag setter writing another field or another id. */
    @Test
    void publicToAllAndAgencyProfileWriteOnlyTheirOwnFlag() {
        when(s.mongoUpsertHelper.updateById(any(Application.class), anyString())).thenReturn(Mono.just(true));

        assertThat(service.setApplicationPublicToAll("a1", true).block(TIMEOUT)).isTrue();
        assertThat(service.setApplicationAsAgencyProfile("a2", true).block(TIMEOUT)).isTrue();

        ArgumentCaptor<Application> first = ArgumentCaptor.forClass(Application.class);
        verify(s.mongoUpsertHelper).updateById(first.capture(), eq("a1"));
        assertThat(first.getValue().isPublicToAll()).isTrue();
        assertThat(first.getValue().agencyProfile()).isFalse();
        assertThat(first.getValue().isPublicToMarketplace()).isFalse();
        ArgumentCaptor<Application> second = ArgumentCaptor.forClass(Application.class);
        verify(s.mongoUpsertHelper).updateById(second.capture(), eq("a2"));
        assertThat(second.getValue().agencyProfile()).isTrue();
        assertThat(second.getValue().isPublicToAll()).isFalse();
    }

    /** Catches: the marketplace flag written without the editing DSL, or without the existence check. */
    @Test
    void publicToMarketplaceWritesTheFlagAndTheEditingDslAfterAnExistenceCheck() {
        Map<String, Object> dsl = new HashMap<>(Map.of("k", "v"));
        when(s.repository.findByIdWithDsl("a1")).thenReturn(Mono.just(app("a1", dsl)));
        when(s.mongoUpsertHelper.updateById(any(Application.class), eq("a1"))).thenReturn(Mono.just(true));

        assertThat(service.setApplicationPublicToMarketplace("a1", true).block(TIMEOUT)).isTrue();

        ArgumentCaptor<Application> patch = ArgumentCaptor.forClass(Application.class);
        verify(s.mongoUpsertHelper).updateById(patch.capture(), eq("a1"));
        assertThat(patch.getValue().isPublicToMarketplace()).isTrue();
        assertThat(patch.getValue().getEditingApplicationDSL()).isEqualTo(dsl);
        assertThat(failure(() -> service.setApplicationPublicToMarketplace("nope", true).block(TIMEOUT)).getError())
                .isEqualTo(BizError.NO_RESOURCE_FOUND);
        verify(s.mongoUpsertHelper, never()).updateById(any(Application.class), eq("nope"));
    }

    private void stubFilterQueries(AtomicInteger publicQ, AtomicInteger privateQ, AtomicInteger marketQ, AtomicInteger agencyQ) {
        when(s.repository.findByPublicToAllIsTrueAndIdIn(any())).thenReturn(counted(Flux.just(app("pub")), publicQ));
        when(s.repository.findByCreatedByAndSlugIn(anyString(), any())).thenReturn(Flux.empty());
        when(s.repository.findByCreatedByAndIdIn(anyString(), any())).thenReturn(counted(Flux.just(app("priv")), privateQ));
        when(s.repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndIdIn(any())).thenReturn(counted(Flux.just(app("mkt")), marketQ));
        when(s.repository.findByPublicToAllIsTrueAndAgencyProfileIsTrueAndIdIn(any())).thenReturn(counted(Flux.just(app("agy")), agencyQ));
    }

    /** Catches: the request-type switch or the anonymous test routing to a neighbouring query. */
    @ParameterizedTest
    @ValueSource(strings = {"", "  "})
    void filteredIdsRouteByRequestTypeAndAnonymity(String blankUser) {
        AtomicInteger publicQ = new AtomicInteger();
        AtomicInteger privateQ = new AtomicInteger();
        AtomicInteger marketQ = new AtomicInteger();
        AtomicInteger agencyQ = new AtomicInteger();
        stubFilterQueries(publicQ, privateQ, marketQ, agencyQ);
        Collection<String> ids = List.of("x1");

        assertThat(service.getFilteredPublicApplicationIds(ApplicationRequestType.PUBLIC_TO_ALL, ids, blankUser, false).block(TIMEOUT)).containsExactly("pub");
        assertThat(service.getFilteredPublicApplicationIds(ApplicationRequestType.PUBLIC_TO_ALL, ids, null, false).block(TIMEOUT)).containsExactly("pub");
        assertThat(publicQ.get()).isEqualTo(2);
        assertThat(privateQ.get()).isZero();

        assertThat(service.getFilteredPublicApplicationIds(ApplicationRequestType.PUBLIC_TO_ALL, ids, USER, false).block(TIMEOUT)).containsExactly("priv");
        assertThat(privateQ.get()).isEqualTo(1);
        assertThat(publicQ.get()).isEqualTo(2);

        assertThat(service.getFilteredPublicApplicationIds(ApplicationRequestType.PUBLIC_TO_MARKETPLACE, ids, USER, false).block(TIMEOUT)).containsExactly("mkt");
        assertThat(service.getFilteredPublicApplicationIds(ApplicationRequestType.AGENCY_PROFILE, ids, null, true).block(TIMEOUT)).containsExactly("agy");
        assertThat(marketQ.get()).isEqualTo(1);
        assertThat(agencyQ.get()).isEqualTo(1);
    }

    /**
     * Behaviour: a request type of null is not handled (the switch dereferences it), and the "default" arm of the switch is
     * unreachable for the three enum values. A null type is not passed by the callers (ApplicationPermissionHandler:79, :94
     * pass a request type derived from the request).
     */
    @Test
    void aNullRequestTypeFailsInTheSwitch() {
        assertThrows(NullPointerException.class, () -> service.getFilteredPublicApplicationIds(null, List.of("x"), USER, false));
    }

    /** Catches: the marketplace truth table (anonymous x private mode) changed (:317). */
    @Test
    void marketplaceIdsAreHiddenOnlyFromAnonymousVisitorsOfAPrivateMarketplace() {
        AtomicInteger marketQ = new AtomicInteger();
        when(s.repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndIdIn(any())).thenReturn(counted(Flux.just(app("mkt")), marketQ));
        Collection<String> ids = List.of("x1");

        assertThat(service.getPublicMarketplaceApplicationIds(ids, true, true).blockOptional(TIMEOUT)).isEmpty();
        assertThat(marketQ.get()).isZero();
        assertThat(service.getPublicMarketplaceApplicationIds(ids, true, false).block(TIMEOUT)).containsExactly("mkt");
        assertThat(service.getPublicMarketplaceApplicationIds(ids, false, true).block(TIMEOUT)).containsExactly("mkt");
        assertThat(service.getPublicMarketplaceApplicationIds(ids, false, false).block(TIMEOUT)).containsExactly("mkt");
        assertThat(marketQ.get()).isEqualTo(3);
    }

    /**
     * Catches: the gid variant answering ids or the id variant answering gids. An empty set asks no query and answers an
     * empty set (BF-155; it asked the id query before, which a real database answers empty too).
     */
    @Test
    void theFourFiltersAnswerGidsForGidListsAndIdsOtherwise() {
        Application withGid = appWithGid("real-id", "the-gid");
        when(s.repository.findByPublicToAllIsTrueAndGidIn(any())).thenReturn(Flux.just(withGid));
        when(s.repository.findByCreatedByAndGidIn(anyString(), any())).thenReturn(Flux.just(withGid));
        when(s.repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndGidIn(any())).thenReturn(Flux.just(withGid));
        when(s.repository.findByPublicToAllIsTrueAndAgencyProfileIsTrueAndGidIn(any())).thenReturn(Flux.just(withGid));
        when(s.repository.findByPublicToAllIsTrueAndIdIn(any())).thenReturn(Flux.just(withGid));
        when(s.repository.findByCreatedByAndIdIn(anyString(), any())).thenReturn(Flux.just(withGid));
        when(s.repository.findByPublicToAllIsTrueAndPublicToMarketplaceIsTrueAndIdIn(any())).thenReturn(Flux.just(withGid));
        when(s.repository.findByPublicToAllIsTrueAndAgencyProfileIsTrueAndIdIn(any())).thenReturn(Flux.just(withGid));
        Collection<String> gids = List.of("aa-bb");
        Collection<String> ids = List.of("plain");

        assertThat(s.service.getPublicApplicationIds(gids).block(TIMEOUT)).containsExactly("the-gid");
        assertThat(s.service.getPrivateApplicationIds(gids, USER).block(TIMEOUT)).containsExactly("the-gid");
        assertThat(s.service.getPublicMarketplaceApplicationIds(gids, false, false).block(TIMEOUT)).containsExactly("the-gid");
        assertThat(s.service.getPublicAgencyApplicationIds(gids).block(TIMEOUT)).containsExactly("the-gid");

        assertThat(s.service.getPublicApplicationIds(ids).block(TIMEOUT)).containsExactly("real-id");
        assertThat(s.service.getPrivateApplicationIds(ids, USER).block(TIMEOUT)).containsExactly("real-id");
        assertThat(s.service.getPublicMarketplaceApplicationIds(ids, false, false).block(TIMEOUT)).containsExactly("real-id");
        assertThat(s.service.getPublicAgencyApplicationIds(ids).block(TIMEOUT)).containsExactly("real-id");
        assertThat(s.service.getPublicApplicationIds(List.of()).block(TIMEOUT)).isEmpty();
        assertThat(s.service.getPublicAgencyApplicationIds(List.of()).block(TIMEOUT)).isEmpty();
    }

    /** Catches: the private route not trying slugs first, a key a slug matched being sent to the id query too (:297). */
    @Test
    void privateIdsTrySlugsFirstAndAnswerTheRealIds() {
        AtomicInteger idQueries = new AtomicInteger();
        when(s.repository.findByCreatedByAndSlugIn(eq(USER), any())).thenReturn(Flux.just(appWithSlug("by-slug-id", "someslug")));
        when(s.repository.findByCreatedByAndIdIn(anyString(), any())).thenReturn(counted(Flux.just(app("by-id")), idQueries));

        assertThat(service.getPrivateApplicationIds(List.of("someslug"), USER).block(TIMEOUT)).containsExactly("by-slug-id");
        assertThat(idQueries.get()).isZero();
    }

    /** Catches: updateLastEditedAt writing another time or user, saving nothing, answering true for an unknown application. */
    @Test
    void updateLastEditedAtStoresTimeAndUserAndAnswersWhetherAnApplicationWasFound() {
        Application application = app("a1");
        Instant time = Instant.parse("2026-02-03T04:05:06Z");
        when(s.repository.findByIdIn(List.of("a1"))).thenReturn(Flux.just(application));
        when(s.repository.save(any(Application.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        assertThat(service.updateLastEditedAt("a1", time, USER).block(TIMEOUT)).isTrue();

        verify(s.repository).save(application);
        assertThat(application.getLastEditedAt()).isEqualTo(time);
        assertThat(application.getEditingUserId()).isEqualTo(USER);
        assertThat(service.updateLastEditedAt("unknown", time, USER).block(TIMEOUT)).isFalse();
    }

    /** Catches: the live DSL not being the latest record's, the editing fallback missing, an unknown id not failing. */
    @Test
    void liveDslIsTheLatestRecordsAndFallsBackToTheEditingDsl() {
        Map<String, Object> recordDsl = Map.of("from", "record");
        Map<String, Object> editingDsl = Map.of("from", "editing");
        when(s.applicationRecordService.getLatestRecordByApplicationId("with-record")).thenReturn(Mono.just(version(recordDsl)));
        when(s.repository.findByIdWithDsl("without-record")).thenReturn(Mono.just(app("without-record", new HashMap<>(editingDsl))));

        assertThat(service.getLiveDSLByApplicationId("with-record").block(TIMEOUT)).isEqualTo(recordDsl);
        assertThat(service.getLiveDSLByApplicationId("without-record").block(TIMEOUT)).isEqualTo(editingDsl);
        assertThat(failure(() -> service.getLiveDSLByApplicationId("nope").block(TIMEOUT)).getError()).isEqualTo(BizError.NO_RESOURCE_FOUND);
    }

    /** Catches: the slug checks in a different order, a duplicate asked in another org, the slug not saved, an unknown application answering. */
    @Test
    void updateSlugValidatesRejectsDuplicatesInTheSameOrgAndSaves() {
        Application application = Application.builder().organizationId("org-1").build();
        application.setId("a1");
        when(s.repository.findById("a1")).thenReturn(Mono.just(application));
        when(s.repository.existsByOrganizationIdAndSlug("org-1", "free")).thenReturn(Mono.just(false));
        when(s.repository.existsByOrganizationIdAndSlug("org-1", "taken")).thenReturn(Mono.just(true));
        when(s.repository.existsByOrganizationIdAndSlug("org-1", "bad slug!")).thenReturn(Mono.just(true));
        when(s.repository.save(any(Application.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        assertThat(failure(() -> service.updateSlug("a1", "bad slug!").block(TIMEOUT)).getError()).as("invalid wins over duplicate").isEqualTo(BizError.SLUG_INVALID);
        assertThat(failure(() -> service.updateSlug("a1", "taken").block(TIMEOUT)).getError()).isEqualTo(BizError.SLUG_DUPLICATE_ENTRY);
        verify(s.repository, never()).save(any(Application.class));

        Application saved = service.updateSlug("a1", "free").block(TIMEOUT);
        assertThat(saved.getSlug()).isEqualTo("free");
        verify(s.repository).save(application);
        assertThat(service.updateSlug("unknown", "free").blockOptional(TIMEOUT)).isEmpty();
    }
}
