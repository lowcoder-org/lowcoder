package org.lowcoder.domain.datasource.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.lowcoder.domain.plugin.DatasourceMetaInfoConstants.REST_API;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.lowcoder.domain.datasource.model.ClientBasedDatasourceConnectionHolder;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceConnectionHolder;
import org.lowcoder.domain.datasource.model.StatelessDatasourceConnectionHolder;
import org.lowcoder.domain.datasource.model.TokenBasedConnection;
import org.lowcoder.domain.datasource.model.TokenBasedConnectionHolder;
import org.lowcoder.domain.datasource.repository.TokenBasedConnectionRepository;
import org.lowcoder.domain.datasource.service.DatasourceConnectionPool;
import org.lowcoder.domain.plugin.DatasourceMetaInfo;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.infra.perf.PerfHelper;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.TokenBasedConnectionDetail;
import org.lowcoder.sdk.plugin.common.DatasourceConnector;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.auth.AuthConfig;
import org.lowcoder.sdk.plugin.restapi.auth.RestApiAuthType;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.core.publisher.Mono;

/**
 * {@code DatasourceConnectionPoolFacade} (unit U5, task L3-5): which pool serves which datasource. The three pools are
 * real instances (the facade keys them by class), recognised by the holder type they hand out.
 */
@SuppressWarnings({"rawtypes", "unchecked"})
class DatasourceConnectionPoolFacadeTest {

    private static final String SQL_TYPE = "L3-5-facade-sql";
    private static final Set<RestApiAuthType> STATELESS_AUTH_TYPES = EnumSet.of(RestApiAuthType.NO_AUTH,
            RestApiAuthType.BASIC_AUTH, RestApiAuthType.DIGEST_AUTH, RestApiAuthType.OAUTH2_INHERIT_FROM_LOGIN);

    private DatasourceMetaInfoService metaInfoService;
    private ClientBasedConnectionPool clientBasedPool;
    private DatasourceConnectionPoolFacade facade;
    private DatasourceConnector connector;

    @BeforeEach
    void setUp() {
        metaInfoService = mock(DatasourceMetaInfoService.class);
        TokenBasedConnectionRepository tokenRepository = mock(TokenBasedConnectionRepository.class);
        TokenBasedConnection stored = new TokenBasedConnection();
        stored.setTokenDetail(mock(TokenBasedConnectionDetail.class));
        stored.setUpdatedAt(Instant.now());
        when(tokenRepository.findByDatasourceId(any(), any())).thenReturn(Mono.just(stored));
        connector = mock(DatasourceConnector.class);
        when(metaInfoService.getDatasourceConnector(SQL_TYPE)).thenReturn(connector);
        when(connector.doCreateConnection(any())).thenReturn(Mono.just("connection"));
        when(connector.destroyConnection(any())).thenReturn(Mono.empty());

        clientBasedPool = new ClientBasedConnectionPool(metaInfoService, mock(PerfHelper.class));
        List<DatasourceConnectionPool> pools = new ArrayList<>();
        pools.add(new StatelessConnectionPool());
        pools.add(new TokenBasedConnectionPool(metaInfoService, tokenRepository));
        pools.add(clientBasedPool);
        facade = new DatasourceConnectionPoolFacade(pools, metaInfoService);
        pools.add(facade); // the facade itself is among the injected pools, as it is a Spring bean of the same type
        facade.init();
    }

    @AfterEach
    void releaseConnections() {
        ((com.google.common.cache.LoadingCache) ReflectionTestUtils.getField(clientBasedPool, "cache")).invalidateAll();
    }

    private static Datasource restDatasource(RestApiAuthType authType) {
        AuthConfig authConfig = mock(AuthConfig.class);
        when(authConfig.getType()).thenReturn(authType);
        Datasource datasource = Datasource.builder().id("L3-5-rest-" + authType).type(REST_API)
                .detailConfig(RestApiDatasourceConfig.builder().authConfig(authConfig).build()).build();
        return datasource;
    }

    private DatasourceConnectionHolder holderOf(Datasource datasource) {
        return facade.getOrCreateConnection(datasource).block();
    }

    /** Catches the facade registering itself (:43): the map holds exactly the three real pools. */
    @Test
    void init_registersEveryPoolByClass_exceptTheFacadeItself() {
        Map<Class<?>, DatasourceConnectionPool> poolMap = (Map<Class<?>, DatasourceConnectionPool>) ReflectionTestUtils.getField(facade, "poolMap");

        assertThat(poolMap).containsOnlyKeys(StatelessConnectionPool.class, TokenBasedConnectionPool.class, ClientBasedConnectionPool.class);
        System.out.println("[DatasourceConnectionPoolFacadeTest] registered pools: " + poolMap.keySet());
    }

    /** Catches the wrong pool for stateless REST auth types (:55-58): each of the four goes to the stateless pool. */
    @ParameterizedTest
    @EnumSource(value = RestApiAuthType.class, names = {"NO_AUTH", "BASIC_AUTH", "DIGEST_AUTH", "OAUTH2_INHERIT_FROM_LOGIN"})
    void rest_statelessAuthTypes_goToTheStatelessPool(RestApiAuthType authType) {
        assertThat(STATELESS_AUTH_TYPES).contains(authType);

        assertThat(holderOf(restDatasource(authType))).isInstanceOf(StatelessDatasourceConnectionHolder.class);
        System.out.println("[DatasourceConnectionPoolFacadeTest] REST " + authType + " -> stateless pool");
    }

    /** Catches the wrong pool for token REST auth (:61): a stateless pool would never refresh the OAuth token. */
    @ParameterizedTest
    @EnumSource(value = RestApiAuthType.class, names = {"BEARER_TOKEN_AUTH", "OAUTH2"})
    void rest_otherAuthTypes_goToTheTokenPool(RestApiAuthType authType) {
        assertThat(STATELESS_AUTH_TYPES).doesNotContain(authType);

        assertThat(holderOf(restDatasource(authType))).isInstanceOf(TokenBasedConnectionHolder.class);
        System.out.println("[DatasourceConnectionPoolFacadeTest] REST " + authType + " -> token pool");
    }

    /** Catches the REST shortcut applying to any config (:54): a REST type with another config follows the meta info. */
    @Test
    void rest_withANonRestConfig_followsTheMetaInfoPool() {
        when(metaInfoService.getDatasourceMetaInfo(REST_API)).thenReturn(
                DatasourceMetaInfo.builder().type(REST_API).connectionPool(ClientBasedConnectionPool.class).build());
        when(metaInfoService.getDatasourceConnector(REST_API)).thenReturn(connector);
        Datasource datasource = Datasource.builder().id("L3-5-rest-other-config").type(REST_API)
                .detailConfig(mock(org.lowcoder.sdk.models.DatasourceConnectionConfig.class)).build();

        assertThat(holderOf(datasource)).isInstanceOf(ClientBasedDatasourceConnectionHolder.class);
        System.out.println("[DatasourceConnectionPoolFacadeTest] REST type with a non-REST config -> meta info pool");
    }

    /** Catches a wrong lookup of the pool for non-REST datasources (:66-72), and that info() reaches the client pool. */
    @Test
    void nonRest_usesTheMetaInfoPool_andInfoDelegatesToTheClientBasedPool() {
        when(metaInfoService.getDatasourceMetaInfo(SQL_TYPE)).thenReturn(
                DatasourceMetaInfo.builder().type(SQL_TYPE).connectionPool(ClientBasedConnectionPool.class).build());
        HikariPerfWrapper wrapper = mock(HikariPerfWrapper.class);
        when(wrapper.getDatasourceProperties()).thenReturn(new java.util.Properties());
        when(wrapper.getHealthCheckProperties()).thenReturn(new java.util.Properties());
        when(connector.doCreateConnection(any())).thenReturn(Mono.just(wrapper));
        Datasource datasource = Datasource.builder().id("L3-5-facade-info").type(SQL_TYPE).build();

        assertThat(holderOf(datasource)).isInstanceOf(ClientBasedDatasourceConnectionHolder.class);

        assertThat((List<?>) facade.info("L3-5-facade-info")).hasSize(1);
        assertThat((List<?>) facade.info("L3-5-no-such-datasource")).isEmpty();
        System.out.println("[DatasourceConnectionPoolFacadeTest] SQL datasource -> client based pool; info delegated");
    }

    /**
     * Pins as behaviour that an unknown pool class is thrown synchronously, not signalled (:69): the BizException
     * INVALID_DATASOURCE_CONFIGURATION with message key CANT_FIND_CONNECTION_POOL surfaces from the call itself.
     */
    @Test
    void unknownPoolClass_throwsInvalidDatasourceConfigurationSynchronously() {
        when(metaInfoService.getDatasourceMetaInfo(SQL_TYPE)).thenReturn(
                DatasourceMetaInfo.builder().type(SQL_TYPE).connectionPool(DatasourceConnectionPoolFacade.class).build());
        Datasource datasource = Datasource.builder().id("L3-5-unknown-pool").type(SQL_TYPE).build();

        assertThatThrownBy(() -> facade.getOrCreateConnection(datasource))
                .isInstanceOfSatisfying(BizException.class, biz -> {
                    assertThat(biz.getError()).isEqualTo(BizError.INVALID_DATASOURCE_CONFIGURATION);
                    assertThat(biz.getMessageKey()).isEqualTo("CANT_FIND_CONNECTION_POOL");
                });
        System.out.println("[DatasourceConnectionPoolFacadeTest] unregistered pool class -> synchronous BizException CANT_FIND_CONNECTION_POOL");
    }
}
