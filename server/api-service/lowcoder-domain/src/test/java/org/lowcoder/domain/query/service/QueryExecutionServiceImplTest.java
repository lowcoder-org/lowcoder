package org.lowcoder.domain.query.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceConnectionHolder;
import org.lowcoder.domain.datasource.service.DatasourceConnectionPool;
import org.lowcoder.domain.plugin.client.DatasourcePluginClient;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.QueryExecutor;
import org.lowcoder.sdk.query.QueryExecutionContext;
import org.lowcoder.sdk.query.QueryVisitorContext;
import org.springframework.http.HttpCookie;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@code QueryExecutionServiceImpl} (unit U7, task L3-6): executor routing, the request handed to the node client,
 * oauth2 token injection, error mapping and the timeout, with Mockito collaborators and StepVerifier.
 */
@SuppressWarnings({"rawtypes", "unchecked"})
class QueryExecutionServiceImplTest {

    private static final String JAVA_TYPE = "L3-6-java";
    private static final String JS_TYPE = "L3-6-js";
    private static final Duration VERIFY_TIMEOUT = Duration.ofSeconds(5);
    /** {@code CommonConfig}'s maximum query timeout, in seconds. */
    private static final int DEFAULT_MAX_SECONDS = 300;
    private static final String AT_THE_MAXIMUM = DEFAULT_MAX_SECONDS + "s";
    private static final String ABOVE_THE_MAXIMUM = (DEFAULT_MAX_SECONDS + 100) + "s";
    /** The smallest maximum whose milliseconds, multiplied by 1000 again as the caller did (BF-043), leave the int range. */
    private static final int OVERFLOWING_MAX_SECONDS = 2148;
    private static final String DEFAULT_TIMEOUT_MS = "10000";
    /** A timeout text that parses to NaN (BF-079). */
    private static final String NAN_TIMEOUT = "NaN";

    private DatasourceConnectionPool pool;
    private DatasourceMetaInfoService metaInfoService;
    private DatasourcePluginClient pluginClient;
    private CommonConfig common;
    private QueryExecutionServiceImpl service;
    private QueryExecutor executor;
    private QueryExecutionContext executionContext;
    private DatasourceConnectionHolder holder;
    private QueryExecutionResult success;

    @BeforeEach
    void setUp() {
        pool = mock(DatasourceConnectionPool.class);
        metaInfoService = mock(DatasourceMetaInfoService.class);
        pluginClient = mock(DatasourcePluginClient.class);
        common = new CommonConfig();
        service = new QueryExecutionServiceImpl(pool, metaInfoService, pluginClient, common);

        executor = mock(QueryExecutor.class);
        executionContext = mock(QueryExecutionContext.class);
        holder = mock(DatasourceConnectionHolder.class);
        success = QueryExecutionResult.success("rows");
        when(metaInfoService.isJsDatasourcePlugin(JS_TYPE)).thenReturn(true);
        when(metaInfoService.getQueryExecutor(JAVA_TYPE)).thenReturn(executor);
        when(executor.buildQueryExecutionContextMono(any(), any(), any(), any())).thenReturn(Mono.just(executionContext));
        when(holder.connection()).thenReturn("connection-object");
        when(pool.getOrCreateConnection(any())).thenReturn((Mono) Mono.just(holder));
        when(executor.doExecuteQuery(any(), any())).thenReturn(Mono.just(success));
    }

    private static Datasource javaDatasource() {
        return Datasource.builder().id("ds-java").type(JAVA_TYPE).detailConfig(mock(DatasourceConnectionConfig.class)).build();
    }

    private static Datasource jsDatasource(JsDatasourceConnectionConfig config) {
        return Datasource.builder().id("ds-js").type(JS_TYPE).detailConfig(config).build();
    }

    private static QueryVisitorContext visitor(MultiValueMap<String, HttpCookie> cookies, Mono<List<Property>> tokens) {
        return new QueryVisitorContext("visitor", "org", 8080, cookies, tokens, Set.of());
    }

    private static QueryVisitorContext visitor() {
        return visitor(new LinkedMultiValueMap<>(), Mono.just(List.of()));
    }

    private static JsDatasourceConnectionConfig jsConfigWithAuthType(String authType) {
        JsDatasourceConnectionConfig config = new JsDatasourceConnectionConfig();
        if (authType != null) {
            HashMap<String, String> authConfig = new HashMap<>();
            authConfig.put("type", authType);
            config.put("authConfig", authConfig);
        }
        return config;
    }

    // ---------------------------------------------------------------- timeout

    /** Catches a user-set timeout being overwritten (:48) and the default not being written. */
    @Test
    void executeQuery_blankTimeout_putsTheDefaultIntoTheQueryConfigWithoutOverwriting() {
        Map<String, Object> queryConfig = new HashMap<>();
        StepVerifier.create(service.executeQuery(javaDatasource(), queryConfig, Map.of(), "", visitor())).expectNext(success).verifyComplete();
        assertThat(queryConfig).containsEntry("timeoutMs", "10000");

        Map<String, Object> preset = new HashMap<>(Map.of("timeoutMs", "777"));
        StepVerifier.create(service.executeQuery(javaDatasource(), preset, Map.of(), "5s", visitor())).expectNext(success).verifyComplete();
        assertThat(preset).as("an existing timeoutMs is kept").containsEntry("timeoutMs", "777");
        System.out.println("[QueryExecutionServiceImplTest] default timeout 10000 written; an existing value kept");
    }

    /**
     * BF-043 fixed: the caller passed {@code getMaxQueryTimeout() * 1000} to a method that takes seconds, so with the
     * default maximum of 300 s a "400s" timeout was accepted (limit 300000 s). The maximum is now enforced: 300 s is
     * accepted, 400 s is refused with EXCEED_MAX_QUERY_TIMEOUT naming 300 (the message reads "{0}s"), before any executor.
     */
    @Test
    void executeQuery_timeoutAboveTheConfiguredMaximum_isRefusedBF043() {
        assertThat(common.getMaxQueryTimeout()).isEqualTo(DEFAULT_MAX_SECONDS);
        Map<String, Object> atTheMaximum = new HashMap<>();
        StepVerifier.create(service.executeQuery(javaDatasource(), atTheMaximum, Map.of(), AT_THE_MAXIMUM, visitor())).expectNext(success).verifyComplete();
        assertThat(atTheMaximum).containsEntry("timeoutMs", String.valueOf(DEFAULT_MAX_SECONDS * 1000));
        clearInvocations(executor, pluginClient, pool);

        assertThatThrownBy(() -> service.executeQuery(javaDatasource(), new HashMap<>(), Map.of(), ABOVE_THE_MAXIMUM, visitor()))
                .isInstanceOfSatisfying(PluginException.class, plugin -> {
                    System.out.println("[QueryExecutionServiceImplTest] " + ABOVE_THE_MAXIMUM + " with a " + DEFAULT_MAX_SECONDS + " s maximum -> "
                            + plugin.getError() + " " + java.util.Arrays.toString(plugin.getArgs()));
                    assertThat(plugin.getError()).isEqualTo(PluginCommonError.EXCEED_MAX_QUERY_TIMEOUT);
                    assertThat(plugin.getArgs()).containsExactly(DEFAULT_MAX_SECONDS);
                });
        verifyNoInteractions(executor, pluginClient, pool);
    }

    /**
     * BF-043 fixed, overflow part: with the x1000 a configured maximum of 2148 s made the blank-timeout default a
     * NEGATIVE timeoutMs, so every query timed out at once. Now the default (10 s) is used and the query answers.
     */
    @Test
    void executeQuery_maximumOf2148Seconds_keepsTheDefaultTimeoutBF043() {
        common.setMaxQueryTimeout(OVERFLOWING_MAX_SECONDS);
        Map<String, Object> queryConfig = new HashMap<>();

        StepVerifier.create(service.executeQuery(javaDatasource(), queryConfig, Map.of(), "", visitor()))
                .expectNext(success)
                .expectComplete()
                .verify(VERIFY_TIMEOUT);

        System.out.println("[QueryExecutionServiceImplTest] maximum " + OVERFLOWING_MAX_SECONDS + " s -> timeoutMs " + queryConfig.get("timeoutMs"));
        assertThat(queryConfig).containsEntry("timeoutMs", DEFAULT_TIMEOUT_MS);
    }

    /**
     * Catches invalid timeouts reaching the executor (QueryExecutionServiceImpl:48): they are thrown synchronously, outside the
     * reactive chain; "NaN" among them (BF-079: it was a 0 ms timeout).
     */
    @ParameterizedTest
    @ValueSource(strings = {"-5", "abc", NAN_TIMEOUT})
    void executeQuery_invalidTimeout_throwsSynchronouslyBeforeAnyExecutor(String timeout) {
        assertThatThrownBy(() -> service.executeQuery(javaDatasource(), new HashMap<>(), Map.of(), timeout, visitor()))
                .isInstanceOfSatisfying(PluginException.class, plugin -> assertThat(plugin.getError()).isEqualTo(PluginCommonError.QUERY_ARGUMENT_ERROR));
        verifyNoInteractions(executor, pluginClient, pool);
        System.out.println("[QueryExecutionServiceImplTest] invalid timeout '" + timeout + "' -> PluginException thrown by the call");
    }

    // ---------------------------------------------------------------- local executor

    /** Catches the wrong executor (:51) or a connection not passed on (:77): the Java plugin path end to end. */
    @Test
    void executeQuery_javaPlugin_runsTheLocalExecutorWithTheConnection() {
        Datasource datasource = javaDatasource();
        Map<String, Object> queryConfig = new HashMap<>();
        Map<String, Object> params = Map.of("p", 1);
        QueryVisitorContext visitor = visitor();

        StepVerifier.create(service.executeQuery(datasource, queryConfig, params, "", visitor)).expectNext(success).verifyComplete();

        verify(executor).buildQueryExecutionContextMono(datasource.getDetailConfig(), queryConfig, params, visitor);
        verify(pool).getOrCreateConnection(datasource);
        verify(executor).doExecuteQuery("connection-object", executionContext);
        verifyNoInteractions(pluginClient);
        System.out.println("[QueryExecutionServiceImplTest] Java plugin: local executor, connection passed, node client unused");
    }

    /** Catches executor errors not reaching the holder (:78): that call is what marks a Hikari connection stale. */
    @Test
    void executeQuery_localExecutorError_isReportedToTheConnectionHolder() {
        PluginException failure = new PluginException(PluginCommonError.QUERY_EXECUTION_ERROR, "QUERY_EXECUTION_ERROR", "bad query");
        when(executor.doExecuteQuery(any(), any())).thenReturn(Mono.error(failure));

        StepVerifier.create(service.executeQuery(javaDatasource(), new HashMap<>(), Map.of(), "", visitor()))
                .assertNext(result -> assertThat(result.getQueryCode()).isEqualTo(PluginCommonError.QUERY_EXECUTION_ERROR.name()))
                .verifyComplete();
        verify(holder).onQueryError(failure);
        System.out.println("[QueryExecutionServiceImplTest] executor error reported to the connection holder");
    }

    // ---------------------------------------------------------------- node client

    /** Catches params or cookies lost or mis-keyed for JS plugins (:83-98): params first, cookies appended, nulls allowed. */
    @Test
    void executeQuery_jsPlugin_handsParamsAndCookiesAsKeyValueContextToTheNodeClient() {
        JsDatasourceConnectionConfig config = jsConfigWithAuthType(null);
        Datasource datasource = jsDatasource(config);
        Map<String, Object> queryConfig = new HashMap<>();
        Map<String, Object> params = new HashMap<>();
        params.put("param", "value");
        params.put("nullParam", null);
        MultiValueMap<String, HttpCookie> cookies = new LinkedMultiValueMap<>();
        cookies.add("session", new HttpCookie("session", "abc"));
        when(pluginClient.executeQuery(eq(JS_TYPE), any(), any(), any())).thenReturn(Mono.just(success));

        StepVerifier.create(service.executeQuery(datasource, queryConfig, params, "", visitor(cookies, Mono.just(List.of()))))
                .expectNext(success).verifyComplete();

        org.mockito.ArgumentCaptor<List<Map<String, Object>>> context = org.mockito.ArgumentCaptor.forClass(List.class);
        verify(pluginClient).executeQuery(eq(JS_TYPE), eq(queryConfig), context.capture(), eq(config));
        List<Map<String, Object>> sent = context.getValue();
        assertThat(sent).hasSize(3);
        assertThat(sent.subList(0, 2)).containsExactlyInAnyOrder(Map.of("key", "param", "value", "value"),
                new HashMap<>(Map.of("key", "nullParam")) {{ put("value", null); }});
        assertThat(sent.get(2)).containsEntry("key", "session").containsEntry("value", cookies.get("session"));
        verifyNoInteractions(executor, pool);
        System.out.println("[QueryExecutionServiceImplTest] JS plugin: params then cookies sent as key/value context");
    }

    /**
     * Catches the oauth2 token injected for the wrong datasources (:102-103), not added (:117), or the node call made
     * before the token is known (:104-105): subscription order is recorded in an event log, and the context seen at the
     * moment the client call is assembled already holds the token.
     */
    @Test
    void executeQuery_jsPluginWithOauth2InheritFromLogin_appendsTheAuthTokensBeforeTheCall() {
        JsDatasourceConnectionConfig config = jsConfigWithAuthType("OAUTH2_INHERIT_FROM_LOGIN");
        List<String> events = new ArrayList<>();
        List<Map<String, Object>> contextAtAssembly = new ArrayList<>();
        Mono<List<Property>> tokens = Mono.fromSupplier(() -> {
            events.add("token-subscribed");
            return List.of(new Property("access_token", "tok-1"), new Property("refresh_token", "tok-2"));
        });
        when(pluginClient.executeQuery(eq(JS_TYPE), any(), any(), any())).thenAnswer(invocation -> {
            events.add("client-assembled");
            contextAtAssembly.addAll((List<Map<String, Object>>) invocation.getArgument(2));
            return Mono.fromSupplier(() -> {
                events.add("client-subscribed");
                return success;
            });
        });

        StepVerifier.create(service.executeQuery(jsDatasource(config), new HashMap<>(), Map.of("p", "v"), "", visitor(new LinkedMultiValueMap<>(), tokens)))
                .expectNext(success).verifyComplete();

        assertThat(events).containsExactly("token-subscribed", "client-assembled", "client-subscribed");
        assertThat(contextAtAssembly).containsExactly(Map.of("key", "p", "value", "v"),
                Map.of("key", "access_token", "value", "tok-1"), Map.of("key", "refresh_token", "value", "tok-2"));
        System.out.println("[QueryExecutionServiceImplTest] oauth2 inherit: token subscribed first, client assembled with the tokens: " + events);
    }

    /** Catches token injection for other auth types and non-JS configs (:102-103): the token Mono is never subscribed. */
    @ParameterizedTest
    @ValueSource(strings = {"NO_AUTH", "BASIC_AUTH", "OAUTH2"})
    void executeQuery_jsPluginWithAnotherAuthType_neverAsksForTheToken(String authType) {
        List<String> events = new ArrayList<>();
        Mono<List<Property>> tokens = Mono.fromSupplier(() -> {
            events.add("token-subscribed");
            return List.of();
        });
        when(pluginClient.executeQuery(eq(JS_TYPE), any(), any(), any())).thenReturn(Mono.just(success));

        StepVerifier.create(service.executeQuery(jsDatasource(jsConfigWithAuthType(authType)), new HashMap<>(), Map.of(),
                "", visitor(new LinkedMultiValueMap<>(), tokens))).expectNext(success).verifyComplete();

        assertThat(events).isEmpty();
        System.out.println("[QueryExecutionServiceImplTest] auth type " + authType + " -> the token is not requested");
    }

    // ---------------------------------------------------------------- error mapping

    /** Catches plugin errors surfacing as exceptions (:58): a PluginException becomes an emitted error result. */
    @Test
    void executeQuery_pluginException_becomesAnErrorResult() {
        when(executor.doExecuteQuery(any(), any())).thenReturn(
                Mono.error(new PluginException(PluginCommonError.QUERY_ARGUMENT_ERROR, "INVALID_TIMEOUT_SETTING", "x")));

        StepVerifier.create(service.executeQuery(javaDatasource(), new HashMap<>(), Map.of(), "", visitor()))
                .assertNext(result -> {
                    assertThat(result.getQueryCode()).isEqualTo(PluginCommonError.QUERY_ARGUMENT_ERROR.name());
                    assertThat(result.getMessageKey()).isEqualTo("INVALID_TIMEOUT_SETTING");
                })
                .verifyComplete();
        System.out.println("[QueryExecutionServiceImplTest] PluginException -> error result");
    }

    /** Catches a BizException being rewrapped (:60) and other exceptions leaking raw (:64). */
    @Test
    void executeQuery_bizExceptionPassesThrough_otherExceptionsAreWrapped() {
        BizException biz = new BizException(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED");
        when(executor.doExecuteQuery(any(), any())).thenReturn(Mono.error(biz));
        StepVerifier.create(service.executeQuery(javaDatasource(), new HashMap<>(), Map.of(), "", visitor()))
                .expectErrorSatisfies(error -> assertThat(error).isSameAs(biz)).verify(VERIFY_TIMEOUT);

        when(executor.doExecuteQuery(any(), any())).thenReturn(Mono.error(new IllegalStateException("db exploded")));
        StepVerifier.create(service.executeQuery(javaDatasource(), new HashMap<>(), Map.of(), "", visitor()))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(BizException.class);
                    BizException wrapped = (BizException) error;
                    assertThat(wrapped.getError()).isEqualTo(BizError.QUERY_EXECUTION_ERROR);
                    assertThat(wrapped.getArgs()).containsExactly("db exploded");
                }).verify(VERIFY_TIMEOUT);
        System.out.println("[QueryExecutionServiceImplTest] BizException unchanged; others wrapped as QUERY_EXECUTION_ERROR");
    }

    /** Catches a hanging query (:56) and the timeout code (:57): "2s" times out after 2000 ms (virtual time) as an error result. */
    @Test
    void executeQuery_executorThatNeverAnswers_timesOutAfterTheConfiguredTimeout() {
        when(executor.doExecuteQuery(any(), any())).thenReturn(Mono.never());

        StepVerifier.withVirtualTime(() -> service.executeQuery(javaDatasource(), new HashMap<>(), Map.of(), "2s", visitor()))
                .expectSubscription()
                .expectNoEvent(Duration.ofMillis(1999))
                .thenAwait(Duration.ofMillis(1))
                .assertNext(result -> {
                    assertThat(result.getQueryCode()).isEqualTo(PluginCommonError.QUERY_EXECUTION_TIMEOUT.name());
                    assertThat(result.getMessageKey()).isEqualTo("PLUGIN_EXECUTION_TIMEOUT");
                    assertThat(result.getMessageArgs()).containsExactly(2000);
                })
                .expectComplete()
                .verify(VERIFY_TIMEOUT);
        System.out.println("[QueryExecutionServiceImplTest] 2s timeout -> QUERY_EXECUTION_TIMEOUT result after 2000 ms");
    }
}
