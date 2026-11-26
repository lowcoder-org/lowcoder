package org.lowcoder.domain.organization.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.config.JsonViews;
import org.lowcoder.sdk.util.JsonUtils;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * {@link Organization#getAuthConfigs()} must never reach JSON (D-14): the configs hold OAuth client secrets, and
 * admins read them through {@code GET /api/auth/configs}, never through an organization. Java access and MongoDB
 * storage (through {@code OrganizationDomain}'s hooks) are unaffected.
 */
class OrganizationJsonTest {

    private static final String CLIENT_SECRET = "OrganizationJsonTest.clientSecret";
    private static final String CLIENT_ID = "OrganizationJsonTest.clientId";
    private static final String ORG_NAME = "OrganizationJsonTest.name";
    private static final String AUTH_CONFIGS = "authConfigs";
    private static final String NAME = "name";
    private static final ObjectMapper MAPPER = JsonUtils.getObjectMapper();

    private static Organization organization() {
        OrganizationDomain domain = new OrganizationDomain();
        domain.setConfigs(new ArrayList<>(List.of(Oauth2SimpleAuthConfig.builder()
                .id("OrganizationJsonTest.configId")
                .source(AuthTypeConstants.GITHUB)
                .sourceName(AuthTypeConstants.GITHUB)
                .authType(AuthTypeConstants.GITHUB)
                .enable(Boolean.TRUE)
                .enableRegister(Boolean.FALSE)
                .clientId(CLIENT_ID)
                .clientSecret(CLIENT_SECRET)
                .build())));
        return Organization.builder().name(ORG_NAME).organizationDomain(domain).build();
    }

    private static Stream<Arguments> views() {
        return Stream.of(
                Arguments.of("no view", (Class<?>) null),
                Arguments.of("Public", JsonViews.Public.class),
                Arguments.of("Internal", JsonViews.Internal.class));
    }

    private static String write(Class<?> view) throws Exception {
        Organization organization = organization();
        return view == null ? MAPPER.writeValueAsString(organization) : MAPPER.writerWithView(view).writeValueAsString(organization);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("views")
    void writesNoAuthConfigs(String label, Class<?> view) throws Exception {
        String json = write(view);
        JsonNode tree = MAPPER.readTree(json);

        System.out.println("[OrganizationJsonTest] writesNoAuthConfigs(" + label + ") json=" + json);
        assertThat(tree.get(NAME).asText()).as("positive control: the organization was written").isEqualTo(ORG_NAME);
        assertThat(tree.has(AUTH_CONFIGS)).as(label + ": no authConfigs member").isFalse();
        assertThat(json.contains(CLIENT_SECRET)).as(label + ": the secret is nowhere in the JSON").isFalse();
    }

    @Test
    void javaAccessKeepsTheConfigs() {
        Organization organization = organization();

        List<AbstractAuthConfig> configs = organization.getAuthConfigs();

        System.out.println("[OrganizationJsonTest] javaAccessKeepsTheConfigs configs=" + configs);
        assertThat(configs).hasSize(1);
        assertThat(((Oauth2SimpleAuthConfig) configs.get(0)).getClientSecret()).isEqualTo(CLIENT_SECRET);
    }

    @Test
    void anAuthConfigsMemberInABodyIsIgnored() throws Exception {
        String body = "{\"name\":\"" + ORG_NAME + "\",\"authConfigs\":[{\"authType\":\"GITHUB\",\"clientSecret\":\"" + CLIENT_SECRET + "\"}]}";

        Organization bound = MAPPER.readValue(body, Organization.class);

        System.out.println("[OrganizationJsonTest] anAuthConfigsMemberInABodyIsIgnored name=" + bound.getName() + " configs=" + bound.getAuthConfigs());
        assertThat(bound.getName()).isEqualTo(ORG_NAME);
        assertThat(bound.getAuthConfigs()).isEmpty();
    }
}
