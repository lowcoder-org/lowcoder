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
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
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
 * permission check and the real {@link ApplicationApiService#update} over the test database, with no HTTP layer and no
 * security filter chain. An application's object id or gid is answered by that application, never by another application
 * whose slug happens to equal the key; only a key that names nothing that way is answered by the one application holding it
 * as a slug, and a slug several applications hold is refused.
 *
 * <p>Every case stores its own applications with fresh slugs and gids (the init data resets nothing) and removes them
 * afterwards. E3 and E4 store a foreign organization, ACTIVE with no member; E1, E2 and E5 only name a foreign organization id that is
 * not stored, as the lookup does not read the organization; E6-E8 use the seeded {@code org01}.
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

    @Autowired
    private ApplicationService applicationService;
    @Autowired
    private ApplicationApiService applicationApiService;
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
