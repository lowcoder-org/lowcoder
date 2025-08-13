package org.lowcoder.api.datasource;

import com.fasterxml.jackson.annotation.JsonView;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.annotation.Nullable;
import jakarta.validation.Valid;
import org.lowcoder.api.framework.view.PageResponseView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.permission.view.CommonPermissionView;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.plugin.client.dto.GetPluginDynamicConfigRequestDTO;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.lowcoder.sdk.config.JsonViews;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping(value = {Url.DATASOURCE_URL, NewUrl.DATASOURCE_URL})
public interface DatasourceEndpoints 
{
	public static final String TAG_DATASOURCE_MANAGEMENT = "Data Source APIs";
	public static final String TAG_DATASOURCE_PERMISSIONS = "Data Source Permissions APIs";
	
	@Operation(
			tags = TAG_DATASOURCE_MANAGEMENT,
		    operationId = "createDatasource",
		    summary = "Create new data source",
		    description = "Create a new data source in Lowcoder for data retrieval or storage."
	)
    @JsonView(JsonViews.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseView<Datasource>> create(@Valid @RequestBody UpsertDatasourceRequest request);

	@Operation(
			tags = TAG_DATASOURCE_MANAGEMENT,
		    operationId = "getDatasource",
		    summary = "Get data source by ID",
		    description = "Retrieve a specific data source within Lowcoder by its ID."

	)
    @JsonView(JsonViews.Public.class)
    @GetMapping("/{id}")
    public Mono<ResponseView<Datasource>> getById(@PathVariable String id);

	@Operation(
			tags = TAG_DATASOURCE_MANAGEMENT,
		    operationId = "updateDatasource",
		    summary = "Update data source by ID",
		    description = "Modify the properties and settings of a data source within Lowcoder using its ID."
	)
    @JsonView(JsonViews.Public.class)
    @PutMapping("/{id}")
    public Mono<ResponseView<Datasource>> update(@PathVariable String id,
            @RequestBody UpsertDatasourceRequest request);

	@Operation(
			tags = TAG_DATASOURCE_MANAGEMENT,
		    operationId = "deleteDatasource",
		    summary = "Delete data source by ID",
		    description = "Permanently remove a data source within Lowcoder using its ID."
	)
    @DeleteMapping("/{id}")
    public Mono<ResponseView<Boolean>> delete(@PathVariable String id);

	@Operation(
			tags = TAG_DATASOURCE_MANAGEMENT,
		    operationId = "testDatasource",
		    summary = "Test data source",
		    description = "Verify the functionality and connectivity of a data source within the Lowcoder platform, identified by its ID."
	)
    @PostMapping("/test")
    public Mono<ResponseView<Boolean>> testDatasource(@RequestBody UpsertDatasourceRequest request);

	@Operation(
			tags = TAG_DATASOURCE_MANAGEMENT,
		    operationId = "getDatasourceStructure",
		    summary = "Get data source structure",
		    description = "Retrieve the structure and schema of a data source within Lowcoder, identified by its ID."
	)
    @GetMapping("/{datasourceId}/structure")
    public Mono<ResponseView<DatasourceStructure>> getStructure(@PathVariable String datasourceId,
            @RequestParam(required = false, defaultValue = "false") boolean ignoreCache);

    /**
     * Returns the information of all the js data source plugins by the org id which we get by the applicationId, including the data source id,
     * name, type... and the plugin definition of it, excluding the detail configs such as the connection uri, password...
     */
	@Operation(
			tags = TAG_DATASOURCE_MANAGEMENT,
		    operationId = "listNodeServicePlugins",
		    summary = "Get Node service plugins",
		    description = "Retrieve a list of node service plugins available within Lowcoder."
	)
    @GetMapping("/jsDatasourcePlugins")
    public Mono<PageResponseView<?>> listJsDatasourcePlugins(@RequestParam("appId") String applicationId, @RequestParam(required = false) String name, @RequestParam(required = false) String type,
															 @RequestParam(required = false, defaultValue = "1") int pageNum,
															 @RequestParam(required = false, defaultValue = "0") int pageSize);

    /**
     * Proxy the request to the node service, besides, add the "extra" information from the data source config stored in the mongodb if exists to
     * the request dto. And then return the response from the node service.
     */
	@Operation(
			tags = TAG_DATASOURCE_MANAGEMENT,
		    operationId = "getDatasourceDynamicConfig",
		    summary = "Get data source dynamic config",
		    description = "Get additional dynamic configuration parameter information of data source within Lowcoder."
	)
    @PostMapping("/getPluginDynamicConfig")
    public Mono<ResponseView<List<Object>>> getPluginDynamicConfig(
            @RequestBody List<GetPluginDynamicConfigRequestDTO> getPluginDynamicConfigRequestDTOS);

	@Operation(
			tags = TAG_DATASOURCE_MANAGEMENT,
		    operationId = "listDatasourcesByOrg",
		    summary = "Get data sources by Organization ID",
		    description = "List data sources associated with a specific Organization-ID within Lowcoder."
	)
    @JsonView(JsonViews.Public.class)
    @GetMapping("/listByOrg")
    public Mono<PageResponseView<?>> listOrgDataSources(@RequestParam(name = "orgId") String orgId, @RequestParam String name, @RequestParam String type,
                                                        @RequestParam(required = false, defaultValue = "1") int pageNum,
                                                        @RequestParam(required = false, defaultValue = "0") int pageSize);

	@Operation(
			tags = TAG_DATASOURCE_MANAGEMENT,
		    operationId = "listDatasourcesByApp",
		    summary = "Get data sources by Application ID",
		    description = "List data sources associated with a specific Application-ID within Lowcoder."
	)
    @Deprecated
    @JsonView(JsonViews.Public.class)
    @GetMapping("/listByApp")
    public Mono<PageResponseView<?>> listAppDataSources(@RequestParam(name = "appId") String applicationId, @RequestParam String name, @RequestParam String type,
														@RequestParam(required = false, defaultValue = "1") int pageNum,
														@RequestParam(required = false, defaultValue = "0") int pageSize);

	@Operation(
			tags = TAG_DATASOURCE_PERMISSIONS,
		    operationId = "listDatasourcePermissions",
		    summary = "Get data source permissions",
		    description = "Retrieve permissions associated with a specific data source within Lowcoder, identified by its ID."
	)
    @GetMapping("/{datasourceId}/permissions")
    public Mono<ResponseView<CommonPermissionView>> getPermissions(@PathVariable("datasourceId") String datasourceId);

	@Operation(
			tags = TAG_DATASOURCE_PERMISSIONS,
		    operationId = "updateDatasourcePermission",
		    summary = "Update data source permission",
		    description = "Modify a specific data source permission within Lowcoder, identified by its ID."
	)
    @PutMapping("/{datasourceId}/permissions")
    public Mono<ResponseView<Boolean>> grantPermission(@PathVariable String datasourceId,
            @RequestBody BatchAddPermissionRequest request);

	@Operation(
			tags = TAG_DATASOURCE_PERMISSIONS,
		    operationId = "grantDatasourcePermissions",
		    summary = "Grant permissions to data source",
		    description = "Assign permissions for selected users or user-groups to a specific data source within Lowcoder, identified by its ID."
	)
    @PutMapping("/permissions/{permissionId}")
    public Mono<ResponseView<Boolean>> updatePermission(@PathVariable("permissionId") String permissionId,
            @RequestBody UpdatePermissionRequest request);

	@Operation(
			tags = TAG_DATASOURCE_PERMISSIONS,
		    operationId = "revokeDatasourcePermission",
		    summary = "Revoke permission from data source",
		    description = "Revoke a specific permission from a data source within Lowcoder, identified by its ID."
	)
    @DeleteMapping("/permissions/{permissionId}")
    public Mono<ResponseView<Boolean>> deletePermission(@PathVariable("permissionId") String permissionId);

	@Operation(
			tags = TAG_DATASOURCE_MANAGEMENT,
		    operationId = "getDatasourceInfo",
		    summary = "Get data source information",
		    description = "Obtain information related to a data source within Lowcoder."
	)
    @GetMapping("/info")
    public Mono<ResponseView<Object>> info(@RequestParam(required = false) String datasourceId);


	@Operation(
			tags = TAG_DATASOURCE_PERMISSIONS,
			operationId = "listGroupsOrMembersWithoutPermissionsForDatasource",
			summary = "Get groups or members without permissions for datasource",
			description = "Retrieve the groups or members of a specific datasource identified by its ID that do not have permissions."
	)
	@GetMapping("/{datasourceId}/available")
	public Mono<PageResponseView<?>> getGroupsOrMembersWithoutPermissions(
			@PathVariable String datasourceId,
			@RequestParam(required = false) String search,
			@RequestParam(required = false, defaultValue = "1") Integer pageNum,
			@RequestParam(required = false, defaultValue = "1000") Integer pageSize
	);

    public record BatchAddPermissionRequest(String role, Set<String> userIds, Set<String> groupIds) {
    }

    public record UpdatePermissionRequest(String role) {

        @Nullable
        public ResourceRole getResourceRole() {
            return ResourceRole.fromValue(role());
        }
    }

}
