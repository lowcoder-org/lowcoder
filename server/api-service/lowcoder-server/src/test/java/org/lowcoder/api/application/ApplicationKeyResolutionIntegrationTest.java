package org.lowcoder.api.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;

import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.application.view.ApplicationView;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.ActiveProfiles;

import reactor.core.publisher.Mono;

/**
 * NEW-78: the one application a key names, through the real {@link ApplicationService#findByIdWithoutDsl}, the real
 * {@link GidService#convertApplicationIdToObjectId} (C-cases, and the editing route {@link ApplicationController#getEditingApplication}
 * behind it), the real permission check and the real {@link ApplicationApiService#update} over the test database, with no HTTP
 * layer and no security filter chain. An application's object id or gid is answered by that application, never by another application
 * whose slug happens to equal the key; only a key that names nothing that way is answered by the one application holding it
 * as a slug, and a slug several applications hold is refused.
 *
 * <p>Every case but C8 stores its own applications with fresh slugs and gids (the init data resets nothing) and removes them
 * afterwards; C8 stores none. E3, E4 and C5 store a foreign organization, ACTIVE with no member; E1, E2, E5 and C1-C4 only name a
 * foreign organization id that is not stored, as the lookup does not read the organization; the applications of E6-E8, C6 and C7, and
 * the own applications of the other cases, are in the seeded {@code org01}.
 *
 * <p>Not covered: HTTP routing and the security filter chain. The application events, the status checks and the marketplace
 * preview call {@code findByIdWithoutDsl} and are not observed directly; E1, E2, E5 and E7 test the lookup they share.
 */
@SpringBootTest
@ActiveProfiles("test")
class ApplicationKeyResolutionIntegrationTest {

    private static final String LOG_PREFIX = "[ApplicationKeyResolutionIntegrationTest] ";
    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final String ORG_ID = "org01";
    private static final String ORG_ADMIN = "user01";
    private static final String NAME_PREFIX = "key-resolution-it-";
    private static final String RENAMED_NAME = NAME_PREFIX + "renamed";
    private static final String FOREIGN_ORG_NAME = NAME_PREFIX + "foreign-org";
    private static final String SLUG_PREFIX = "krit";
    private static final String DSL_KEY = "settings";
    private static final int APPLICATION_TYPE = 1;
    private static final String CANT_FIND_APPLICATION_KEY = "CANT_FIND_APPLICATION";
    private static final String NOT_AUTHORIZED_KEY = "NOT_AUTHORIZED";
    private static final Boolean KEEP_STATUS = null;
    private static final String NO_ANSWER = "completed empty";
    private static final Boolean WITH_DELETED_UNSET = null;

    @Autowired
    private ApplicationService applicationService;
    @Autowired
    private ApplicationApiService applicationApiService;
    @Autowired
    private GidService gidService;
    @Autowired
    private ApplicationController applicationController;
    @Autowired
    private ResourcePermissionService resourcePermissionService;
    @Autowired
    private ReactiveMongoTemplate mongo;
    @Autowired
    private InitData initData;

    private final List<String> storedApplicationIds = new ArrayList<>();
    private final List<String> storedOrganizationIds = new ArrayList<>();

    @BeforeEach
    void seed() {
        initData.init();
        storedApplicationIds.clear();
        storedOrganizationIds.clear();
    }

    /** Removes what the case stored, each step on its own: the failures after the first are attached to it as suppressed. */
    @AfterEach
    void removeWhatTheCaseStored() {
        RuntimeException failure = run(null, () -> {
            long removed = mongo.remove(Query.query(Criteria.where(FieldName.ID).in(storedApplicationIds)), Application.class)
                    .block(TIMEOUT).getDeletedCount();
            say("removed %d of %d stored application(s)", removed, storedApplicationIds.size());
            assertThat(removed).as("applications removed").isEqualTo(storedApplicationIds.size());
        });
        failure = run(failure, () -> {
            long removed = mongo.remove(Query.query(Criteria.where(FieldName.ID).in(storedOrganizationIds)), Organization.class)
                    .block(TIMEOUT).getDeletedCount();
            say("removed %d of %d stored organization(s)", removed, storedOrganizationIds.size());
            assertThat(removed).as("organizations removed").isEqualTo(storedOrganizationIds.size());
        });
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

    // ------------------------------------------------------------------ cases

    /** E1. Catches: an application answered for another application's object id because it holds that id as its slug. */
    @Test
    @WithMockUser(id = ORG_ADMIN)
    void anObjectIdIsNotShadowedByAnotherApplicationsSlugNEW78() {
        Application v = store("E1-V", ORG_ID, null, null);
        Application w = store("E1-W", foreignOrganizationId(), v.getId(), null);

        assertAnswered("E1 object id " + v.getId() + " (W=" + w.getId() + " holds it as its slug)", v.getId(), v);
    }

    /** E2. Catches: an application answered for another application's gid because it holds that gid as its slug. */
    @Test
    @WithMockUser(id = ORG_ADMIN)
    void aGidIsNotShadowedByAnotherApplicationsSlugNEW78() {
        String gid = UUID.randomUUID().toString();
        Application v2 = store("E2-V2", ORG_ID, null, gid);
        Application w2 = store("E2-W2", foreignOrganizationId(), gid, null);

        assertAnswered("E2 gid " + gid + " (W2=" + w2.getId() + " holds it as its slug)", gid, v2);
    }

    /** E3. Catches: the permission check resolving a foreign application's organization through another application's slug. */
    @Test
    @WithMockUser(id = ORG_ADMIN)
    void aSlugEqualToAForeignApplicationsIdGrantsNothingOnItNEW78() {
        Application x = store("E3-X", storedForeignOrganizationId(), null, null);
        Application y = store("E3-Y", ORG_ID, x.getId(), null);
        say("E3 X=%s (foreign) Y=%s (org01, slug = X.id)", x.getId(), y.getId());

        Throwable error = outcomeError(() -> resourcePermissionService.checkResourcePermissionWithError(ORG_ADMIN, x.getId(),
                ResourceAction.EDIT_APPLICATIONS));

        assertNotAuthorized("E3 " + ORG_ADMIN + " EDIT_APPLICATIONS on " + x.getId(), error);
    }

    /** E4. Catches: a foreign application renamed through another application's slug. */
    @Test
    @WithMockUser(id = ORG_ADMIN)
    void aSlugEqualToAForeignApplicationsIdDoesNotLetItBeRenamedNEW78() {
        Application x = store("E4-X", storedForeignOrganizationId(), null, null);
        Application y = store("E4-Y", ORG_ID, x.getId(), null);
        Application patch = Application.builder().name(RENAMED_NAME)
                .editingApplicationDSL(new HashMap<>(Map.of(DSL_KEY, new HashMap<String, Object>()))).build();
        say("E4 X=%s (foreign) Y=%s (org01, slug = X.id)", x.getId(), y.getId());

        Throwable error = outcomeError(() -> applicationApiService.update(x.getId(), patch, KEEP_STATUS));

        assertNotAuthorized("E4 update of " + x.getId(), error);
        assertThat(storedName(x)).as("E4 stored name of X").isEqualTo(NAME_PREFIX + "E4-X");
        assertThat(storedName(y)).as("E4 stored name of Y").isEqualTo(NAME_PREFIX + "E4-Y");
    }

    /** E5. Catches: a slug two applications hold answered with the first stored one. */
    @Test
    @WithMockUser(id = ORG_ADMIN)
    void aSlugTwoApplicationsShareIsRefusedNEW78() {
        String slug = freshSlug();
        Application a = store("E5-A", ORG_ID, slug, null);
        Application b = store("E5-B", foreignOrganizationId(), slug, null);
        say("E5 A=%s B=%s share slug %s", a.getId(), b.getId(), slug);

        assertCantFindApplication("E5 shared slug " + slug, slug);
    }

    /** E6. Control: a slug exactly one application holds still resolves to it. */
    @Test
    @WithMockUser(id = ORG_ADMIN)
    void aSlugOneApplicationHasStillResolvesNEW78() {
        String slug = freshSlug();
        Application a = store("E6-A", ORG_ID, slug, null);

        assertAnswered("E6 unique slug " + slug, slug, a);
    }

    /** E7. Catches: a blank key looked up as a slug, answering the application stored with that blank slug. */
    @ParameterizedTest
    @ValueSource(strings = {"", " "})
    @WithMockUser(id = ORG_ADMIN)
    void aBlankKeyIsNotLookedUpAsASlugNEW78(String blankSlug) {
        Application a = store("E7-A", ORG_ID, blankSlug, null);
        say("E7 A=%s stored with slug '%s'", a.getId(), blankSlug);

        assertCantFindApplication("E7 blank key '" + blankSlug + "'", blankSlug);
    }

    /** E8. Control: an object id no slug shadows resolves to its own application. */
    @Test
    @WithMockUser(id = ORG_ADMIN)
    void anObjectIdNoSlugShadowsResolvesToItselfNEW78() {
        Application v = store("E8-V", ORG_ID, null, null);

        assertAnswered("E8 object id " + v.getId(), v.getId(), v);
    }

    // ------------------------------------------------------------------ the converter and the routes behind it

    /** C1. Catches: the converter answering the slug owner for an application's own object id. */
    @Test
    @WithMockUser(id = ORG_ADMIN)
    void theConverterAnswersTheObjectIdNotTheSlugOwnerNEW78() {
        Application v = store("C1-V", ORG_ID, null, null);
        Application w = store("C1-W", foreignOrganizationId(), v.getId(), null);
        say("C1 V=%s W=%s (slug = V.id)", v.getId(), w.getId());

        assertConverted("C1 object id " + v.getId(), v.getId(), v.getId());
    }

    /** C2. Catches: the converter answering the slug owner for an application's own gid. */
    @Test
    @WithMockUser(id = ORG_ADMIN)
    void theConverterAnswersTheGidOwnerNotTheSlugOwnerNEW78() {
        String gid = UUID.randomUUID().toString();
        Application v2 = store("C2-V2", ORG_ID, null, gid);
        Application w2 = store("C2-W2", foreignOrganizationId(), gid, null);
        say("C2 V2=%s W2=%s (slug = gid %s)", v2.getId(), w2.getId(), gid);

        assertConverted("C2 gid " + gid, gid, v2.getId());
    }

    /** C3. Catches: the converter answering the first of two applications that share a slug. */
    @Test
    @WithMockUser(id = ORG_ADMIN)
    void theConverterRefusesASharedSlugNEW78() {
        String slug = freshSlug();
        Application a = store("C3-A", ORG_ID, slug, null);
        Application b = store("C3-B", foreignOrganizationId(), slug, null);
        say("C3 A=%s B=%s share slug %s", a.getId(), b.getId(), slug);

        Throwable error = outcomeError(() -> gidService.convertApplicationIdToObjectId(slug));

        say("C3 shared slug %s -> %s", slug, error == null ? NO_ANSWER : describe(error));
        assertCantFindApplication("C3 shared slug " + slug, error);
    }

    /** C4. Catches: the editing route refusing a user their own application because another application holds its id as a slug. */
    @Test
    @WithMockUser(id = ORG_ADMIN)
    void theEditingRouteServesTheOwnApplicationByObjectIdNEW78() {
        Application v = store("C4-V", ORG_ID, null, null);
        Application w = store("C4-W", foreignOrganizationId(), v.getId(), null);
        say("C4 V=%s W=%s (slug = V.id)", v.getId(), w.getId());

        String answered = editingRouteAnswer(v.getId());

        say("C4 editing route for %s -> %s", v.getId(), answered);
        assertThat(answered).as("C4: the application the route answers").isEqualTo(v.getId());
    }

    /** C5. Catches: a foreign application served through another application's slug equal to its id (the converter alone would admit the visitor). */
    @Test
    @WithMockUser(id = ORG_ADMIN)
    void aForeignApplicationReachedByASlugEqualToItsIdIsRefusedNEW78() {
        Application x = store("C5-X", storedForeignOrganizationId(), null, null);
        Application y = store("C5-Y", ORG_ID, x.getId(), null);
        say("C5 X=%s (foreign) Y=%s (org01, slug = X.id)", x.getId(), y.getId());

        Throwable error = outcomeError(() -> applicationController.getEditingApplication(x.getId(), WITH_DELETED_UNSET));

        say("C5 editing route for %s -> %s", x.getId(), error == null ? NO_ANSWER : describe(error));
        assertThat(error).as("C5: error").isInstanceOf(BizException.class);
        assertThat(((BizException) error).getError()).as("C5: BizError").isEqualTo(BizError.NO_PERMISSION_TO_REQUEST_APP);
    }

    /** C6. Catches: a blank key looked up as a slug, answering the id of the application stored with that blank slug. */
    @ParameterizedTest
    @ValueSource(strings = {"", " "})
    @WithMockUser(id = ORG_ADMIN)
    void aBlankApplicationKeyIsAnsweredAsGivenNEW78(String blankSlug) {
        Application a = store("C6-A", ORG_ID, blankSlug, null);
        say("C6 A=%s stored with slug '%s'", a.getId(), blankSlug);

        assertConverted("C6 blank key '" + blankSlug + "'", blankSlug, blankSlug);
    }

    /** C7. Control: a slug exactly one application holds still converts to that application's id. */
    @Test
    @WithMockUser(id = ORG_ADMIN)
    void aUniqueSlugStillConvertsNEW78() {
        String slug = freshSlug();
        Application a = store("C7-A", ORG_ID, slug, null);

        assertConverted("C7 unique slug " + slug, slug, a.getId());
    }

    /** C8. Control: an object id that names no application is answered as given. */
    @Test
    @WithMockUser(id = ORG_ADMIN)
    void anUnknownObjectIdIsAnsweredAsGivenNEW78() {
        String unknown = new ObjectId().toHexString();

        assertConverted("C8 unknown object id " + unknown, unknown, unknown);
    }

    // ------------------------------------------------------------------ helpers

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }

    private static String freshSlug() {
        return SLUG_PREFIX + UUID.randomUUID().toString().replace("-", "");
    }

    private Application store(String label, String organizationId, String slug, String gid) {
        Application application = Application.builder()
                .organizationId(organizationId)
                .name(NAME_PREFIX + label)
                .gid(gid)
                .slug(slug)
                .applicationType(APPLICATION_TYPE)
                .applicationStatus(ApplicationStatus.NORMAL)
                .editingApplicationDSL(new HashMap<>(Map.of(DSL_KEY, new HashMap<String, Object>())))
                .build();
        Application saved = mongo.save(application).block(TIMEOUT);
        assertThat(saved).as("stored %s", label).isNotNull();
        assertThat(saved.getId()).as("stored %s id", label).isNotBlank();
        storedApplicationIds.add(saved.getId());
        say("stored %s id=%s org=%s slug=%s gid=%s", label, saved.getId(), organizationId, slug, gid);
        return saved;
    }

    /** An organization id no organization document backs. */
    private static String foreignOrganizationId() {
        return new ObjectId().toHexString();
    }

    /** An organization stored ACTIVE with no member, so the permission check finds it and the visitor has no role in it. */
    private String storedForeignOrganizationId() {
        String organizationId = new ObjectId().toHexString();
        Organization organization = Organization.builder().name(FOREIGN_ORG_NAME).gid(UUID.randomUUID().toString())
                .state(OrganizationState.ACTIVE).build();
        organization.setId(organizationId);
        Organization saved = mongo.save(organization).block(TIMEOUT);
        assertThat(saved).as("stored foreign organization").isNotNull();
        storedOrganizationIds.add(organizationId);
        say("stored foreign organization %s", organizationId);
        return organizationId;
    }

    private String storedName(Application application) {
        Application read = mongo.findById(application.getId(), Application.class).block(TIMEOUT);
        assertThat(read).as("stored application %s", application.getId()).isNotNull();
        return read.getName();
    }

    private void assertAnswered(String scenario, String key, Application expected) {
        Application answer = outcome(() -> applicationService.findByIdWithoutDsl(key));
        say("%s -> %s", scenario, answer == null ? NO_ANSWER : answer.getId());
        assertThat(answer).as("%s: answer", scenario).isNotNull();
        assertThat(answer.getId()).as("%s: answered id", scenario).isEqualTo(expected.getId());
    }

    private void assertCantFindApplication(String scenario, String key) {
        Throwable error = outcomeError(() -> applicationService.findByIdWithoutDsl(key));
        say("%s -> %s", scenario, error == null ? NO_ANSWER : describe(error));
        assertCantFindApplication(scenario, error);
    }

    /** The id of the application the editing route answers, or the text of the error it ends with, so a refusal fails an assertion. */
    private String editingRouteAnswer(String key) {
        Throwable error = null;
        ResponseView<ApplicationView> view = null;
        try {
            view = applicationController.getEditingApplication(key, WITH_DELETED_UNSET).block(TIMEOUT);
        } catch (RuntimeException failure) {
            error = NestedExceptionUtils.getMostSpecificCause(failure);
        }
        if (error != null) {
            return "error " + describe(error);
        }
        return view == null ? NO_ANSWER : view.getData().getApplicationInfoView().getApplicationId();
    }

    private void assertConverted(String scenario, String key, String expectedId) {
        String answer = outcome(() -> gidService.convertApplicationIdToObjectId(key));
        say("%s -> %s", scenario, answer == null ? NO_ANSWER : answer);
        assertThat(answer).as("%s: converted id", scenario).isEqualTo(expectedId);
    }

    private static void assertCantFindApplication(String scenario, Throwable error) {
        assertThat(error).as("%s: error", scenario).isInstanceOf(BizException.class);
        BizException biz = (BizException) error;
        assertThat(biz.getError()).as("%s: BizError", scenario).isEqualTo(BizError.NO_RESOURCE_FOUND);
        assertThat(biz.getMessageKey()).as("%s: key", scenario).isEqualTo(CANT_FIND_APPLICATION_KEY);
    }

    private void assertNotAuthorized(String scenario, Throwable error) {
        say("%s -> %s", scenario, error == null ? "no error" : describe(error));
        assertThat(error).as("%s: error", scenario).isInstanceOf(BizException.class);
        BizException biz = (BizException) error;
        assertThat(biz.getError()).as("%s: BizError", scenario).isEqualTo(BizError.NOT_AUTHORIZED);
        assertThat(biz.getMessageKey()).as("%s: key", scenario).isEqualTo(NOT_AUTHORIZED_KEY);
    }

    private static <T> T outcome(Callable<Mono<T>> call) {
        try {
            return call.call().block(TIMEOUT);
        } catch (RuntimeException error) {
            throw error;
        } catch (Exception error) {
            throw new IllegalStateException(error);
        }
    }

    /** The error the call ends with (the most specific {@link BizException} cause), or null when it completes. */
    private static <T> Throwable outcomeError(Callable<Mono<T>> call) {
        try {
            call.call().block(TIMEOUT);
            return null;
        } catch (Throwable error) {
            Throwable cause = NestedExceptionUtils.getMostSpecificCause(error);
            return cause instanceof BizException ? cause : error;
        }
    }

    private static String describe(Throwable error) {
        if (error instanceof BizException biz) {
            return error.getClass().getName() + " error=" + biz.getError() + " messageKey=" + biz.getMessageKey();
        }
        return error.getClass().getName() + " message=" + error.getMessage();
    }
}
