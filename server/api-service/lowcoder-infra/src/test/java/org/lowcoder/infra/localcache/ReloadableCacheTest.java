package org.lowcoder.infra.localcache;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.BooleanSupplier;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.destructor.DestructorUtil;
import reactor.core.publisher.Mono;

/**
 * {@link ReloadableCache}. The load-through and default paths use an instance built reflectively (no scheduler). The
 * scheduled reload paths call {@code build()}, which starts a non-daemon executor; those tests use a counting factory
 * and bounded polling, and the executors are shut down in {@link #stopExecutors()}.
 */
class ReloadableCacheTest {

    private static final String DEFAULT = "default";
    private static final Duration RELOAD_INTERVAL = Duration.ofMillis(20);
    private static final Duration POLL_LIMIT = Duration.ofSeconds(5);

    @AfterAll
    static void stopExecutors() {
        DestructorUtil.onDestroy();
    }

    private static ReloadableCache<String> unscheduled(ReloadableCache.CacheValueMonoProvider<String> factory) throws ReflectiveOperationException {
        Constructor<ReloadableCache> constructor = ReloadableCache.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        @SuppressWarnings("unchecked")
        ReloadableCache<String> cache = (ReloadableCache<String>) constructor.newInstance();
        Field field = ReloadableCache.class.getDeclaredField("factory");
        field.setAccessible(true);
        field.set(cache, factory);
        return cache;
    }

    private static void awaitTrue(String what, BooleanSupplier condition) throws InterruptedException {
        long deadline = System.nanoTime() + POLL_LIMIT.toNanos();
        while (!condition.getAsBoolean()) {
            if (System.nanoTime() > deadline) {
                throw new AssertionError("timed out waiting for " + what);
            }
            Thread.sleep(5);
        }
    }

    @Test
    void nothingIsCachedUntilTheFirstLoadAndThenTheFactoryIsNotCalledAgain() throws ReflectiveOperationException {
        AtomicInteger calls = new AtomicInteger();
        ReloadableCache<String> cache = unscheduled(() -> Mono.just("v" + calls.incrementAndGet()));

        assertThat(cache.getCachedOrDefault(DEFAULT)).isEqualTo(DEFAULT);
        assertThat(cache.getMonoValue().block()).isEqualTo("v1");
        assertThat(cache.getMonoValue().block()).isEqualTo("v1");
        assertThat(cache.getCachedOrDefault(DEFAULT)).isEqualTo("v1");
        assertThat(calls).hasValue(1);
    }

    @Test
    void anEmptyFactoryLeavesNothingCachedSoTheNextCallLoadsAgain() throws ReflectiveOperationException {
        AtomicInteger calls = new AtomicInteger();
        ReloadableCache<String> cache = unscheduled(() -> {
            calls.incrementAndGet();
            return Mono.empty();
        });

        assertThat(cache.getMonoValue().blockOptional()).isEmpty();
        assertThat(cache.getMonoValue().blockOptional()).isEmpty();
        assertThat(cache.getCachedOrDefault(DEFAULT)).isEqualTo(DEFAULT);
        assertThat(calls).hasValue(2);
    }

    @Test
    void buildRequiresAFactoryAndAnInterval() {
        assertThatThrownBy(() -> ReloadableCache.<String>newBuilder().setInterval(RELOAD_INTERVAL).build()).isInstanceOf(NullPointerException.class);
        assertThatThrownBy(() -> ReloadableCache.<String>newBuilder().setFactory(() -> Mono.just("v")).build()).isInstanceOf(NullPointerException.class);
    }

    @Test
    void scheduledReloadLoadsTheValueWithoutAnyCaller() throws InterruptedException {
        ReloadableCache<String> cache = ReloadableCache.<String>newBuilder()
                .setFactory(() -> Mono.just("loaded")).setInterval(RELOAD_INTERVAL).setName("loads").build();

        awaitTrue("the first scheduled load", () -> "loaded".equals(cache.getCachedOrDefault(DEFAULT)));
    }

    @Test
    void scheduledReloadKeepsTheOldValueWhenTheFactoryFails() throws InterruptedException {
        AtomicInteger calls = new AtomicInteger();
        List<String> seenWhenFailing = Collections.synchronizedList(new ArrayList<>());
        @SuppressWarnings("unchecked")
        ReloadableCache<String>[] holder = new ReloadableCache[1];
        holder[0] = ReloadableCache.<String>newBuilder().setFactory(() -> {
            int call = calls.incrementAndGet();
            if (call == 1) {
                return Mono.just("old");
            }
            if (call <= 3) {
                seenWhenFailing.add(String.valueOf(holder[0].getCachedOrDefault(DEFAULT)));
                return Mono.error(new IllegalStateException("source down " + call));
            }
            return Mono.just("old");
        }).setInterval(RELOAD_INTERVAL).setName("keeps").build();

        awaitTrue("two failed reloads", () -> calls.get() >= 4);

        System.out.println("[ReloadableCacheTest] value while failing " + seenWhenFailing);
        assertThat(seenWhenFailing).containsExactly("old", "old");
    }

    /**
     * DEFECT pinned (plan section 9 row R1, D-6, fix deferred): the scheduled task assigns the result of
     * {@code factory.getValue().block()} unconditionally, so a reload that completes empty writes null and the cache
     * falls back to the caller's default, unlike a failing reload which keeps the old value. The obvious fix is to
     * assign only a non-null result.
     */
    @Test
    void scheduledReloadThatReturnsAnEmptyMonoDropsTheCachedValue() throws InterruptedException {
        AtomicInteger calls = new AtomicInteger();
        ReloadableCache<String> cache = ReloadableCache.<String>newBuilder()
                .setFactory(() -> calls.incrementAndGet() == 1 ? Mono.just("v") : Mono.empty())
                .setInterval(RELOAD_INTERVAL).setName("drops").build();

        awaitTrue("the first load", () -> calls.get() >= 1);
        awaitTrue("the value to be dropped after an empty reload", () -> DEFAULT.equals(cache.getCachedOrDefault(DEFAULT)) && calls.get() >= 2);

        assertThat(cache.getCachedOrDefault(DEFAULT)).isEqualTo(DEFAULT);
    }
}
