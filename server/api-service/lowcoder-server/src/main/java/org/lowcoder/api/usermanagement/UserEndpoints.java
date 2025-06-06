package org.lowcoder.api.usermanagement;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.usermanagement.view.UpdateUserRequest;
import org.lowcoder.api.usermanagement.view.UserProfileView;
import org.lowcoder.domain.user.model.UserDetail;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.springframework.http.MediaType;
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
@RequestMapping(value = {Url.USER_URL, NewUrl.USER_URL})
public interface UserEndpoints
{
	public static final String TAG_USER_MANAGEMENT = "User APIs";
	public static final String TAG_USER_PASSWORD_MANAGEMENT = "User Password APIs";
	public static final String TAG_USER_PROFILE_PHOTO_MANAGEMENT = "User Profile Photo APIs";
	@Operation(
			tags = TAG_USER_MANAGEMENT,
			operationId = "createUserAndAddToOrg",
			summary = "Create user and add to the org",
			description = "Create a new user and add to specified organization."
	)
	@PostMapping("/new/{orgId}")
	public Mono<ResponseView<?>> createUserAndAddToOrg(@PathVariable String orgId, @RequestBody CreateUserRequest request);

	@Operation(
			tags = TAG_USER_MANAGEMENT,
		    operationId = "getUserProfile",
		    summary = "Get current User Profile",
		    description = "Retrieve the profile information of the current user within Lowcoder, including their identity, name, avatar, email, IP address, group memberships, and details of the current Organization / Workspace."
	)
    @GetMapping("/me")
    public Mono<ResponseView<?>> getUserProfile(ServerWebExchange exchange);

	@Operation(
			tags = {TAG_USER_MANAGEMENT},
			operationId = "getUserOrgs",
			summary = "Get User Organizations",
			description = "Retrieve a paginated list of organizations for the current user, filtered by organization name if provided."
	)
	@GetMapping("/myorg")
	public Mono<ResponseView<?>> getUserOrgs(
			ServerWebExchange exchange,
			@RequestParam(required = false) String orgName,
			@RequestParam(required = false, defaultValue = "1") Integer pageNum,
			@RequestParam(required = false, defaultValue = "10") Integer pageSize
	);

	@Operation(
			tags = TAG_USER_MANAGEMENT,
		    operationId = "newUserGuidanceShown",
		    summary = "Mark current user with help shown status",
		    description = "Indicate that the current user has been shown help or guidance within Lowcoder, helping track user assistance efforts."
	)
    @PutMapping("/newUserGuidanceShown")
    public Mono<ResponseView<Boolean>> newUserGuidanceShown() ;

	@Operation(
			tags = TAG_USER_MANAGEMENT,
		    operationId = "markUserStatus",
		    summary = "Mark current User with Status",
		    description = "Mark the current User with a specific Status within Lowcoder, allowing for status tracking or updates."
	)
    @PutMapping("/mark-status")
    public Mono<ResponseView<Boolean>> markStatus(@RequestBody MarkUserStatusRequest request);

	@Operation(
			tags = TAG_USER_MANAGEMENT,
		    operationId = "updateUser",
		    summary = "Update current User",
		    description = "Enable the current User to update their Profile information within Lowcoder, ensuring accuracy and relevance."
	)
    @PutMapping
    public Mono<ResponseView<UserProfileView>> update(@RequestBody UpdateUserRequest updateUserRequest, ServerWebExchange exchange);

	@Operation(
			tags = TAG_USER_MANAGEMENT,
			operationId = "updateUser",
			summary = "Update selected User",
			description = "Update specified user profile information within Lowcoder, ensuring accuracy and relevance."
	)
	@PutMapping("/{orgId}/{userId}")
	public Mono<ResponseView<UserProfileView>> update(@PathVariable String orgId, @PathVariable String userId, @RequestBody UpdateUserRequest updateUserRequest, ServerWebExchange exchange);

	@Operation(
			tags = TAG_USER_PROFILE_PHOTO_MANAGEMENT,
		    operationId = "uploadUserProfilePhoto",
		    summary = "Upload current Users profile photo",
		    description = "Allow the current User to upload or change their profile photo within Lowcoder for personalization."
	)
    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseView<Boolean>> uploadProfilePhoto(@RequestPart("file") Mono<Part> fileMono);

	@Operation(
			tags = TAG_USER_PROFILE_PHOTO_MANAGEMENT,
			operationId = "uploadUserProfilePhotoById",
			summary = "Upload specific Users profile photo",
			description = "Upload or change specific profile photo within Lowcoder for personalization."
	)
	@PostMapping(value = "/photo/{orgId}/{userId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public Mono<ResponseView<Boolean>> uploadProfilePhotoById(@PathVariable String orgId, @PathVariable String userId, @RequestPart("file") Mono<Part> fileMono);

	@Operation(
			tags = TAG_USER_PROFILE_PHOTO_MANAGEMENT,
		    operationId = "deleteUserProfilePhotoById",
		    summary = "Delete specific users profile photo",
		    description = "Remove the profile Photo associated with the specific User within Lowcoder."
	)

	@DeleteMapping("/photo/{orgId}/{userId}")
    public Mono<ResponseView<Void>> deleteProfilePhotoById(@PathVariable String orgId, @PathVariable String userId);
	@Operation(
			tags = TAG_USER_PROFILE_PHOTO_MANAGEMENT,
			operationId = "deleteUserProfilePhoto",
			summary = "Delete current users profile photo",
			description = "Remove the profile Photo associated with the current User within Lowcoder."
	)
	@DeleteMapping("/photo")
	public Mono<ResponseView<Void>> deleteProfilePhoto();

	@Operation(
			tags = TAG_USER_PROFILE_PHOTO_MANAGEMENT,
		    operationId = "getUserProfilePhoto",
		    summary = "Get current User profile photo",
		    description = "Retrieve the profile photo of the current User within Lowcoder, if available."
	)
    @GetMapping("/photo")
    public Mono<Void> getProfilePhoto(ServerWebExchange exchange);

	@Operation(
			tags = TAG_USER_PROFILE_PHOTO_MANAGEMENT,
				    operationId = "uploadUserProfilePhotoById",
				    summary = "Upload users profile photo by ID",
				    description = "Upload or change the profile photo of a specific User within Lowcoder using their user ID for identification."
	)
    @GetMapping("/photo/{userId}")
    public Mono<Void> getProfilePhoto(ServerWebExchange exchange, @PathVariable String userId);

	@Operation(
			tags = TAG_USER_PASSWORD_MANAGEMENT,
		    operationId = "updatePassword",
		    summary = "Update User Password",
		    description = "Allow the User to update their Password within Lowcoder, enhancing security and account management."
	)
    @PutMapping("/password")
    public Mono<ResponseView<Boolean>> updatePassword(@RequestBody UpdatePasswordRequest request);

	@Operation(
			tags = TAG_USER_PASSWORD_MANAGEMENT,
		    operationId = "resetPassword",
		    summary = "Reset User Password",
		    description = "Initiate a Password Reset process for the user within Lowcoder, allowing them to regain access to their account."
	)
    @PostMapping("/reset-password")
    public Mono<ResponseView<String>> resetPassword(@RequestBody ResetPasswordRequest request);

	@Operation(
			tags = TAG_USER_PASSWORD_MANAGEMENT,
			operationId = "lostPassword",
			summary = "Lost User Password",
			description = "Initiate a Lost Password recovery process."
	)
	@PostMapping("/lost-password")
	public Mono<ResponseView<Boolean>> lostPassword(@RequestBody LostPasswordRequest request);

	@Operation(
			tags = TAG_USER_PASSWORD_MANAGEMENT,
			operationId = "resetLostPassword",
			summary = "Reset Lost User Password",
			description = "Resets lost password based on the token from lost password email."
	)
	@PostMapping("/reset-lost-password")
	public Mono<ResponseView<Boolean>> resetLostPassword(@RequestBody ResetLostPasswordRequest request);

	@Operation(
			tags = TAG_USER_PASSWORD_MANAGEMENT,
		    operationId = "setPassword",
		    summary = "Set User Password",
		    description = "Set a new Password for the User within Lowcoder, ensuring secure access to their account."
	)
    @PostMapping("/password")
    public Mono<ResponseView<Boolean>> setPassword(@RequestParam String password);

	@Operation(
			tags = TAG_USER_MANAGEMENT,
		    operationId = "getUserInfo",
		    summary = "Get current User Information",
		    description = "Retrieve comprehensive information about the current user within Lowcoder, including their ID, name, avatar URL, email, IP address and group memberships."
	)
    @GetMapping("/currentUser")
    public Mono<ResponseView<UserDetail>> getCurrentUser(ServerWebExchange exchange);

	@Operation(
			tags = TAG_USER_MANAGEMENT,
		    operationId = "getUserDetails",
		    summary = "Get User Details by ID",
		    description = "Retrieve specific User Details within Lowcoder using their unique user ID."
	)
    @GetMapping("/userDetail/{id}")
    public Mono<ResponseView<?>> getUserDetail(@PathVariable("id") String userId);

    public record ResetPasswordRequest(String userId) {
    }

	public record LostPasswordRequest(String userEmail) {
	}

	public record ResetLostPasswordRequest(String token, String userEmail, String newPassword) {
	}

    public record UpdatePasswordRequest(String oldPassword, String newPassword) {
    }

    public record MarkUserStatusRequest(String type, Object value) {
    }

	public record CreateUserRequest(String email, String password) {
	}
}
