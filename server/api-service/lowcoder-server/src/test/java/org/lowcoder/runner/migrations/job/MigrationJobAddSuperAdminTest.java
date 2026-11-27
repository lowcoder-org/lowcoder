package org.lowcoder.runner.migrations.job;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lowcoder.api.authentication.service.AuthenticationApiServiceImpl;
import org.lowcoder.domain.authentication.context.FormAuthRequestContext;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.runner.init.AddSuperAdminRunner;
import org.lowcoder.runner.migrations.DatabaseChangelog;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Hooks;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

import java.util.ArrayList;
import java.util.List;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit K3 (task L2-12, lane L5): {@code AddSuperAdminUserImpl}, the job behind changeset 020 ({@code add-super-admin-user},
 * {@code DatabaseChangelog.java:221-224}): it builds the super admin's login from the server config (a default name, a configured
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
    static final String MARKING_FAILED = "marking failed";
    static final String PASSWORD_FAILED = "password failed";
    /** The hash of a password the account already has, and the hash {@code matchPassword} accepts for a password the start stored. */
    static final String STORED_HASH = "$2a$10$stored";
    static final String GENERATED_HASH = "$2a$10$generated";
    static final String JOB_LOGGER = "AddSuperAdminUserImpl";
    static final int MIN_GENERATED_LENGTH = 8;
    static final Duration WAIT = Duration.ofSeconds(10);
    static final long POLL_MS = 10;

    @Mock
    private AuthenticationApiServiceImpl authenticationApiService;
    @Mock
    private CommonConfig commonConfig;
    @Mock
    private UserService userService;
    @Mock
    private OrgMemberService orgMemberService;
    @Mock
    private EncryptionService encryptionService;
    @InjectMocks
    private AddSuperAdminUserImpl job;

    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();

    @BeforeEach
    void captureLog() {
        logs.start();
        ((Logger) LoggerFactory.getLogger(JOB_LOGGER)).addAppender(logs);
    }

    @AfterEach
    void releaseLog() {
        ((Logger) LoggerFactory.getLogger(JOB_LOGGER)).detachAppender(logs);
        logs.stop();
    }

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

    /** The account as the job finds it: with the hash of the password it stores, or none. */
    private static User user(boolean isNew, String storedHash) {
        User user = user(isNew);
        ReflectionTestUtils.setField(user, "password", storedHash);
        return user;
    }

    /** No password is configured, {@code existing} is what the login step answers; the steps after the password succeed. */
    private void noPasswordConfigured(User existing) {
        superAdmin(CONFIGURED_NAME, null);
        when(authenticationApiService.updateOrCreateUser(any(AuthUser.class), anyBoolean(), anyBoolean())).thenReturn(Mono.just(existing));
        lenient().when(authenticationApiService.onUserRegister(any(User.class), anyBoolean())).thenReturn(Mono.empty());
        lenient().when(userService.setPassword(anyString(), anyString())).thenReturn(Mono.just(true));
        lenient().when(userService.markAsSuperAdmin(anyString())).thenReturn(Mono.just(true));
        lenient().when(orgMemberService.addToAllOrgAsAdminIfNot(anyString())).thenReturn(Mono.empty());
    }

    private static BizException passwordAlreadySet() {
        return new BizException(BizError.INVALID_PASSWORD, UserService.PASSWORD_ALREADY_SET);
    }

    private String passwordOfTheLoginContext() {
        return ((FormAuthRequestContext) capturedAuthUser().getAuthContext()).getPassword();
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
        assertSame(encryptionService, ReflectionTestUtils.getField(job, "encryptionService"));
    }

    @Test
    public void configuredNameAndPasswordAreUsedAndTheStepsRunInOrderForANewUser() {
        superAdmin(CONFIGURED_NAME, CONFIGURED_PASSWORD);
        everythingSucceeds(true);

        job.addOrUpdateSuperAdmin().block();

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
        job.addOrUpdateSuperAdmin().block();
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
            job.addOrUpdateSuperAdmin().block();
            AuthUser authUser = capturedAuthUser();
            assertEquals(DEFAULT_NAME, authUser.getUsername(), "name [" + blank + "]");
            assertEquals(DEFAULT_NAME, authUser.getEmail());
        }
    }

    /** Without a configured password, a password the account already has is kept: it is not replaced at every start. */
    @Test
    public void anExistingAccountWithAPasswordKeepsItWhenNoneIsConfigured() {
        noPasswordConfigured(user(false, STORED_HASH));
        lenient().when(encryptionService.matchPassword(anyString(), eq(STORED_HASH))).thenReturn(false);
        lenient().when(userService.setPasswordIfAbsent(eq(USER_ID), anyString())).thenReturn(Mono.error(passwordAlreadySet()));

        job.addOrUpdateSuperAdmin().block(WAIT);

        verify(userService, never()).setPassword(anyString(), anyString());
        verify(userService).markAsSuperAdmin(USER_ID);
        verify(orgMemberService).addToAllOrgAsAdminIfNot(USER_ID);
        System.out.println(TAG + "stored password kept, the later steps ran");
    }

    @Test
    public void anExistingAccountWithoutAPasswordGetsTheGeneratedOneWhenNoneIsConfigured() {
        noPasswordConfigured(user(false, null));
        ArgumentCaptor<String> stored = ArgumentCaptor.forClass(String.class);
        lenient().when(userService.setPasswordIfAbsent(eq(USER_ID), stored.capture())).thenReturn(Mono.just(true));

        job.addOrUpdateSuperAdmin().block(WAIT);

        assertEquals(passwordOfTheLoginContext(), stored.getValue(), "the password stored is the one of the login context");
        verify(userService, never()).setPassword(anyString(), anyString());
        verify(encryptionService, never()).matchPassword(anyString(), anyString());
    }

    /** A start that created or renamed the account with the generated password has stored it already: no second write. */
    @Test
    public void aNewOrRenamedAccountThatStoredTheGeneratedPasswordIsNotWrittenAgain() {
        for (boolean isNew : new boolean[] {true, false}) {
            Mockito.reset(authenticationApiService, userService, orgMemberService, commonConfig, encryptionService);
            noPasswordConfigured(user(isNew, GENERATED_HASH));
            lenient().when(encryptionService.matchPassword(anyString(), eq(GENERATED_HASH))).thenReturn(true);

            job.addOrUpdateSuperAdmin().block(WAIT);

            verify(userService, never()).setPassword(anyString(), anyString());
            verify(userService, never()).setPasswordIfAbsent(anyString(), anyString());
            System.out.println(TAG + "isNew " + isNew + ": the stored generated password is not written again");
        }
    }

    /** The constant the job tests the refusal against is the key the implementation refuses with (pinned in the Mongo test as well). */
    @Test
    public void theRefusalKeyIsTheOneTheImplementationWrites() {
        assertEquals("PASSWORD_ALREADY_SET", UserService.PASSWORD_ALREADY_SET);
    }

    @Test
    public void aFailureOtherThanAnExistingPasswordFailsTheJob() {
        noPasswordConfigured(user(false, null));
        lenient().when(userService.setPasswordIfAbsent(eq(USER_ID), anyString()))
                .thenReturn(Mono.error(new BizException(BizError.USER_NOT_EXIST, "USER_NOT_EXIST")));

        BizException failure = assertThrows(BizException.class, () -> job.addOrUpdateSuperAdmin().block(WAIT));

        assertEquals(BizError.USER_NOT_EXIST, failure.getError());
        verify(userService, never()).markAsSuperAdmin(anyString());
    }

    @Test
    public void aKeptPasswordIsNeverLogged() {
        noPasswordConfigured(user(false, STORED_HASH));
        lenient().when(encryptionService.matchPassword(anyString(), eq(STORED_HASH))).thenReturn(false);
        lenient().when(userService.setPasswordIfAbsent(eq(USER_ID), anyString())).thenReturn(Mono.error(passwordAlreadySet()));

        job.addOrUpdateSuperAdmin().block(WAIT);

        String generated = passwordOfTheLoginContext();
        logs.list.forEach(event -> System.out.println(TAG + event.getLevel() + " " + event.getMessage().replace("\n", "<LF>")));
        assertTrue(logs.list.stream().noneMatch(event -> event.getFormattedMessage().contains(generated)), "no log line holds the password");
        assertEquals(1, logs.list.stream().filter(event -> AddSuperAdminUserImpl.PASSWORD_KEPT_LOG.equals(event.getMessage())).count());
    }

    @Test
    public void aGeneratedPasswordDiffersEachTimeItIsStored() {
        List<String> passwords = new ArrayList<>();
        for (String blank : new String[] {null, "  "}) {
            Mockito.reset(authenticationApiService, userService, orgMemberService, commonConfig, encryptionService);
            noPasswordConfigured(user(false, null));
            superAdmin(CONFIGURED_NAME, blank);
            ArgumentCaptor<String> stored = ArgumentCaptor.forClass(String.class);
            lenient().when(userService.setPasswordIfAbsent(eq(USER_ID), stored.capture())).thenReturn(Mono.just(true));

            job.addOrUpdateSuperAdmin().block(WAIT);

            String password = stored.getValue();
            System.out.println(TAG + "generated password length " + password.length());
            assertEquals(passwordOfTheLoginContext(), password, "the password stored is the one of the login context");
            assertTrue(password.length() >= MIN_GENERATED_LENGTH, "length " + password.length());
            assertFalse(password.isBlank());
            passwords.add(password);
        }
        assertNotEquals(passwords.get(0), passwords.get(1));
    }

    /** Guard, not red on the old code: the line that tells the operator the generated password stays, once, at the start that stored it. */
    @Test
    public void aStoredGeneratedPasswordIsLoggedOnce() {
        noPasswordConfigured(user(false, null));
        lenient().when(userService.setPasswordIfAbsent(eq(USER_ID), anyString())).thenReturn(Mono.just(true));

        job.addOrUpdateSuperAdmin().block(WAIT);

        String generated = passwordOfTheLoginContext();
        List<ILoggingEvent> lines = logs.list.stream().filter(event -> AddSuperAdminUserImpl.GENERATED_PASSWORD_LOG.equals(event.getMessage())).toList();
        System.out.println(TAG + "generated-password log lines: " + lines.size());
        assertEquals(1, lines.size());
        assertTrue(lines.get(0).getFormattedMessage().contains(generated));
    }

    /** The marking step answers through {@code marking}; every other step succeeds at once. */
    private void markingAnswersThrough(Sinks.One<Boolean> marking) {
        superAdmin(CONFIGURED_NAME, CONFIGURED_PASSWORD);
        when(authenticationApiService.updateOrCreateUser(any(AuthUser.class), anyBoolean(), anyBoolean())).thenReturn(Mono.just(user(false)));
        when(userService.setPassword(anyString(), anyString())).thenReturn(Mono.just(true));
        when(userService.markAsSuperAdmin(USER_ID)).thenReturn(marking.asMono());
        Mockito.lenient().when(orgMemberService.addToAllOrgAsAdminIfNot(USER_ID)).thenReturn(Mono.empty());
    }

    /**
     * Runs changeset 020 with the job on another thread, because the changeset waits for the job; returns when the marking
     * step has been subscribed, that is, while the changeset is waiting for it.
     */
    private CompletableFuture<Void> runChangesetWhileMarkingIsPending(Sinks.One<Boolean> marking) throws InterruptedException {
        markingAnswersThrough(marking);
        CompletableFuture<Void> run = CompletableFuture.runAsync(() -> new DatabaseChangelog().addSuperAdminUser(job));
        awaitSubscribed(marking);
        return run;
    }

    private static void awaitSubscribed(Sinks.One<Boolean> marking) throws InterruptedException {
        long deadline = System.nanoTime() + WAIT.toNanos();
        while (marking.currentSubscriberCount() == 0) {
            assertTrue(System.nanoTime() < deadline, "the marking step was never subscribed");
            Thread.sleep(POLL_MS);
        }
    }

    /**
     * BF-037 fixed (part 1): the job ended its pipeline with {@code subscribe()}, so changeset 020
     * ({@code DatabaseChangelog.addSuperAdminUser}) returned while a step was still pending and was recorded as applied.
     * Now the changeset returns only after the last step has run.
     */
    @Test
    public void theChangesetReturnsOnlyAfterThePendingStepAndTheLaterStepsBF037() throws Exception {
        Sinks.One<Boolean> marking = Sinks.one();
        CompletableFuture<Void> run = runChangesetWhileMarkingIsPending(marking);

        System.out.println(TAG + "marking pending: changeset returned " + run.isDone());
        assertFalse(run.isDone(), "the changeset waits for the pending step");
        verify(orgMemberService, never()).addToAllOrgAsAdminIfNot(anyString());

        marking.tryEmitValue(true);
        run.get(WAIT.toMillis(), TimeUnit.MILLISECONDS);
        verify(orgMemberService).addToAllOrgAsAdminIfNot(USER_ID);
    }

    /**
     * BF-037 fixed (part 2): a step that failed after the changeset had returned went to Reactor's dropped-error hook and the
     * later steps never ran. Now the changeset fails with it, so the migration runner records it as FAILED, not EXECUTED; nothing is dropped.
     */
    @Test
    public void aStepThatFailsWhilePendingFailsTheChangesetAndStopsTheLaterStepsBF037() throws Exception {
        AtomicReference<Throwable> dropped = new AtomicReference<>();
        Hooks.onErrorDropped(dropped::set);
        try {
            Sinks.One<Boolean> marking = Sinks.one();
            CompletableFuture<Void> run = runChangesetWhileMarkingIsPending(marking);

            marking.tryEmitError(new IllegalStateException(MARKING_FAILED));

            ExecutionException failure = assertThrows(ExecutionException.class, () -> run.get(WAIT.toMillis(), TimeUnit.MILLISECONDS));
            System.out.println(TAG + "pending step failed: the changeset threw " + failure.getCause() + ", dropped " + dropped.get());
            assertInstanceOf(IllegalStateException.class, failure.getCause());
            assertEquals(MARKING_FAILED, failure.getCause().getMessage());
            assertNull(dropped.get(), "the error reached the caller, nothing was dropped");
            verify(orgMemberService, never()).addToAllOrgAsAdminIfNot(anyString());
        } finally {
            Hooks.resetOnErrorDropped();
        }
    }

    /** BF-037 fixed: a step that fails at once makes the changeset throw, and the later steps do not run. */
    @Test
    public void aStepThatFailsAtOnceMakesTheChangesetThrowBF037() {
        superAdmin(CONFIGURED_NAME, CONFIGURED_PASSWORD);
        when(authenticationApiService.updateOrCreateUser(any(AuthUser.class), anyBoolean(), anyBoolean())).thenReturn(Mono.just(user(false)));
        when(userService.setPassword(anyString(), anyString())).thenReturn(Mono.error(new IllegalStateException(PASSWORD_FAILED)));

        IllegalStateException thrown = assertThrows(IllegalStateException.class, () -> new DatabaseChangelog().addSuperAdminUser(job));

        System.out.println(TAG + "failing step at once: the changeset threw " + thrown);
        assertEquals(PASSWORD_FAILED, thrown.getMessage());
        verify(userService, never()).markAsSuperAdmin(anyString());
        verify(orgMemberService, never()).addToAllOrgAsAdminIfNot(anyString());
    }

    /**
     * {@code AddSuperAdminRunner} keeps its behaviour (BF-037 concerns changeset 020): it starts the job at every start and
     * returns without waiting for it; the job's steps go on and complete after it has returned.
     */
    @Test
    public void theStartupRunnerStartsTheJobWithoutWaitingForIt() throws Exception {
        Sinks.One<Boolean> marking = Sinks.one();
        markingAnswersThrough(marking);

        new AddSuperAdminRunner(job).addSuperAdmin();

        awaitSubscribed(marking);
        System.out.println(TAG + "runner returned while the marking step is pending");
        verify(orgMemberService, never()).addToAllOrgAsAdminIfNot(anyString());
        marking.tryEmitValue(true);
        verify(orgMemberService, Mockito.timeout(WAIT.toMillis())).addToAllOrgAsAdminIfNot(USER_ID);
    }
}
