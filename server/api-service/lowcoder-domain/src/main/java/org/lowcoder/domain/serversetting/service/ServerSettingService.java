package org.lowcoder.domain.serversetting.service;

import org.lowcoder.domain.serversetting.model.ServerSetting;
import reactor.core.publisher.Flux;

public interface ServerSettingService {

    Flux<ServerSetting> findAll();
}
