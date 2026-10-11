package org.lowcoder.api.usermanagement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.BizError.ALREADY_BIND;
import static org.lowcoder.sdk.exception.BizError.INVALID_EMAIL_FORMAT;
import static org.lowcoder.sdk.exception.BizError.NOT_AUTHORIZED;

import java.util.HashSet;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.api.usermanagement.UserEndpoints.CreateUserRequest;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import lombok.extern.slf4j.Slf4j;

/**
 * Cover for the two address writers that {@link org.lowcoder.api.authentication.EmailNormalizationTest} does
 * not reach: SCIM provisioning ({@link UserController#createSCIMUserAndAddToOrg}) and
 * {@link UserService#bindEmail}, which attaches an address to an account that signed in via SSO.
 *
 * <p>Both wrote whatever they were handed. {@code bindEmail} takes a bare {@code @RequestParam} and wrote it
 * to {@code user.email} <b>and</b> to a connection {@code rawId} that the form login then resolves against --
 * so an unvalidated value there is not just untidy data, it is a login identifier.
 *
 * <p>Fixtures come from {@code InitData}: {@code user01} is an ADMIN of {@code org01} and {@code user02} is
 * an ordinary member, which is what the authorization-ordering test needs.
 */
@SpringBootTest
@ActiveProfiles("emailSanitization")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Slf4j
public class EmailSanitizationEndpointsTest {

    private static final String ORG_ID = WithMockUser.DEFAULT_CURRENT_ORG_ID;
    private static final String NON_ADMIN_USER_ID = "user02";
    private static final String PASSWORD = "lowcoder";

    @Autowired
    private UserController userController;
    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private InitData initData;

    @BeforeAll
    public void beforeAll() {
        initData.init();
    }

    private BizException expectFailure(Mono<?> mono, String what) {
        try {
            mono.block();
        } catch (BizException e) {
            return e;
        }
        throw new AssertionError("expected " + what + " to fail, but it succeeded");
    }

    private User findByEmail(String email) {
        return userRepository.findByEmailOrConnections_Email(email, email).next().block();
    }

    // ------------------------------------------------------- SCIM provisioning

    /**
     * A SCIM client that sends a mixed-case address must produce one canonical row, or the next SSO login --
     * which resolves by email -- provisions a second account for the same person.
     */
    @Test
    @WithMockUser
    public void scimProvisioningStoresTheAddressInCanonicalForm() {
        String typed = "SCIM.User@Example.COM";
        String canonical = "scim.user@example.com";

        userController.createSCIMUserAndAddToOrg(ORG_ID, new CreateUserRequest(typed, PASSWORD)).block();

        User user = findByEmail(canonical);
        log.info("SCIM-provisioned [{}] -> id={} name={} email={}", typed,
                user == null ? null : user.getId(),
                user == null ? null : user.getName(),
                user == null ? null : user.getEmail());

        assertNotNull(user, "the provisioned account must be reachable by the canonical address");
        assertEquals(canonical, user.getEmail(), "user.email must be stored canonical");
        // This endpoint has no display name to work with, so it uses the address for both fields. Both must
        // therefore be canonical -- unlike form registration, where name is what the user typed.
        assertEquals(canonical, user.getName(), "SCIM uses the address as the name, so it too is canonical");

        assertNull(findByEmail(typed), "nothing may remain stored under the typed casing");
    }

    /**
     * An empty address used to create a row whose {@code email} is {@code ""}. Nothing can ever resolve it:
     * {@code findByEmailDeep} short-circuits on an empty value, so the next SCIM call for the same person
     * creates yet another row.
     */
    @ParameterizedTest(name = "SCIM rejects [{0}]")
    @ValueSource(strings = { "", "   ", "notanemail", "@example.com", "user@", "a@b@c.com", "Iron Man" })
    @WithMockUser
    public void scimProvisioningRejectsValuesThatAreNotAddresses(String notAnAddress) {
        BizException exception = expectFailure(
                userController.createSCIMUserAndAddToOrg(ORG_ID, new CreateUserRequest(notAnAddress, PASSWORD)),
                "SCIM provisioning of [" + notAnAddress + "]");
        log.info("SCIM provisioning of [{}] rejected with {} / {}", notAnAddress, exception.getError(),
                exception.getMessageKey());

        assertEquals(INVALID_EMAIL_FORMAT, exception.getError());
        assertEquals("INVALID_EMAIL_FORMAT", exception.getMessageKey());
        assertNull(findByEmail(notAnAddress), "nothing may have been stored for [" + notAnAddress + "]");
    }

    /**
     * Authorization is checked before the payload is. A non-admin must get {@code NOT_AUTHORIZED} whatever
     * they send, so that the error they see cannot be used to distinguish a malformed payload from a
     * well-formed one.
     */
    @Test
    @WithMockUser(id = NON_ADMIN_USER_ID)
    public void scimProvisioningRejectsANonAdminBeforeLookingAtThePayload() {
        BizException exception = expectFailure(
                userController.createSCIMUserAndAddToOrg(ORG_ID, new CreateUserRequest("", PASSWORD)),
                "SCIM provisioning by a non-admin");
        log.info("SCIM provisioning by non-admin {} rejected with {} / {}", NON_ADMIN_USER_ID,
                exception.getError(), exception.getMessageKey());

        assertEquals(NOT_AUTHORIZED, exception.getError(),
                "a non-admin must be turned away by the role check, not by the shape check");
    }

    // -------------------------------------------------------------- bindEmail

    /**
     * Binding an address to an existing account writes it in three places at once -- {@code user.email}, the
     * new connection's {@code rawId} and its {@code email}. All three must be canonical, because
     * {@code rawId} is what the form login matches on.
     */
    @Test
    public void bindEmailStoresTheAddressInCanonicalForm() {
        String typed = "  Bound.User@Example.COM ";
        String canonical = "bound.user@example.com";

        User user = userRepository.save(User.builder()
                        .name("sso-only-user")
                        .isEnabled(true)
                        .connections(new HashSet<>())
                        .build())
                .block();
        assertNotNull(user);

        StepVerifier.create(userService.bindEmail(user, typed))
                .expectNext(true)
                .verifyComplete();

        User bound = userRepository.findById(user.getId()).block();
        assertNotNull(bound);
        log.info("bindEmail([{}]) -> email={} connections={}", typed, bound.getEmail(),
                bound.getConnections().stream()
                        .map(c -> c.getSource() + ":" + c.getRawId() + " (email=" + c.getEmail() + ")")
                        .toList());

        assertEquals(canonical, bound.getEmail(), "user.email must be stored canonical");

        Connection connection = bound.getConnections().stream()
                .filter(c -> AuthSourceConstants.EMAIL.equals(c.getSource()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("bindEmail did not add an EMAIL connection"));
        assertEquals(canonical, connection.getRawId(),
                "connection.rawId is a login identifier and must be stored canonical");
        assertEquals(canonical, connection.getEmail(), "connection.email must be stored canonical");
        assertEquals(canonical, connection.getName(), "connection.name must be stored canonical");

        assertTrue(userService.findBySourceAndId(AuthSourceConstants.EMAIL, "BOUND.USER@example.com")
                        .hasElement().block(),
                "the bound address must now resolve however it is typed");
    }

    /**
     * The regression that normalizing on its own would introduce. The unique index on
     * {@code (connections.source, connections.rawId)} is what used to stop two accounts holding one
     * address -- but it is byte-exact, so once the bind writes {@code legacy@example.com} where the
     * existing account holds {@code Legacy@Example.COM}, the keys differ and the index waves it through.
     * Both accounts would then be reachable by the same address in different casings.
     */
    @Test
    public void bindEmailRejectsAnAddressAnotherAccountAlreadyHoldsInADifferentCase() {
        String legacy = "Taken.Legacy@Example.COM";

        User owner = userRepository.save(User.builder()
                        .name(legacy)
                        .email(legacy)
                        .isEnabled(true)
                        .connections(newConnectionSet(legacy))
                        .build())
                .block();
        assertNotNull(owner);

        User binder = userRepository.save(User.builder()
                        .name("sso-only-binder")
                        .isEnabled(true)
                        .connections(new HashSet<>())
                        .build())
                .block();
        assertNotNull(binder);

        BizException exception = expectFailure(userService.bindEmail(binder, legacy),
                "binding an address another account already holds");
        log.info("bindEmail([{}]) by {} rejected with {} / {} (already held by {})", legacy, binder.getId(),
                exception.getError(), exception.getMessageKey(), owner.getId());

        assertEquals(ALREADY_BIND, exception.getError());

        User unchanged = userRepository.findById(binder.getId()).block();
        assertNotNull(unchanged);
        assertNull(unchanged.getEmail(), "the rejected bind must not have written an address");
        assertTrue(unchanged.getConnections().isEmpty(), "the rejected bind must not have added a connection");
    }

    /**
     * Re-binding an address the account already holds must not append a second EMAIL connection differing
     * from the first only in case -- that is precisely the state this change exists to prevent.
     */
    @Test
    public void bindEmailIsIdempotentForAnAddressThisAccountAlreadyHolds() {
        String legacy = "Own.Legacy@Example.COM";

        User user = userRepository.save(User.builder()
                        .name(legacy)
                        .email(legacy)
                        .isEnabled(true)
                        .connections(newConnectionSet(legacy))
                        .build())
                .block();
        assertNotNull(user);

        StepVerifier.create(userService.bindEmail(user, legacy))
                .expectNext(true)
                .verifyComplete();

        User after = userRepository.findById(user.getId()).block();
        assertNotNull(after);
        log.info("re-bind of [{}] -> email={} connections={}", legacy, after.getEmail(),
                after.getConnections().stream().map(c -> c.getSource() + ":" + c.getRawId()).toList());

        assertEquals(1, after.getConnections().size(),
                "re-binding must not append a second EMAIL connection");
        assertEquals(legacy, after.getConnections().iterator().next().getRawId(),
                "re-binding must leave the stored value alone; only changeset 032 converges it");
    }

    /**
     * The residual hole, pinned deliberately so it is not mistaken for a guarantee the probe gives.
     *
     * <p>The ownership probe reaches an owner stored under the typed casing and an owner stored
     * canonically. It cannot reach one stored in a <i>third</i> casing, because that needs a
     * case-insensitive query and MongoDB will not serve one from the byte-exact
     * {@code (connections.source, connections.rawId)} index.
     *
     * <p>This is <b>unchanged from before normalization was added</b>: the index is byte-exact, so
     * {@code legacy@example.com} and {@code Legacy@Example.COM} were always two distinct keys and this
     * bind always succeeded.
     *
     * <p>The backfill migration now ships, and this still holds -- it describes the <i>probe</i>, not the
     * stored data. Once changeset {@code 032} has converged the owner, the bind is rejected; that is
     * covered by {@code EmailBackfillEndToEndTest#bindEmailFindsALegacyMixedCaseOwnerAfterTheBackfill}.
     * What remains is the row the backfill deliberately leaves alone -- a member of a reported conflict
     * group -- which this test keeps pinned. It seeds its own row under a profile whose migration has
     * already run against an empty collection, so nothing converges it.
     */
    @Test
    public void bindEmailStillMissesALegacyMixedCaseOwnerFromLowercaseInput() {
        String storedByOwner = "Missed.Legacy@Example.COM";
        String typedByBinder = "missed.legacy@example.com";

        User owner = userRepository.save(User.builder()
                        .name(storedByOwner)
                        .email(storedByOwner)
                        .isEnabled(true)
                        .connections(newConnectionSet(storedByOwner))
                        .build())
                .block();
        assertNotNull(owner);

        User binder = userRepository.save(User.builder()
                        .name("sso-only-binder-lowercase")
                        .isEnabled(true)
                        .connections(new HashSet<>())
                        .build())
                .block();
        assertNotNull(binder);

        StepVerifier.create(userService.bindEmail(binder, typedByBinder))
                .expectNext(true)
                .verifyComplete();

        User bound = userRepository.findById(binder.getId()).block();
        assertNotNull(bound);
        log.info("documented gap: [{}] bound to {} even though {} holds [{}]", typedByBinder,
                bound.getId(), owner.getId(), storedByOwner);

        assertEquals(typedByBinder, bound.getEmail(),
                "documents the gap: the probe cannot see a third casing, so the bind goes through");
    }

    private static HashSet<Connection> newConnectionSet(String address) {
        HashSet<Connection> connections = new HashSet<>();
        connections.add(Connection.builder()
                .source(AuthSourceConstants.EMAIL)
                .name(address)
                .rawId(address)
                .email(address)
                .build());
        return connections;
    }

    /**
     * The endpoint behind this takes a bare {@code @RequestParam} and validated nothing, so these values
     * really could be written as a login identifier.
     */
    @ParameterizedTest(name = "bindEmail rejects [{0}]")
    @ValueSource(strings = { "", "   ", "notanemail", "@example.com", "user@", "a@b@c.com", "Iron Man" })
    public void bindEmailRejectsValuesThatAreNotAddresses(String notAnAddress) {
        User user = userRepository.save(User.builder()
                        .name("bind-reject-" + notAnAddress.hashCode())
                        .isEnabled(true)
                        .connections(new HashSet<>())
                        .build())
                .block();
        assertNotNull(user);

        BizException exception = expectFailure(userService.bindEmail(user, notAnAddress),
                "bindEmail([" + notAnAddress + "])");
        log.info("bindEmail([{}]) rejected with {} / {}", notAnAddress, exception.getError(),
                exception.getMessageKey());

        assertEquals(INVALID_EMAIL_FORMAT, exception.getError());
        assertEquals("INVALID_EMAIL_FORMAT", exception.getMessageKey());

        User unchanged = userRepository.findById(user.getId()).block();
        assertNotNull(unchanged);
        assertNull(unchanged.getEmail(), "a rejected bind must not have written an address");
        assertTrue(unchanged.getConnections().isEmpty(),
                "a rejected bind must not have added a connection");
    }
}
