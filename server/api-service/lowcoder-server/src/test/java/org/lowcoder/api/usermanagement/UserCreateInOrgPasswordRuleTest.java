package org.lowcoder.api.usermanagement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.lowcoder.sdk.exception.BizError.NOT_AUTHORIZED;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.api.usermanagement.UserEndpoints.CreateUserRequest;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import lombok.extern.slf4j.Slf4j;

/**
 * Real-stack, real-MongoDB cover for the client's password rule (D-48) at an admin's create-user route
 * ({@code POST /api/users/new/{orgId}} -> {@link UserController#createUserAndAddToOrg}), which the mocked
 * {@code UserEndpointsContractTest} cannot exercise because it mocks {@code AuthenticationApiService} --
 * the rule lives in {@link org.lowcoder.api.authentication.request.form.FormAuthRequest}, one layer below
 * that mock.
 */
@SpringBootTest
@ActiveProfiles("createUserPasswordRule")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Slf4j
public class UserCreateInOrgPasswordRuleTest {

    private static final String ORG_ID = WithMockUser.DEFAULT_CURRENT_ORG_ID;
    private static final String NON_ADMIN_USER_ID = "user02";
    private static final String WEAK_PASSWORD = "a";
    private static final String ACCEPTABLE_PASSWORD = "lowcoder1";

    @Autowired
    private UserController userController;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EncryptionService encryptionService;
    @Autowired
    private InitData initData;

    @BeforeAll
    public void beforeAll() {
        initData.init();
    }

    private User findByEmail(String email) {
        return userRepository.findByEmailOrConnections_Email(email, email).next().block();
    }

    private BizException expectFailure(String email, String password, String what) {
        try {
            userController.createUserAndAddToOrg(ORG_ID, new CreateUserRequest(email, password)).block();
        } catch (BizException e) {
            return e;
        }
        throw new AssertionError("expected " + what + " to fail, but it succeeded");
    }

    @Test
    @WithMockUser
    void createUserAndAddToOrg_weakPassword_failsPasswordTooWeakAndStoresNothing() {
        String address = "pwrule.weak@example.com";

        BizException exception = expectFailure(address, WEAK_PASSWORD, "admin create-user with a weak password");
        log.info("[UserCreateInOrgPasswordRuleTest] weak password create -> {} / {}", exception.getError(), exception.getMessageKey());

        assertEquals(org.lowcoder.sdk.exception.BizError.INVALID_PASSWORD, exception.getError());
        assertEquals("PASSWORD_TOO_WEAK", exception.getMessageKey());
        assertNull(findByEmail(address), "nothing may be stored for a refused password");
    }

    @Test
    @WithMockUser
    void createUserAndAddToOrg_acceptablePassword_createsAndStoresTheHash() {
        String address = "pwrule.ok@example.com";

        userController.createUserAndAddToOrg(ORG_ID, new CreateUserRequest(address, ACCEPTABLE_PASSWORD)).block();

        User stored = findByEmail(address);
        assertNotNull(stored, "an acceptable password must create and store the account");
        assertTrue(encryptionService.matchPassword(ACCEPTABLE_PASSWORD, stored.getPassword()),
                "the stored hash must match the password that was set");
        log.info("[UserCreateInOrgPasswordRuleTest] acceptable password create -> id={}", stored.getId());
    }

    @Test
    @WithMockUser(id = NON_ADMIN_USER_ID)
    void createUserAndAddToOrg_nonAdminWithAWeakPassword_failsNotAuthorizedBeforeTheRuleRuns() {
        String address = "pwrule.nonadmin@example.com";

        BizException exception = expectFailure(address, WEAK_PASSWORD, "admin create-user by a non-admin");
        log.info("[UserCreateInOrgPasswordRuleTest] non-admin create -> {}", exception.getError());

        assertEquals(NOT_AUTHORIZED, exception.getError(),
                "a non-admin must be turned away by the role check, not by the password rule");
        assertNull(findByEmail(address), "nothing may be stored when the caller is not authorized");
    }
}
