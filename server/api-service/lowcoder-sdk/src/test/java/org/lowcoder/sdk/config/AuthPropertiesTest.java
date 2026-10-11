package org.lowcoder.sdk.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.lowcoder.sdk.constants.AuthSourceConstants;

/**
 * {@link AuthProperties}: the register switch of an auth way and the conversion of the {@code auth.*} properties into the
 * auth configs offered at login (the saas mode, where no config is stored in the database).
 */
public class AuthPropertiesTest {

    private static AuthProperties.AuthWay way(boolean enable, Boolean enableRegister) {
        AuthProperties.AuthWay way = new AuthProperties.AuthWay();
        way.setEnable(enable);
        way.setEnableRegister(enableRegister);
        return way;
    }

    @Test
    public void registerIsAllowedOnlyWhenTheWayIsEnabledAndRegisterIsNotSwitchedOff() {
        // enable x enableRegister (null = not configured: follows enable)
        assertFalse(way(false, null).isEnableRegister(), "disabled, register unset");
        assertTrue(way(true, null).isEnableRegister(), "enabled, register unset follows enable");
        assertFalse(way(false, true).isEnableRegister(), "disabled way cannot register even if register is true");
        assertFalse(way(false, false).isEnableRegister());
        assertTrue(way(true, true).isEnableRegister());
        assertFalse(way(true, false).isEnableRegister(), "register switched off");
    }

    @Test
    public void nothingIsOfferedWhenNoProviderIsEnabled() {
        AuthProperties properties = new AuthProperties();
        properties.getGoogle().setClientId("g-id");
        properties.getGithub().setClientSecret("h-secret");

        assertEquals(List.of(), properties.getAuthConfigs(), "a provider with credentials but not enabled is not offered");
    }

    @Test
    public void anEnabledEmailWayIsOfferedAsAFormConfigWithItsRegisterSwitch() {
        AuthProperties properties = new AuthProperties();
        properties.getEmail().setEnable(true);
        properties.getEmail().setEnableRegister(false);

        List<AbstractAuthConfig> configs = properties.getAuthConfigs();

        assertEquals(1, configs.size());
        AbstractAuthConfig email = configs.get(0);
        System.out.println("[AuthPropertiesTest] email -> source " + email.getSource() + ", type " + email.getAuthType() + ", enable " + email.isEnable()
                + ", register " + email.isEnableRegister());
        assertInstanceOf(EmailAuthConfig.class, email);
        assertEquals(AuthSourceConstants.EMAIL, email.getSource());
        assertEquals(AuthTypeConstants.FORM, email.getAuthType());
        assertTrue(email.isEnable());
        assertFalse(email.isEnableRegister());
        assertEquals(AuthSourceConstants.EMAIL, email.getId(), "an unsaved config is identified by its source");
    }

    @Test
    public void googleAndGithubAreOfferedAfterEmailWithTheirOwnCredentialsSourceAndType() {
        AuthProperties properties = new AuthProperties();
        properties.getEmail().setEnable(true);
        properties.getGoogle().setEnable(true);
        properties.getGoogle().setClientId("google-id");
        properties.getGoogle().setClientSecret("google-secret");
        properties.getGithub().setEnable(true);
        properties.getGithub().setEnableRegister(false);
        properties.getGithub().setClientId("github-id");
        properties.getGithub().setClientSecret("github-secret");

        List<AbstractAuthConfig> configs = properties.getAuthConfigs();

        System.out.println("[AuthPropertiesTest] " + configs.stream().map(c -> c.getSource() + "/" + c.getAuthType()).toList());
        assertEquals(List.of(AuthSourceConstants.EMAIL, AuthSourceConstants.GOOGLE, AuthSourceConstants.GITHUB), configs.stream().map(AbstractAuthConfig::getSource).toList());
        Oauth2SimpleAuthConfig google = (Oauth2SimpleAuthConfig) configs.get(1);
        Oauth2SimpleAuthConfig github = (Oauth2SimpleAuthConfig) configs.get(2);
        assertEquals(AuthTypeConstants.GOOGLE, google.getAuthType());
        assertEquals(AuthSourceConstants.GOOGLE_NAME, google.getSourceName());
        assertEquals("google-id", google.getClientId());
        assertEquals("google-secret", google.getClientSecret());
        assertTrue(google.isEnable());
        assertTrue(google.isEnableRegister(), "register unset follows enable");
        assertEquals(AuthTypeConstants.GITHUB, github.getAuthType());
        assertEquals(AuthSourceConstants.GITHUB_NAME, github.getSourceName());
        assertEquals("github-id", github.getClientId());
        assertEquals("github-secret", github.getClientSecret());
        assertTrue(github.isEnable());
        assertFalse(github.isEnableRegister(), "register switched off");
    }

    @Test
    public void aGoogleWayWithRegisterSwitchedOffIsOfferedWithoutRegister() {
        AuthProperties properties = new AuthProperties();
        properties.getGoogle().setEnable(true);
        properties.getGoogle().setEnableRegister(false);

        List<AbstractAuthConfig> configs = properties.getAuthConfigs();

        assertEquals(1, configs.size());
        assertTrue(configs.get(0).isEnable());
        assertFalse(configs.get(0).isEnableRegister());
    }

    @Test
    public void onlyTheEnabledOnesAreOfferedWhateverTheOthersHold() {
        AuthProperties properties = new AuthProperties();
        properties.getGithub().setEnable(true);
        properties.getGithub().setClientId("github-id");
        properties.getGoogle().setClientId("google-id");

        List<AbstractAuthConfig> configs = properties.getAuthConfigs();

        assertEquals(List.of(AuthSourceConstants.GITHUB), configs.stream().map(AbstractAuthConfig::getSource).toList());
        assertNull(properties.getWorkspaceCreation(), "not configured");
        assertNull(properties.getApiKey().getSecret());
    }
}
