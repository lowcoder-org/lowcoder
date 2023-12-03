package org.lowcoder.api.application;

import java.util.Map;

import org.lowcoder.api.application.view.HistorySnapshotDslView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.infra.constant.NewUrl;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = {NewUrl.APPLICATION_HISTORY_URL})
public interface ApplicationHistorySnapshotEndpoints 
{
	public static final String TAG_APPLICATION_HISTORY_MANAGEMENT = "Application History APIs";
	
	@Operation(
			tags = TAG_APPLICATION_HISTORY_MANAGEMENT,
		    operationId = "createApplicationSnapshot",
		    summary = "Create Application Snapshot",
		    description = "Create a snapshot of an Application DSL within Lowcoder, capturing its current state for future reference."
	)
    @PostMapping
    public Mono<ResponseView<Boolean>> create(@RequestBody ApplicationHistorySnapshotRequest request);

	@Operation(
			tags = TAG_APPLICATION_HISTORY_MANAGEMENT,
		    operationId = "listApplicationSnapshots",
		    summary = "List Application Snapshots",
		    description = "Retrieve a list of Snapshots associated with a specific Application within Lowcoder."
	)
    @GetMapping("/{applicationId}")
    public Mono<ResponseView<Map<String, Object>>> listAllHistorySnapshotBriefInfo(@PathVariable String applicationId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size);

	@Operation(
			tags = TAG_APPLICATION_HISTORY_MANAGEMENT,
		    operationId = "getApplicationSnapshot",
		    summary = "Retrieve Application Snapshot",
		    description = "Retrieve a specific Application Snapshot within Lowcoder using the Application and Snapshot IDs."
	)
    @GetMapping("/{applicationId}/{snapshotId}")
    public Mono<ResponseView<HistorySnapshotDslView>> getHistorySnapshotDsl(@PathVariable String applicationId,
            @PathVariable String snapshotId);

    public record ApplicationHistorySnapshotBriefInfo(String snapshotId, Map<String, Object> context,
                                                       String userId, String userName,
                                                       String userAvatar, long createTime) {
    }

    public record ApplicationHistorySnapshotRequest(String applicationId, Map<String, Object> dsl, Map<String, Object> context) {
    }

}
