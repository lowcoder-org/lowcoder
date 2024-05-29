package org.lowcoder.api.config;

import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.serversetting.model.ServerSetting;
import org.lowcoder.domain.serversetting.service.ServerSettingService;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RequiredArgsConstructor
@RestController
public class ServerSettingController implements ServerSettingEndpoints
{
    private final ServerSettingService serverSettingService;
    @Override
    public Mono<Map<String, String>> getServerSettings() {
        return serverSettingService.getServerSettingsMap();
    }

}
