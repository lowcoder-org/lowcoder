package org.lowcoder.api.framework.plugin.security;

import java.util.function.Supplier;

import org.aopalliance.intercept.MethodInvocation;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class EndpointAuthorizationManager implements AuthorizationManager<MethodInvocation> 
{
	
	@Override
	public AuthorizationDecision check(Supplier<Authentication> authentication, MethodInvocation invocation) 
	{
		log.info("Checking plugin endpoint invocation security for {}", invocation.getMethod().getName());
		
		return new AuthorizationDecision(true);
	}

}
