package org.lowcoder.runner.migrations.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.api.authentication.service.AuthenticationApiServiceImpl;
import org.lowcoder.api.util.RandomPasswordGeneratorConfig;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.authentication.context.FormAuthRequestContext;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.sdk.config.CommonConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import static org.lowcoder.domain.authentication.AuthenticationService.DEFAULT_AUTH_CONFIG;

@RequiredArgsConstructor
@Component
@Slf4j(topic = "AddSuperAdminUserImpl")
public class AddSuperAdminUserImpl implements AddSuperAdminUser {

    private final AuthenticationApiServiceImpl authenticationApiService;
    private final CommonConfig commonConfig;
    
    @Override
    public void addSuperAdmin() {

        AuthUser authUser = formulateAuthUser();

        authenticationApiService.updateOrCreateUser(authUser, false)
                .delayUntil(user -> {
                    if (user.getIsNewUser()) {
                        return authenticationApiService.onUserRegister(user, true);
                    }
                    return Mono.empty();
                })
                .block();
    }

    private AuthUser formulateAuthUser() {
        String username = formulateUserName();
        String password = formulatePassword();
        AuthRequestContext authRequestContext = new FormAuthRequestContext(username, password, true, null);
        authRequestContext.setAuthConfig(DEFAULT_AUTH_CONFIG);
        return AuthUser.builder()
                .uid(username)
                .username(username)
                .authContext(authRequestContext)
                .build();
    }
    private String formulateUserName() {
        if(commonConfig.getSuperAdmin().getUserName() != null) {
            return commonConfig.getSuperAdmin().getUserName();
        }
        return "admin@lowcoder.pro";
    }

    private String formulatePassword() {
        if(commonConfig.getSuperAdmin().getPassword() != null) {
            return commonConfig.getSuperAdmin().getPassword();
        }
        RandomPasswordGeneratorConfig passGen = new RandomPasswordGeneratorConfig();
        String password = passGen.generatePassayPassword();
        log.info("PASSWORD FOR SUPER-ADMIN is: {}", password);
        return password;
    }
}
