package org.lowcoder.domain.datasource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.ServerApplication;
import org.lowcoder.domain.datasource.model.TokenBasedConnection;
import org.lowcoder.domain.datasource.model.TokenBasedConnectionDO;
import org.lowcoder.domain.datasource.repository.TokenBasedConnectionRepository;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.plugin.client.DatasourcePluginClient;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.sdk.models.TokenBasedConnectionDetail;
import org.lowcoder.sdk.plugin.common.DatasourceConnector;
import org.lowcoder.sdk.util.IDUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * TokenBasedConnectionRepository against the MongoDB test container (unit U14, task L3-11c). The connector that turns the
 * stored map back into a token detail is a mock (plugin jars are not on the surefire classpath); the detail class is a fake
 * with one secret field, which makes the encryption at rest observable in the raw document. Shares the Spring context of
 * DatasourceRepositoryMongoTest (same extra property and mock beans).
 */
@SpringBootTest(classes = ServerApplication.class)
@ActiveProfiles("test")
@TestPropertySource(properties = "l3_11c.context=datasource-repository")
class TokenBasedConnectionRepositoryMongoTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final String TYPE = "tokenPlugin";
    private static final String ACCESS_TOKEN = "accessToken";

    /** Fake detail: one secret field, reversible encryption through the functions it is handed. */
    static class FakeTokenDetail implements TokenBasedConnectionDetail {
        String accessToken;
        boolean stale;

        FakeTokenDetail(String accessToken, boolean stale) {
            this.accessToken = accessToken;
            this.stale = stale;
        }

        @Override
        public boolean isStale() {
            return stale;
        }

        @Override
        public Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put(ACCESS_TOKEN, accessToken);
            map.put("stale", stale);
            return map;
        }

        @Override
        public void doEncrypt(Function<String, String> encryptFunc) {
            accessToken = encryptFunc.apply(accessToken);
        }

        @Override
        public void doDecrypt(Function<String, String> decryptFunc) {
            accessToken = decryptFunc.apply(accessToken);
        }
    }

    @MockBean
    private DatasourceMetaInfoService datasourceMetaInfoService;
    @MockBean
    private DatasourcePluginClient datasourcePluginClient;
    @Autowired
    private TokenBasedConnectionRepository repository;
    @Autowired
    private EncryptionService encryptionService;
    @Autowired
    private ReactiveMongoTemplate mongo;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void theConnectorBuildsAFakeDetailFromTheStoredMap() {
        DatasourceConnector<Object, ?> connector = org.mockito.Mockito.mock(DatasourceConnector.class);
        when(connector.resolveTokenDetail(anyMap())).thenAnswer(invocation -> {
            Map<String, Object> map = invocation.getArgument(0);
            return new FakeTokenDetail((String) map.get(ACCESS_TOKEN), Boolean.TRUE.equals(map.get("stale")));
        });
        when(datasourceMetaInfoService.getDatasourceConnector(anyString())).thenReturn((DatasourceConnector) connector);
    }

    private static TokenBasedConnection connection(String datasourceId, String token, boolean stale) {
        TokenBasedConnection connection = new TokenBasedConnection();
        connection.setDatasourceId(datasourceId);
        connection.setTokenDetail(new FakeTokenDetail(token, stale));
        return connection;
    }

    private long countRaw(String datasourceId) {
        return mongo.count(Query.query(Criteria.where("datasourceId").is(datasourceId)), TokenBasedConnectionDO.class).block(TIMEOUT);
    }

    private TokenBasedConnectionDO raw(String datasourceId) {
        return mongo.findOne(Query.query(Criteria.where("datasourceId").is(datasourceId)), TokenBasedConnectionDO.class).block(TIMEOUT);
    }

    /** Catches: the token stored in clear, the encryption not being undone on the caller's object, a lost field on the way back. */
    @Test
    void saveStoresTheTokenEncryptedAndFindDecryptsItAgain() {
        String datasourceId = IDUtils.generate();
        TokenBasedConnection connection = connection(datasourceId, "secret-token-1", true);

        repository.saveConnection(connection, datasourceId).block(TIMEOUT);

        String stored = (String) raw(datasourceId).getTokenDetail().get(ACCESS_TOKEN);
        System.out.println("[TokenBasedConnectionRepositoryMongoTest] stored token is " + stored.length() + " chars, not the clear text");
        assertThat(stored).isNotEqualTo("secret-token-1");
        assertThat(encryptionService.decryptString(stored)).isEqualTo("secret-token-1");
        assertThat(((FakeTokenDetail) connection.getTokenDetail()).accessToken)
                .as("the caller's object is decrypted again after the save").isEqualTo("secret-token-1");

        TokenBasedConnection found = repository.findByDatasourceId(datasourceId, TYPE).block(TIMEOUT);
        assertThat(found.getDatasourceId()).isEqualTo(datasourceId);
        assertThat(found.getId()).isNotBlank();
        assertThat(found.isStale()).isTrue();
        assertThat(((FakeTokenDetail) found.getTokenDetail()).accessToken).isEqualTo("secret-token-1");
    }

    /** Catches: a second save inserting a second document, or replacing the id / creation data. */
    @Test
    void savingAgainForTheSameDatasourceReplacesTheTokenInTheSameDocument() {
        String datasourceId = IDUtils.generate();
        repository.saveConnection(connection(datasourceId, "first", false), datasourceId).block(TIMEOUT);
        TokenBasedConnectionDO firstRaw = raw(datasourceId);

        repository.saveConnection(connection(datasourceId, "second", false), datasourceId).block(TIMEOUT);

        assertThat(countRaw(datasourceId)).isEqualTo(1L);
        TokenBasedConnectionDO secondRaw = raw(datasourceId);
        assertThat(secondRaw.getId()).isEqualTo(firstRaw.getId());
        assertThat(encryptionService.decryptString((String) secondRaw.getTokenDetail().get(ACCESS_TOKEN))).isEqualTo("second");
        TokenBasedConnection found = repository.findByDatasourceId(datasourceId, TYPE).block(TIMEOUT);
        assertThat(((FakeTokenDetail) found.getTokenDetail()).accessToken).isEqualTo("second");
        assertThat(found.isStale()).isFalse();
    }

    /** Catches: a cross-datasource mix-up in the lookup, a missing connection failing instead of completing empty. */
    @Test
    void connectionsOfDifferentDatasourcesStayApartAndAnUnknownOneIsEmpty() {
        String a = IDUtils.generate();
        String b = IDUtils.generate();
        repository.saveConnection(connection(a, "token-a", false), a).block(TIMEOUT);
        repository.saveConnection(connection(b, "token-b", true), b).block(TIMEOUT);

        assertThat(((FakeTokenDetail) repository.findByDatasourceId(a, TYPE).block(TIMEOUT).getTokenDetail()).accessToken).isEqualTo("token-a");
        assertThat(((FakeTokenDetail) repository.findByDatasourceId(b, TYPE).block(TIMEOUT).getTokenDetail()).accessToken).isEqualTo("token-b");
        assertThat(repository.findByDatasourceId(IDUtils.generate(), TYPE).blockOptional(TIMEOUT)).isEmpty();
    }
}
