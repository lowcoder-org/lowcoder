package org.lowcoder.api.framework;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = {Url.STATE_URL, NewUrl.STATE_URL})
public interface StateEndpoints 
{
	public static final String TAG_STATUS_CHECKS = "Status checks APIs";
	
	@Operation(
			tags = TAG_STATUS_CHECKS,
		    operationId = "healthCheck",
		    summary = "Run health check",
		    description = "Perform a health check within Lowcoder to ensure the system's overall operational health and availability."
	)
    @RequestMapping(value = "/healthCheck", method = RequestMethod.HEAD)
    public Mono<ResponseView<Boolean>> healthCheck();

}
