package org.lowcoder.api.framework.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.api.framework.filter.FilterTestSupport.ChainProbe;
import org.lowcoder.infra.config.model.ServerConfig;
import org.lowcoder.infra.config.repository.ServerConfigRepository;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.WebFilterChain;

import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * Tests of {@link APIDelayFilter}. The delay is a real 5 second timer: two tests wait it, one with the repository answer on
 * the calling thread and one with it on a Reactor non-blocking thread, as the server delivers it.
 *
 * <p>The flag is written through {@code POST /api/configs/isRateLimited} (ConfigController:61-68, ConfigEndpoints:44), since
 * BF-001 by the deployment's super admin only, and by installed plugin code through {@code LowcoderServices.setConfig}
 * (SharedPluginServices:52-53, no user check, ConfigController:55-58): the enterprise plugin's license check sets it when the
 * licensed API calls are used up. No server code writes it. BF-062 (formerly pinned under D-6, plan §9 row
 * "APIDelayFilter blocks inside a reactive map"): the delay was a {@code block()} inside {@code map}, which failed with
 * IllegalStateException on a non-blocking thread, so every request failed
 * ({@link #flagTrue_whenTheAnswerArrivesOnANonBlockingThread_delaysTheChainBF062}).
 */
class APIDelayFilterTest {

    private ServerConfigRepository repository;
    private APIDelayFilter filter;

    @BeforeEach
    void setUp() {
        repository = mock(ServerConfigRepository.class);
        filter = new APIDelayFilter();
        ReflectionTestUtils.setField(filter, "serverConfigRepository", repository);
    }

    /** Catches the flag being ignored: the chain runs after about 5 s, once. */
    @Test
    void flagTrue_delaysTheChainByAboutFiveSeconds() {
        when(repository.findByKey("isRateLimited")).thenReturn(Mono.just(new ServerConfig("isRateLimited", true)));
        AtomicLong chainStartedNanos = new AtomicLong();
        WebFilterChain chain = exchange -> Mono.fromRunnable(() -> chainStartedNanos.set(System.nanoTime()));
        long start = System.nanoTime();

        filter.filter(FilterTestSupport.exchange("/api/x"), chain).block(Duration.ofSeconds(30));

        Duration delay = Duration.ofNanos(chainStartedNanos.get() - start);
        System.out.println("[APIDelayFilterTest] chain started after " + delay.toMillis() + " ms");
        assertThat(chainStartedNanos.get()).as("the chain ran").isNotZero();
        assertThat(delay).isGreaterThanOrEqualTo(Duration.ofMillis(4500));
    }

    /** Catches a delay for every request: no flag, a false or null value, or a non-boolean value pass at once. */
    @ParameterizedTest
    @ValueSource(strings = {"missing", "false", "null", "garbage"})
    void otherFlagValues_doNotDelay_andTheChainRunsOnce(String variant) {
        Mono<ServerConfig> answer = switch (variant) {
            case "missing" -> Mono.empty();
            case "false" -> Mono.just(new ServerConfig("isRateLimited", false));
            case "null" -> Mono.just(new ServerConfig("isRateLimited", null));
            default -> Mono.just(new ServerConfig("isRateLimited", "garbage"));
        };
        when(repository.findByKey("isRateLimited")).thenReturn(answer);
        ChainProbe chain = new ChainProbe();
        long start = System.nanoTime();

        var result = filter.filter(FilterTestSupport.exchange("/api/x"), chain);
        assertThat(chain.invoked).as("the chain's Mono is created at assembly time").hasValue(1);
        result.block(Duration.ofSeconds(30));

        Duration took = Duration.ofNanos(System.nanoTime() - start);
        System.out.println("[APIDelayFilterTest] flag " + variant + " -> " + took.toMillis() + " ms");
        assertThat(took).isLessThan(Duration.ofSeconds(3));
        assertThat(chain.subscribed).hasValue(1);
    }

    /**
     * BF-062 (formerly pinned as plan §9 row "APIDelayFilter blocks inside a reactive map": the {@code block()} threw
     * IllegalStateException and the chain was never reached): with the flag true and the repository answer delivered on a
     * Reactor non-blocking thread, the request waits about 5 s without an error and then reaches the chain once.
     */
    @Test
    void flagTrue_whenTheAnswerArrivesOnANonBlockingThread_delaysTheChainBF062() {
        when(repository.findByKey("isRateLimited"))
                .thenReturn(Mono.just(new ServerConfig("isRateLimited", true)).publishOn(Schedulers.parallel()));
        AtomicLong chainStartedNanos = new AtomicLong();
        AtomicInteger chainRuns = new AtomicInteger();
        WebFilterChain chain = exchange -> Mono.fromRunnable(() -> {
            chainStartedNanos.set(System.nanoTime());
            chainRuns.incrementAndGet();
        });
        long start = System.nanoTime();

        filter.filter(FilterTestSupport.exchange("/api/x"), chain).block(Duration.ofSeconds(30));

        Duration delay = Duration.ofNanos(chainStartedNanos.get() - start);
        System.out.println("[APIDelayFilterTest] flag true on a non-blocking thread -> chain ran " + chainRuns.get() + " time(s) after "
                + delay.toMillis() + " ms");
        assertThat(chainRuns).as("the chain runs once").hasValue(1);
        assertThat(delay).isGreaterThanOrEqualTo(Duration.ofMillis(4500));
    }
}
