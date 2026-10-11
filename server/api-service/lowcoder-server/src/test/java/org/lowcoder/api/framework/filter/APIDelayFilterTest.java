package org.lowcoder.api.framework.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Duration;
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
 * Tests of {@link APIDelayFilter}. The delay is a {@code Mono.delay(5s).block()} inside a reactive {@code map}, so it
 * cannot run on virtual time: exactly one test waits the real 5 seconds.
 *
 * <p>Pinned under D-6, plan §9 row "APIDelayFilter blocks inside a reactive map": the flag is writable by any signed-in
 * user through {@code POST /api/configs/isRateLimited} (ConfigController:44-48, ConfigEndpoints:44), nothing else
 * writes it. On a Reactor non-blocking thread {@code block()} fails with IllegalStateException
 * ({@link #flagTrue_whenTheAnswerArrivesOnANonBlockingThread_failsWithIllegalState_pinsTheSection9Row}).
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

    /** The only 5 s test. Catches the flag being ignored: the chain runs after about 5 s, once. */
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
     * Pins plan §9 row "APIDelayFilter blocks inside a reactive map": with the flag true and the repository answer
     * delivered on a Reactor non-blocking thread, the {@code block()} inside the map throws IllegalStateException, so
     * the request fails instead of being delayed.
     */
    @Test
    void flagTrue_whenTheAnswerArrivesOnANonBlockingThread_failsWithIllegalState_pinsTheSection9Row() {
        when(repository.findByKey("isRateLimited"))
                .thenReturn(Mono.just(new ServerConfig("isRateLimited", true)).publishOn(Schedulers.parallel()));
        ChainProbe chain = new ChainProbe();

        assertThatThrownBy(() -> filter.filter(FilterTestSupport.exchange("/api/x"), chain).block(Duration.ofSeconds(30)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("block()/blockFirst()/blockLast() are blocking");
        assertThat(chain.subscribed).as("the chain is never reached").hasValue(0);
        System.out.println("[APIDelayFilterTest] flag true on a non-blocking thread -> IllegalStateException, chain not reached");
    }
}
