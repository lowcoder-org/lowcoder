package org.lowcoder.domain.asset.service;

import org.lowcoder.domain.asset.model.Asset;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

public interface AssetRepository extends ReactiveMongoRepository<Asset, String> {
}
