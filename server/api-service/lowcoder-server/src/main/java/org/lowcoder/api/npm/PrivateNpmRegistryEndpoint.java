package org.lowcoder.api.npm;

import io.swagger.v3.oas.annotations.Operation;
import org.lowcoder.infra.constant.NewUrl;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(NewUrl.NPM_REGISTRY)
public interface PrivateNpmRegistryEndpoint {
    public static final String TAG_NPM_REGISTRY_MANAGEMENT = "Private NPM registry APIs";

    @Operation(
            tags = TAG_NPM_REGISTRY_MANAGEMENT,
            operationId = "getNpmPackageMeta",
            summary = "Get NPM registry Metadata",
            description = "Retrieve the metadata of private NPM registry package."
    )
//    @GetMapping("/registry/{name}")
    public Mono<ResponseEntity<Resource>> getNpmPackageMeta(@PathVariable String name);

    @Operation(
            tags = TAG_NPM_REGISTRY_MANAGEMENT,
            operationId = "getNpmPackageAsset",
            summary = "Get NPM registry asset",
            description = "Retrieve the asset of private NPM registry package."
    )
//    @GetMapping("/package/{path}")
    public Mono<ResponseEntity<Resource>> getNpmPackageAsset(@PathVariable String path);
}
