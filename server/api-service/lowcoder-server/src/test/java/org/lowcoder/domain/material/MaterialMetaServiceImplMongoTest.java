package org.lowcoder.domain.material;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.material.model.MaterialMeta;
import org.lowcoder.domain.material.model.MaterialType;
import org.lowcoder.domain.material.service.meta.MaterialMetaService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.IDUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * MaterialMetaServiceImpl against the MongoDB test container (unit U14, task L3-11d). Org ids are generated per test.
 * create is used as setup. existsByOrgIdAndFilename had no caller in main code and is deleted on coverage-gate (the owner's unreferenced-code deletions), so it is not tested.
 * MaterialApiServiceImpl (L2-10) is not repeated.
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
class MaterialMetaServiceImplMongoTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(30);

    @Autowired
    private MaterialMetaService materialMetaService;

    private MaterialMeta create(String orgId, String filename, long size, MaterialType type) {
        return materialMetaService.create(MaterialMeta.builder().orgId(orgId).filename(filename).size(size).type(type).build()).block(TIMEOUT);
    }

    /** Catches: a lost field, findById(null) not failing with INVALID_PARAMETER, an unknown id not failing with NO_RESOURCE_FOUND. */
    @Test
    void createThenFindByIdRoundTripsTheFieldsAndBadIdsFail() {
        String orgId = IDUtils.generate();
        MaterialMeta created = create(orgId, "logo.png", 1234L, MaterialType.LOGO);

        MaterialMeta read = materialMetaService.findById(created.getId()).block(TIMEOUT);

        System.out.println("[MaterialMetaServiceImplMongoTest] created " + created.getId());
        assertThat(read.getOrgId()).isEqualTo(orgId);
        assertThat(read.getFilename()).isEqualTo("logo.png");
        assertThat(read.getSize()).isEqualTo(1234L);
        assertThat(read.getType()).isEqualTo(MaterialType.LOGO);
        BizException nullId = assertThrows(BizException.class, () -> materialMetaService.findById(null).block(TIMEOUT));
        assertThat(nullId.getError()).isEqualTo(BizError.INVALID_PARAMETER);
        BizException unknown = assertThrows(BizException.class, () -> materialMetaService.findById(IDUtils.generate()).block(TIMEOUT));
        assertThat(unknown.getError()).isEqualTo(BizError.NO_RESOURCE_FOUND);
    }

    /** Catches: the sum taken over other orgs' rows, a missing org not answering 0. */
    @Test
    void totalSizeSumsOnlyTheOrgsMaterialsAndIsZeroWithoutAny() {
        String orgId = IDUtils.generate();
        create(orgId, "a.png", 100L, MaterialType.COMMON);
        create(orgId, "b.png", 250L, MaterialType.LOGO);
        create(IDUtils.generate(), "other.png", 9999L, MaterialType.COMMON);

        assertThat(materialMetaService.totalSize(orgId).block(TIMEOUT)).isEqualTo(350L);
        assertThat(materialMetaService.totalSize(IDUtils.generate()).block(TIMEOUT)).isZero();
    }

    /** Catches: a cross-org leak in the listing, deleteById removing more than one row. */
    @Test
    void getByOrgIdIsScopedToTheOrgAndDeleteByIdRemovesOnlyThatRow() {
        String orgId = IDUtils.generate();
        MaterialMeta a = create(orgId, "a.png", 1L, MaterialType.COMMON);
        MaterialMeta b = create(orgId, "b.png", 2L, MaterialType.COMMON);
        create(IDUtils.generate(), "c.png", 3L, MaterialType.COMMON);

        assertThat(materialMetaService.getByOrgId(orgId).collectList().block(TIMEOUT))
                .extracting(MaterialMeta::getId).containsExactlyInAnyOrder(a.getId(), b.getId());

        materialMetaService.deleteById(a.getId()).block(TIMEOUT);

        assertThat(materialMetaService.getByOrgId(orgId).collectList().block(TIMEOUT))
                .extracting(MaterialMeta::getId).containsExactly(b.getId());
        assertThat(materialMetaService.getByOrgId(IDUtils.generate()).collectList().block(TIMEOUT)).isEmpty();
    }
}
