package org.lowcoder.domain.datasource.repository;

import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.datasource.model.TokenBasedConnection;
import org.lowcoder.domain.datasource.model.TokenBasedConnectionDO;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.TokenBasedConnectionDetail;
import org.lowcoder.sdk.plugin.common.DatasourceConnector;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import reactor.core.publisher.Mono;

@Repository
@RequiredArgsConstructor
public class TokenBasedConnectionRepository {

    private final TokenBasedConnectionDORepository tokenBasedConnectionDORepository;
    private final DatasourceMetaInfoService datasourceMetaInfoService;
    private final EncryptionService encryptionService;
    private final MongoUpsertHelper mongoUpsertHelper;

    public Mono<TokenBasedConnection> findByDatasourceId(String datasourceId, String datasourceType) {
        return tokenBasedConnectionDORepository.findByDatasourceId(datasourceId)
                .map(connectionDO -> convertToDatasourceConnection(connectionDO, datasourceType));
    }

    public Mono<Void> saveConnection(TokenBasedConnection tokenBasedConnection, String datasourceId) {

        tokenBasedConnection.getTokenDetail().doEncrypt(encryptionService::encryptString);

        TokenBasedConnectionDO result = TokenBasedConnectionDO.builder()
                .datasourceId(tokenBasedConnection.getDatasourceId())
                .tokenDetail(tokenBasedConnection.getTokenDetail().toMap())
                .id(tokenBasedConnection.getId())
                .createdAt(tokenBasedConnection.getCreatedAt())
                .updatedAt(tokenBasedConnection.getUpdatedAt())
                .createdBy(tokenBasedConnection.getCreatedBy())
                .modifiedBy(tokenBasedConnection.getModifiedBy())
                .build();

        return mongoUpsertHelper.upsertWithAuditingParams(result, "datasourceId", datasourceId)
                .doOnNext(__ -> tokenBasedConnection.getTokenDetail().doDecrypt(encryptionService::decryptString))
                .then();
    }

    private TokenBasedConnection convertToDatasourceConnection(TokenBasedConnectionDO tokenBasedConnectionDO,
            String datasourceType) {

        Map<String, Object> tokenDetailMap = tokenBasedConnectionDO.getTokenDetail();
        TokenBasedConnectionDetail tokenDetail = getDatasourceConnector(datasourceType).resolveTokenDetail(tokenDetailMap);
        tokenDetail.doDecrypt(encryptionService::decryptString);

        TokenBasedConnection result = new TokenBasedConnection();
        result.setDatasourceId(tokenBasedConnectionDO.getDatasourceId());
        result.setTokenDetail(tokenDetail);
        result.setId(tokenBasedConnectionDO.getId());
        result.setCreatedAt(tokenBasedConnectionDO.getCreatedAt());
        result.setUpdatedAt(tokenBasedConnectionDO.getUpdatedAt());
        result.setCreatedBy(tokenBasedConnectionDO.getCreatedBy());
        result.setModifiedBy(tokenBasedConnectionDO.getModifiedBy());
        return result;
    }

    private DatasourceConnector<Object, ? extends DatasourceConnectionConfig> getDatasourceConnector(String datasourceType) {
        return datasourceMetaInfoService.getDatasourceConnector(datasourceType);
    }
}
