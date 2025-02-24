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
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

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
}
