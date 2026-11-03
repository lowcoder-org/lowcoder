package org.lowcoder.api.usermanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.api.common.mockuser.WithMockUser.DEFAULT_CURRENT_ORG_ID;
import static org.lowcoder.api.common.mockuser.WithMockUser.DEFAULT_CURRENT_USER_ID;

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
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.OrganizationState;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.ActiveProfiles;

import reactor.test.StepVerifier;

/**
 * NEW-102: {@code GET /api/organizations/{orgId}} through the real {@link OrganizationController} bean (the real key
 * conversion over the test database, the real {@link OrgApiService}), with no HTTP layer and no security filter chain.
 * A member of an organization reads it, whatever the role; the instance's super admin (the stored user's
 * {@code superAdmin} flag) reads it only with {@code withDeleted=true}; everyone else gets NOT_AUTHORIZED.
 *
 * <p>The organizations are stored directly (no memberships, no groups), so the super admin user is not a member of
 * them and R9-R11 test the super admin rule, not the member rule. The super admin user and the memberships exist only
 * while one case runs (the shared test database: a stored super admin would become a member of every organization
 * created meanwhile, see {@code ConfigEndpointsIntegrationTest}); the stored organizations are removed after each case.
 *
 * <p>Not covered: the production security filter chain and the HTTP routing (this class calls the controller bean), and
 * that the controller's conversion and the membership check are not one atomic step.
 */
@SpringBootTest
@ActiveProfiles("test")
class OrganizationReadMembershipIntegrationTest {

    private static final String LOG_PREFIX = "[OrganizationReadMembershipIntegrationTest] ";

    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final String SUPER_ADMIN_USER_ID = "org-read-it-super-admin";
    private static final String FORMER_MEMBER_USER_ID = "org-read-it-former-member";
    private static final String STORED_ORG_NAME = "org-read-it-org";
    private static final String STORED_ORG_SLUG_PREFIX = "org-read-it-slug-";
    /** The gid of the seed organization {@code org01} (a hyphen: the converter reads it as a gid). */
    private static final String SEED_ORG_GID = "019053a4-c5c8-7621-8740-e3a43e1e85d1";
    private static final String BLANK_KEY = " ";
    private static final String NOT_AUTHORIZED_KEY = "NOT_AUTHORIZED";
    private static final String ORGANIZATION_NOT_FOUND_KEY = "ORGANIZATION_NOT_FOUND";
    /** {@code withDeleted} as the controller receives it: absent (null) or {@code true}. */
    private static final Boolean WITHOUT_WITH_DELETED = null;
    private static final Boolean WITH_DELETED = Boolean.TRUE;

    @Autowired
    private OrganizationController organizationController;
    @Autowired
    private OrgMemberService orgMemberService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ReactiveMongoTemplate mongo;
    @Autowired
    private InitData initData;

    /** The ids of the organizations this case stored (recorded before the save, so that a save that reached the database is removed too). */
    private final List<String> storedOrgIds = new ArrayList<>();
    /** The organizations this case made {@code user01} a member of. */
    private final List<String> memberOfOrgIds = new ArrayList<>();
    private boolean superAdminStored;

    @BeforeEach
    void seed() {
        initData.init();
        storedOrgIds.clear();
        memberOfOrgIds.clear();
        superAdminStored = false;
    }

    /**
     * Removes what the case stored, each step on its own: a failing step does not stop the next, and the failures after the
     * first are attached to it as suppressed (JUnit attaches this method's failure to the case's own).
     */
    @AfterEach
    void removeWhatTheCaseStored() {
        RuntimeException failure = null;
        for (String orgId : memberOfOrgIds) {
            failure = run(failure, () -> {
                Boolean removed = orgMemberService.removeMember(orgId, DEFAULT_CURRENT_USER_ID).block(TIMEOUT);
                say("removed the membership of %s in %s: %s", DEFAULT_CURRENT_USER_ID, orgId, removed);
                assertThat(removed).as("membership removed").isTrue();
            });
        }
        if (superAdminStored) {
            failure = run(failure, () -> {
                userRepository.deleteById(SUPER_ADMIN_USER_ID).block(TIMEOUT);
                say("removed the stored super admin %s", SUPER_ADMIN_USER_ID);
            });
        }
        if (!storedOrgIds.isEmpty()) {
            failure = run(failure, () -> {
                long removed = mongo.remove(Query.query(Criteria.where(FieldName.ID).in(storedOrgIds)), Organization.class)
                        .block(TIMEOUT).getDeletedCount();
                say("removed %d of the %d org(s) the case stored", removed, storedOrgIds.size());
                assertThat(removed).as("organizations removed").isEqualTo(storedOrgIds.size());
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

    // ------------------------------------------------------------------ fixtures

    private static void say(String format, Object... args) {
        System.out.println(LOG_PREFIX + String.format(format, args));
    }

    /** An organization stored without memberships or groups; its id is a fresh object id (no hyphen). */
    private String storeOrganization(OrganizationState state, String slug) {
        String orgId = new ObjectId().toHexString();
        storedOrgIds.add(orgId);
        Organization organization = Organization.builder().name(STORED_ORG_NAME).gid(UUID.randomUUID().toString()).slug(slug).state(state).build();
        organization.setId(orgId);
        mongo.save(organization).block(TIMEOUT);
        say("stored org %s, state %s, slug %s", orgId, state, slug);
        return orgId;
    }

    /** The instance's super admin: a stored user with the flag true. It is not a member of any stored organization. */
    private void storeSuperAdmin() {
        User superAdmin = new User();
        superAdmin.setId(SUPER_ADMIN_USER_ID);
        superAdmin.setName(SUPER_ADMIN_USER_ID);
        superAdmin.setSuperAdmin(true);
        superAdminStored = true;
        userRepository.save(superAdmin).block(TIMEOUT);
        say("stored the super admin %s", SUPER_ADMIN_USER_ID);
    }

    private void addMemberUser01(String orgId, MemberRole role) {
        memberOfOrgIds.add(orgId);
        Boolean added = orgMemberService.addMember(orgId, DEFAULT_CURRENT_USER_ID, role).block(TIMEOUT);
        say("added %s to %s as %s: %s", DEFAULT_CURRENT_USER_ID, orgId, role, added);
        assertThat(added).as("membership added").isTrue();
    }

    /** {@code user01}'s stored flag is not TRUE: a polluted shared database fails here, not as a wrong refusal. */
    private void assertUser01IsNoInstanceSuperAdmin() {
        User stored = userRepository.findById(DEFAULT_CURRENT_USER_ID).block(TIMEOUT);
        assertThat(stored).as("the stored %s", DEFAULT_CURRENT_USER_ID).isNotNull();
        assertThat(stored.getSuperAdmin()).as("the stored %s's superAdmin flag (the shared database must not make it the super admin)",
                DEFAULT_CURRENT_USER_ID).isNotEqualTo(Boolean.TRUE);
    }

    private void assertAnswers(String key, Boolean withDeleted, String expectedOrgId) {
        StepVerifier.create(organizationController.getOrganization(key, withDeleted))
                .assertNext(view -> {
                    say("getOrganization(key [%s], withDeleted %s) -> org %s", key, withDeleted, view.getData().getId());
                    assertThat(view.getData().getId()).isEqualTo(expectedOrgId);
                })
                .expectComplete().verify(TIMEOUT);
    }

    private void assertRefused(String key, Boolean withDeleted, BizError expected, String messageKey) {
        StepVerifier.create(organizationController.getOrganization(key, withDeleted))
                .expectErrorSatisfies(error -> {
                    say("getOrganization(key [%s], withDeleted %s) -> error %s", key, withDeleted, error);
                    assertThat(error).isInstanceOf(BizException.class);
                    assertThat(((BizException) error).getError()).isEqualTo(expected);
                    assertThat(((BizException) error).getMessageKey()).isEqualTo(messageKey);
                })
                .verify(TIMEOUT);
    }

    // ------------------------------------------------------------------ a non-member

    /** NEW-102: any signed-in user read any organization; a non-member of an active one is refused. */
    @Test
    @WithMockUser
    void aNonMemberIsRefusedAnActiveOrganizationNEW102() {
        String orgId = storeOrganization(OrganizationState.ACTIVE, null);
        assertRefused(orgId, WITHOUT_WITH_DELETED, BizError.NOT_AUTHORIZED, NOT_AUTHORIZED_KEY);
    }

    /** NEW-102: a non-member who is not the instance's super admin is refused a deleted organization, with withDeleted too. */
    @Test
    @WithMockUser
    void aNonMemberIsRefusedADeletedOrganizationNEW102() {
        assertUser01IsNoInstanceSuperAdmin();
        String orgId = storeOrganization(OrganizationState.DELETED, null);
        assertRefused(orgId, WITH_DELETED, BizError.NOT_AUTHORIZED, NOT_AUTHORIZED_KEY);
    }

    /**
     * NEW-102: a key without a hyphen that names no organization: the converter answers the key itself, and the refusal comes
     * before the read, which would have answered UNABLE_TO_FIND_VALID_ORG.
     */
    @Test
    @WithMockUser
    void aNonMemberIsRefusedForAnUnknownKeyWithoutAHyphenNEW102() {
        String unknownKey = new ObjectId().toHexString();
        assertRefused(unknownKey, WITHOUT_WITH_DELETED, BizError.NOT_AUTHORIZED, NOT_AUTHORIZED_KEY);
    }

    /**
     * NEW-102: a blank key: the converter answers it as given (no query), and the membership lookup for that source id
     * answers empty, so the refusal comes before the read, which refuses a blank key with UNABLE_TO_FIND_VALID_ORG.
     */
    @Test
    @WithMockUser
    void aNonMemberIsRefusedForABlankKeyNEW102() {
        assertRefused(BLANK_KEY, WITHOUT_WITH_DELETED, BizError.NOT_AUTHORIZED, NOT_AUTHORIZED_KEY);
    }

    /**
     * NEW-112 as it stands (green before and after the fix): a key with a hyphen that names no organization's slug or gid is
     * ORGANIZATION_NOT_FOUND, from the converter's empty answer, before the membership check.
     */
    @Test
    @WithMockUser
    void anUnknownKeyWithAHyphenIsNotFoundBeforeTheCheckNEW112() {
        String unknownKey = UUID.randomUUID().toString();
        assertRefused(unknownKey, WITHOUT_WITH_DELETED, BizError.ORGANIZATION_NOT_FOUND, ORGANIZATION_NOT_FOUND_KEY);
    }

    // ------------------------------------------------------------------ a member

    /** A control: a member reads its organization by id. */
    @Test
    @WithMockUser
    void aMemberReadsItsOwnOrganizationNEW102() {
        assertAnswers(DEFAULT_CURRENT_ORG_ID, WITHOUT_WITH_DELETED, DEFAULT_CURRENT_ORG_ID);
    }

    /** A control: the converter turns the gid into the object id before the membership check. */
    @Test
    @WithMockUser
    void aMemberReadsItsOrganizationByGidNEW102() {
        assertAnswers(SEED_ORG_GID, WITHOUT_WITH_DELETED, DEFAULT_CURRENT_ORG_ID);
    }

    /** A control: the converter's slug lookup comes first; the slug is unique per run. */
    @Test
    @WithMockUser
    void aMemberReadsItsOrganizationBySlugNEW102() {
        String slug = STORED_ORG_SLUG_PREFIX + UUID.randomUUID();
        String orgId = storeOrganization(OrganizationState.ACTIVE, slug);
        addMemberUser01(orgId, MemberRole.MEMBER);
        assertAnswers(slug, WITHOUT_WITH_DELETED, orgId);
    }

    // ------------------------------------------------------------------ the instance super admin

    /** A control: the instance's super admin, not a member, reads a deleted organization with withDeleted. */
    @Test
    @WithMockUser(id = SUPER_ADMIN_USER_ID)
    void theInstanceSuperAdminReadsADeletedOrganizationWithDeletedNEW102() {
        storeSuperAdmin();
        String orgId = storeOrganization(OrganizationState.DELETED, null);
        assertAnswers(orgId, WITH_DELETED, orgId);
    }

    /** NEW-102: the instance's super admin, not a member, is refused without withDeleted. */
    @Test
    @WithMockUser(id = SUPER_ADMIN_USER_ID)
    void theInstanceSuperAdminIsRefusedWithoutWithDeletedNEW102() {
        storeSuperAdmin();
        String orgId = storeOrganization(OrganizationState.ACTIVE, null);
        assertRefused(orgId, WITHOUT_WITH_DELETED, BizError.NOT_AUTHORIZED, NOT_AUTHORIZED_KEY);
    }

    /** A control: the exception holds for an active organization too, with withDeleted. */
    @Test
    @WithMockUser(id = SUPER_ADMIN_USER_ID)
    void theInstanceSuperAdminReadsAnActiveOrganizationWithDeletedNEW102() {
        storeSuperAdmin();
        String orgId = storeOrganization(OrganizationState.ACTIVE, null);
        assertAnswers(orgId, WITH_DELETED, orgId);
    }

    // ------------------------------------------------------------------ a deleted organization's kept membership

    /**
     * Pins a named limit, not a wanted behaviour (green before and after the fix): the deletion cleanup's first step,
     * {@code orgMemberService.deleteOrgMembers}, keeps every membership with the organization role SUPER_ADMIN, so its
     * holder keeps reading the deleted organization with withDeleted after the cleanup. The cleanup's step is called here
     * directly and waited for, not through the asynchronous listener.
     */
    @Test
    @WithMockUser
    void aFormerOrganizationSuperAdminStillReadsItsDeletedOrganizationAfterCleanupNEW102() {
        String orgId = storeOrganization(OrganizationState.DELETED, null);
        addMemberUser01(orgId, MemberRole.SUPER_ADMIN);
        assertThat(orgMemberService.addMember(orgId, FORMER_MEMBER_USER_ID, MemberRole.MEMBER).block(TIMEOUT))
                .as("the ordinary member added").isTrue();

        Boolean cleaned;
        try {
            cleaned = orgMemberService.deleteOrgMembers(orgId).block(TIMEOUT);
            say("deleteOrgMembers(%s) -> %s", orgId, cleaned);
            assertThat(cleaned).as("the cleanup step ran").isTrue();
            assertThat(orgMemberService.getOrgMember(orgId, FORMER_MEMBER_USER_ID).block(TIMEOUT))
                    .as("the ordinary member's row the cleanup removes (so the cleanup was not a no-op)").isNull();
        } finally {
            orgMemberService.removeMember(orgId, FORMER_MEMBER_USER_ID).block(TIMEOUT);
        }

        assertThat(orgMemberService.getOrgMember(orgId, DEFAULT_CURRENT_USER_ID).block(TIMEOUT))
                .as("the SUPER_ADMIN row the cleanup keeps").isNotNull()
                .extracting(member -> member.getRole()).isEqualTo(MemberRole.SUPER_ADMIN);
        assertUser01IsNoInstanceSuperAdmin();

        assertAnswers(orgId, WITH_DELETED, orgId);
    }
}
