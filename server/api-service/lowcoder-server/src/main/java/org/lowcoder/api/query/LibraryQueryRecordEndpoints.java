package org.lowcoder.api.query;

import static org.lowcoder.infra.constant.NewUrl.LIBRARY_QUERY_RECORD_URL;

import java.util.List;
import java.util.Map;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.query.view.LibraryQueryRecordMetaView;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = LIBRARY_QUERY_RECORD_URL)
public interface LibraryQueryRecordEndpoints 
{
	public static final String TAG_LIBRARY_QUERY_RECORDS = "Library Queries Record APIs";

	@Operation(
			tags = LIBRARY_QUERY_RECORD_URL,
		    operationId = "deleteLibrartQueryRecord",
		    summary = "Delete Library Query Record",
		    description = "Permanently remove a specific Library Query Record from Lowcoder using its unique record ID."
	)
    @DeleteMapping("/{libraryQueryRecordId}")
    public Mono<Void> delete(@PathVariable String libraryQueryRecordId);

	@Operation(
			tags = LIBRARY_QUERY_RECORD_URL,
		    operationId = "getLibraryQueryRecord",
		    summary = "Get Library Query Record",
		    description = "Retrieve a specific Library Query Record within Lowcoder using the associated library query ID."
	)
    @GetMapping("/listByLibraryQueryId")
    public Mono<ResponseView<List<LibraryQueryRecordMetaView>>> getByLibraryQueryId(@RequestParam(name = "libraryQueryId") String libraryQueryId);

	@Operation(
			tags = LIBRARY_QUERY_RECORD_URL,
		    operationId = "listLibraryQueryRecords",
		    summary = "Get Library Query Records",
		    description = "Retrieve a list of Library Query Records, which store information related to executed queries within Lowcoder and the current Organization / Workspace by the impersonated User"
	)
    @GetMapping
    public Mono<ResponseView<Map<String, Object>>> dslById(@RequestParam(name = "libraryQueryId") String libraryQueryId,
            @RequestParam(name = "libraryQueryRecordId") String libraryQueryRecordId);

}
