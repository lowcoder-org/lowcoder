package org.lowcoder.api.application;

import static org.lowcoder.infra.constant.NewUrl.APPLICATION_RECORD_URL;

import java.util.List;
import java.util.Map;

import org.lowcoder.api.application.view.ApplicationRecordMetaView;
import org.lowcoder.api.framework.view.ResponseView;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = APPLICATION_RECORD_URL)
public interface ApplicationRecordEndpoints
{
	public static final String TAG_APPLICATION_RECORDS = "Application Record APIs";

	@Operation(
			tags = TAG_APPLICATION_RECORDS,
		    operationId = "deleteApplicationRecord",
		    summary = "Delete Application Record",
		    description = "Permanently remove a specific Application Record from Lowcoder using its unique record ID."
	)
    @DeleteMapping("/{applicationRecordId}")
    public Mono<Void> delete(@PathVariable String applicationRecordId);

	@Operation(
			tags = TAG_APPLICATION_RECORDS,
		    operationId = "getApplicationRecord",
		    summary = "Get Application Record",
		    description = "Retrieve a specific Application Record within Lowcoder using the associated application ID."
	)
    @GetMapping("/listByApplicationId")
    public Mono<ResponseView<List<ApplicationRecordMetaView>>> getByApplicationId(@RequestParam(name = "applicationId") String applicationId);

	@Operation(
			tags = TAG_APPLICATION_RECORDS,
		    operationId = "listApplicationRecords",
		    summary = "Get Application Records",
		    description = "Retrieve a list of Application Records, which store information related to executed queries within Lowcoder and the current Organization / Workspace by the impersonated User"
	)
    @GetMapping
    public Mono<ResponseView<Map<String, Object>>> dslById(@RequestParam(name = "applicationId") String applicationId,
            @RequestParam(name = "applicationRecordId") String applicationRecordId);

	@Operation(
			tags = TAG_APPLICATION_RECORDS,
		    operationId = "getVersionDsl",
		    summary = "Get DSL from specific version",
		    description = "Retrieve the DSL data from a specific application version for rollback preview"
	)
    @GetMapping("/{applicationRecordId}/dsl")
    public Mono<ResponseView<Map<String, Object>>> getVersionDsl(@PathVariable String applicationRecordId);

}
