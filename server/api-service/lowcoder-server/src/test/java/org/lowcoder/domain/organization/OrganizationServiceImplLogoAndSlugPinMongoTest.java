package org.lowcoder.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.lowcoder.domain.organization.model.OrganizationState.ACTIVE;

import java.nio.charset.StandardCharsets;
import java.util.List;
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
 * Two section 9 rows found by L3-11b on OrganizationServiceImpl (follow-up): the dangling logo reference (BF-064, fixed)
 * and the hyphenated slug (BF-133, fixed). Shared {@code test} context, ids generated per test.
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
     * BF-064 (formerly pinned as plan section 9 row "deleteLogo keeps a dangling logoAssetId (null not written by
     * convertToUpdate)": the asset was deleted, the reference stayed, and a second delete failed naming the deleted asset):
     * deleteLogo unsets the reference and deletes the asset, by the organization's id, gid or slug, and a second delete
     * fails as "no logo" ({@code ASSET_NOT_FOUND} with an empty argument).
     */
    @Test
    void deleteLogoRemovesTheReferenceAndTheAssetByIdGidOrSlugBF064() {
        for (String by : List.of("id", "gid", "slug")) {
            Organization org = saveOrg();
            String key = switch (by) {
                case "gid" -> org.getGid();
                case "slug" -> org.getSlug();
                default -> org.getId();
            };
            organizationService.uploadLogo(key, pngPart()).block(TIMEOUT);
            String assetId = stored(org.getId()).getLogoAssetId();
            assertThat(assetId).as("uploaded by " + by).isNotBlank();

            assertThat(organizationService.deleteLogo(key).block(TIMEOUT)).as("deleted by " + by).isTrue();

            System.out.println("[OrganizationServiceImplLogoAndSlugPinMongoTest] by " + by + ": asset " + assetId + " present="
                    + assetRepository.findById(assetId).blockOptional(TIMEOUT).isPresent() + ", reference " + stored(org.getId()).getLogoAssetId());
            assertThat(assetRepository.findById(assetId).blockOptional(TIMEOUT)).as("the asset is deleted").isEmpty();
            assertThat(stored(org.getId()).getLogoAssetId()).as("the reference is removed").isNull();
            BizException again = assertThrows(BizException.class, () -> {
                try {
                    organizationService.deleteLogo(key).block(TIMEOUT);
                } catch (RuntimeException e) {
                    throw e instanceof BizException ? e : (BizException) e.getCause();
                }
            });
            assertThat(again.getError()).isEqualTo(BizError.NO_RESOURCE_FOUND);
            assertThat(again.getMessageKey()).isEqualTo("ASSET_NOT_FOUND");
            assertThat(again.getArgs()).containsExactly("");
        }
    }

    /**
     * BF-133 (was pinned as plan section 9 row "a hyphenated slug is accepted but unreachable (isGID)"): SlugUtils.validate
     * accepts a hyphen, and the lookups took every key with a hyphen for a gid (FieldName.guessFieldNameFromId), so such a
     * slug was never found. A key with a hyphen is now looked up as a gid and then as a slug, in getById,
     * getByIdWithDeleted, getOrgCommonSettings and getByIds.
     */
    @Test
    void aHyphenatedSlugIsFoundByEveryLookupBF133() {
        Organization org = saveOrg();
        String slug = "my-" + newId();

        assertThat(organizationService.updateSlug(org.getId(), slug).block(TIMEOUT).getSlug()).isEqualTo(slug);

        assertThat(stored(org.getId()).getSlug()).isEqualTo(slug);
        Organization found = organizationService.getById(slug).block(TIMEOUT);
        System.out.println("[OrganizationServiceImplLogoAndSlugPinMongoTest] slug " + slug + " -> " + found.getId());
        assertThat(found.getId()).isEqualTo(org.getId());
        assertThat(organizationService.getByIdWithDeleted(slug).block(TIMEOUT).getId()).isEqualTo(org.getId());
        assertThat(organizationService.getOrgCommonSettings(slug).block(TIMEOUT)).isEqualTo(stored(org.getId()).getCommonSettings());
        assertThat(organizationService.getByIds(List.of(slug)).map(Organization::getId).collectList().block(TIMEOUT))
                .containsExactly(org.getId());
        assertThat(organizationService.getById(org.getId()).block(TIMEOUT).getId()).as("the id still works").isEqualTo(org.getId());
        assertThat(organizationService.getById(org.getGid()).block(TIMEOUT).getId()).as("the gid still works").isEqualTo(org.getId());
    }

    /**
     * BF-133: the gid is looked up first, so a slug that spells another organization's gid does not take its lookups over;
     * a key with a hyphen that names no organization is still UNABLE_TO_FIND_VALID_ORG.
     */
    @Test
    void aGidIsLookedUpBeforeASlugAndAnUnknownHyphenatedKeyIsNotFoundBF133() {
        Organization owner = saveOrg();
        Organization other = saveOrg();
        assertThat(organizationService.updateSlug(other.getId(), owner.getGid()).block(TIMEOUT).getSlug()).isEqualTo(owner.getGid());

        assertThat(organizationService.getById(owner.getGid()).block(TIMEOUT).getId()).isEqualTo(owner.getId());
        assertThat(organizationService.getByIdWithDeleted(owner.getGid()).block(TIMEOUT).getId()).isEqualTo(owner.getId());

        String unknown = "no-such-" + newId();
        BizException error = assertThrows(BizException.class, () -> {
            try {
                organizationService.getById(unknown).block(TIMEOUT);
            } catch (RuntimeException e) {
                throw e instanceof BizException ? e : (BizException) e.getCause();
            }
        });
        System.out.println("[OrganizationServiceImplLogoAndSlugPinMongoTest] unknown " + unknown + " -> " + error.getError());
        assertThat(error.getError()).isEqualTo(BizError.UNABLE_TO_FIND_VALID_ORG);
        assertThat(organizationService.getByIds(List.of(unknown)).collectList().block(TIMEOUT)).isEmpty();
    }
}
