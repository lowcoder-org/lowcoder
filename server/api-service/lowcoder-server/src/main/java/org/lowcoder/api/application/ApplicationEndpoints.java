package org.lowcoder.api.application;

import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.annotation.Nullable;

import org.apache.commons.lang3.BooleanUtils;
import org.lowcoder.api.application.view.ApplicationInfoView;
import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.application.view.ApplicationView;
import org.lowcoder.api.application.view.MarketplaceApplicationInfoView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.UserHomepageView;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.Operation;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = {Url.APPLICATION_URL, NewUrl.APPLICATION_URL})
public interface ApplicationEndpoints 
{
	public static final String TAG_APPLICATION_MANAGEMENT = "Application APIs";
	public static final String TAG_APPLICATION_PERMISSIONS = "Application Permissions APIs";
	
	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
		    operationId = " createApplication",
		    summary = "Create a new Application",
		    description = "Create a new Lowcoder Application based on the Organization-ID where the authenticated or impersonated user has access."
	)
	@PostMapping
    public Mono<ResponseView<ApplicationView>> create(@RequestBody CreateApplicationRequest createApplicationRequest);

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
		    operationId = "createApplicationFromTemplate",
		    summary = "Create an Application from a predefined Template",
		    description = "Use an Application-Template to create a new Application in an Organization where the authenticated or impersonated user has access."
	)
    @PostMapping("/createFromTemplate")
    public Mono<ResponseView<ApplicationView>> createFromTemplate(@RequestParam String templateId);

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
		    operationId = "recycleApplication",
		    summary = "Move Application to bin (do not delete)",
		    description = "Move a Lowcoder Application identified by its ID to the recycle bin without permanent deletion."
	)
    @PutMapping("/recycle/{applicationId}")
    public Mono<ResponseView<Boolean>> recycle(@PathVariable String applicationId);

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
		    operationId = "restoreRecycledApplication",
		    summary = "Restore recycled Application",
		    description = "Restore a previously recycled Lowcoder Application identified by its ID"
	)
    @PutMapping("/restore/{applicationId}")
    public Mono<ResponseView<Boolean>> restore(@PathVariable String applicationId);

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
		    operationId = "listRecycledApplications",
		    summary = "List recycled Applications in bin",
		    description = "List all the recycled Lowcoder Applications in the recycle bin where the authenticated or impersonated user has access."
	)
    @GetMapping("/recycle/list")
    public Mono<ResponseView<List<ApplicationInfoView>>> getRecycledApplications();

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
		    operationId = "deleteApplication",
		    summary = "Delete Application by ID",
		    description = "Permanently delete a Lowcoder Application identified by its ID."
	)
    @DeleteMapping("/{applicationId}")
    public Mono<ResponseView<ApplicationView>> delete(@PathVariable String applicationId);

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
		    operationId = "getApplicationDataInEditMode",
		    summary = "Get Application data in edit mode",
		    description = "Retrieve the DSL data of a Lowcoder Application in edit-mode by its ID."
	)
    @GetMapping("/{applicationId}")
    public Mono<ResponseView<ApplicationView>> getEditingApplication(@PathVariable String applicationId);

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
		    operationId = "getApplicatioDataInViewMode",
		    summary = "Get Application data in view mode",
		    description = "Retrieve the DSL data of a Lowcoder Application in view-mode by its ID."
	)
    @GetMapping("/{applicationId}/view")
    public Mono<ResponseView<ApplicationView>> getPublishedApplication(@PathVariable String applicationId);

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
			operationId = "getMarketplaceApplicationDataInViewMode",
			summary = "Get Marketplace Application data in view mode",
			description = "Retrieve the DSL data of a Lowcoder Application in view-mode by its ID for the marketplace."
	)
	@GetMapping("/{applicationId}/view_marketplace")
	public Mono<ResponseView<ApplicationView>> getPublishedMarketPlaceApplication(@PathVariable String applicationId);

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
			operationId = "getAgencyProfileApplicationDataInViewMode",
			summary = "Get Agency profile Application data in view mode",
			description = "Retrieve the DSL data of a Lowcoder Application in view-mode by its ID marked as agency profile."
	)
	@GetMapping("/{applicationId}/view_agency")
	public Mono<ResponseView<ApplicationView>> getAgencyProfileApplication(@PathVariable String applicationId);

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
		    operationId = "updateApplication",
		    summary = "Update Application by ID",
		    description = "Update a Lowcoder Application identified by its ID."
	)
    @PutMapping("/{applicationId}")
    public Mono<ResponseView<ApplicationView>> update(@PathVariable String applicationId,
            @RequestBody Application newApplication);

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
		    operationId = "publicApplication",
		    summary = "Publish Application for users",
		    description = "Set a Lowcoder Application identified by its ID as available to all selected Users or User-Groups. This is similar to the classic deployment. The Lowcoder Apps gets published in production mode."
	)
    @PostMapping("/{applicationId}/publish")
    public Mono<ResponseView<ApplicationView>> publish(@PathVariable String applicationId);

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
		    operationId = "getUserHomepageApplication",
		    summary = "Get the homepage Application of current User",
		    description = "Retrieve the first displayed Lowcoder Application for an authenticated or impersonated user."
	)
    @GetMapping("/home")
    public Mono<ResponseView<UserHomepageView>> getUserHomePage(@RequestParam(required = false, defaultValue = "0") int applicationType);

    @Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
    	    operationId = "listApplications",
    	    summary = "List Applications of current User",
    	    description = "Retrieve a list of Lowcoder Applications accessible by the authenticated or impersonated user."
    )
    @GetMapping("/list")
    public Mono<ResponseView<List<ApplicationInfoView>>> getApplications(@RequestParam(required = false) Integer applicationType,
            @RequestParam(required = false) ApplicationStatus applicationStatus,
            @RequestParam(defaultValue = "true") boolean withContainerSize);

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
			operationId = "listMarketplaceApplications",
			summary = "List marketplace Applications",
			description = "Retrieve a list of Lowcoder Applications that are published to the marketplace"
	)
	@GetMapping("/marketplace-apps")
	public Mono<ResponseView<List<MarketplaceApplicationInfoView>>> getMarketplaceApplications(@RequestParam(required = false) Integer applicationType);

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
			operationId = "listAgencyProfileApplications",
			summary = "List agency profile Applications",
			description = "Retrieve a list of Lowcoder Applications that are set as agency profiles"
	)
	@GetMapping("/agency-profiles")
	public Mono<ResponseView<List<MarketplaceApplicationInfoView>>> getAgencyProfileApplications(@RequestParam(required = false) Integer applicationType);

	@Operation(
			tags = TAG_APPLICATION_PERMISSIONS,
		    operationId = "updateApplicationPermissions",
		    summary = "Update Application permissions",
		    description = "Update the permissions of a specific Lowcoder Application identified by its ID."
	)
    @PutMapping("/{applicationId}/permissions/{permissionId}")
    public Mono<ResponseView<Boolean>> updatePermission(@PathVariable String applicationId,
            @PathVariable String permissionId,
            @RequestBody UpdatePermissionRequest updatePermissionRequest);

	@Operation(
			tags = TAG_APPLICATION_PERMISSIONS,
		    operationId = "revokeApplicationPermissions",
		    summary = "Revoke permissions from Application",
		    description = "Revoke permissions of a specific Lowcoder Application identified by its ID."
	)
    @DeleteMapping("/{applicationId}/permissions/{permissionId}")
    public Mono<ResponseView<Boolean>> removePermission(
            @PathVariable String applicationId,
            @PathVariable String permissionId);

	@Operation(
			tags = TAG_APPLICATION_PERMISSIONS,
		    operationId = "grantApplicationPermissions",
		    summary = "Grant permissions to Application",
		    description = "Grant new permissions to a specific Lowcoder Application identified by its ID."
	)
    @PutMapping("/{applicationId}/permissions")
    public Mono<ResponseView<Boolean>> grantPermission(
            @PathVariable String applicationId,
            @RequestBody BatchAddPermissionRequest request);


	@Operation(
			tags = TAG_APPLICATION_PERMISSIONS,
		    operationId = "listApplicationPermissions",
		    summary = "Get Application permissions",
		    description = "Retrieve the permissions of a specific Lowcoder Application identified by its ID."
	)
    @GetMapping("/{applicationId}/permissions")
    public Mono<ResponseView<ApplicationPermissionView>> getApplicationPermissions(@PathVariable String applicationId);

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
		    operationId = "setApplicationAsPublic",
		    summary = "Set Application as publicly available",
		    description = "Set a Lowcoder Application identified by its ID as generally publicly available. This is a preparation to published a Lowcoder Application in production mode."
	)
    @PutMapping("/{applicationId}/public-to-all")
    public Mono<ResponseView<Boolean>> setApplicationPublicToAll(@PathVariable String applicationId,
            @RequestBody ApplicationPublicToAllRequest request);

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
			operationId = "setApplicationAsPublicToMarketplace",
			summary = "Set Application as publicly available on marketplace but to only logged in users",
			description = "Set a Lowcoder Application identified by its ID as publicly available on marketplace but to only logged in users."
	)
	@PutMapping("/{applicationId}/public-to-marketplace")
	public Mono<ResponseView<Boolean>> setApplicationPublicToMarketplace(@PathVariable String applicationId,
																  @RequestBody ApplicationPublicToMarketplaceRequest request);

	@Operation(
			tags = TAG_APPLICATION_MANAGEMENT,
			operationId = "setApplicationAsAgencyProfile",
			summary = "Set Application as agency profile",
			description = "Set a Lowcoder Application identified by its ID as as agency profile but to only logged in users."
	)
	@PutMapping("/{applicationId}/agency-profile")
	public Mono<ResponseView<Boolean>> setApplicationAsAgencyProfile(@PathVariable String applicationId,
																	 @RequestBody ApplicationAsAgencyProfileRequest request);


	public record BatchAddPermissionRequest(String role, Set<String> userIds, Set<String> groupIds) {
    }

    public record ApplicationPublicToAllRequest(Boolean publicToAll) {
        @Override
        public Boolean publicToAll() {
            return BooleanUtils.isTrue(publicToAll);
        }
    }

	public record ApplicationPublicToMarketplaceRequest(Boolean publicToMarketplace, String title,
														String description, String category, String image) {
		@Override
		public Boolean publicToMarketplace() {
			return BooleanUtils.isTrue(publicToMarketplace);
		}

		@Override
		public String title() {
			return title;
		}

		@Override
		public String description() {
			return description;
		}

		@Override
		public String category() {
			return category;
		}

		@Override
		public String image() {
			return image;
		}

	}

	public record ApplicationAsAgencyProfileRequest(Boolean agencyProfile) {
		@Override
		public Boolean agencyProfile() {
			return BooleanUtils.isTrue(agencyProfile);
		}
	}

	public enum ApplicationRequestType {
		PUBLIC_TO_ALL,
		PUBLIC_TO_MARKETPLACE,
		AGENCY_PROFILE,
	}

    public record UpdatePermissionRequest(String role) {
    }

    public record CreateApplicationRequest(@JsonProperty("orgId") String organizationId,
                                           String name,
                                           Integer applicationType,
                                           Map<String, Object> publishedApplicationDSL,
                                           Map<String, Object> editingApplicationDSL,
                                           @Nullable String folderId) {
    }

}
