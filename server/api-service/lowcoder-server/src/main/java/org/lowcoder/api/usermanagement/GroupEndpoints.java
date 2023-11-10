package org.lowcoder.api.usermanagement;

import java.util.List;

import javax.validation.Valid;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.usermanagement.view.AddMemberRequest;
import org.lowcoder.api.usermanagement.view.CreateGroupRequest;
import org.lowcoder.api.usermanagement.view.GroupMemberAggregateView;
import org.lowcoder.api.usermanagement.view.GroupView;
import org.lowcoder.api.usermanagement.view.UpdateGroupRequest;
import org.lowcoder.api.usermanagement.view.UpdateRoleRequest;
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

import io.swagger.v3.oas.annotations.Operation;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = {Url.GROUP_URL, NewUrl.GROUP_URL})
public interface GroupEndpoints 
{
	public static final String TAG_GROUP_MANAGEMENT = "Group APIs";
	public static final String TAG_GROUP_MEMBERS = "Group Members APIs";

	@Operation(
			tags = TAG_GROUP_MANAGEMENT,
		    operationId = "createGroup",
		    summary = "Create User Group",
		    description = "Create a new User Group within the current Lowcoder Organization / Workspace for organizing and managing your Application users."
	)
    @PostMapping
    public Mono<ResponseView<GroupView>> create(@Valid @RequestBody CreateGroupRequest newGroup);

	@Operation(
			tags = TAG_GROUP_MANAGEMENT,
		    operationId = "updateGroup",
		    summary = "Update User Group",
		    description = "Modify the properties and settings of an existing User Group within Lowcoder, identified by the unique ID of a User Group."
	)
    @PutMapping("{groupId}/update")
    public Mono<ResponseView<Boolean>> update(@PathVariable String groupId,
            @Valid @RequestBody UpdateGroupRequest updateGroupRequest);

	@Operation(
			tags = TAG_GROUP_MANAGEMENT,
		    operationId = "deleteGroup",
		    summary = "Delete User Group",
		    description = "Permanently remove a User Group from Lowcoder using its unique ID."
	)
    @DeleteMapping("/{groupId}")
    public Mono<ResponseView<Boolean>> delete(@PathVariable String groupId);

	@Operation(
			tags = TAG_GROUP_MANAGEMENT,
		    operationId = "listGroups",
		    summary = "List User Groups",
		    description = "Retrieve a list of User Groups within Lowcoder, providing an overview of available groups, based on the access rights of the currently impersonated User."
	)
    @GetMapping("/list")
    public Mono<ResponseView<List<GroupView>>> getOrgGroups();

	@Operation(
			tags = TAG_GROUP_MEMBERS,
		    operationId = "listGroupMembers",
		    summary = "List User Group Members",
		    description = "Retrieve a list of Users / Members within a specific User Group in Lowcoder, showing the group's composition."
	)
    @GetMapping("/{groupId}/members")
    public Mono<ResponseView<GroupMemberAggregateView>> getGroupMembers(@PathVariable String groupId,
            @RequestParam(name = "page", required = false, defaultValue = "1") int page,
            @RequestParam(name = "count", required = false, defaultValue = "100") int count);

	@Operation(
			tags = TAG_GROUP_MEMBERS,
		    operationId = "addUserToGroup",
		    summary = "Add User to User Group",
		    description = "Include a User as a member of a specified User Group in Lowcoder, granting them access to group resources."
	)
    @PostMapping("/{groupId}/addMember")
    public Mono<ResponseView<Boolean>> addGroupMember(@PathVariable String groupId,
            @RequestBody AddMemberRequest addMemberRequest);

	@Operation(
			tags = TAG_GROUP_MEMBERS,
		    operationId = "updateRoleForGroupMember",
		    summary = "Update User Group member role",
		    description = "Modify the Role of a specific Member within a User Group in Lowcoder, ensuring proper access control."
	)
    @PutMapping("/{groupId}/role")
    public Mono<ResponseView<Boolean>> updateRoleForMember(@RequestBody UpdateRoleRequest updateRoleRequest,
            @PathVariable String groupId);

	@Operation(
			tags = TAG_GROUP_MEMBERS,
		    operationId = "leaveGroup",
		    summary = "Remove current User from User Group",
		    description = "Allow the current user to voluntarily leave a User Group in Lowcoder, removing themselves from the group's membership."
	)
    @DeleteMapping("/{groupId}/leave")
    public Mono<ResponseView<Boolean>> leaveGroup(@PathVariable String groupId);

	@Operation(
			tags = TAG_GROUP_MEMBERS,
		    operationId = "removeUserFromGroup",
		    summary = "Remove a User from User Group",
		    description = "Remove a specific User from a User Group within Lowcoder, revoking their access to the Group resources."
	)
    @DeleteMapping("/{groupId}/remove")
    public Mono<ResponseView<Boolean>> removeUser(@PathVariable String groupId,
            @RequestParam String userId);
}
