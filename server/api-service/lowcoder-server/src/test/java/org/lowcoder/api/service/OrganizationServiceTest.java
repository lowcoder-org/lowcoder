package org.lowcoder.api.service;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.UUID;

@SpringBootTest
//@RunWith(SpringRunner.class)
@ActiveProfiles("OrganizationApiServiceTest")
@Slf4j(topic = "OrganizationApiServiceTest")

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class OrganizationServiceTest {

    @Autowired
    private OrganizationService organizationService;

    private Mono<Organization> createOrganization(String name) {
        Organization organization = Organization.builder()
                .name(name)
                .gid("gid-" + UUID.randomUUID())
                .build();
        return organizationService.create(organization, "user01", false);
    }

    @Test
    @WithMockUser
    public void testUpdateSlug() {
        // Create a dummy organization
        Mono<String> organizationMono = createOrganization("SlugTestOrganization")
                .map(HasIdAndAuditing::getId);

        // Assume updateSlug is performed by passing organizationId and the new slug
        Mono<Organization> updatedOrganizationMono = organizationMono
                .flatMap(organizationId -> organizationService.updateSlug(organizationId, "new-slug-value"));

        // Verify the organization updates with the new slug
        StepVerifier.create(updatedOrganizationMono)
                .assertNext(organization -> {
                    Assertions.assertNotNull(organization.getSlug(), "Slug should not be null");
                    Assertions.assertEquals("new-slug-value", organization.getSlug(), "Slug should be updated to 'new-slug-value'");
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testGetAllActive() {
        // Create a single organization to ensure there is at least one active one in the database
        Mono<Organization> orgMono = createOrganization("ActiveOrganization");

        // Ensure the organization is created and then verify getAllActive
        Flux<Organization> allActiveOrganizations = orgMono.thenMany(organizationService.getAllActive());

        StepVerifier.create(allActiveOrganizations.collectList())
                .assertNext(orgList -> {
                    Assertions.assertFalse(orgList.isEmpty(), "The organization list should not be empty");
                    Organization lastOrg = orgList.get(orgList.size() - 1);

                    // Check the last element in the list
                    Assertions.assertNotNull(lastOrg.getId(), "Last organization ID should not be null");
                    Assertions.assertEquals("ActiveOrganization", lastOrg.getName(), "Last organization name should match 'ActiveOrganization'");
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testGetByIds() {
        // Create the first organization and update its gid
        Mono<Organization> org1Mono = createOrganization("Organization1")
                .flatMap(org -> {
                    org.setGid("gid-1");
                    return organizationService.update(org.getId(), org)
                            .thenReturn(org);
                });

        // Create the second organization and update its gid
        Mono<Organization> org2Mono = createOrganization("Organization2")
                .flatMap(org -> {
                    org.setGid("gid-2");
                    return organizationService.update(org.getId(), org)
                            .thenReturn(org);
                });

        // Use these updated organizations in further operations or assertions
        Flux<Organization> savedOrgs = org1Mono.then(org2Mono)
                .thenMany(organizationService.getByIds(List.of("gid-1", "gid-2")));

        StepVerifier.create(savedOrgs.collectList())
                .assertNext(orgList -> {
                    Assertions.assertTrue(orgList.size() >= 2, "Organization list should have at least two elements");

                    // Check the last two elements
                    Organization org1 = orgList.get(orgList.size() - 2);
                    Organization org2 = orgList.get(orgList.size() - 1);

                    Assertions.assertNotNull(org1.getId(), "Organization ID should not be null");
                    Assertions.assertEquals("gid-1", org1.getGid(), "First organization GID should match 'gid-1'");
                    Assertions.assertEquals("Organization1", org1.getName(), "First organization name should match 'Organization1'");

                    Assertions.assertNotNull(org2.getId(), "Organization ID should not be null");
                    Assertions.assertEquals("gid-2", org2.getGid(), "Second organization GID should match 'gid-2'");
                    Assertions.assertEquals("Organization2", org2.getName(), "Second organization name should match 'Organization2'");
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testGetOrgCommonSettings() {

        Organization.OrganizationCommonSettings testSettings = new Organization.OrganizationCommonSettings();
        testSettings.put("settingKey1", "settingValue1");
        testSettings.put("settingKey2", "settingValue2");

        // Create the first organization and update its common setting
        Mono<Organization> orgMono = createOrganization("Organization")
                .flatMap(org -> {
                    org.setCommonSettings(testSettings);
                    return organizationService.update(org.getId(), org)
                            .thenReturn(org);
                });

        // Retrieve the common settings from the organization
        Mono<Organization.OrganizationCommonSettings> commonSettingsMono = orgMono
                .flatMap(org -> organizationService.getOrgCommonSettings(org.getId()));

        // Verify that the settings match the expected test settings
        StepVerifier.create(commonSettingsMono)
                .assertNext(retrievedSettings -> {
                    Assertions.assertEquals("settingValue1", retrievedSettings.get("settingKey1"), "The setting value for 'settingKey1' should match");
                    Assertions.assertEquals("settingValue2", retrievedSettings.get("settingKey2"), "The setting value for 'settingKey2' should match");
                })
                .verifyComplete();
    }

    @Test
    @WithMockUser
    public void testUpdateCommonSettings() {
        // Initial settings for the organization
        Organization.OrganizationCommonSettings initialSettings = new Organization.OrganizationCommonSettings();
        initialSettings.put("settingKey1", "initialValue1");

        // Create an organization with initial settings
        Mono<Organization> orgMono = createOrganization("CommonSettingsTestOrganization")
                .flatMap(org -> {
                    org.setCommonSettings(initialSettings);
                    return organizationService.update(org.getId(), org)
                            .thenReturn(org);
                });

        // Define key and new value to update
        String keyToUpdate = "settingKey1";
        String newValue = "updatedValue1";

        // Chain the update and verification operations
        orgMono.flatMap(org ->
                        // Update the common settings
                        organizationService.updateCommonSettings(org.getId(), keyToUpdate, newValue)
                                .flatMap(updateSuccess -> {
                                    Assertions.assertTrue(updateSuccess, "Update should be successful");
                                    // Retrieve updated common settings
                                    return organizationService.getOrgCommonSettings(org.getId());
                                })
                )
                .as(StepVerifier::create)
                .assertNext(updatedSettings -> {
                    // Verify updated settings
                    Assertions.assertEquals(newValue, updatedSettings.get(keyToUpdate), "The setting value should be updated to 'updatedValue1'");
                })
                .verifyComplete();
    }
}
