package org.lowcoder.api.config;

import lombok.RequiredArgsConstructor;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.domain.serversetting.model.ServerSetting;
import org.lowcoder.domain.serversetting.service.ServerSettingRepository;
import org.lowcoder.domain.serversetting.service.ServerSettingService;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RequiredArgsConstructor
@RestController
public class ServerSettingController implements ServerSettingEndpoints
{
    private final ServerSettingService serverSettingService;
    @Override
    public Flux<ServerSetting> getServerSettings() {
        return serverSettingService.findAll();
    }

}
