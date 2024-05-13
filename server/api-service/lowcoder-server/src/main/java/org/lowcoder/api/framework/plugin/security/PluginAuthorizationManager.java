package org.lowcoder.api.framework.plugin.security;

import lombok.extern.slf4j.Slf4j;
import org.aopalliance.intercept.MethodInvocation;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.plugin.api.EndpointExtension;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.EvaluationException;
import org.springframework.expression.Expression;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.ExpressionAuthorizationDecision;
import org.springframework.security.authorization.ReactiveAuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class PluginAuthorizationManager implements ReactiveAuthorizationManager<MethodInvocation>
{
	private final MethodSecurityExpressionHandler expressionHandler;

	public PluginAuthorizationManager()
	{
		this.expressionHandler = new DefaultMethodSecurityExpressionHandler();
	}
	
	@Override
	public Mono<AuthorizationDecision> check(Mono<Authentication> authentication, MethodInvocation invocation) 
	{
		log.info("Checking plugin reactive endpoint invocation security for {}", invocation.getMethod().getName());
		
		EndpointExtension endpointExtension = (EndpointExtension)invocation.getArguments()[1];
		if (endpointExtension == null || StringUtils.isBlank(endpointExtension.authorize()))
		{
			return Mono.empty();
		}
		
		Expression authorizeExpression = this.expressionHandler.getExpressionParser()
				.parseExpression(endpointExtension.authorize());
		
		return authentication
				.map(auth -> expressionHandler.createEvaluationContext(auth, invocation))
				.flatMap(ctx -> evaluateAsBoolean(authorizeExpression, ctx))
				.map(granted -> new ExpressionAuthorizationDecision(granted, authorizeExpression));
	}

	
	private Mono<Boolean> evaluateAsBoolean(Expression expr, EvaluationContext ctx) 
	{
		return Mono.defer(() -> 
		{
			Object value;
			try 
			{
				value = expr.getValue(ctx);
			}
			catch (EvaluationException ex) 
			{
				return Mono.error(() -> new IllegalArgumentException(
						"Failed to evaluate expression '" + expr.getExpressionString() + "'", ex));
			}
			
			if (value instanceof Boolean bool) 
			{
				return Mono.just(bool);
			}
			
			if (value instanceof Mono<?> monoBool) 
			{
				Mono<?> monoValue = monoBool;
				return monoValue
						.filter(Boolean.class::isInstance)
						.map(Boolean.class::cast)
						.switchIfEmpty(createInvalidReturnTypeMono(expr));
			}
			return createInvalidReturnTypeMono(expr);
		});
	}
	
	private static Mono<Boolean> createInvalidReturnTypeMono(Expression expr) 
	{
		return Mono.error(() -> new IllegalStateException(
				"Expression: '" + expr.getExpressionString() + "' must return boolean or Mono<Boolean>"));
	}

}
