package org.lowcoder.api.npm;

import lombok.RequiredArgsConstructor;
import org.jetbrains.annotations.NotNull;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.application.service.ApplicationServiceImpl;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.model.Organization;
import org.lowcoder.domain.organization.service.OrgMemberServiceImpl;
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

import java.util.ArrayList;
import java.util.Map;
import java.util.Objects;

@RequiredArgsConstructor
@RestController
@RequestMapping(NewUrl.NPM_REGISTRY)
public class PrivateNpmRegistryController implements PrivateNpmRegistryEndpoint{
    private final OrganizationService organizationService;
    private final SessionUserService sessionUserService;
    private final NodeServerHelper nodeServerHelper;

    private static final String NPM_REGISTRY_METADATA = "npm/registry";
    private static final String NPM_REGISTRY_ASSET = "npm/package";
    private final OrgMemberServiceImpl orgMemberServiceImpl;
    private final ApplicationServiceImpl applicationServiceImpl;

    @Override
    public Mono<ResponseEntity<Resource>> getNpmPackageMeta(String applicationId, String path) {
        return forwardToNodeService(applicationId, path, NPM_REGISTRY_METADATA);
    }

    @Override
    public Mono<ResponseEntity<Resource>> getNpmPackageAsset(String applicationId, String path) {
        return forwardToNodeService(applicationId, path, NPM_REGISTRY_ASSET);
    }

    @NotNull
    private Mono<ResponseEntity<Resource>> forwardToNodeService(String applicationId, String path, String prefix) {

        String withoutLeadingSlash = path.startsWith("/") ? path.substring(1) : path;
        if(applicationId.equals("none")) {
            return sessionUserService.getVisitorOrgMemberCache()
                    .onErrorResume(e -> Mono.just(OrgMember.builder().orgId("default").build()))
                    .flatMap(orgMember -> organizationService.getOrgCommonSettings(orgMember.getOrgId())
                            .onErrorResume(e -> {
                                // Handle errors fetching organization settings and provide defaults
                                Organization.OrganizationCommonSettings defaultSettings = new Organization.OrganizationCommonSettings();
                                defaultSettings.put("npmRegistries", new ArrayList<>(0));
                                return Mono.just(defaultSettings);
                            })
                            .flatMap(organizationCommonSettings -> {
                                Map<String, Object> config = Map.of(
                                        "npmRegistries", Objects.requireNonNullElse(
                                                organizationCommonSettings.get("npmRegistries"),
                                                new ArrayList<>(0)
                                        ),
                                        "workspaceId", orgMember.getOrgId()
                                );
                                return WebClientBuildHelper.builder()
                                        .systemProxy()
                                        .build()
                                        .post()
                                        .uri(nodeServerHelper.createUri(prefix + "/" + withoutLeadingSlash))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .body(BodyInserters.fromValue(config))
                                        .retrieve()
                                        .toEntity(Resource.class)
                                        .map(response -> ResponseEntity
                                                .status(response.getStatusCode())
                                                .headers(response.getHeaders())
                                                .body(response.getBody())
                                        );
                            }));

        } else{
            return applicationServiceImpl.findById(applicationId).flatMap(application -> organizationService.getById(application.getOrganizationId())).flatMap(orgMember -> organizationService.getOrgCommonSettings(orgMember.getId()).flatMap(organizationCommonSettings -> {
                Map<String, Object> config = Map.of("npmRegistries", Objects.requireNonNullElse(organizationCommonSettings.get("npmRegistries"), new ArrayList<>(0)), "workspaceId", orgMember.getId());
                return WebClientBuildHelper.builder()
                        .systemProxy()
                        .build()
                        .post()
                        .uri(nodeServerHelper.createUri(prefix + "/" + withoutLeadingSlash))
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(BodyInserters.fromValue(config))
                        .retrieve().toEntity(Resource.class)
                        .map(response -> {
                            return ResponseEntity
                                    .status(response.getStatusCode())
                                    .headers(response.getHeaders())
                                    .body(response.getBody());
                        });
            }));
        }
    }
}
