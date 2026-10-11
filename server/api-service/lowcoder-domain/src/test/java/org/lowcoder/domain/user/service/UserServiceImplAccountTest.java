package org.lowcoder.domain.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.lowcoder.domain.user.service.UserServiceFixture.AVATAR_MAX_SIZE_KB;
import static org.lowcoder.domain.user.service.UserServiceFixture.USER_ID;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.lowcoder.domain.asset.model.Asset;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.authentication.context.FormAuthRequestContext;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserState;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.codec.multipart.Part;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Account and profile flows of {@code UserServiceImpl} (unit U10, task L3-2): profile photo, enterprise-mode
 * deletion, the bind-email race, account creation from an auth user, adding a connection, update, and the
 * deterministic candidate pick.
 */
class UserServiceImplAccountTest {

    private static final String AUTH_CONFIG_ID = "auth-config-1";
    private static final String GITHUB = "GITHUB";
    private static final String PREVIOUS_AVATAR = "asset-old";
    private static final String NEW_AVATAR = "asset-new";

    private UserServiceFixture fixture;
    private UserServiceImpl service;

    @BeforeEach
    void setUp() {
        fixture = new UserServiceFixture();
        service = fixture.service;
    }

    // ---------------------------------------------------------------- profile photo

    private void stubUpload(Part part) {
        when(fixture.assetService.upload(part, AVATAR_MAX_SIZE_KB, true))
                .thenReturn(Mono.just(Asset.builder().id(NEW_AVATAR).build()));
    }

    /**
     * Catches orphaned or wrongly ordered assets (:206-210): the previous avatar is removed first, then the user row
     * is updated with the new asset id, and the upload honours the configured size limit.
     */
    @Test
    void saveProfilePhoto_withPreviousAvatar_removesTheOldAssetThenUpdatesTheUser() {
        Part part = mock(Part.class);
        stubUpload(part);
        List<String> events = new ArrayList<>();
        when(fixture.assetService.remove(PREVIOUS_AVATAR)).thenReturn(Mono.fromRunnable(() -> events.add("remove")));
        when(fixture.mongoUpsertHelper.updateById(any(User.class), eq(USER_ID)))
                .thenReturn(Mono.fromSupplier(() -> {
                    events.add("update");
                    return true;
                }));
        User user = User.builder().id(USER_ID).avatar(PREVIOUS_AVATAR).build();

        StepVerifier.create(service.saveProfilePhoto(part, user)).expectNext(true).verifyComplete();

        assertThat(events).containsExactly("remove", "update");
        ArgumentCaptor<User> update = ArgumentCaptor.forClass(User.class);
        verify(fixture.mongoUpsertHelper).updateById(update.capture(), eq(USER_ID));
        assertThat(update.getValue().getAvatar()).isEqualTo(NEW_AVATAR);
        System.out.println("[UserServiceImplAccountTest] photo saved: old asset removed first, new asset id written");
    }

    /** Catches a remove call for an empty previous avatar (:206). */
    @ParameterizedTest
    @NullAndEmptySource
    void saveProfilePhoto_withoutPreviousAvatar_doesNotRemoveAnything(String previous) {
        Part part = mock(Part.class);
        stubUpload(part);
        when(fixture.mongoUpsertHelper.updateById(any(User.class), eq(USER_ID))).thenReturn(Mono.just(true));
        User user = User.builder().id(USER_ID).avatar(previous).build();

        StepVerifier.create(service.saveProfilePhoto(part, user)).expectNext(true).verifyComplete();
        verify(fixture.assetService, never()).remove(anyString());
        System.out.println("[UserServiceImplAccountTest] no previous avatar (" + previous + ") -> nothing removed");
    }

    /** Catches an upload failure still removing the old avatar or touching the user. */
    @Test
    void saveProfilePhoto_uploadFails_leavesAssetAndUserUntouched() {
        Part part = mock(Part.class);
        when(fixture.assetService.upload(any(Part.class), anyInt(), any(Boolean.class)))
                .thenReturn(Mono.error(new IllegalStateException("too large")));
        User user = User.builder().id(USER_ID).avatar(PREVIOUS_AVATAR).build();

        StepVerifier.create(service.saveProfilePhoto(part, user)).expectError(IllegalStateException.class).verify();
        verify(fixture.assetService, never()).remove(anyString());
        verify(fixture.mongoUpsertHelper, never()).updateById(any(User.class), anyString());
        System.out.println("[UserServiceImplAccountTest] failed upload -> old avatar kept, user not updated");
    }

    /** Catches the avatar not being cleared on the user (:374) or the asset not being removed (:376). */
    @Test
    void deleteProfilePhoto_clearsTheAvatarSavesTheUserAndRemovesTheAsset() {
        when(fixture.assetService.remove(PREVIOUS_AVATAR)).thenReturn(Mono.empty());
        User user = User.builder().id(USER_ID).avatar(PREVIOUS_AVATAR).build();

        StepVerifier.create(service.deleteProfilePhoto(user)).verifyComplete();

        assertThat(user.getAvatar()).isNull();
        verify(fixture.repository).save(user);
        verify(fixture.assetService).remove(PREVIOUS_AVATAR);
        System.out.println("[UserServiceImplAccountTest] photo deleted: avatar cleared, user saved, asset removed");
    }

    /**
     * Pins the plan section 9 candidate "deleteProfilePhoto thenReturn(null)" (UserServiceImpl:375): for a user
     * without an avatar, {@code thenReturn(userAvatar)} receives null and Reactor rejects it with a
     * NullPointerException at assembly, so the call fails instead of doing nothing. A fix changes this test on purpose.
     */
    @Test
    void deleteProfilePhoto_userWithoutAvatar_throwsNullPointerException() {
        User user = User.builder().id(USER_ID).build();

        assertThatThrownBy(() -> service.deleteProfilePhoto(user)).isInstanceOf(NullPointerException.class);
        verify(fixture.assetService, never()).remove(any());
        System.out.println("[UserServiceImplAccountTest] pins the section 9 candidate: no avatar -> NPE");
    }

    // ---------------------------------------------------------------- enterprise-mode deletion

    /** Catches SaaS users being deleted through the enterprise path (:549). */
    @Test
    void markUserDeletedAtEnterpriseMode_saasMode_doesNothing() {
        fixture.commonConfig.getWorkspace().setMode(WorkspaceMode.SAAS);

        StepVerifier.create(service.markUserDeletedAndInvalidConnectionsAtEnterpriseMode(USER_ID))
                .expectNext(false)
                .verifyComplete();
        verify(fixture.repository, never()).findById(anyString());
        verify(fixture.mongoUpsertHelper, never()).updateById(any(User.class), anyString());
        System.out.println("[UserServiceImplAccountTest] SaaS mode -> false, user untouched");
    }

    /** Catches an enterprise delete that keeps the connections blocked or the user enabled (:554). */
    @Test
    void markUserDeletedAtEnterpriseMode_marksDeletedAndSuffixesTheConnectionSources() {
        fixture.commonConfig.getWorkspace().setMode(WorkspaceMode.ENTERPRISE);
        Connection connection = Connection.builder().authId("a").source(GITHUB).rawId("raw").build();
        User user = User.builder().id(USER_ID).connections(Set.of(connection)).build();
        when(fixture.repository.findById(USER_ID)).thenReturn(Mono.just(user));
        when(fixture.mongoUpsertHelper.updateById(user, USER_ID)).thenReturn(Mono.just(true));

        StepVerifier.create(service.markUserDeletedAndInvalidConnectionsAtEnterpriseMode(USER_ID))
                .expectNext(true)
                .verifyComplete();

        assertThat(user.getState()).isEqualTo(UserState.DELETED);
        assertThat(user.getIsEnabled()).isFalse();
        assertThat(connection.getSource()).startsWith(GITHUB + "(User deleted at ");
        verify(fixture.mongoUpsertHelper).updateById(user, USER_ID);
        System.out.println("[UserServiceImplAccountTest] enterprise delete: DELETED, disabled, source " + connection.getSource());
    }

    // ---------------------------------------------------------------- bindEmail race

    private User userWithoutEmailProbeHits(String typed, String normalized) {
        when(fixture.repository.findByConnections_SourceAndConnections_RawId(AuthSourceConstants.EMAIL, typed)).thenReturn(Mono.empty());
        when(fixture.repository.findByConnections_SourceAndConnections_RawId(AuthSourceConstants.EMAIL, normalized)).thenReturn(Mono.empty());
        return User.builder().id(USER_ID).build();
    }

    /** Catches a 500 on a concurrent bind (:342): a duplicate key between probe and save becomes ALREADY_BIND. */
    @Test
    void bindEmail_duplicateKeyOnSave_becomesAlreadyBind() {
        User user = userWithoutEmailProbeHits("New@Example.COM", "new@example.com");
        when(fixture.repository.save(any(User.class))).thenReturn(Mono.error(new DuplicateKeyException("index collision")));

        StepVerifier.create(service.bindEmail(user, "New@Example.COM"))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(BizException.class);
                    BizException biz = (BizException) error;
                    assertThat(biz.getError()).isEqualTo(BizError.ALREADY_BIND);
                    assertThat(biz.getArgs()).containsExactly("new@example.com", "");
                })
                .verify();
        System.out.println("[UserServiceImplAccountTest] duplicate key on bind -> ALREADY_BIND with the normalized address");
    }

    /** Catches other save errors being swallowed or rewritten (:345). */
    @Test
    void bindEmail_otherSaveError_isPropagatedUnchanged() {
        User user = userWithoutEmailProbeHits("new@example.com", "new@example.com");
        IllegalStateException failure = new IllegalStateException("mongo down");
        when(fixture.repository.save(any(User.class))).thenReturn(Mono.error(failure));

        StepVerifier.create(service.bindEmail(user, "new@example.com"))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(failure))
                .verify();
        System.out.println("[UserServiceImplAccountTest] other save error propagated unchanged");
    }

    // ---------------------------------------------------------------- createNewUserByAuthUser

    private static AbstractAuthConfig authConfig(String source) {
        AbstractAuthConfig config = mock(AbstractAuthConfig.class);
        when(config.getSource()).thenReturn(source);
        when(config.getId()).thenReturn(AUTH_CONFIG_ID);
        return config;
    }

    private static AuthUser formAuthUser(String source, String email, String password) {
        FormAuthRequestContext context = new FormAuthRequestContext("login-id", password, true, null);
        context.setAuthConfig(authConfig(source));
        return AuthUser.builder().uid("uid-1").username("jane").email(email).authContext(context).build();
    }

    private static AuthUser ssoAuthUser(String email) {
        AuthRequestContext context = new AuthRequestContext() { };
        context.setAuthConfig(authConfig(GITHUB));
        return AuthUser.builder().uid("sso-uid").username("jane-gh").email(email).authContext(context).build();
    }

    /**
     * Catches a missing password hash for a form registration, an un-normalized address, and a wrong initial state
     * (:243-265).
     */
    @Test
    void createNewUser_formEmailRegistration_hashesPasswordAndNormalizesAddress() {
        StepVerifier.create(service.createNewUserByAuthUser(formAuthUser(AuthSourceConstants.EMAIL, "Jane@Example.COM", "s3cret"), false))
                .assertNext(created -> {
                    assertThat(created.getEmail()).isEqualTo("jane@example.com");
                    assertThat(created.getState()).isEqualTo(UserState.ACTIVATED);
                    assertThat(created.getIsEnabled()).isTrue();
                    assertThat(created.getSuperAdmin()).isFalse();
                    assertThat(created.getIsNewUser()).isTrue();
                    assertThat(created.getActiveAuthId()).isEqualTo(AUTH_CONFIG_ID);
                    assertThat(created.getConnections()).hasSize(1);
                    assertThat(fixture.encryptionService.matchPassword("s3cret", created.getPassword())).isTrue();
                })
                .verifyComplete();
        verify(fixture.repository, never()).findBySuperAdminIsTrue();
        System.out.println("[UserServiceImplAccountTest] form registration: hashed password, normalized e-mail, ACTIVATED");
    }

    /** Catches an SSO or non-email form user getting a password (:254-255), and a null e-mail turning into "" (:248). */
    @Test
    void createNewUser_ssoOrNonEmailSource_hasNoPassword_andNullEmailStaysNull() {
        StepVerifier.create(service.createNewUserByAuthUser(ssoAuthUser(null), false))
                .assertNext(created -> {
                    assertThat(created.getPassword()).isNull();
                    assertThat(created.getEmail()).isNull();
                })
                .verifyComplete();

        StepVerifier.create(service.createNewUserByAuthUser(formAuthUser(GITHUB, "jane@example.com", "ignored"), false))
                .assertNext(created -> assertThat(created.getPassword()).as("form context but not the EMAIL source").isNull())
                .verifyComplete();
        System.out.println("[UserServiceImplAccountTest] SSO / non-email source -> no password, null e-mail preserved");
    }

    /** Catches a second super admin row (:266-269): an existing super admin is updated instead of inserting. */
    @Test
    void createNewUser_superAdmin_updatesTheExistingSuperAdminInsteadOfInserting() {
        User existing = User.builder().id("sa-1").superAdmin(true).build();
        when(fixture.repository.findBySuperAdminIsTrue()).thenReturn(Mono.just(existing));
        when(fixture.mongoUpsertHelper.updateById(any(User.class), eq("sa-1"))).thenReturn(Mono.just(true));
        when(fixture.repository.findById("sa-1")).thenReturn(Mono.just(existing));
        // count subscriptions: the production code assembles create(newUser) eagerly in switchIfEmpty, which only
        // calls save(), it does not subscribe, so an insert is a subscribed save
        List<User> inserted = new ArrayList<>();
        when(fixture.repository.save(any(User.class))).thenAnswer(invocation -> Mono.fromSupplier(() -> {
            inserted.add(invocation.getArgument(0));
            return invocation.<User>getArgument(0);
        }));

        StepVerifier.create(service.createNewUserByAuthUser(formAuthUser(AuthSourceConstants.EMAIL, "root@example.com", "pw"), true))
                .expectNext(existing)
                .verifyComplete();

        verify(fixture.mongoUpsertHelper).updateById(any(User.class), eq("sa-1"));
        assertThat(inserted).as("no second super admin row inserted").isEmpty();
        System.out.println("[UserServiceImplAccountTest] super admin exists -> updated in place, no insert");
    }

    /** Catches the first super admin not being created when none exists (:269). */
    @Test
    void createNewUser_superAdmin_noneExisting_createsIt() {
        when(fixture.repository.findBySuperAdminIsTrue()).thenReturn(Mono.empty());

        StepVerifier.create(service.createNewUserByAuthUser(formAuthUser(AuthSourceConstants.EMAIL, "root@example.com", "pw"), true))
                .assertNext(created -> assertThat(created.getSuperAdmin()).isTrue())
                .verifyComplete();
        verify(fixture.repository).save(any(User.class));
        System.out.println("[UserServiceImplAccountTest] no super admin yet -> created");
    }

    // ---------------------------------------------------------------- addNewConnectionAndReturnUser

    /** Catches an empty e-mail not being filled (:355), the active connection not switching (:356), a missing password. */
    @Test
    void addNewConnection_formEmail_appendsConnectionFillsEmailSwitchesActiveAndSetsPassword() {
        User user = User.builder().id(USER_ID).activeAuthId("old-auth").build();
        when(fixture.repository.findById(USER_ID)).thenReturn(Mono.just(user));

        StepVerifier.create(service.addNewConnectionAndReturnUser(USER_ID,
                        formAuthUser(AuthSourceConstants.EMAIL, "Jane@Example.COM", "s3cret")))
                .assertNext(saved -> {
                    assertThat(saved.getConnections()).hasSize(1);
                    assertThat(saved.getEmail()).isEqualTo("jane@example.com");
                    assertThat(saved.getActiveAuthId()).isEqualTo(AUTH_CONFIG_ID);
                    assertThat(fixture.encryptionService.matchPassword("s3cret", saved.getPassword())).isTrue();
                })
                .verifyComplete();
        System.out.println("[UserServiceImplAccountTest] connection added, e-mail filled, active auth switched, password set");
    }

    /** Catches an existing e-mail being overwritten and an SSO connection setting a password. */
    @Test
    void addNewConnection_sso_keepsExistingEmailAndSetsNoPassword() {
        User user = User.builder().id(USER_ID).email("kept@example.com").activeAuthId("old-auth").build();
        when(fixture.repository.findById(USER_ID)).thenReturn(Mono.just(user));

        StepVerifier.create(service.addNewConnectionAndReturnUser(USER_ID, ssoAuthUser("other@example.com")))
                .assertNext(saved -> {
                    assertThat(saved.getEmail()).isEqualTo("kept@example.com");
                    assertThat(saved.getPassword()).isNull();
                    assertThat(saved.getConnections()).hasSize(1);
                })
                .verifyComplete();
        System.out.println("[UserServiceImplAccountTest] SSO connection added, e-mail kept, no password");
    }

    /** Catches a form login of a non-EMAIL source setting a password on an existing account (:358). */
    @Test
    void addNewConnection_formContextOfANonEmailSource_setsNoPassword() {
        User user = User.builder().id(USER_ID).email("kept@example.com").build();
        when(fixture.repository.findById(USER_ID)).thenReturn(Mono.just(user));

        StepVerifier.create(service.addNewConnectionAndReturnUser(USER_ID, formAuthUser(GITHUB, "kept@example.com", "ignored")))
                .assertNext(saved -> assertThat(saved.getPassword()).isNull())
                .verifyComplete();
        System.out.println("[UserServiceImplAccountTest] form context but not the EMAIL source -> no password set");
    }

    // ---------------------------------------------------------------- update / findById / pick

    /** Catches an update of a missing user reporting success (:224). */
    @Test
    void update_userNotFound_failsWithNoUserFound() {
        when(fixture.mongoUpsertHelper.updateById(any(User.class), eq("missing"))).thenReturn(Mono.just(false));

        StepVerifier.create(service.update("missing", User.builder().name("x").build()))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(BizException.class);
                    assertThat(((BizException) error).getError()).isEqualTo(BizError.NO_RESOURCE_FOUND);
                    assertThat(((BizException) error).getMessageKey()).isEqualTo("NO_USER_FOUND");
                })
                .verify();
        verify(fixture.repository, never()).findById(anyString());
        System.out.println("[UserServiceImplAccountTest] update of a missing user -> NO_USER_FOUND");
    }

    /** Catches a null id reaching the repository (:93). */
    @Test
    void findById_nullId_failsWithInvalidParameter() {
        StepVerifier.create(service.findById(null))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(BizException.class);
                    assertThat(((BizException) error).getError()).isEqualTo(BizError.INVALID_PARAMETER);
                })
                .verify();
        verify(fixture.repository, never()).findById(anyString());
        System.out.println("[UserServiceImplAccountTest] findById(null) -> INVALID_PARAMETER, repository untouched");
    }

    /** Catches a password reset aimed at a random one of two matching accounts (:191-197). */
    @Test
    void pickDeterministically_ownEmailBeatsConnectionMatch_thenSmallestId() {
        String value = "jane@example.com";
        User viaConnectionOnly = User.builder().id("a-first").email("other@example.com").build();
        User ownLarger = User.builder().id("z-last").email(value).build();
        User ownSmaller = User.builder().id("m-middle").email(value).build();

        assertThat(UserServiceImpl.pickDeterministically(List.of(viaConnectionOnly, ownLarger, ownSmaller), value))
                .as("own e-mail wins over a connection match, then the smallest id").isSameAs(ownSmaller);
        assertThat(UserServiceImpl.pickDeterministically(List.of(ownLarger, viaConnectionOnly), value)).isSameAs(ownLarger);
        assertThat(UserServiceImpl.pickDeterministically(List.of(), value)).isNull();
        System.out.println("[UserServiceImplAccountTest] pick: own e-mail first, then smallest id, none -> null");
    }
}
