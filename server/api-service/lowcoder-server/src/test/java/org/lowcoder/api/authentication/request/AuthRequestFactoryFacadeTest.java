package org.lowcoder.api.authentication.request;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.domain.authentication.context.FormAuthRequestContext;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/** Tests of {@link AuthRequestFactoryFacade}: factory registration per auth type and dispatch by the config's auth type. */
class AuthRequestFactoryFacadeTest {

    private static final AuthRequest FORM_REQUEST = new MarkerRequest();
    private static final AuthRequest GITHUB_REQUEST = new MarkerRequest();

    private static final class MarkerRequest implements AuthRequest {
        @Override
        public Mono<org.lowcoder.domain.user.model.AuthUser> auth(AuthRequestContext authRequestContext) {
            return Mono.empty();
        }

        @Override
        public Mono<org.lowcoder.domain.user.model.AuthUser> refresh(String refreshToken) {
            return Mono.empty();
        }
    }

    private static AuthRequestFactory<AuthRequestContext> factory(AuthRequest request, String... types) {
        return new AuthRequestFactory<>() {
            @Override
            public Mono<AuthRequest> build(AuthRequestContext context) {
                return Mono.just(request);
            }

            @Override
            public Set<String> supportedAuthTypes() {
                return Set.of(types);
            }
        };
    }

    private static AuthRequestFactoryFacade facadeOver(AuthRequestFactoryFacade facade, Object... factories) {
        ReflectionTestUtils.setField(facade, "authRequestFactories", List.of(factories));
        return facade;
    }

    private static FormAuthRequestContext contextOf(String authType) {
        FormAuthRequestContext context = new FormAuthRequestContext("login", "pw", false, "org");
        if (AuthTypeConstants.FORM.equals(authType)) {
            context.setAuthConfig(new EmailAuthConfig("cfg", true, true));
        } else {
            context.setAuthConfig(Oauth2SimpleAuthConfig.builder().id("cfg").source(authType).sourceName(authType).authType(authType)
                    .clientId("c").build());
        }
        return context;
    }

    private AuthRequestFactoryFacade registered() {
        AuthRequestFactoryFacade facade = new AuthRequestFactoryFacade();
        facadeOver(facade, facade, factory(FORM_REQUEST, AuthTypeConstants.FORM), factory(GITHUB_REQUEST, AuthTypeConstants.GITHUB));
        facade.init();
        return facade;
    }

    /** Catches a request built by the wrong factory: dispatch is by the config's auth type. */
    @Test
    void build_dispatchesByTheAuthTypeOfTheConfig() {
        AuthRequestFactoryFacade facade = registered();

        StepVerifier.create(facade.build(contextOf(AuthTypeConstants.FORM))).expectNext(FORM_REQUEST).verifyComplete();
        StepVerifier.create(facade.build(contextOf(AuthTypeConstants.GITHUB))).expectNext(GITHUB_REQUEST).verifyComplete();
        System.out.println("[AuthRequestFactoryFacadeTest] FORM and GITHUB dispatched to their own factories");
    }

    /** Catches an unknown auth type reaching a request: it is the coded AUTH_ERROR. */
    @Test
    void build_unknownAuthType_failsWithAuthError() {
        StepVerifier.create(registered().build(contextOf(AuthTypeConstants.KEYCLOAK)))
                .expectErrorSatisfies(e -> {
                    assertThat(e).isInstanceOf(BizException.class);
                    assertThat(((BizException) e).getError()).isEqualTo(BizError.AUTH_ERROR);
                })
                .verify();
        System.out.println("[AuthRequestFactoryFacadeTest] unregistered type -> AUTH_ERROR");
    }

    /** Catches a provider being silently shadowed: two factories for the same auth type are rejected at start-up. */
    @Test
    void init_twoFactoriesForTheSameAuthType_failsNamingTheType() {
        AuthRequestFactoryFacade facade = new AuthRequestFactoryFacade();
        facadeOver(facade, factory(FORM_REQUEST, AuthTypeConstants.GITHUB), factory(GITHUB_REQUEST, AuthTypeConstants.GITHUB));

        assertThatThrownBy(facade::init)
                .isInstanceOf(RuntimeException.class)
                .hasMessage("duplicate authRequestFactory found for same authType: GITHUB");
        System.out.println("[AuthRequestFactoryFacadeTest] duplicate GITHUB factory rejected");
    }

    @Test
    void supportedAuthTypes_isEmpty_theFacadeRegistersNoTypeOfItsOwn() {
        assertThat(registered().supportedAuthTypes()).isEmpty();
        System.out.println("[AuthRequestFactoryFacadeTest] facade supports no types itself");
    }
}
