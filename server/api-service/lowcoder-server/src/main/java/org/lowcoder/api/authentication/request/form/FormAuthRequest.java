package org.lowcoder.api.authentication.request.form;

import org.lowcoder.api.authentication.request.AuthRequest;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.authentication.context.FormAuthRequestContext;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.EmailUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

@Component
public class FormAuthRequest implements AuthRequest {

    @Autowired
    private UserService userService;
    @Autowired
    private EncryptionService encryptionService;

    @Override
    public Mono<AuthUser> auth(AuthRequestContext authRequestContext) {
        FormAuthRequestContext context = (FormAuthRequestContext) authRequestContext;

        return Mono.defer(() -> {
                    AbstractAuthConfig authConfig = context.getAuthConfig();
                    // register
                    if (context.isRegister()) {
                        // register by email
                        if (AuthSourceConstants.EMAIL.equals(authConfig.getSource())
                                && authConfig instanceof EmailAuthConfig emailAuthConfig
                                && emailAuthConfig.isEnableRegister()) {
                            // Shape check before anything is created. A blank loginId would otherwise be
                            // stored as an address and then resolve on a subsequent login with loginId="".
                            if (!EmailUtils.looksLikeEmail(EmailUtils.normalize(context.getLoginId()))) {
                                return ofError(BizError.INVALID_EMAIL_FORMAT, "INVALID_EMAIL_FORMAT");
                            }
                            // Passed AS SUPPLIED on purpose: findBySourceAndId probes the value given and
                            // then its normalized form, so this now rejects JoHn@DoE.com when
                            // john@doe.com already exists -- the duplicate that used to get through.
                            return userService.findBySourceAndId(authConfig.getSource(), context.getLoginId())
                                    .flatMap(user -> ofError(BizError.USER_LOGIN_ID_EXIST, "USER_LOGIN_ID_EXIST"));
                        }
                        // register not by email
                        return Mono.error(new BizException(BizError.UNSUPPORTED_OPERATION, "BAD_REQUEST"));
                    }
                    // login
                    return userService.findBySourceAndId(authConfig.getSource(), context.getLoginId())
                            .switchIfEmpty(ofError(BizError.INVALID_PASSWORD, "INVALID_EMAIL_OR_PASSWORD"))
                            .flatMap(user -> {
                                String raw = context.getPassword();
                                String encoded = user.getPassword();
                                if (!encryptionService.matchPassword(raw, encoded)) {
                                    return ofError(BizError.INVALID_PASSWORD, "INVALID_EMAIL_OR_PASSWORD");
                                }
                                return Mono.empty();
                            });
                })
                .thenReturn(AuthUser.builder().uid(context.getLoginId()).username(context.getLoginId()).email(context.getLoginId()).build());
    }

    @Override
    public Mono<AuthUser> refresh(String refreshToken) {
        return Mono.error(new UnsupportedOperationException());
    }
}
