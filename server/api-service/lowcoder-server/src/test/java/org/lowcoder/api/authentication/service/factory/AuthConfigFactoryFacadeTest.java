package org.lowcoder.api.authentication.service.factory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.springframework.test.util.ReflectionTestUtils;

/** Tests of {@link AuthConfigFactoryFacade}: dispatch by auth type to the registered factories. */
class AuthConfigFactoryFacadeTest {

    private static final String FIRST_ID = "from-first";
    private static final String SECOND_ID = "from-second";

    /** A factory that supports fixed types and marks what it built with its own id. */
    private static AuthConfigFactory factory(String marker, String... types) {
        return new AuthConfigFactory() {
            @Override
            public AbstractAuthConfig build(AuthConfigRequest request, boolean enable) {
                return new EmailAuthConfig(marker, enable, true);
            }

            @Override
            public Set<String> supportAuthTypes() {
                return Set.of(types);
            }
        };
    }

    private AuthConfigFactoryFacade facade;

    @BeforeEach
    void setUp() {
        facade = new AuthConfigFactoryFacade();
        AuthConfigFactory first = factory(FIRST_ID, AuthTypeConstants.GITHUB, AuthTypeConstants.GOOGLE);
        AuthConfigFactory second = factory(SECOND_ID, AuthTypeConstants.GOOGLE, AuthTypeConstants.GENERIC);
        ReflectionTestUtils.setField(facade, "factories", List.of(facade, first, second));
        facade.init();
    }

    private static AuthConfigRequest request(String authType) {
        AuthConfigRequest request = new AuthConfigRequest();
        request.put("authType", authType);
        return request;
    }

    /** Catches a type being routed to the wrong factory; for an overlapping type the first registered wins. */
    @Test
    void build_dispatchesByAuthType_andTheFirstRegisteredFactoryWinsAnOverlap() {
        assertThat(facade.build(request(AuthTypeConstants.GITHUB), true).getId()).isEqualTo(FIRST_ID);
        assertThat(facade.build(request(AuthTypeConstants.GOOGLE), true).getId()).isEqualTo(FIRST_ID);
        assertThat(facade.build(request(AuthTypeConstants.GENERIC), false).getId()).isEqualTo(SECOND_ID);
        assertThat(facade.build(request(AuthTypeConstants.GENERIC), false).isEnable()).as("enable is passed on").isFalse();
        System.out.println("[AuthConfigFactoryFacadeTest] GITHUB, GOOGLE -> first; GENERIC -> second");
    }

    @Test
    void build_unknownAuthType_failsWithUnsupportedOperation() {
        assertThatThrownBy(() -> facade.build(request(AuthTypeConstants.KEYCLOAK), true))
                .isInstanceOf(UnsupportedOperationException.class)
                .hasMessage(AuthTypeConstants.KEYCLOAK);
        System.out.println("[AuthConfigFactoryFacadeTest] unregistered type -> UnsupportedOperationException");
    }

    @Test
    void supportAuthTypes_areTheRegisteredTypesOfAllOtherFactories() {
        assertThat(facade.supportAuthTypes())
                .containsExactlyInAnyOrder(AuthTypeConstants.GITHUB, AuthTypeConstants.GOOGLE, AuthTypeConstants.GENERIC);
        System.out.println("[AuthConfigFactoryFacadeTest] supported " + facade.supportAuthTypes());
    }
}
