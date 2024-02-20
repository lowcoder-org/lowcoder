package org.lowcoder.api.config;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.usermanagement.OrgApiService;
import org.lowcoder.infra.config.model.ServerConfig;
import org.lowcoder.infra.config.repository.ServerConfigRepository;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@RestController
public class ConfigController implements ConfigEndpoints 
{
    private final ServerConfigRepository serverConfigRepository;
    private final OrgApiService orgApiService;
    private final ConfigCenter configCenter;

    private Conf<String> deploymentIdConf;

    @PostConstruct
    public void init() {
        deploymentIdConf = configCenter.deployment().ofString("id", "");
    }

    @Override
    public Mono<String> getDeploymentId() {
        return Mono.just(deploymentIdConf.get());
    }

    @Override
    public Mono<ResponseView<ServerConfig>> getServerConfig(@PathVariable String key) {
        return serverConfigRepository.findByKey(key)
                .defaultIfEmpty(new ServerConfig(key, null))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<ServerConfig>> updateServerConfig(@PathVariable String key, @RequestBody UpdateConfigRequest updateConfigRequest) {
        return serverConfigRepository.upsert(key, updateConfigRequest.value())
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<ConfigView>> getConfig(ServerWebExchange exchange,@RequestParam(required = false) String orgId) {
        return orgApiService.getOrganizationConfigs(orgId)
                .map(ResponseView::success);
    }
}
