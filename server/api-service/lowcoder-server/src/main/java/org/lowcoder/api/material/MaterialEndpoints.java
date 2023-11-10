package org.lowcoder.api.material;

import static org.lowcoder.infra.constant.NewUrl.MATERIAL_URL;

import java.util.List;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.domain.material.model.MaterialType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(MATERIAL_URL)
public interface MaterialEndpoints 
{
    public static final String DOWNLOAD_TYPE = "download";
    public static final String PREVIEW_TYPE = "preview";
	public static final String TAG_MATERIAL_MANAGEMENT = "File APIs";
	
	@Operation(
			tags = TAG_MATERIAL_MANAGEMENT,
		    operationId = "createFileUpload",
		    summary = "Upload new File",
		    description = "Upload a new binary File within Lowcoder and the current Organization / Workspace by the impersonated User, allowing users to add small files to their resources."
	)
    @PostMapping
    public Mono<ResponseView<MaterialView>> upload(@RequestBody UploadMaterialRequestDTO uploadMaterialRequestDTO);

    /**
     * @param type {@link #DOWNLOAD_TYPE,#PREVIEW_TYPE}
     */
	@Operation(
			tags = TAG_MATERIAL_MANAGEMENT,
		    operationId = "downloadFile",
		    summary = "Download File contents",
		    description = "Download the contents of a specific File within Lowcoder using its unique ID."
	)
    @GetMapping("/{id}")
    public Mono<Void> download(@PathVariable String id,
            @RequestParam(value = "type", defaultValue = DOWNLOAD_TYPE) String type,
            ServerHttpResponse serverHttpResponse);

	@Operation(
			tags = TAG_MATERIAL_MANAGEMENT,
		    operationId = "listFiles",
		    summary = "List uploaded Files",
		    description = "Retrieve a list of uploaded Files within Lowcoder, providing an overview of available files."
	)
    @GetMapping("/list")
    public Mono<ResponseView<List<MaterialView>>> getFileList();

	@Operation(
			tags = TAG_MATERIAL_MANAGEMENT,
		    operationId = "deleteFile",
		    summary = "Delete uploaded File",
		    description = "Permanently remove a specific File from Lowcoder using its unique ID."
	)
    @DeleteMapping("/{id}")
    public Mono<ResponseView<Boolean>> delete(@PathVariable String id);

    @Getter
    @Builder
    public static class MaterialView {
        private String id;
        private String filename;
    }

    @Data
    public static class UploadMaterialRequestDTO {

        private String filename;
        private String content;// in base64
        private MaterialType type;
    }

}
