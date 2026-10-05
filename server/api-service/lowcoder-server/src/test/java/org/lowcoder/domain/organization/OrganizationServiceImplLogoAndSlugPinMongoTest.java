package org.lowcoder.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.lowcoder.domain.organization.model.OrganizationState.ACTIVE;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.asset.service.AssetRepository;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.test.context.ActiveProfiles;

import reactor.core.publisher.Flux;

/**
 * Pins of two section 9 rows found by L3-11b on OrganizationServiceImpl (follow-up): the dangling logo reference and the
 * hyphenated slug. Shared {@code test} context, ids generated per test.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
class OrganizationServiceImplLogoAndSlugPinMongoTest extends OrganizationMongoTestBase {

    private static final byte[] LOGO_BYTES = "logo-bytes".getBytes(StandardCharsets.UTF_8);

    @Autowired
    private OrganizationService organizationService;
    @Autowired
    private AssetRepository assetRepository;

    private Organization saveOrg() {
        return mongo.save(Organization.builder().name("pin-" + newId()).gid(UUID.randomUUID().toString()).slug("s" + newId()).state(ACTIVE).build()).block(TIMEOUT);
    }

    private Organization stored(String orgId) {
        return mongo.findById(orgId, Organization.class).block(TIMEOUT);
    }

    private Part pngPart() {
        Part part = Mockito.mock(Part.class);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        Mockito.when(part.headers()).thenReturn(headers);
        Mockito.when(part.content()).thenAnswer(invocation -> Flux.just(new DefaultDataBufferFactory().wrap(LOGO_BYTES)));
        return part;
    }

    /**
     * Pins plan section 9 row "deleteLogo keeps a dangling logoAssetId (null not written by convertToUpdate)": deleteLogo
     * (OrganizationServiceImpl:251-256) clears the logo with updateById on an Organization whose logoAssetId is null, and
     * MongoUpsertHelper.convertToUpdate (:139-147) writes only non-null fields, so the asset is deleted but the org keeps
     * its logoAssetId (for the real id and, a fortiori, for a gid or slug). A second deleteLogo then fails naming the
     * deleted asset. A fix (unset the field) changes this test on purpose.
     */
    @Test
    void deleteLogoKeepsADanglingLogoAssetId_pinsTheSection9Row() {
        Organization org = saveOrg();
        organizationService.uploadLogo(org.getId(), pngPart()).block(TIMEOUT);
        String assetId = stored(org.getId()).getLogoAssetId();

        organizationService.deleteLogo(org.getId()).block(TIMEOUT);

        System.out.println("[OrganizationServiceImplLogoAndSlugPinMongoTest] PINNED asset " + assetId + " present="
                + assetRepository.findById(assetId).blockOptional(TIMEOUT).isPresent() + ", reference " + stored(org.getId()).getLogoAssetId());
        assertThat(assetRepository.findById(assetId).blockOptional(TIMEOUT)).as("the asset is deleted").isEmpty();
        assertThat(stored(org.getId()).getLogoAssetId()).as("the reference stays").isEqualTo(assetId);
        BizException again = assertThrows(BizException.class, () -> {
            try {
                organizationService.deleteLogo(org.getId()).block(TIMEOUT);
            } catch (RuntimeException e) {
                throw e instanceof BizException ? e : (BizException) e.getCause();
            }
        });
        assertThat(again.getError()).isEqualTo(BizError.NO_RESOURCE_FOUND);
        assertThat(again.getArgs()).containsExactly(assetId);
    }

    /**
     * Pins plan section 9 row "a hyphenated slug is accepted but unreachable (isGID)": SlugUtils.validate accepts a hyphen,
     * but getById (OrganizationServiceImpl:175-179) decides GID-or-not by "contains a hyphen" (FieldName.guessFieldNameFromId),
     * so the org cannot be found by that slug. A fix (reject hyphens, or look the slug up before the GID guess) changes this
     * test on purpose.
     */
    @Test
    void aHyphenatedSlugIsAcceptedButUnreachable_pinsTheSection9Row() {
        Organization org = saveOrg();
        String slug = "my-" + newId();

        assertThat(organizationService.updateSlug(org.getId(), slug).block(TIMEOUT).getSlug()).isEqualTo(slug);

        assertThat(stored(org.getId()).getSlug()).isEqualTo(slug);
        BizException error = assertThrows(BizException.class, () -> {
            try {
                organizationService.getById(slug).block(TIMEOUT);
            } catch (RuntimeException e) {
                throw e instanceof BizException ? e : (BizException) e.getCause();
            }
        });
        System.out.println("[OrganizationServiceImplLogoAndSlugPinMongoTest] PINNED slug " + slug + " not resolvable: " + error.getError());
        assertThat(error.getError()).isEqualTo(BizError.UNABLE_TO_FIND_VALID_ORG);
        assertThat(organizationService.getById(org.getId()).block(TIMEOUT).getId()).as("the id still works").isEqualTo(org.getId());
    }
}
