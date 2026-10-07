package org.lowcoder.infra.localcache;

import com.google.common.base.Preconditions;
import com.google.common.util.concurrent.MoreExecutors;
import jakarta.annotation.Nonnull;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.sdk.destructor.DestructorUtil;
import reactor.core.publisher.Mono;

import javax.annotation.CheckReturnValue;
import java.time.Duration;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static com.google.common.base.MoreObjects.firstNonNull;
import static java.util.concurrent.Executors.newSingleThreadScheduledExecutor;

@Slf4j
public final class ReloadableCache<T> {

    private CacheValueMonoProvider<T> factory;
    private volatile T cachedValue;
    private String cacheName;

    private ReloadableCache() {
    }

    public T getCachedOrDefault(T defaultValue) {
        return firstNonNull(cachedValue, defaultValue);
    }

    public Mono<T> getMonoValue() {
        if (cachedValue == null) {
            return factory.getValue() // cache stampeding can be met here, but seems not a big problem here
                    .doOnNext(value -> cachedValue = value);
        }
        return Mono.just(cachedValue);
    }

    @CheckReturnValue
    public static <T> ReloadableCacheBuilder<T> newBuilder() {
        return new ReloadableCacheBuilder<>();
    }

    public static class ReloadableCacheBuilder<T> {

        private Duration interval;
        private CacheValueMonoProvider<T> factory;
        private String cacheName;

        @CheckReturnValue
        public ReloadableCacheBuilder<T> setInterval(Duration interval) {
            this.interval = interval;
            return this;
        }

        @CheckReturnValue
        public ReloadableCacheBuilder<T> setFactory(CacheValueMonoProvider<T> factory) {
            this.factory = factory;
            return this;
        }

        @CheckReturnValue
        public ReloadableCacheBuilder<T> setName(String name) {
            this.cacheName = name;
            return this;
        }

        @CheckReturnValue
        public ReloadableCache<T> build() {
            ensureParams();
            ReloadableCache<T> cache = new ReloadableCache<>();
            cache.factory = this.factory;
            cache.cacheName = this.cacheName;
            startScheduledReloadTask(cache);
            return cache;
        }

        /**
         * Reloads the value at the interval. A reload that fails or completes without a value keeps the cached value (BF-067:
         * an empty reload wrote null, so callers fell back to their default until the next good reload).
         * <p>
         * Limits: a factory that completes empty to mean "no value any more" cannot clear the cache; it keeps the last value.
         * A factory that maps a failure to a value (a placeholder) still replaces the cached value with it: only an empty
         * completion or an error is kept out.
         */
        @SuppressWarnings("UnstableApiUsage")
        private void startScheduledReloadTask(ReloadableCache<T> cache) {
            ScheduledExecutorService scheduledExecutor = newSingleThreadScheduledExecutor();
            scheduledExecutor.scheduleAtFixedRate(() -> {
                log.trace("{} scheduled reload...", cacheName);
                try {
                    T value = factory.getValue().block();
                    if (value != null) {
                        cache.cachedValue = value;
                    } else {
                        log.warn("{} scheduled reload returned no value, the cached value is kept", cacheName);
                    }
                } catch (Exception e) {
                    // do not update value in error cases
                    log.error("scheduled load error", e);
                }
            }, 0, interval.toMillis(), TimeUnit.MILLISECONDS);

            DestructorUtil.register(() -> MoreExecutors.shutdownAndAwaitTermination(scheduledExecutor, Duration.ofSeconds(10)),
                    "shutdown and await reload task executor termination.");
        }

        private void ensureParams() {
            Preconditions.checkNotNull(factory);
            Preconditions.checkNotNull(interval);
        }
    }

    @FunctionalInterface
    public interface CacheValueMonoProvider<T> {
        @Nonnull
        Mono<T> getValue();
    }
}
