package org.lowcoder.sdk.auth;

import static org.lowcoder.sdk.auth.constants.Oauth2Constants.BASE_URL_PLACEHOLDER;
import static org.lowcoder.sdk.auth.constants.Oauth2Constants.REALM_PLACEHOLDER;
import static org.lowcoder.sdk.auth.constants.Oauth2Constants.SCOPE_PLACEHOLDER;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;

/**
 * 
 * Keycloak OAuth configuration.
 */
@Getter
@SuperBuilder
@Jacksonized
public class Oauth2KeycloakAuthConfig extends Oauth2SimpleAuthConfig 
{
	protected String baseUrl;
	protected String realm;
	protected String scope;
	
	@Override
	public String replaceAuthUrlClientIdPlaceholder(String url) 
	{
		return super.replaceAuthUrlClientIdPlaceholder(url)
				.replace(BASE_URL_PLACEHOLDER, baseUrl)
				.replace(REALM_PLACEHOLDER, realm)
				.replace(SCOPE_PLACEHOLDER, scope);
	}
	
	
}
