package org.lowcoder.api.bundle;

import io.swagger.v3.oas.annotations.Operation;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.infra.constant.NewUrl;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping(NewUrl.BUNDLE_URL)
public interface BundleEndpoints
{
	public static final String TAG_BUNDLE_MANAGEMENT = "Bundle APIs";
	public static final String TAG_BUNDLE_PERMISSIONS = "Bundle Permissions APIs";
	
	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
		    operationId = "createBundle",
		    summary = "Create new Bundle",
		    description = "Create a new Application Bundle within the Lowcoder to organize Applications effectively."
	)
    @PostMapping
    public Mono<ResponseView<BundleInfoView>> create(@RequestBody Bundle bundle);

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
		    operationId = "deleteBundle",
		    summary = "Delete Bundle",
		    description = "Permanently remove an Application Bundle from Lowcoder using its unique ID."
	)
    @DeleteMapping("/{id}")
    public Mono<ResponseView<Void>> delete(@PathVariable("id") String bundleId);

    /**
     * update name only.
     */
	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
		    operationId = "updateBundle",
		    summary = "Update Bundle",
		    description = "Modify the properties and settings of an existing Application Bundle within Lowcoder."
	)
    @PutMapping
    public Mono<ResponseView<BundleInfoView>> update(@RequestBody Bundle bundle);

    /**
     * get all files under bundle
     */
	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
		    operationId = "listBundleContents",
		    summary = "Get Bundle contents",
		    description = "Retrieve the contents of an Application Bundle within Lowcoder, including Applications."
	)
    @GetMapping("/elements")
    public Mono<ResponseView<List<?>>> getElements(@RequestParam(value = "id", required = false) String bundleId,
            @RequestParam(value = "applicationType", required = false) ApplicationType applicationType);

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
		    operationId = "moveBundle",
		    summary = "Move Bundle",
		    description = "Relocate an Application Bundle to a different location in the Bundle hierarchy in Lowcoder using its unique ID."
	)
    @PutMapping("/move/{id}")
    public Mono<ResponseView<Void>> move(@PathVariable("id") String applicationLikeId,
            @RequestParam(value = "targetBundleId", required = false) String targetBundleId);

	@Operation(
			tags = TAG_BUNDLE_PERMISSIONS,
		    operationId = "updateBundlePermissions",
		    summary = "Update Bundle permissions",
		    description = "Modify permissions associated with a specific Application Bundle within Lowcoder."
	)
    @PutMapping("/{bundleId}/permissions/{permissionId}")
    public Mono<ResponseView<Void>> updatePermission(@PathVariable String bundleId,
            @PathVariable String permissionId,
            @RequestBody UpdatePermissionRequest updatePermissionRequest);

	@Operation(
			tags = TAG_BUNDLE_PERMISSIONS,
		    operationId = "revokeBundlePermissions",
		    summary = "Revoke permissions from Bundle",
		    description = "Remove specific permissions from an Application Bundle within Lowcoder, ensuring that selected Users or User-Groups no longer have access."
	)
    @DeleteMapping("/{bundleId}/permissions/{permissionId}")
    public Mono<ResponseView<Void>> removePermission(
            @PathVariable String bundleId,
            @PathVariable String permissionId);

	@Operation(
			tags = TAG_BUNDLE_PERMISSIONS,
		    operationId = "grantBundlePermissions",
		    summary = "Grant permissions to Bundle",
		    description = "Assign new permissions to a specific Application Bundle within Lowcoder, allowing authorized users to access it."
	)
    @PostMapping("/{bundleId}/permissions")
    public Mono<ResponseView<Void>> grantPermission(
            @PathVariable String bundleId,
            @RequestBody BatchAddPermissionRequest request);

	@Operation(
			tags = TAG_BUNDLE_PERMISSIONS,
				    operationId = "listBundlePermissions",
				    summary = "Get Bundle permissions",
				    description = "Retrieve detailed information about permissions associated with a specific Application Bundle within Lowcoder."
	)
    @GetMapping("/{bundleId}/permissions")
    public Mono<ResponseView<ApplicationPermissionView>> getApplicationPermissions(@PathVariable String bundleId);

    public record BatchAddPermissionRequest(String role, Set<String> userIds, Set<String> groupIds) {
    }

    public record UpdatePermissionRequest(String role) {
    }

}
