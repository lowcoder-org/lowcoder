package org.lowcoder.api.contract.payload;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.api.authentication.service.factory.AuthConfigFactoryImpl;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.Oauth2GenericAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.util.JsonUtils;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The map representative {@code AuthConfigRequest} (docs/API_PAYLOAD_TEST_PLAN.md §5.3) through its real consumer:
 * its D1 fixture, decoded by the production mapper, is handed to {@link AuthConfigFactoryImpl}, and the
 * {@link Oauth2GenericAuthConfig} it builds must equal one built without Jackson from the sample's values.
 *
 * <p>A map type has no properties the gate could compare with its fixture (rule 4 skips it), so this is what keeps the
 * fixture complete: a key the factory reads that is missing from the fixture falls back to the factory's default,
 * which the sample avoids, and fails here. It also pins what the factory needs from the bound values: booleans as
 * {@code Boolean} ({@code MapUtils.getBoolean}) and {@code sourceMappings} as a {@code HashMap}, which the
 * {@code LinkedHashMap} Jackson binds is ({@code AuthConfigRequest#getSourceMappings} casts to it).
 */
class AuthConfigRequestConsumerTest {

    static final String D1 = "types/" + AuthConfigRequest.class.getName() + ".D1.json";
    static final boolean ENABLE = true;

    @Test
    void theFactoryBuildsTheGenericConfigFromTheBoundFixture() throws Exception {
        AuthConfigRequest bound = JsonUtils.getObjectMapper().readValue(GoldenJson.forModule().read(D1), AuthConfigRequest.class);
        AbstractAuthConfig built = new AuthConfigFactoryImpl().build(bound, ENABLE);
        System.out.println("[AuthConfigRequestConsumerTest] built " + built.getClass().getName() + " from " + bound);
        assertThat(bound.getSourceMappings()).isInstanceOf(LinkedHashMap.class);
        assertThat(built).usingRecursiveComparison().withStrictTypeChecking().isEqualTo(expected());
    }

    /** The config the factory must build from {@link PayloadSamples#authConfigRequest()}, written out field by field. */
    private static Oauth2GenericAuthConfig expected() {
        AuthConfigRequest sample = PayloadSamples.authConfigRequest();
        HashMap<String, String> sourceMappings = new LinkedHashMap<>();
        ((Map<?, ?>) sample.get("sourceMappings")).forEach((key, value) -> sourceMappings.put((String) key, (String) value));
        return Oauth2GenericAuthConfig.builder()
                .id((String) sample.get("id"))
                .enable(ENABLE)
                .enableRegister((Boolean) sample.get("enableRegister"))
                .source((String) sample.get("source"))
                .sourceName((String) sample.get("sourceName"))
                .sourceDescription((String) sample.get("sourceDescription"))
                .sourceIcon((String) sample.get("sourceIcon"))
                .sourceCategory((String) sample.get("sourceCategory"))
                .sourceMappings(sourceMappings)
                .clientId((String) sample.get("clientId"))
                .clientSecret((String) sample.get("clientSecret"))
                .issuerUri((String) sample.get("issuerUri"))
                .authorizationEndpoint((String) sample.get("authorizationEndpoint"))
                .tokenEndpoint((String) sample.get("tokenEndpoint"))
                .userInfoEndpoint((String) sample.get("userInfoEndpoint"))
                .scope((String) sample.get("scope"))
                .authType(AuthTypeConstants.GENERIC)
                .userInfoIntrospection((Boolean) sample.get("userInfoIntrospection"))
                .userCanSelectAccounts((Boolean) sample.get("userCanSelectAccounts"))
                .postForUserEndpoint((Boolean) sample.get("postForUserEndpoint"))
                .build();
    }
}
