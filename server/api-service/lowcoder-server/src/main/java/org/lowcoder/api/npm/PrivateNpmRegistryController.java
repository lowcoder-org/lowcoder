package org.lowcoder.api.npm;

import lombok.RequiredArgsConstructor;
import org.jetbrains.annotations.NotNull;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.js.NodeServerHelper;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping(NewUrl.NPM_REGISTRY)
public class PrivateNpmRegistryController implements PrivateNpmRegistryEndpoint{
    private final OrganizationService organizationService;
    private final SessionUserService sessionUserService;
    private final NodeServerHelper nodeServerHelper;

    private static final String NPM_REGISTRY_METADATA = "npm/registry";
    private static final String NPM_REGISTRY_ASSET = "npm/package";

    @Override
    public Mono<ResponseEntity<Resource>> getNpmPackageMeta(String name) {
        return forwardToNodeService(name, NPM_REGISTRY_METADATA);
    }

    @Override
    public Mono<ResponseEntity<Resource>> getNpmPackageAsset(String path) {
        return forwardToNodeService(path, NPM_REGISTRY_ASSET);
    }

    @NotNull
    private Mono<ResponseEntity<Resource>> forwardToNodeService(String path, String prefix) {
        return sessionUserService.getVisitorOrgMemberCache().flatMap(orgMember -> organizationService.getOrgCommonSettings(orgMember.getOrgId()).flatMap(organizationCommonSettings -> {
            Map<String, Object> config = Map.of("npmRegistries", organizationCommonSettings.get("npmRegistries"), "workspaceId", orgMember.getOrgId());
            return WebClientBuildHelper.builder()
                    .systemProxy()
                    .build()
                    .post()
                    .uri(nodeServerHelper.createUri(prefix + "/" + path))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(BodyInserters.fromValue(config))
                    .retrieve().toEntity(Resource.class)
                    .map(response -> ResponseEntity
                            .status(response.getStatusCode())
                            .headers(response.getHeaders())
                            .body(response.getBody()));
        }));
    }
}
