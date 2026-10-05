package org.lowcoder.api.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.OrgApiService;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.infra.config.model.ServerConfig;
import org.lowcoder.infra.config.repository.ServerConfigRepository;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import static org.lowcoder.sdk.exception.BizError.NOT_AUTHORIZED;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

@RequiredArgsConstructor
@RestController
public class ConfigController implements ConfigEndpoints 
{
    private final ServerConfigRepository serverConfigRepository;
    private final OrgApiService orgApiService;
    private final ConfigCenter configCenter;
    private final SessionUserService sessionUserService;
    private final UserService userService;

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

    /**
     * Server configuration keys are deployment-wide (the JS executor host, size limits, rate limits, quotas), so only the
     * deployment's super admin (the stored user's {@code superAdmin} flag, not an org role) may write one.
     * <p>
     * Limits: this guards the REST endpoint only. Installed plugin code can still write a key through
     * {@code LowcoderServices.setConfig} ({@code SharedPluginServices}), which has no user check: plugins are server
     * code the operator installs, and what a plugin's own endpoints let a user do is that plugin's to check.
     */
    @Override
    public Mono<ResponseView<ServerConfig>> updateServerConfig(@PathVariable String key, @RequestBody UpdateConfigRequest updateConfigRequest) {
        return sessionUserService.getVisitorId()
                .flatMap(userService::findById)
                .filter(user -> Boolean.TRUE.equals(user.getSuperAdmin()))
                .switchIfEmpty(ofError(NOT_AUTHORIZED, "NOT_AUTHORIZED"))
                .flatMap(superAdmin -> serverConfigRepository.upsert(key, updateConfigRequest.value()))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<ConfigView>> getConfig(ServerWebExchange exchange,@RequestParam(required = false) String orgId) {
        return orgApiService.getOrganizationConfigs(orgId)
                .map(ResponseView::success);
    }
}
