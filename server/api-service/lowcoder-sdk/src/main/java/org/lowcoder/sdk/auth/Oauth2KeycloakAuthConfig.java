package org.lowcoder.sdk.auth;

import static org.lowcoder.sdk.auth.constants.Oauth2Constants.INSTANCE_ID_PLACEHOLDER;
import static org.lowcoder.sdk.auth.constants.Oauth2Constants.REALM_PLACEHOLDER;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;

/**
 * 
 * Keycloak OAuth configuration.
 */
@Getter
public class Oauth2KeycloakAuthConfig extends Oauth2SimpleAuthConfig 
{
	protected String instanceId;
	protected String realm;
	
	@JsonCreator
	public Oauth2KeycloakAuthConfig(
			@JsonProperty("id") String id, 
			@JsonProperty("enable") Boolean enable, 
			@JsonProperty("enableRegister") Boolean enableRegister, 
			@JsonProperty("source") String source, 
			@JsonProperty("sourceName") String sourceName,
			@JsonProperty("clientId") String clientId, 
			@JsonProperty("clientSecret") String clientSecret,
			@JsonProperty("instanceId") String instanceId,
			@JsonProperty("realm") String realm,
			@JsonProperty("authType") String authType) 
	{
		super(id, enable, enableRegister, source, sourceName, clientId, clientSecret, authType);
		this.instanceId = instanceId;
		this.realm = realm;
	}



	@Override
	public String replaceAuthUrlClientIdPlaceholder(String url) 
	{
		return super.replaceAuthUrlClientIdPlaceholder(url)
				.replace(INSTANCE_ID_PLACEHOLDER, instanceId)
				.replace(REALM_PLACEHOLDER, realm);
	}
	
	
}
