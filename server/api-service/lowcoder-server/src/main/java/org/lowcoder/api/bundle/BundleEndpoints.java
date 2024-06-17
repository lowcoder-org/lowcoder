package org.lowcoder.api.bundle;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.annotation.Nullable;
import org.apache.commons.lang3.BooleanUtils;
import org.lowcoder.api.bundle.view.BundleInfoView;
import org.lowcoder.api.bundle.view.BundlePermissionView;
import org.lowcoder.api.bundle.view.MarketplaceBundleInfoView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.bundle.model.Bundle;
import org.lowcoder.domain.bundle.model.BundleStatus;
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
    public Mono<ResponseView<BundleInfoView>> create(@RequestBody CreateBundleRequest bundle);

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
		    operationId = "deleteBundle",
		    summary = "Delete Bundle",
		    description = "Permanently remove an Application Bundle from Lowcoder using its unique ID."
	)
    @DeleteMapping("/{id}")
    public Mono<ResponseView<Void>> delete(@PathVariable("id") String bundleId);


	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
			operationId = "recycleBundle",
			summary = "Move Bundle to bin (do not delete)",
			description = "Move a Lowcoder Bundle identified by its ID to the recycle bin without permanent deletion."
	)
	@PutMapping("/recycle/{bundleId}")
	public Mono<ResponseView<Boolean>> recycle(@PathVariable String bundleId);

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
			operationId = "restoreRecycledBundle",
			summary = "Restore recycled Bundle",
			description = "Restore a previously recycled Lowcoder Bundle identified by its ID"
	)
	@PutMapping("/restore/{bundleId}")
	public Mono<ResponseView<Boolean>> restore(@PathVariable String bundleId);

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
			operationId = "listRecycledBundles",
			summary = "List recycled Bundles in bin",
			description = "List all the recycled Lowcoder Bundles in the recycle bin where the authenticated or impersonated user has access."
	)
	@GetMapping("/recycle/list")
	public Mono<ResponseView<List<BundleInfoView>>> getRecycledBundles();

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
			operationId = "getBundleDataInViewMode",
			summary = "Get Bundle data in view mode",
			description = "Retrieve the data of a Lowcoder Bundle in view-mode by its ID."
	)
	@GetMapping("/{bundleId}/view")
	public Mono<ResponseView<BundleInfoView>> getPublishedBundle(@PathVariable String bundleId);

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
			operationId = "getMarketplaceBundleDataInViewMode",
			summary = "Get Marketplace Bundle data in view mode",
			description = "Retrieve the DSL data of a Lowcoder Bundle in view-mode by its ID for the Marketplace."
	)
	@GetMapping("/{bundleId}/view_marketplace")
	public Mono<ResponseView<BundleInfoView>> getPublishedMarketPlaceBundle(@PathVariable String bundleId);

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
			operationId = "getAgencyProfileBundleDataInViewMode",
			summary = "Get Agency profile Bundle data in view mode",
			description = "Retrieve the DSL data of a Lowcoder Bundle in view-mode by its ID marked as Agency Profile."
	)
	@GetMapping("/{bundleId}/view_agency")
	public Mono<ResponseView<BundleInfoView>> getAgencyProfileBundle(@PathVariable String bundleId);

    /**
     * update name only.
     */
	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
		    operationId = "updateBundle",
		    summary = "Update Bundle",
		    description = "Modify the properties and settings of an existing Bundle Bundle within Lowcoder."
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
		    description = "Retrieve the contents of an Bundle Bundle within Lowcoder, including Bundles."
	)
    @GetMapping("/{bundleId}/elements")
    public Mono<ResponseView<List<?>>> getElements(@PathVariable String bundleId,
            @RequestParam(value = "applicationType", required = false) ApplicationType applicationType);

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
		    operationId = "moveApp",
		    summary = "Move App to Bundle",
		    description = "Relocate an application to a different bundle in Lowcoder using its unique ID."
	)
    @PutMapping("/moveApp/{id}")
    public Mono<ResponseView<Void>> moveApp(@PathVariable("id") String applicationId,
            @RequestParam(value = "fromBundleId") String fromBundleId,
			@RequestParam(value = "toBundleId") String toBundleId);

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
			operationId = "addApp",
			summary = "Add App to Bundle",
			description = "Add an application to a bundle in Lowcoder using its unique ID."
	)

	@PutMapping("/addApp/{id}")
	public Mono<ResponseView<Void>> addApp(@PathVariable("id") String applicationId,
											@RequestParam(value = "toBundleId") String toBundleId);

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
			operationId = "reorderBundle",
			summary = "Reorder Bundle",
			description = "Reorder bundle."
	)
	@PutMapping("/{bundleId}/reorder")
	public Mono<ResponseView<Void>> reorder(@PathVariable("bundleId") String bundleId,
										 @RequestParam(value = "elementIds", required = true) List<String> elementIds);

	@Operation(
			tags = TAG_BUNDLE_PERMISSIONS,
		    operationId = "updateBundlePermissions",
		    summary = "Update Bundle permissions",
		    description = "Modify permissions associated with a specific Bundle Bundle within Lowcoder."
	)
    @PutMapping("/{bundleId}/permissions/{permissionId}")
    public Mono<ResponseView<Void>> updatePermission(@PathVariable String bundleId,
            @PathVariable String permissionId,
            @RequestBody UpdatePermissionRequest updatePermissionRequest);

	@Operation(
			tags = TAG_BUNDLE_PERMISSIONS,
		    operationId = "revokeBundlePermissions",
		    summary = "Revoke permissions from Bundle",
		    description = "Remove specific permissions from an Bundle Bundle within Lowcoder, ensuring that selected Users or User-Groups no longer have access."
	)
    @DeleteMapping("/{bundleId}/permissions/{permissionId}")
    public Mono<ResponseView<Void>> removePermission(
            @PathVariable String bundleId,
            @PathVariable String permissionId);

	@Operation(
			tags = TAG_BUNDLE_PERMISSIONS,
		    operationId = "grantBundlePermissions",
		    summary = "Grant permissions to Bundle",
		    description = "Assign new permissions to a specific Bundle Bundle within Lowcoder, allowing authorized users to access it."
	)
    @PostMapping("/{bundleId}/permissions")
    public Mono<ResponseView<Void>> grantPermission(
            @PathVariable String bundleId,
            @RequestBody BatchAddPermissionRequest request);

	@Operation(
			tags = TAG_BUNDLE_PERMISSIONS,
				    operationId = "listBundlePermissions",
				    summary = "Get Bundle permissions",
				    description = "Retrieve detailed information about permissions associated with a specific Bundle Bundle within Lowcoder."
	)
    @GetMapping("/{bundleId}/permissions")
    public Mono<ResponseView<BundlePermissionView>> getBundlePermissions(@PathVariable String bundleId);

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
			operationId = "listBundles",
			summary = "List Bundles of current User",
			description = "Retrieve a list of Lowcoder Bundles accessible by the authenticated or impersonated user."
	)
	@GetMapping("/list")
	public Mono<ResponseView<List<BundleInfoView>>> getBundles(@RequestParam(required = false) BundleStatus bundleStatus);

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
			operationId = "listMarketplaceBundles",
			summary = "List Marketplace Bundles",
			description = "Retrieve a list of Lowcoder Bundles that are published to the Marketplace"
	)
	@GetMapping("/marketplace-bundles")
	public Mono<ResponseView<List<MarketplaceBundleInfoView>>> getMarketplaceBundles();

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
			operationId = "listAgencyProfileBundles",
			summary = "List agency profile Bundles",
			description = "Retrieve a list of Lowcoder Bundles that are set as agency profiles"
	)
	@GetMapping("/agency-profiles")
	public Mono<ResponseView<List<MarketplaceBundleInfoView>>> getAgencyProfileBundles();

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
			operationId = "setBundleAsPublic",
			summary = "Set Bundle as publicly available",
			description = "Set a Lowcoder Bundle identified by its ID as generally publicly available. This is a preparation to published a Lowcoder Bundle in production mode."
	)
	@PutMapping("/{bundleId}/public-to-all")
	public Mono<ResponseView<Boolean>> setBundlePublicToAll(@PathVariable String bundleId,
																 @RequestBody BundleEndpoints.BundlePublicToAllRequest request);

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
			operationId = "setBundleAsPublicToMarketplace",
			summary = "Set Bundle as publicly available on marketplace but to only logged in users",
			description = "Set a Lowcoder Bundle identified by its ID as publicly available on marketplace but to only logged in users."
	)
	@PutMapping("/{bundleId}/public-to-marketplace")
	public Mono<ResponseView<Boolean>> setBundlePublicToMarketplace(@PathVariable String bundleId,
																		 @RequestBody BundleEndpoints.BundlePublicToMarketplaceRequest request);

	@Operation(
			tags = TAG_BUNDLE_MANAGEMENT,
			operationId = "setBundleAsAgencyProfile",
			summary = "Set Bundle as agency profile",
			description = "Set a Lowcoder Bundle identified by its ID as as agency profile but to only logged in users."
	)
	@PutMapping("/{bundleId}/agency-profile")
	public Mono<ResponseView<Boolean>> setBundleAsAgencyProfile(@PathVariable String bundleId,
																	 @RequestBody BundleEndpoints.BundleAsAgencyProfileRequest request);
	
	public record BundlePublicToAllRequest(Boolean publicToAll) {
		@Override
		public Boolean publicToAll() {
			return BooleanUtils.isTrue(publicToAll);
		}
	}

	public record BundlePublicToMarketplaceRequest(Boolean publicToMarketplace) {
		@Override
		public Boolean publicToMarketplace() {
			return BooleanUtils.isTrue(publicToMarketplace);
		}

	}

	public record BundleAsAgencyProfileRequest(Boolean agencyProfile) {
		@Override
		public Boolean agencyProfile() {
			return BooleanUtils.isTrue(agencyProfile);
		}
	}

	public record BatchAddPermissionRequest(String role, Set<String> userIds, Set<String> groupIds) {
    }

    public record UpdatePermissionRequest(String role) {
    }

	public record CreateBundleRequest(@JsonProperty("orgId") String organizationId,
										   String name,
										   String title,
										   String description,
										   String category,
										   String image,
										   @Nullable String folderId) {
	}

}
