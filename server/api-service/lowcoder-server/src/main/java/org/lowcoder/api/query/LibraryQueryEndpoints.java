package org.lowcoder.api.query;

import static org.lowcoder.infra.constant.NewUrl.LIBRARY_QUERY_URL;

import java.util.List;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.query.view.LibraryQueryAggregateView;
import org.lowcoder.api.query.view.LibraryQueryPublishRequest;
import org.lowcoder.api.query.view.LibraryQueryRecordMetaView;
import org.lowcoder.api.query.view.LibraryQueryView;
import org.lowcoder.api.query.view.UpsertLibraryQueryRequest;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = LIBRARY_QUERY_URL)
public interface LibraryQueryEndpoints 
{
	public static final String TAG_LIBRARY_QUERY_MANAGEMENT = "Query Library APIs";
	
	@Operation(
			tags = TAG_LIBRARY_QUERY_MANAGEMENT,
		    operationId = "listLibraryQueriesForDropDown",
		    summary = "Get Data Query Libraries in dropdown format",
		    description = "Retrieve Library Queries in a dropdown format within Lowcoder, suitable for selection in user interfaces."
	)
    @GetMapping("/dropDownList")
    public Mono<ResponseView<List<LibraryQueryAggregateView>>> dropDownList();

	@Operation(
			tags = TAG_LIBRARY_QUERY_MANAGEMENT,
		    operationId = "listLibrartQueriesByOrg",
		    summary = "Get Data Query Libraries for organization",
		    description = "Retrieve a list of Library Queries for a specific Organization within Lowcoder."
	)
    @GetMapping("/listByOrg")
    public Mono<ResponseView<List<LibraryQueryView>>> list();

	@Operation(
			tags = TAG_LIBRARY_QUERY_MANAGEMENT,
		    operationId = "createLibraryQuery",
		    summary = "Create a Library for Data Queries",
		    description = "Create a new Library Query within Lowcoder for storing and managing reusable Data Queries."
	)
    @PostMapping
    public Mono<ResponseView<LibraryQueryView>> create(@RequestBody LibraryQuery libraryQuery);

	@Operation(
			tags = TAG_LIBRARY_QUERY_MANAGEMENT,
		    operationId = "updateLibraryQuery",
		    summary = "Update a Data Query Library",
		    description = "Modify the properties and settings of an existing Library Query within Lowcoder identified by its unique ID."
	)
    @PutMapping("/{libraryQueryId}")
    public Mono<ResponseView<Boolean>> update(@PathVariable String libraryQueryId,
            @RequestBody UpsertLibraryQueryRequest upsertLibraryQueryRequest);

	@Operation(
			tags = TAG_LIBRARY_QUERY_MANAGEMENT,
		    operationId = "deleteLibraryQuery",
		    summary = "Delete a Data Query Library",
		    description = "Permanently remove a Library Query from Lowcoder using its unique ID."
	)
    @DeleteMapping("/{libraryQueryId}")
    public Mono<ResponseView<Boolean>> delete(@PathVariable String libraryQueryId);

	@Operation(
			tags = TAG_LIBRARY_QUERY_MANAGEMENT,
		    operationId = "publishLibraryQuery",
		    summary = "Publish a Data Query Library for usage",
		    description = "Publish a Library Query for usage within Lowcoder, making it available for other users to utilize."
	)
    @PostMapping("/{libraryQueryId}/publish")
    public Mono<ResponseView<LibraryQueryRecordMetaView>> publish(@PathVariable String libraryQueryId,
            @RequestBody LibraryQueryPublishRequest libraryQueryPublishRequest);

}
