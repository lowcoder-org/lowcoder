package org.lowcoder.api.config;

import jakarta.annotation.PostConstruct;

import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.usermanagement.OrgApiService;
import org.lowcoder.infra.config.model.ServerConfig;
import org.lowcoder.infra.config.repository.ServerConfigRepository;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.SerializeConfig.JsonViews;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ServerWebExchange;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = {Url.CONFIG_URL, NewUrl.CONFIG_URL})
@Slf4j
public class ConfigController {

    @Autowired
    private CommonConfig commonConfig;

    @Autowired
    private ServerConfigRepository serverConfigRepository;

    @Autowired
    private OrgApiService orgApiService;

    @Autowired
    private ConfigCenter configCenter;

    private Conf<String> deploymentIdConf;

    @PostConstruct
    public void init() {
        deploymentIdConf = configCenter.deployment().ofString("id", "");
    }

    @GetMapping(value = "/deploymentId")
    public Mono<String> getDeploymentId() {
        return Mono.just(deploymentIdConf.get());
    }

    @GetMapping("/{key}")
    public Mono<ResponseView<ServerConfig>> getServerConfig(@PathVariable String key) {
        return serverConfigRepository.findByKey(key)
                .defaultIfEmpty(new ServerConfig(key, null))
                .map(ResponseView::success);
    }

    @PostMapping("/{key}")
    public Mono<ResponseView<ServerConfig>> updateServerConfig(@PathVariable String key, @RequestBody UpdateConfigRequest updateConfigRequest) {
        return serverConfigRepository.upsert(key, updateConfigRequest.value())
                .map(ResponseView::success);
    }

    @JsonView(JsonViews.Public.class)
    @GetMapping
    public Mono<ResponseView<ConfigView>> getConfig(ServerWebExchange exchange,@RequestParam(required = false) String orgId) {
        return orgApiService.getOrganizationConfigs(orgId)
                .map(ResponseView::success);
    }

    private record UpdateConfigRequest(String value) {
    }
}
