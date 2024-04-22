package org.lowcoder.api.framework.plugin.endpoint;

import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.support.RouterFunctionMapping;


public class ReloadableRouterFunctionMapping extends RouterFunctionMapping
{
	/**
	 * Rescan application context for RouterFunction beans
	 */
	public void reloadFunctionMappings()
	{
		initRouterFunctions();
		if (getRouterFunction() != null)
		{
			RouterFunctions.changeParser(getRouterFunction(), getPathPatternParser());
		}
	}
}
