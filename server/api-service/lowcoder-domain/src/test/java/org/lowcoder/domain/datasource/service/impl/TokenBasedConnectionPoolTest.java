package org.lowcoder.domain.datasource.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.TokenBasedConnection;
import org.lowcoder.domain.datasource.model.TokenBasedConnectionHolder;
import org.lowcoder.domain.datasource.repository.TokenBasedConnectionRepository;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.TokenBasedConnectionDetail;
import org.lowcoder.sdk.plugin.common.DatasourceConnector;
import org.mockito.ArgumentCaptor;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@code TokenBasedConnectionPool} (unit U5, task L3-5): a stored token is reused while it is fresh, and fetched and
 * saved again when it is missing or stale. Mockito repository, connector and token detail.
 */
@SuppressWarnings({"rawtypes", "unchecked"})
class TokenBasedConnectionPoolTest {

    private static final String TYPE = "L3-5-token-type";
    private static final String DATASOURCE_ID = "L3-5-token-ds";

    private TokenBasedConnectionRepository repository;
    private DatasourceConnector connector;
    private TokenBasedConnectionPool pool;
    private DatasourceConnectionConfig config;
    private Datasource datasource;

    @BeforeEach
    void setUp() {
        repository = mock(TokenBasedConnectionRepository.class);
        connector = mock(DatasourceConnector.class);
        DatasourceMetaInfoService metaInfoService = mock(DatasourceMetaInfoService.class);
        when(metaInfoService.getDatasourceConnector(TYPE)).thenReturn(connector);
        pool = new TokenBasedConnectionPool(metaInfoService, repository);
        config = mock(DatasourceConnectionConfig.class);
        datasource = Datasource.builder().id(DATASOURCE_ID).type(TYPE).detailConfig(config).build();
        when(repository.findByDatasourceId(DATASOURCE_ID, TYPE)).thenReturn(Mono.empty());
        when(repository.saveConnection(any(), eq(DATASOURCE_ID))).thenReturn(Mono.empty());
    }

    private static TokenBasedConnection stored(TokenBasedConnectionDetail detail, Instant updatedAt) {
        TokenBasedConnection connection = new TokenBasedConnection();
        connection.setDatasourceId(DATASOURCE_ID);
        connection.setTokenDetail(detail);
        connection.setUpdatedAt(updatedAt);
        return connection;
    }

    private static TokenBasedConnectionDetail detail(boolean stale) {
        TokenBasedConnectionDetail detail = mock(TokenBasedConnectionDetail.class);
        when(detail.isStale()).thenReturn(stale);
        return detail;
    }

    /** Catches a missing token never being fetched (:39-44) or not saved (:44, :65-66), and the holder not exposing the new detail. */
    @Test
    void noStoredToken_createsSavesAndReturnsTheNewConnection() {
        TokenBasedConnectionDetail fresh = detail(false);
        when(connector.doCreateConnection(config)).thenReturn(Mono.just(fresh));

        StepVerifier.create(pool.getOrCreateConnection(datasource))
                .assertNext(holder -> assertThat(holder.connection()).isSameAs(fresh))
                .verifyComplete();

        ArgumentCaptor<TokenBasedConnection> saved = ArgumentCaptor.forClass(TokenBasedConnection.class);
        verify(repository).saveConnection(saved.capture(), eq(DATASOURCE_ID));
        assertThat(saved.getValue().getDatasourceId()).isEqualTo(DATASOURCE_ID);
        assertThat(saved.getValue().getTokenDetail()).isSameAs(fresh);
        System.out.println("[TokenBasedConnectionPoolTest] no stored token -> created, saved, returned");
    }

    /** Catches the token being refetched on every query (:41, :47): a stored, fresh token is reused. */
    @Test
    void freshStoredToken_isReusedWithoutCreatingOrSaving() {
        TokenBasedConnectionDetail storedDetail = detail(false);
        when(repository.findByDatasourceId(DATASOURCE_ID, TYPE)).thenReturn(Mono.just(stored(storedDetail, Instant.now())));
        datasource.setUpdatedAt(Instant.now().minus(1, ChronoUnit.HOURS));

        StepVerifier.create(pool.getOrCreateConnection(datasource))
                .assertNext(holder -> assertThat(holder.connection()).isSameAs(storedDetail))
                .verifyComplete();
        verify(connector, never()).doCreateConnection(any());
        verify(repository, never()).saveConnection(any(), any());
        System.out.println("[TokenBasedConnectionPoolTest] fresh stored token reused");
    }

    /** Catches a stale token being reused (:41-42): an expired token and a datasource edited after the token are refetched. */
    @ParameterizedTest(name = "tokenExpired={0}")
    @ValueSource(booleans = {true, false})
    void staleStoredToken_isFetchedAndSavedAgain(boolean tokenExpired) {
        TokenBasedConnectionDetail oldDetail = detail(tokenExpired);
        Instant tokenTime = Instant.now().minus(1, ChronoUnit.HOURS);
        when(repository.findByDatasourceId(DATASOURCE_ID, TYPE)).thenReturn(Mono.just(stored(oldDetail, tokenTime)));
        datasource.setUpdatedAt(tokenExpired ? tokenTime.minusSeconds(60) : Instant.now());
        TokenBasedConnectionDetail newDetail = detail(false);
        when(connector.doCreateConnection(config)).thenReturn(Mono.just(newDetail));

        StepVerifier.create(pool.getOrCreateConnection(datasource))
                .assertNext(holder -> assertThat(holder.connection()).isSameAs(newDetail))
                .verifyComplete();
        verify(repository).saveConnection(any(), eq(DATASOURCE_ID));
        System.out.println("[TokenBasedConnectionPoolTest] stale token (expired=" + tokenExpired + ") -> refetched and saved");
    }

    /** Catches a connector that yields nothing passing silently (:43): PLUGIN_CREATE_CONNECTION_FAILED, nothing saved. */
    @Test
    void connectorReturnsNothing_failsWithPluginCreateConnectionFailed() {
        when(connector.doCreateConnection(config)).thenReturn(Mono.empty());

        StepVerifier.create(pool.getOrCreateConnection(datasource))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(BizException.class);
                    assertThat(((BizException) error).getError()).isEqualTo(BizError.PLUGIN_CREATE_CONNECTION_FAILED);
                })
                .verify();
        verify(repository, never()).saveConnection(any(), any());
        System.out.println("[TokenBasedConnectionPoolTest] connector without connection -> PLUGIN_CREATE_CONNECTION_FAILED");
    }

    /** Catches a connection of the wrong class being saved (:58-59): DATASOURCE_TYPE_ERROR with the class name. */
    @Test
    void connectorReturnsAWrongType_failsWithDatasourceTypeError() {
        when(connector.doCreateConnection(config)).thenReturn(Mono.just("not a token detail"));

        StepVerifier.create(pool.getOrCreateConnection(datasource))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(BizException.class);
                    BizException biz = (BizException) error;
                    assertThat(biz.getError()).isEqualTo(BizError.DATASOURCE_TYPE_ERROR);
                    assertThat(biz.getArgs()).containsExactly("String");
                })
                .verify();
        verify(repository, never()).saveConnection(any(), any());
        System.out.println("[TokenBasedConnectionPoolTest] wrong connection class -> DATASOURCE_TYPE_ERROR(String)");
    }

    /** Catches a failed save being swallowed (:65-66), and pins that info() is not supported. */
    @Test
    void saveFailure_propagates_andInfoIsUnsupported() {
        TokenBasedConnectionDetail created = detail(false);
        when(connector.doCreateConnection(config)).thenReturn(Mono.just(created));
        IllegalStateException failure = new IllegalStateException("mongo down");
        when(repository.saveConnection(any(), eq(DATASOURCE_ID))).thenReturn(Mono.error(failure));

        StepVerifier.create(pool.getOrCreateConnection(datasource))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(failure))
                .verify();
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> pool.info(DATASOURCE_ID)).isInstanceOf(UnsupportedOperationException.class);
        System.out.println("[TokenBasedConnectionPoolTest] save failure propagated; info unsupported");
    }
}
