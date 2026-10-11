package org.lowcoder.runner.migrations.job;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lowcoder.api.authentication.service.AuthenticationApiServiceImpl;
import org.lowcoder.domain.authentication.context.FormAuthRequestContext;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.config.CommonConfig;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Hooks;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit K3 (task L2-12, lane L5): {@code AddSuperAdminUserImpl}, the job behind changeset 020 ({@code add-super-admin-user},
 * {@code DatabaseChangelog.java:216-218}): it builds the super admin's login from the server config (a default name, a configured
 * or generated password), creates or updates the user, registers a new one, sets the password, marks the user as super admin and
 * adds it to every organization as admin. Mockito only.
 *
 * <p>Limits: the services are mocks that answer at once unless a test says otherwise; nothing is persisted.
 */
@ExtendWith(MockitoExtension.class)
public class MigrationJobAddSuperAdminTest {

    static final String TAG = "[MigrationJobAddSuperAdminTest] ";
    static final String USER_ID = "super-1";
    static final String DEFAULT_NAME = "admin@lowcoder.org";
    static final String CONFIGURED_NAME = "root@corp.example.com";
    static final String CONFIGURED_PASSWORD = "Configured-Pass-1";

    @Mock
    private AuthenticationApiServiceImpl authenticationApiService;
    @Mock
    private CommonConfig commonConfig;
    @Mock
    private UserService userService;
    @Mock
    private OrgMemberService orgMemberService;
    @InjectMocks
    private AddSuperAdminUserImpl job;

    private CommonConfig.SuperAdmin superAdmin(String name, String password) {
        CommonConfig.SuperAdmin superAdmin = new CommonConfig.SuperAdmin();
        superAdmin.setUserName(name);
        superAdmin.setPassword(password);
        when(commonConfig.getSuperAdmin()).thenReturn(superAdmin);
        return superAdmin;
    }

    private static User user(boolean isNew) {
        User user = User.builder().isNewUser(isNew).build();
        ReflectionTestUtils.setField(user, "id", USER_ID);
        return user;
    }

    /** All collaborators answer at once and complete. */
    private void everythingSucceeds(boolean isNew) {
        when(authenticationApiService.updateOrCreateUser(any(AuthUser.class), anyBoolean(), anyBoolean())).thenReturn(Mono.just(user(isNew)));
        if (isNew) {
            when(authenticationApiService.onUserRegister(any(User.class), anyBoolean())).thenReturn(Mono.empty());
        }
        when(userService.setPassword(anyString(), anyString())).thenReturn(Mono.just(true));
        when(userService.markAsSuperAdmin(anyString())).thenReturn(Mono.just(true));
        when(orgMemberService.addToAllOrgAsAdminIfNot(anyString())).thenReturn(Mono.empty());
    }

    private AuthUser capturedAuthUser() {
        ArgumentCaptor<AuthUser> captor = ArgumentCaptor.forClass(AuthUser.class);
        verify(authenticationApiService).updateOrCreateUser(captor.capture(), eq(false), eq(true));
        return captor.getValue();
    }

    /** Every collaborator of the job is the mock (a constructor or field mismatch would leave one null and fail here). */
    @Test
    public void injectionReachedEveryField() {
        assertSame(authenticationApiService, ReflectionTestUtils.getField(job, "authenticationApiService"));
        assertSame(commonConfig, ReflectionTestUtils.getField(job, "commonConfig"));
        assertSame(userService, ReflectionTestUtils.getField(job, "userService"));
        assertSame(orgMemberService, ReflectionTestUtils.getField(job, "orgMemberService"));
    }

    @Test
    public void configuredNameAndPasswordAreUsedAndTheStepsRunInOrderForANewUser() {
        superAdmin(CONFIGURED_NAME, CONFIGURED_PASSWORD);
        everythingSucceeds(true);

        job.addOrUpdateSuperAdmin();

        AuthUser authUser = capturedAuthUser();
        assertEquals(CONFIGURED_NAME, authUser.getUid());
        assertEquals(CONFIGURED_NAME, authUser.getUsername());
        assertEquals(CONFIGURED_NAME, authUser.getEmail());
        FormAuthRequestContext context = assertInstanceOf(FormAuthRequestContext.class, authUser.getAuthContext());
        assertEquals(CONFIGURED_PASSWORD, context.getPassword());
        assertEquals(CONFIGURED_NAME, context.getLoginId());
        assertNotNull(context.getAuthConfig());
        InOrder order = Mockito.inOrder(authenticationApiService, userService, orgMemberService);
        order.verify(authenticationApiService).updateOrCreateUser(any(AuthUser.class), eq(false), eq(true));
        order.verify(authenticationApiService).onUserRegister(any(User.class), eq(true));
        order.verify(userService).setPassword(USER_ID, CONFIGURED_PASSWORD);
        order.verify(userService).markAsSuperAdmin(USER_ID);
        order.verify(orgMemberService).addToAllOrgAsAdminIfNot(USER_ID);
    }

    @Test
    public void anExistingUserIsNotRegisteredAgainButTheOtherStepsStillRun() {
        superAdmin(CONFIGURED_NAME, CONFIGURED_PASSWORD);
        everythingSucceeds(false);
        job.addOrUpdateSuperAdmin();
        verify(authenticationApiService, never()).onUserRegister(any(User.class), anyBoolean());
        verify(userService).setPassword(USER_ID, CONFIGURED_PASSWORD);
        verify(userService).markAsSuperAdmin(USER_ID);
        verify(orgMemberService).addToAllOrgAsAdminIfNot(USER_ID);
    }

    @Test
    public void aBlankOrMissingNameFallsBackToTheDefault() {
        for (String blank : new String[] {null, "", "   "}) {
            Mockito.reset(authenticationApiService, userService, orgMemberService, commonConfig);
            superAdmin(blank, CONFIGURED_PASSWORD);
            everythingSucceeds(false);
            job.addOrUpdateSuperAdmin();
            AuthUser authUser = capturedAuthUser();
            assertEquals(DEFAULT_NAME, authUser.getUsername(), "name [" + blank + "]");
            assertEquals(DEFAULT_NAME, authUser.getEmail());
        }
    }

    @Test
    public void aBlankPasswordIsReplacedByAGeneratedOneThatDiffersEachTime() {
        List<String> passwords = new ArrayList<>();
        for (String blank : new String[] {null, "  "}) {
            Mockito.reset(authenticationApiService, userService, orgMemberService, commonConfig);
            superAdmin(CONFIGURED_NAME, blank);
            everythingSucceeds(false);
            job.addOrUpdateSuperAdmin();
            String fromContext = ((FormAuthRequestContext) capturedAuthUser().getAuthContext()).getPassword();
            ArgumentCaptor<String> sent = ArgumentCaptor.forClass(String.class);
            verify(userService).setPassword(eq(USER_ID), sent.capture());
            System.out.println(TAG + "generated password length " + fromContext.length());
            assertEquals(fromContext, sent.getValue(), "the password set is the one in the login context");
            assertTrue(fromContext.length() >= 8, "length " + fromContext.length());
            assertFalse(fromContext.isBlank());
            passwords.add(fromContext);
        }
        assertNotEquals(passwords.get(0), passwords.get(1));
    }

    /**
     * Pins the plan section 9 row "super-admin migration (changeset 020) runs fire-and-forget via subscribe(): a failure is lost and
     * the changeset is recorded as done". The job ends its pipeline with {@code .subscribe()}
     * ({@code AddSuperAdminUserImpl.java:51}) and the changeset ({@code DatabaseChangelog.java:216-218}) returns as soon as the job
     * does, so Mongock records the changeset as executed while the later steps may still be pending, and an error in a step never
     * reaches the caller. Two assertions: a step that is still pending when the job returns (the later steps have not run yet), and
     * a step that fails (the job returns normally, the later steps never run, the error goes to Reactor's dropped-error hook).
     * A fix (returning or blocking on the pipeline) changes both on purpose.
     */
    @Test
    public void theJobReturnsWhileAStepIsPendingAndAFailureNeverReachesTheCaller_pinsTheSection9Row() {
        superAdmin(CONFIGURED_NAME, CONFIGURED_PASSWORD);
        when(authenticationApiService.updateOrCreateUser(any(AuthUser.class), anyBoolean(), anyBoolean())).thenReturn(Mono.just(user(false)));
        when(userService.setPassword(anyString(), anyString())).thenReturn(Mono.just(true));
        Sinks.One<Boolean> pending = Sinks.one();
        when(userService.markAsSuperAdmin(USER_ID)).thenReturn(pending.asMono());
        Mockito.lenient().when(orgMemberService.addToAllOrgAsAdminIfNot(USER_ID)).thenReturn(Mono.empty()); // never reached today

        job.addOrUpdateSuperAdmin();

        System.out.println(TAG + "the job has returned; the marking step is still pending");
        verify(userService).markAsSuperAdmin(USER_ID);
        verify(orgMemberService, never()).addToAllOrgAsAdminIfNot(anyString());
        AtomicReference<Throwable> dropped = new AtomicReference<>();
        Hooks.onErrorDropped(dropped::set);
        try {
            pending.tryEmitError(new IllegalStateException("marking failed"));
            System.out.println(TAG + "the step failed after the job returned: dropped error " + dropped.get());
            assertNotNull(dropped.get(), "the error went to Reactor's dropped-error hook, not to the caller");
            assertEquals("marking failed", dropped.get().getCause() == null ? dropped.get().getMessage() : dropped.get().getCause().getMessage());
            verify(orgMemberService, never()).addToAllOrgAsAdminIfNot(anyString());
        } finally {
            Hooks.resetOnErrorDropped();
        }
    }

    @Test
    public void aStepThatFailsAtOnceDoesNotMakeTheJobThrow() {
        superAdmin(CONFIGURED_NAME, CONFIGURED_PASSWORD);
        when(authenticationApiService.updateOrCreateUser(any(AuthUser.class), anyBoolean(), anyBoolean())).thenReturn(Mono.just(user(false)));
        when(userService.setPassword(anyString(), anyString())).thenReturn(Mono.error(new IllegalStateException("password failed")));
        AtomicReference<Throwable> dropped = new AtomicReference<>();
        Hooks.onErrorDropped(dropped::set);
        try {
            job.addOrUpdateSuperAdmin();
            System.out.println(TAG + "failing step, the job returned normally; dropped error " + dropped.get());
            assertNotNull(dropped.get());
        } finally {
            Hooks.resetOnErrorDropped();
        }
        verify(userService, never()).markAsSuperAdmin(anyString());
        verify(orgMemberService, never()).addToAllOrgAsAdminIfNot(anyString());
    }
}
