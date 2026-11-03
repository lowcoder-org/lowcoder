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

	/**
	 * The meta views (id and name; for an application also title, description, category and icon, for a user also the
	 * email) of every application, user, organization, folder, datasource, bundle, group and library query the request
	 * names by key. No permission is checked, and the route is open to anonymous callers unless it is listed in
	 * {@code common.security.forbiddenEndpoints} (NEW-105: kept as upstream designed, owner decision D4).
	 * <p>
	 * Limits: a caller who knows a key can learn that entity's meta view; the eight lookups are joined, so one failing
	 * lookup fails the whole answer; blank keys are dropped from the organization, application and folder lists (NEW-81,
	 * NEW-104, NEW-106), and the other lists pass them to their queries (a null bundle key matched no bundle, NEW-110).
	 */
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
