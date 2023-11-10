package org.lowcoder.api.authentication;

import java.util.List;

import org.lowcoder.api.authentication.dto.APIKeyRequest;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.usermanagement.UserController;
import org.lowcoder.api.usermanagement.UserEndpoints.UpdatePasswordRequest;
import org.lowcoder.api.usermanagement.view.APIKeyVO;
import org.lowcoder.domain.user.model.APIKey;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.config.SerializeConfig.JsonViews;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;

import com.fasterxml.jackson.annotation.JsonView;

import io.swagger.v3.oas.annotations.Operation;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = {NewUrl.CUSTOM_AUTH})
public interface AuthenticationEndpoints 
{
	public static final String TAG_AUTHENTICATION = "Authentication APIs";
    /**
     * login by email or phone with password; or register by email for now.
     *
     * @see UserController#updatePassword(UpdatePasswordRequest)
     */
	@Operation(
			tags = TAG_AUTHENTICATION,
		    operationId = "loginWithUserPassword",
		    summary = "Login with user and password (Form based Login)",
		    description = "Authenticate a Lowcoder User using traditional username and password credentials (Form Login)."
	)
    @PostMapping("/form/login")
    public Mono<ResponseView<Boolean>> formLogin(@RequestBody FormLoginRequest formLoginRequest,
            @RequestParam(required = false) String invitationId,
            ServerWebExchange exchange);
    
    /**
     * third party login api
     */
	@Operation(
			tags = TAG_AUTHENTICATION,
		    operationId = "loginWithThirdParty",
		    summary = "Login with third party",
		    description = "Authenticate a Lowcoder User using third-party login credentials."
	)
    @PostMapping("/tp/login")
    public Mono<ResponseView<Boolean>> loginWithThirdParty(
            @RequestParam(required = false) String authId,
            @RequestParam(required = false) String source,
            @RequestParam String code,
            @RequestParam(required = false) String invitationId,
            @RequestParam String redirectUrl,
            @RequestParam String orgId,
            ServerWebExchange exchange);

	@Operation(
			tags = TAG_AUTHENTICATION,
		    operationId = "logout",
		    summary = "Logout from Lowcoder",
		    description = "End a logged in Session of a Lowcoder User on the Lowcoder platform."
	)
    @PostMapping("/logout")
    public Mono<ResponseView<Boolean>> logout(ServerWebExchange exchange);

	@Operation(
			tags = TAG_AUTHENTICATION,
		    operationId = "createAuthConfig",
		    summary = "Create authentication configuration",
		    description = "Configure a new authentication method to enable Lowcoder Users to log in, for instance, through OAuth or other similar mechanisms, for the current selected Organization, based on the impersonated User"
	)
    @PostMapping("/config")
    public Mono<ResponseView<Void>> enableAuthConfig(@RequestBody AuthConfigRequest authConfigRequest);

	@Operation(
			tags = TAG_AUTHENTICATION,
		    operationId = "deleteAuthConfig",
		    summary = "Delete authentication configuration",
		    description = "Delete a specific Lowcoder authentication configuration."
	)
    @DeleteMapping("/config/{id}")
    public Mono<ResponseView<Void>> disableAuthConfig(@PathVariable("id") String id, @RequestParam(required = false) boolean delete);

	@Operation(
			tags = TAG_AUTHENTICATION,
		    operationId = "listAuthConfigs",
		    summary = "Get available authentication configurations",
		    description = "Retrieve a list of all available authentication configurations for the current selected Organization, based on the impersonated User"
	)
    @JsonView(JsonViews.Internal.class)
    @GetMapping("/configs")
    public Mono<ResponseView<List<AbstractAuthConfig>>> getAllConfigs();

    // ----------- API Key Management ----------------
	@Operation(
			tags = TAG_AUTHENTICATION,
		    operationId = "createApiKey",
		    summary = "Create API key for current user",
		    description = "Generate an Lowcoder API key. The API key will inherit all rights of the current impersonated user."
	)
    @PostMapping("/api-key")
    public Mono<ResponseView<APIKeyVO>> createAPIKey(@RequestBody APIKeyRequest apiKeyRequest);

	@Operation(
			tags = TAG_AUTHENTICATION,
				    operationId = "deleteApiKey",
				    summary = "Delete API key",
				    description = "Delete a specific API key associated with the current impersonated user."
	)
    @DeleteMapping("/api-key/{id}")
    public Mono<ResponseView<Void>> deleteAPIKey(@PathVariable("id") String id);

	@Operation(
			tags = TAG_AUTHENTICATION,
		    operationId = "listApiKeys",
		    summary = "Get API keys of the current User",
		    description = "Retrieve a list of LOwcoder API keys associated with the current impersonated user."
	)
    @GetMapping("/api-keys")
    public Mono<ResponseView<List<APIKey>>> getAllAPIKeys();

    /**
     * @param loginId phone number or email for now.
     * @param register register or login
     * @param source {@link AuthSourceConstants#PHONE} or {@link AuthSourceConstants#EMAIL}
     */
    public record FormLoginRequest(String loginId, String password, boolean register, String source, String authId) {
    }

}
