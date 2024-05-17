package org.lowcoder.domain.serversetting.service;

import org.lowcoder.domain.serversetting.model.ServerSetting;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

public interface ServerSettingRepository extends ReactiveMongoRepository<ServerSetting, String> {
}
