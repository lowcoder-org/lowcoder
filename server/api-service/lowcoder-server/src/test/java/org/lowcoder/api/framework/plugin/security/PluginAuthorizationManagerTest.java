package org.lowcoder.api.framework.plugin.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.List;

import org.aopalliance.intercept.MethodInvocation;
import org.junit.jupiter.api.Test;
import org.lowcoder.plugin.api.EndpointExtension;
import org.lowcoder.plugin.api.PluginEndpoint;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Tests of {@link PluginAuthorizationManager}: the SpEL expression of {@code @EndpointExtension.authorize()} decides.
 * The invocation carries the extension as its second argument, as {@code PluginEndpointHandlerImpl} builds it.
 */
class PluginAuthorizationManagerTest {

    private final PluginAuthorizationManager manager = new PluginAuthorizationManager();

    private static EndpointExtension extension(String authorize) {
        return new EndpointExtension() {
            @Override
            public Class<? extends Annotation> annotationType() {
                return EndpointExtension.class;
            }

            @Override
            public String uri() {
                return "/x";
            }

            @Override
            public PluginEndpoint.Method method() {
                return PluginEndpoint.Method.GET;
            }

            @Override
            public String authorize() {
                return authorize;
            }
        };
    }

    private static MethodInvocation invocation(EndpointExtension extension) {
        try {
            Method method = Object.class.getMethod("toString");
            return new MethodInvocation() {
                @Override
                public Method getMethod() {
                    return method;
                }

                @Override
                public Object[] getArguments() {
                    return new Object[]{"someString", extension};
                }

                @Override
                public Object proceed() {
                    return null;
                }

                @Override
                public Object getThis() {
                    return "target";
                }

                @Override
                public java.lang.reflect.AccessibleObject getStaticPart() {
                    return method;
                }
            };
        } catch (NoSuchMethodException e) {
            throw new IllegalStateException(e);
        }
    }

    private static Mono<Authentication> user(String... roles) {
        return Mono.just(new UsernamePasswordAuthenticationToken("user", "n/a",
                List.of(roles).stream().map(SimpleGrantedAuthority::new).toList()));
    }

    private Mono<AuthorizationDecision> check(String authorize, Mono<Authentication> auth) {
        return manager.check(auth, invocation(extension(authorize)));
    }

    /** Catches an endpoint without an expression being evaluated (the erroring authentication would fail it). */
    @Test
    void check_missingOrBlankExpression_grantsWithoutEvaluating() {
        Mono<Authentication> failing = Mono.error(new IllegalStateException("must not be read"));

        for (String authorize : new String[]{null, "", "   "}) {
            StepVerifier.create(check(authorize, failing)).expectNextMatches(AuthorizationDecision::isGranted).verifyComplete();
        }
        StepVerifier.create(manager.check(failing, invocation(null))).expectNextMatches(AuthorizationDecision::isGranted).verifyComplete();
        System.out.println("[PluginAuthorizationManagerTest] null/blank expression and null extension granted");
    }

    /** Catches roles being ignored or inverted. */
    @Test
    void check_roleExpressions_decideByTheAuthorities() {
        StepVerifier.create(check("isAuthenticated()", user("ROLE_USER"))).expectNextMatches(AuthorizationDecision::isGranted).verifyComplete();
        StepVerifier.create(check("hasRole('USER')", user("ROLE_USER"))).expectNextMatches(AuthorizationDecision::isGranted).verifyComplete();
        StepVerifier.create(check("hasRole('ADMIN')", user("ROLE_USER"))).expectNextMatches(d -> !d.isGranted()).verifyComplete();
        System.out.println("[PluginAuthorizationManagerTest] role expressions decided by authorities");
    }

    /** Catches a Mono-valued expression not being unwrapped (true and false both). */
    @Test
    void check_monoBooleanExpression_isUnwrapped() {
        StepVerifier.create(check("T(reactor.core.publisher.Mono).just(true)", user())).expectNextMatches(AuthorizationDecision::isGranted).verifyComplete();
        StepVerifier.create(check("T(reactor.core.publisher.Mono).just(false)", user())).expectNextMatches(d -> !d.isGranted()).verifyComplete();
        System.out.println("[PluginAuthorizationManagerTest] Mono<Boolean> unwrapped");
    }

    /** Catches a non-boolean result being treated as a decision. */
    @Test
    void check_nonBooleanResults_failWithIllegalState() {
        for (String expression : new String[]{"'text'", "T(reactor.core.publisher.Mono).just('text')", "T(reactor.core.publisher.Mono).empty()"}) {
            StepVerifier.create(check(expression, user()))
                    .expectErrorSatisfies(error -> {
                        assertThat(error).isInstanceOf(IllegalStateException.class).hasMessageContaining("must return boolean or Mono<Boolean>")
                                .hasMessageContaining(expression);
                        System.out.println("[PluginAuthorizationManagerTest] " + expression + " -> " + error.getMessage());
                    }).verify();
        }
    }

    /** Catches an evaluation failure not being reported as an illegal argument with the cause. */
    @Test
    void check_evaluationFailure_failsWithIllegalArgumentAndCause() {
        StepVerifier.create(check("noSuchFunction()", user()))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Failed to evaluate expression 'noSuchFunction()'");
                    assertThat(error.getCause()).isNotNull();
                    System.out.println("[PluginAuthorizationManagerTest] " + error.getMessage() + " / " + error.getCause().getClass().getSimpleName());
                }).verify();
    }
}
