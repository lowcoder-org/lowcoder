package org.lowcoder.runner.migrations.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.authentication.service.AuthenticationApiServiceImpl;
import org.lowcoder.api.util.RandomPasswordGeneratorConfig;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.authentication.context.FormAuthRequestContext;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

import static org.lowcoder.domain.authentication.AuthenticationService.DEFAULT_AUTH_CONFIG;

@RequiredArgsConstructor
@Component
@Slf4j(topic = "AddSuperAdminUserImpl")
public class AddSuperAdminUserImpl implements AddSuperAdminUser {

    private final AuthenticationApiServiceImpl authenticationApiService;
    private final CommonConfig commonConfig;
    private final UserService userService;
    private final OrgMemberService orgMemberService;
    private final EncryptionService encryptionService;

    /** Logged by the start that stored a generated password: the only place the operator can read it. */
    static final String GENERATED_PASSWORD_LOG = "\nPASSWORD FOR SUPER-ADMIN is: {}\n";
    /** Logged by a start that found the account with a password and no configured one: the stored password is kept, and not logged. */
    static final String PASSWORD_KEPT_LOG = "Super admin {} keeps its stored password: no password is configured. Set LOWCODER_SUPERUSER_PASSWORD and restart to replace it.";

    /**
     * The steps as one pipeline, returned instead of subscribed here (BF-037: the pipeline ended in {@code subscribe()}, so
     * changeset 020 was recorded as applied while steps were pending, and a failing step was dropped with the later steps
     * never run).
     * <p>
     * The password: a configured one ({@code LOWCODER_SUPERUSER_PASSWORD}) replaces the stored one at every start. Without
     * one, a generated password is written only to an account that has none, and printed into the log only by the start that
     * stored it; later starts keep the stored password (so a restart no longer replaces it, nor one the super admin changed).
     * <p>
     * Limits: the steps that ran before a failing one are not undone. When the pipeline runs again, the super-admin mark and
     * the organization memberships (and a configured password) are written again, but a user created by the failed run is found
     * as existing, so its default organization ({@code onUserRegister}) is not created if that was the step that failed. Two
     * starts that both create the account at once (the startup runner and changeset 020 on a new database) can each log their
     * own password; whether that race can create two accounts is not verified (no unique index was checked).
     */
    @Override
    public Mono<Void> addOrUpdateSuperAdmin() {

        String configuredPassword = commonConfig.getSuperAdmin().getPassword();
        boolean generated = StringUtils.isBlank(configuredPassword);
        String password = generated ? generatePassword() : configuredPassword;
        AuthUser authUser = formulateAuthUser(password);
        return authenticationApiService.updateOrCreateUser(authUser, false, true)
                .delayUntil(user -> {
                    if (user.getIsNewUser()) {
                        return authenticationApiService.onUserRegister(user, true);
                    }
                    return Mono.empty();
                })
                .delayUntil(user -> storePassword(user, password, generated, authUser.getUsername()))
                .delayUntil(user -> userService.markAsSuperAdmin(user.getId()))
                .delayUntil(user -> orgMemberService.addToAllOrgAsAdminIfNot(user.getId()))
                .then();
    }

    /**
     * A configured password is written. A generated one is written only if the account has none: when the login step has
     * just created or renamed the account with it, the stored hash already matches; otherwise it is written to an account
     * without a password in one conditional update, and an account that has one keeps it.
     */
    private Mono<Void> storePassword(User user, String password, boolean generated, String username) {
        if (!generated) {
            return userService.setPassword(user.getId(), password).then();
        }
        if (storedPasswordIs(user, password)) {
            log.info(GENERATED_PASSWORD_LOG, password);
            return Mono.empty();
        }
        return userService.setPasswordIfAbsent(user.getId(), password)
                .doOnNext(stored -> log.info(GENERATED_PASSWORD_LOG, password))
                .then()
                .onErrorResume(AddSuperAdminUserImpl::isPasswordAlreadySet, error -> {
                    log.info(PASSWORD_KEPT_LOG, username);
                    return Mono.empty();
                });
    }

    private boolean storedPasswordIs(User user, String password) {
        return StringUtils.isNotBlank(user.getPassword()) && encryptionService.matchPassword(password, user.getPassword());
    }

    private static boolean isPasswordAlreadySet(Throwable error) {
        return error instanceof BizException biz
                && biz.getError() == BizError.INVALID_PASSWORD
                && UserService.PASSWORD_ALREADY_SET.equals(biz.getMessageKey());
    }

    private AuthUser formulateAuthUser(String password) {
        String username = formulateUserName();
        AuthRequestContext authRequestContext = new FormAuthRequestContext(username, password, true, null);
        authRequestContext.setAuthConfig(DEFAULT_AUTH_CONFIG);
        return AuthUser.builder()
                .uid(username)
                .username(username)
                .email(username)
                .authContext(authRequestContext)
                .build();
    }
    private String formulateUserName() {
        if(StringUtils.isNotBlank(commonConfig.getSuperAdmin().getUserName())) {
            return commonConfig.getSuperAdmin().getUserName();
        }
        return "admin@lowcoder.org";
    }

    private String generatePassword() {
        return new RandomPasswordGeneratorConfig().generatePassayPassword();
    }
}
