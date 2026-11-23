package org.lowcoder.domain.organization.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings.NPM_REGISTRIES;
import static org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings.PASSWORD_RESET_EMAIL_TEMPLATE;
import static org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings.updateTimeKey;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;

/**
 * {@code sanitized()} must drop {@code npmRegistries} (a registry URL and its
 * {@code auth.credentials}) and its update time, the same way it already drops the password-reset template.
 */
class OrganizationCommonSettingsSanitizedTest {

    private static final String OTHER_KEY = "defaultHomePage";
    private static final String NPM_REGISTRY_VALUE = "OrganizationCommonSettingsSanitizedTest.npmRegistryCredential";

    @Test
    void sanitized_dropsNpmRegistriesAndItsUpdateTime_keepsOtherKeys() {
        OrganizationCommonSettings settings = new OrganizationCommonSettings();
        settings.put(NPM_REGISTRIES, NPM_REGISTRY_VALUE);
        settings.put(updateTimeKey(NPM_REGISTRIES), 123L);
        settings.put(PASSWORD_RESET_EMAIL_TEMPLATE, "template");
        settings.put(OTHER_KEY, "home");

        OrganizationCommonSettings sanitized = settings.sanitized();

        assertThat(sanitized).doesNotContainKey(NPM_REGISTRIES);
        assertThat(sanitized).doesNotContainKey(updateTimeKey(NPM_REGISTRIES));
        assertThat(sanitized).doesNotContainKey(PASSWORD_RESET_EMAIL_TEMPLATE);
        assertThat(sanitized).containsEntry(OTHER_KEY, "home");
        System.out.println("[OrganizationCommonSettingsSanitizedTest] sanitized=" + sanitized);
    }

    @Test
    void sanitized_doesNotModifyTheOriginalMap() {
        OrganizationCommonSettings settings = new OrganizationCommonSettings();
        settings.put(NPM_REGISTRIES, NPM_REGISTRY_VALUE);
        settings.put(OTHER_KEY, "home");

        settings.sanitized();

        assertThat(settings).containsEntry(NPM_REGISTRIES, NPM_REGISTRY_VALUE);
        assertThat(settings).containsEntry(OTHER_KEY, "home");
    }

    @Test
    void sanitized_emptyMap_answersEmpty() {
        OrganizationCommonSettings settings = new OrganizationCommonSettings();

        assertThat(settings.sanitized()).isEmpty();
    }
}
