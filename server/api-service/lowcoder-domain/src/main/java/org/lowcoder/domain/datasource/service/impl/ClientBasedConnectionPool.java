package org.lowcoder.domain.datasource.service.impl;

import com.google.common.cache.*;
import com.google.common.collect.ImmutableList;
import io.micrometer.core.instrument.Tags;
import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.domain.datasource.model.ClientBasedDatasourceConnectionHolder;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.model.DatasourceConnectionHolder;
import org.lowcoder.domain.datasource.service.DatasourceConnectionPool;
import org.lowcoder.domain.plugin.DatasourceMetaInfo;
import org.lowcoder.domain.plugin.service.DatasourceMetaInfoService;
import org.lowcoder.infra.perf.PerfEvent;
import org.lowcoder.infra.perf.PerfHelper;
import org.lowcoder.sdk.exception.BaseException;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.plugin.common.QueryExecutionUtils;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import static org.lowcoder.infra.perf.PerfEvent.*;
import static org.lowcoder.sdk.exception.BizError.PLUGIN_CREATE_CONNECTION_FAILED;
import static org.lowcoder.sdk.plugin.common.QueryExecutionUtils.querySharedScheduler;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;

/**
 * for hikari pool/redis client/es client/..., these clients has taken over underlying connections
 * and their status management, so these clients will be cached and invalidated once datasource is updated.
 */
@Slf4j
@RequiredArgsConstructor
@Service
public class ClientBasedConnectionPool implements DatasourceConnectionPool {

    private static final int DEFAULT_RETRIEVE_CONNECTION_TIMES = 5;
    private static final String STALE_DATASOURCE = "stale datasource";
    private static final String PLUGIN_CREATE_CONNECTION_FAILED_KEY = "PLUGIN_CREATE_CONNECTION_FAILED";
    /** The error message argument of a creation that completed without a connection (BF-081). */
    static final String NO_CONNECTION_CREATED = "the data source connector returned no connection";

    private static final List<PerfEvent> HIKARI_PERF_CONFIG = ImmutableList.of(
            HIKARI_POOL_ACTIVE_CONNECTIONS,
            HIKARI_POOL_IDLE_CONNECTIONS,
            HIKARI_POOL_WAITING_CONNECTIONS,
            HIKARI_POOL_TOTAL_CONNECTIONS
    );
    private static final Map<ClientBasedDatasourceCacheKey, HikariPerfWrapper> HIKARI_PERF_WRAPPER_MAP = new ConcurrentHashMap<>();

    private final DatasourceMetaInfoService datasourceMetaInfoService;
    private final PerfHelper perfHelper;

    @PostConstruct
    public void init() {
        List<DatasourceMetaInfo> supportedDatasourceTypes = datasourceMetaInfoService.getJavaBasedSupportedDatasourceMetaInfos();
        supportedDatasourceTypes.stream()
                .filter(datasourceMetaInfo -> datasourceMetaInfo.getConnectionPool() == ClientBasedConnectionPool.class)
                .forEach(datasourceMetaInfo ->
                        perfHelper.gaugeSafely(CLIENT_BASED_CONNECTION_SIZE, Tags.of("type", datasourceMetaInfo.getType()), cache,
                                value -> value.asMap().keySet()
                                        .stream()
                                        .filter(cacheKey -> cacheKey.datasource().getType().equals(datasourceMetaInfo.getType()))
                                        .toList()
                                        .size()));

        for (DatasourceMetaInfo metaInfo : supportedDatasourceTypes) {
            String datasourceType = metaInfo.getType();
            for (var perfEvent : HIKARI_PERF_CONFIG) {
                perfHelper.gaugeSafely(perfEvent, Tags.of("datasourceType", datasourceType), HIKARI_PERF_WRAPPER_MAP,
                        perfWrapperMap -> perfWrapperMap.entrySet()
                                .stream()
                                .filter(entry -> StringUtils.equals(entry.getKey().datasource().getType(), datasourceType))
                                .map(Entry::getValue)
                                .mapToInt(hikariPerfWrapper -> switch (perfEvent) {
                                    case HIKARI_POOL_ACTIVE_CONNECTIONS -> hikariPerfWrapper.getActiveConnections();
                                    case HIKARI_POOL_IDLE_CONNECTIONS -> hikariPerfWrapper.getIdleConnections();
                                    case HIKARI_POOL_WAITING_CONNECTIONS -> hikariPerfWrapper.getWaitingConnections();
                                    case HIKARI_POOL_TOTAL_CONNECTIONS -> hikariPerfWrapper.getTotalConnections();
                                    default -> 0;
                                })
                                .sum());
            }
        }
    }


    private final LoadingCache<ClientBasedDatasourceCacheKey, Mono<ClientBasedDatasourceConnectionHolder>> cache = CacheBuilder.newBuilder()
            .expireAfterAccess(Duration.ofHours(1L))
            .maximumSize(1000)
            .removalListener(new RemovalListener<ClientBasedDatasourceCacheKey, Mono<ClientBasedDatasourceConnectionHolder>>() {
                @Override
                public void onRemoval(
                        @Nonnull RemovalNotification<ClientBasedDatasourceCacheKey, Mono<ClientBasedDatasourceConnectionHolder>> notification) {

                    ClientBasedDatasourceCacheKey key = notification.getKey();
                    String type = key.datasource().getType();
                    perfHelper.count(CLIENT_BASED_CONNECTION_REMOVE, Tags.of("type", type, "cause", notification.getCause().name()));

                    HIKARI_PERF_WRAPPER_MAP.remove(key);
                    Mono.just(datasourceMetaInfoService.getDatasourceConnector(key.datasource().getType()))
                            .flatMap(factory -> notification.getValue()
                                    .onErrorResume(creationFailure -> Mono.empty()) // a failed creation left nothing to destroy
                                    .flatMap(connection -> factory.destroyConnection(connection.connection())))
                            .subscribeOn(querySharedScheduler())
                            .subscribe();
                }
            })
            .build(new CacheLoader<>() {
                @Override
                public Mono<ClientBasedDatasourceConnectionHolder> load(@Nonnull ClientBasedDatasourceCacheKey key) {
                    Datasource datasource = key.datasource();
                    perfHelper.count(CLIENT_BASED_CONNECTION_CREATE, Tags.of("type", datasource.getType()));

                    releasePreviousConnection(datasource); // datasource is updated, so release previous connections

                    AtomicReference<Mono<ClientBasedDatasourceConnectionHolder>> loaded = new AtomicReference<>();
                    Mono<ClientBasedDatasourceConnectionHolder> connection = create(datasource)
                            .doOnNext(holder -> {
                                if (holder.connection() instanceof HikariPerfWrapper wrapper) {
                                    HIKARI_PERF_WRAPPER_MAP.put(key, wrapper);
                                }
                            })
                            .doOnError(creationFailure -> forgetFailedCreation(key, loaded.get()))
                            .cache();
                    loaded.set(connection);
                    return connection;
                }
            });

    /**
     * Drops a connection whose creation failed from the cache (BF-033), so that the next query for the datasource creates a
     * new one instead of getting the cached failure until the datasource is edited or an hour passes without access. Only
     * this entry is removed: an entry loaded for the key after it is kept.
     * <p>
     * A creation that completes without a connection is a failure too (BF-081, see {@link #create}), so it is dropped the
     * same way.
     * <p>
     * Limits: callers already waiting on the failed creation still get its failure.
     */
    private void forgetFailedCreation(ClientBasedDatasourceCacheKey key, Mono<ClientBasedDatasourceConnectionHolder> failed) {
        cache.asMap().remove(key, failed);
    }

    private void releasePreviousConnection(Datasource datasource) {
        cache.asMap().keySet()
                .stream()
                .filter(cacheKey -> StringUtils.equals(datasource.getId(), cacheKey.datasource().getId()))
                .forEach(cache::invalidate);
    }

    @Override
    public Mono<? extends DatasourceConnectionHolder> getOrCreateConnection(Datasource datasource) {
        ClientBasedDatasourceCacheKey clientBasedDatasourceCacheKey = ClientBasedDatasourceCacheKey.of(datasource);
        return Mono.defer(() -> cache.getUnchecked(clientBasedDatasourceCacheKey))
                .flatMap(clientBasedDatasourceConnection -> {
                    if (clientBasedDatasourceConnection.isStale()) {
                        cache.invalidate(clientBasedDatasourceCacheKey);
                        return Mono.error(new StaleConnectionException()); // by retry
                    }
                    return Mono.just(clientBasedDatasourceConnection);
                })
                // only a stale connection is retried: a failed creation is not cached (BF-033), so retrying it would run the
                // connector, and its timeout, again for every retry of the same query
                .retryWhen(Retry.max(DEFAULT_RETRIEVE_CONNECTION_TIMES)
                        .filter(StaleConnectionException.class::isInstance)
                        .onRetryExhaustedThrow((spec, signal) -> signal.failure()))
                .onErrorMap(throwable -> {
                    if (throwable instanceof BaseException) {
                        return throwable;
                    }
                    log.error("get connection error.", throwable);
                    return new BizException(PLUGIN_CREATE_CONNECTION_FAILED, PLUGIN_CREATE_CONNECTION_FAILED_KEY, throwable.getMessage());
                })
                .subscribeOn(QueryExecutionUtils.querySharedScheduler());
    }

    @Override
    public Object info(@Nullable String datasourceId) {
        return HIKARI_PERF_WRAPPER_MAP.entrySet()
                .stream()
                .filter(entry -> {
                    if (StringUtils.isBlank(datasourceId)) {
                        return true;
                    }
                    return datasourceId.equals(entry.getKey().id());
                })
                .limit(100)
                .map(entry -> {
                    HikariPerfWrapper wrapper = entry.getValue();
                    Map<String, Integer> connections = Map.of("total", wrapper.getTotalConnections(),
                            "idle", wrapper.getIdleConnections(),
                            "active", wrapper.getActiveConnections(),
                            "waiting", wrapper.getWaitingConnections());
                    return Map.of("connections", connections,
                            "datasource", wrapper.getDatasourceProperties(),
                            "healthCheck", wrapper.getHealthCheckProperties());
                })
                .collect(Collectors.toList());
    }

    /**
     * The connection the datasource's connector creates. A connector that completes without one fails the creation with
     * {@code PLUGIN_CREATE_CONNECTION_FAILED} (BF-081), as {@code TokenBasedConnectionPool} does, instead of completing empty:
     * the caller of the pool gets an error, and the failed creation is not cached.
     * <p>
     * Limits: only an empty completion is refused; a connector that emits a connection which does not work is not detected.
     */
    private Mono<ClientBasedDatasourceConnectionHolder> create(Datasource datasource) {
        return datasourceMetaInfoService.getDatasourceConnector(datasource.getType())
                .doCreateConnection(datasource.getDetailConfig())
                .switchIfEmpty(deferredError(PLUGIN_CREATE_CONNECTION_FAILED, PLUGIN_CREATE_CONNECTION_FAILED_KEY, NO_CONNECTION_CREATED))
                .map(ClientBasedDatasourceConnectionHolder::new);
    }

    /** A cached connection that went stale; the only failure {@link #getOrCreateConnection} retries. */
    private static final class StaleConnectionException extends RuntimeException {

        StaleConnectionException() {
            super(STALE_DATASOURCE);
        }
    }

    /**
     * datasource {@link #id} and {@link #updateTime} are used for equals & hashcode methods
     */
    public record ClientBasedDatasourceCacheKey(String id, Instant updateTime, Datasource datasource) {

        public static ClientBasedDatasourceCacheKey of(Datasource datasource) {
            return new ClientBasedDatasourceCacheKey(datasource.getId(), datasource.getUpdatedAt(), datasource);
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (o == null || getClass() != o.getClass()) {
                return false;
            }
            ClientBasedDatasourceCacheKey that = (ClientBasedDatasourceCacheKey) o;
            return Objects.equals(id, that.id) && Objects.equals(updateTime, that.updateTime);
        }

        @Override
        public int hashCode() {
            return Objects.hash(id, updateTime);
        }
    }
}