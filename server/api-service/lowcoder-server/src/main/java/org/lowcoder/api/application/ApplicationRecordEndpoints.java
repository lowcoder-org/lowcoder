package org.lowcoder.api.application;

import io.swagger.v3.oas.annotations.Operation;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.application.view.ApplicationRecordMetaView;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.lowcoder.infra.constant.NewUrl.APPLICATION_RECORD_URL;

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

}
