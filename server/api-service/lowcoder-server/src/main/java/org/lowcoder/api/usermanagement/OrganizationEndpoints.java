package org.lowcoder.api.usermanagement;

import java.util.List;

import javax.validation.Valid;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.usermanagement.view.OrgMemberListView;
import org.lowcoder.api.usermanagement.view.OrgView;
import org.lowcoder.api.usermanagement.view.UpdateOrgRequest;
import org.lowcoder.api.usermanagement.view.UpdateRoleRequest;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.model.Organization.OrganizationCommonSettings;
import org.lowcoder.domain.plugin.DatasourceMetaInfo;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;

import io.swagger.v3.oas.annotations.Operation;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = {Url.ORGANIZATION_URL, NewUrl.ORGANIZATION_URL})
public interface OrganizationEndpoints 
{
	public static final String TAG_ORGANIZATION_MANAGEMENT = "Organization APIs";
	public static final String TAG_ORGANIZATION_MEMBERS = "Organization Member APIs";
	
	@Operation(
			tags = TAG_ORGANIZATION_MANAGEMENT,
		    operationId = "createOrganization",
		    summary = "Create a new Organization",
		    description = "Create a new Organization (Workspace) within the Lowcoder platform as a encapsulated space for Applications, Users and Resources."
	)
    @PostMapping
    public Mono<ResponseView<OrgView>> create(@Valid @RequestBody Organization organization);

	@Operation(
			tags = TAG_ORGANIZATION_MANAGEMENT,
		    operationId = "updateOrganization",
		    summary = "Update Organization by ID",
		    description = "Modify the properties and settings of an existing Organization within Lowcoder identified by its unique ID."
	)
    @PutMapping("{orgId}/update")
    public Mono<ResponseView<Boolean>> update(@PathVariable String orgId,
            @Valid @RequestBody UpdateOrgRequest updateOrgRequest);

	@Operation(
			tags = TAG_ORGANIZATION_MANAGEMENT,
		    operationId = "uploadOrganizationLogo",
		    summary = "Upload Organization Logo",
		    description = "Upload an Organization logo for branding and identification for a Lowcoder Organization / Workspace."
	)
    @PostMapping("/{orgId}/logo")
    public Mono<ResponseView<Boolean>> uploadLogo(@PathVariable String orgId,
            @RequestPart("file") Mono<Part> fileMono);

	@Operation(
			tags = TAG_ORGANIZATION_MANAGEMENT,
		    operationId = "deleteOrganizationLogo",
		    summary = "Delete Organization Logo",
		    description = "Remove the logo associated with an Organization within Lowcoder."
	)
    @DeleteMapping("/{orgId}/logo")
    public Mono<ResponseView<Boolean>> deleteLogo(@PathVariable String orgId);

	@Operation(
			tags = TAG_ORGANIZATION_MEMBERS,
		    operationId = "listOrganizationMembers",
		    summary = "List Organization Members",
		    description = "Retrieve a list of members belonging to an Organization within Lowcoder."
	)
    @GetMapping("/{orgId}/members")
    public Mono<ResponseView<OrgMemberListView>> getOrgMembers(@PathVariable String orgId,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "count", required = false, defaultValue = "1000") int count);

	@Operation(
			tags = TAG_ORGANIZATION_MEMBERS,
		    operationId = "updateOrganizationMemberRole",
		    summary = "Update role of Member in Organization",
		    description = "Change the Role of a specific Member (User) within an Organization in Lowcoder using the unique ID of a user and the name of the existing Role."
	)
    @PutMapping("/{orgId}/role")
    public Mono<ResponseView<Boolean>> updateRoleForMember(@RequestBody UpdateRoleRequest updateRoleRequest,
            @PathVariable String orgId);

	@Operation(
			tags = TAG_ORGANIZATION_MEMBERS,
		    operationId = "switchOrganization",
		    summary = "Switch current users Organization",
		    description = "Trigger a switch of the active Organization for the current User within Lowcoder in regards to the Session. After this switch, the impersonated user will see all resources from the new / selected Organization."
	)
    @PutMapping("/switchOrganization/{orgId}")
    public Mono<ResponseView<?>> setCurrentOrganization(@PathVariable String orgId, ServerWebExchange serverWebExchange);

	@Operation(
			tags = TAG_ORGANIZATION_MANAGEMENT,
		    operationId = "deleteOrganization",
		    summary = "Delete Organization by ID",
		    description = "Permanently remove an Organization from Lowcoder using its unique ID."
	)
    @DeleteMapping("/{orgId}")
    public Mono<ResponseView<Boolean>> removeOrg(@PathVariable String orgId);

	@Operation(
			tags = TAG_ORGANIZATION_MEMBERS,
				    operationId = "leaveOrganization",
				    summary = "Remove current user from Organization",
				    description = "Allow the current user to voluntarily leave an Organization in Lowcoder, removing themselves from the organization's membership."
	)
    @DeleteMapping("/{orgId}/leave")
    public Mono<ResponseView<Boolean>> leaveOrganization(@PathVariable String orgId);

	@Operation(
			tags = TAG_ORGANIZATION_MANAGEMENT,
		    operationId = "deleteOrganization",
		    summary = "Delete Organization by ID",
		    description = "Permanently remove an User from an Organization in Lowcoder using its unique IDs."
	)
    @DeleteMapping("/{orgId}/remove")
    public Mono<ResponseView<Boolean>> removeUserFromOrg(@PathVariable String orgId,
            @RequestParam String userId);

	@Operation(
			tags = TAG_ORGANIZATION_MEMBERS,
		    operationId = "getOrganizationDatasourceTypes",
		    summary = "Get supported data source types for Organization",
		    description = "Retrieve a list of supported datasource types for an Organization within Lowcoder."
	)
    @GetMapping("/{orgId}/datasourceTypes")
    public Mono<ResponseView<List<DatasourceMetaInfo>>> getSupportedDatasourceTypes(@PathVariable String orgId);

	@Operation(
			tags = TAG_ORGANIZATION_MANAGEMENT,
		    operationId = "getOrganizationSettings",
		    summary = "Get Organization common Settings",
		    description = "Retrieve common settings (such as Themes and Auth Sources) and configurations for an Organization within Lowcoder using its unique ID."
	)
    @GetMapping("/{orgId}/common-settings")
    public Mono<ResponseView<OrganizationCommonSettings>> getOrgCommonSettings(@PathVariable String orgId);

	@Operation(
			tags = TAG_ORGANIZATION_MANAGEMENT,
		    operationId = "updateOrganizationSettings",
		    summary = "Update Organization common Settings",
		    description = "Modify common settings (such as Themes) and configurations for a Lowcoder Organization / Workspace."
	)
    @PutMapping("/{orgId}/common-settings")
    public Mono<ResponseView<Boolean>> updateOrgCommonSettings(@PathVariable String orgId, @RequestBody UpdateOrgCommonSettingsRequest request);

    public record UpdateOrgCommonSettingsRequest(String key, Object value) {

    }

}
