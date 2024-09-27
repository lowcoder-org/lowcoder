package org.lowcoder.runner.migrations.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.authentication.service.AuthenticationApiServiceImpl;
import org.lowcoder.api.util.RandomPasswordGeneratorConfig;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.authentication.context.FormAuthRequestContext;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.config.CommonConfig;
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

    @Override
    public void addOrUpdateSuperAdmin() {

        AuthUser authUser = formulateAuthUser();
        authenticationApiService.updateOrCreateUser(authUser, false, true)
                .delayUntil(user -> {
                    if (user.getIsNewUser()) {
                        return authenticationApiService.onUserRegister(user, true);
                    }
                    return Mono.empty();
                })
                .delayUntil(user -> userService.setPassword(user.getId(), ((FormAuthRequestContext)authUser.getAuthContext()).getPassword()))
                .delayUntil(user -> userService.markAsSuperAdmin(user.getId()))
                .delayUntil(user -> orgMemberService.addToAllOrgAsAdminIfNot(user.getId()))
                .subscribe();
    }

    private AuthUser formulateAuthUser() {
        String username = formulateUserName();
        String password = formulatePassword();
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

    private String formulatePassword() {
        if(StringUtils.isNotBlank(commonConfig.getSuperAdmin().getPassword())) {
            return commonConfig.getSuperAdmin().getPassword();
        }
        RandomPasswordGeneratorConfig passGen = new RandomPasswordGeneratorConfig();
        String password = passGen.generatePassayPassword();
        log.info("\nPASSWORD FOR SUPER-ADMIN is: {}\n", password);
        return password;
    }
}
