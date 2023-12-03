package org.lowcoder.api.query;

import org.lowcoder.api.query.view.LibraryQueryRequestFromJs;
import org.lowcoder.api.query.view.QueryExecutionRequest;
import org.lowcoder.api.query.view.QueryResultView;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;

import io.swagger.v3.oas.annotations.Operation;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = {Url.QUERY_URL, NewUrl.QUERY_URL})
public interface QueryEndpoints 
{
	public static final String TAG_QUERY_EXCUTION = "Query Execution APIs";
	
	@Operation(
			tags = TAG_QUERY_EXCUTION,
		    operationId = "executeQueryFromApiService",
		    summary = "Execute query from API service",
		    description = "Execute a data Query from an API service within Lowcoder, facilitating data retrieval and processing. API Service is used for standard Data Sources like Databases."
	)
    @PostMapping("/execute")
    public Mono<QueryResultView> execute(ServerWebExchange exchange,
            @RequestBody QueryExecutionRequest queryExecutionRequest);

	@Operation(
			tags = TAG_QUERY_EXCUTION,
		    operationId = "executeQueryFromNodeService",
		    summary = "Execute query from node service",
		    description = "Execute a data Query from a Node service within Lowcoder, facilitating data retrieval and processing. Node Service is used for extended Data Source Plugins."
	)
    @PostMapping("/execute-from-node")
    public Mono<QueryResultView> executeLibraryQueryFromJs(ServerWebExchange exchange,
            @RequestBody LibraryQueryRequestFromJs queryExecutionRequest);

}
