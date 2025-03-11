package org.lowcoder.api.meta;

import io.swagger.v3.oas.annotations.Operation;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.meta.view.MetaView;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping(value = {Url.META_URL, NewUrl.META_URL})
public interface MetaEndpoints
{
	public static final String TAG_META_MANAGEMENT = "Meta APIs";

	@Operation(
			tags = TAG_META_MANAGEMENT,
		    operationId = "getMetaData",
		    summary = "Get metadata by ids",
		    description = "Get all metadatas by ids"
	)
    @PostMapping("/")
    public Mono<ResponseView<MetaView>> getMetaData(@RequestBody GetMetaDataRequest param);

	public record GetMetaDataRequest(List<String> appIds,
									 List<String> orgIds,
									 List<String> userIds,
									 List<String> groupIds,
									 List<String> bundleIds,
									 List<String> datasourceIds,
									 List<String> folderIds,
									 List<String> libraryQueryIds) {}
}
