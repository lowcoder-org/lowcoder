package org.lowcoder.api.contract.support;

import org.lowcoder.api.material.MaterialEndpoints.MaterialView;
import org.lowcoder.api.material.MaterialEndpoints.UploadMaterialRequestDTO;
import org.lowcoder.domain.material.model.MaterialMeta;
import org.lowcoder.domain.material.model.MaterialType;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Samples of the material (file) types of WP7 (docs/API_PAYLOAD_TEST_PLAN.md §3.3, task T7.1), with the conventions of
 * {@link PayloadSamples}.
 */
public final class MaterialSamples {

    /** The bytes of the uploaded and downloaded file, outside ASCII so a charset change shows. */
    public static final byte[] FILE_BYTES = "MaterialSamples.file: é ✓".getBytes(StandardCharsets.UTF_8);
    /** A file name whose extension {@code MediaTypeUtils} maps to a media type. */
    public static final String FILENAME = "MaterialSamples.file.png";
    /** Above {@code Integer.MAX_VALUE}, as {@code MaterialMeta.size} is a {@code long}. */
    public static final long FILE_SIZE = 3_000_000_300L;

    private MaterialSamples() {
    }

    /** {@code MaterialEndpoints#upload}; {@code content} is base64, as the declaration says. */
    public static UploadMaterialRequestDTO uploadMaterialRequestDTO() {
        UploadMaterialRequestDTO request = new UploadMaterialRequestDTO();
        request.setFilename("UploadMaterialRequestDTO.filename");
        request.setContent(Base64.getEncoder().encodeToString(FILE_BYTES));
        request.setType(MaterialType.LOGO);
        return request;
    }

    public static MaterialView materialView() {
        return materialView("MaterialView");
    }

    static MaterialView materialView(String prefix) {
        return MaterialView.builder().id(prefix + ".id").filename(prefix + ".filename").build();
    }

    /** The stored metadata the service hands the controller; its id and file name become a {@link MaterialView}. */
    public static MaterialMeta materialMeta(String id, String filename) {
        MaterialMeta meta = MaterialMeta.builder().filename(filename).orgId("MaterialMeta.orgId").size(FILE_SIZE).type(MaterialType.LOGO).build();
        meta.setId(id);
        return meta;
    }
}
