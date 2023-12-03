package org.lowcoder.api.home;

import java.util.List;
import java.util.Set;

import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.infra.constant.NewUrl;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(NewUrl.FOLDER_URL)
public interface FolderEndpoints 
{
	public static final String TAG_FOLDER_MANAGEMENT = "Folder APIs";
	public static final String TAG_FOLDER_PERMISSIONS = "Folder Permissions APIs";
	
	@Operation(
			tags = TAG_FOLDER_MANAGEMENT,
		    operationId = "createFolder",
		    summary = "Create new Folder",
		    description = "Create a new Application Folder within the Lowcoder to organize Applications effectively."
	)
    @PostMapping
    public Mono<ResponseView<FolderInfoView>> create(@RequestBody Folder folder);

	@Operation(
			tags = TAG_FOLDER_MANAGEMENT,
		    operationId = "deleteFolder",
		    summary = "Delete Folder",
		    description = "Permanently remove an Application Folder from Lowcoder using its unique ID."
	)
    @DeleteMapping("/{id}")
    public Mono<ResponseView<Void>> delete(@PathVariable("id") String folderId);

    /**
     * update name only.
     */
	@Operation(
			tags = TAG_FOLDER_MANAGEMENT,
		    operationId = "updateFolder",
		    summary = "Update Folder",
		    description = "Modify the properties and settings of an existing Application Folder within Lowcoder."
	)
    @PutMapping
    public Mono<ResponseView<FolderInfoView>> update(@RequestBody Folder folder);

    /**
     * get all files under folder
     */
	@Operation(
			tags = TAG_FOLDER_MANAGEMENT,
		    operationId = "listFolderContents",
		    summary = "Get Folder contents",
		    description = "Retrieve the contents of an Application Folder within Lowcoder, including Applications and Subfolders."
	)
    @GetMapping("/elements")
    public Mono<ResponseView<List<?>>> getElements(@RequestParam(value = "id", required = false) String folderId,
            @RequestParam(value = "applicationType", required = false) ApplicationType applicationType);

	@Operation(
			tags = TAG_FOLDER_MANAGEMENT,
		    operationId = "moveFolder",
		    summary = "Move Folder",
		    description = "Relocate an Application Folder to a different location in the Folder hierarchy in Lowcoder using its unique ID."
	)
    @PutMapping("/move/{id}")
    public Mono<ResponseView<Void>> move(@PathVariable("id") String applicationLikeId,
            @RequestParam(value = "targetFolderId", required = false) String targetFolderId);

	@Operation(
			tags = TAG_FOLDER_PERMISSIONS,
		    operationId = "updateFolderPermissions",
		    summary = "Update Folder permissions",
		    description = "Modify permissions associated with a specific Application Folder within Lowcoder."
	)
    @PutMapping("/{folderId}/permissions/{permissionId}")
    public Mono<ResponseView<Void>> updatePermission(@PathVariable String folderId,
            @PathVariable String permissionId,
            @RequestBody UpdatePermissionRequest updatePermissionRequest);

	@Operation(
			tags = TAG_FOLDER_PERMISSIONS,
		    operationId = "revokeFolderPermissions",
		    summary = "Revoke permissions from Folder",
		    description = "Remove specific permissions from an Application Folder within Lowcoder, ensuring that selected Users or User-Groups no longer have access."
	)
    @DeleteMapping("/{folderId}/permissions/{permissionId}")
    public Mono<ResponseView<Void>> removePermission(
            @PathVariable String folderId,
            @PathVariable String permissionId);

	@Operation(
			tags = TAG_FOLDER_PERMISSIONS,
		    operationId = "grantFolderPermissions",
		    summary = "Grant permissions to Folder",
		    description = "Assign new permissions to a specific Application Folder within Lowcoder, allowing authorized users to access it."
	)
    @PostMapping("/{folderId}/permissions")
    public Mono<ResponseView<Void>> grantPermission(
            @PathVariable String folderId,
            @RequestBody BatchAddPermissionRequest request);

	@Operation(
			tags = TAG_FOLDER_PERMISSIONS,
				    operationId = "listFolderPermissions",
				    summary = "Get Folder permissions",
				    description = "Retrieve detailed information about permissions associated with a specific Application Folder within Lowcoder."
	)
    @GetMapping("/{folderId}/permissions")
    public Mono<ResponseView<ApplicationPermissionView>> getApplicationPermissions(@PathVariable String folderId);

    public record BatchAddPermissionRequest(String role, Set<String> userIds, Set<String> groupIds) {
    }

    public record UpdatePermissionRequest(String role) {
    }

}
