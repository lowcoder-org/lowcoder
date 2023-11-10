package org.lowcoder.api.usermanagement;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.usermanagement.view.InvitationVO;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = {Url.INVITATION_URL, NewUrl.INVITATION_URL})
public interface InvitationEndpoints 
{
	public static final String TAG_INVITATION_MANAGEMENT = "User invitation APIs";

	@Operation(
			tags = TAG_INVITATION_MANAGEMENT,
		    operationId = "createUserInvitation",
		    summary = "Create user Invitation",
		    description = "Create a generic User-Invitation within Lowcoder to invite new users to join the platform. Internally an invite Link based on inviting User and it's current Organization / Workspace is built."
	)
    @PostMapping
    public Mono<ResponseView<InvitationVO>> create(@RequestParam String orgId);

	@Operation(
			tags = TAG_INVITATION_MANAGEMENT,
		    operationId = "inviteUser",
		    summary = "Invite User",
		    description = "Proceed the actual Invite for User to an Lowcoder Organization / Workspace using an existing Invitation identified by its ID."
	)
    @GetMapping("/{invitationId}")
    public Mono<ResponseView<InvitationVO>> get(@PathVariable String invitationId);

	@Operation(
			tags = TAG_INVITATION_MANAGEMENT,
		    operationId = "getInvitation",
		    summary = "Get Invitation",
		    description = "Retrieve information about a specific Invitation within Lowcoder, including details about the Invitee and the connected Organization / Workspace."
	)
    @GetMapping("/{invitationId}/invite")
    public Mono<ResponseView<?>> inviteUser(@PathVariable String invitationId);

}
