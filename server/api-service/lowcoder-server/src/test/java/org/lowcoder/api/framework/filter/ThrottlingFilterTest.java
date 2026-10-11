package org.lowcoder.api.framework.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.framework.filter.FilterTestSupport.ChainProbe;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.config.dynamic.ConfigInstance;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.test.util.ReflectionTestUtils;

import com.google.common.util.concurrent.RateLimiter;

import reactor.test.StepVerifier;

/**
 * Tests of {@link ThrottlingFilter}. A limiter grants every request for one second after it was created or its rate
 * changed; the tests end that window through {@code ReflectionTestUtils} on the wrapper's {@code initMillis} so they
 * are deterministic. Limit: after the window two requests in a row are throttled only while they arrive within the
 * same second (the lowest rate is one request per second), so the permit is taken right before the check.
 */
class ThrottlingFilterTest {

    private static final String URL_A = "/api/a";
    private static final String URL_B = "/api/b";

    private final AtomicReference<Map<String, Integer>> urlLimits = new AtomicReference<>(Collections.emptyMap());

    private ThrottlingFilter filter(int defaultRate) {
        ThrottlingFilter filter = new ThrottlingFilter();
        ReflectionTestUtils.setField(filter, "defaultApiRateLimit", defaultRate);
        ReflectionTestUtils.setField(filter, "urlRateLimiter", (java.util.function.Supplier<Map<String, Integer>>) urlLimits::get);
        return filter;
    }

    @SuppressWarnings("unchecked")
    private static Object wrapper(ThrottlingFilter filter, String url) {
        return ((Map<String, Object>) ReflectionTestUtils.getField(filter, "rateLimiterMap")).get(url);
    }

    private static double rate(Object wrapper) {
        return ((RateLimiter) ReflectionTestUtils.getField(wrapper, "rateLimiter")).getRate();
    }

    private static void endGraceWindow(Object wrapper) {
        ReflectionTestUtils.setField(wrapper, "initMillis", 0L);
    }

    private void call(ThrottlingFilter filter, String url, ChainProbe chain) {
        StepVerifier.create(filter.filter(FilterTestSupport.exchange(url), chain)).verifyComplete();
    }

    private void expectThrottled(ThrottlingFilter filter, String url, ChainProbe chain) {
        int before = chain.invoked.get();
        StepVerifier.create(filter.filter(FilterTestSupport.exchange(url), chain))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(BizException.class);
                    assertThat(((BizException) error).getError()).isEqualTo(BizError.REQUEST_THROTTLED);
                    System.out.println("[ThrottlingFilterTest] " + url + " -> " + error.getMessage());
                })
                .verify();
        assertThat(chain.invoked).as("a throttled request does not reach the chain").hasValue(before);
    }

    /** Catches no throttling at all, and one shared bucket for every URL. */
    @Test
    void defaultRate_throttlesAfterTheGraceWindow_perUrl() {
        ThrottlingFilter filter = filter(1);
        ChainProbe chain = new ChainProbe();

        call(filter, URL_A, chain);
        call(filter, URL_A, chain);
        assertThat(chain.invoked).as("the grace window grants every request").hasValue(2);

        endGraceWindow(wrapper(filter, URL_A));
        call(filter, URL_A, chain);
        expectThrottled(filter, URL_A, chain);

        call(filter, URL_B, chain);
        assertThat(wrapper(filter, URL_B)).as("own limiter per URL").isNotSameAs(wrapper(filter, URL_A));
        assertThat(chain.invoked).hasValue(4);
    }

    /** Catches the per-URL limit being ignored: the configured rate replaces the default for that URL only. */
    @Test
    void urlRateLimiter_overridesTheDefaultRate_forThatUrlOnly() {
        urlLimits.set(Map.of(URL_A, 7));
        ThrottlingFilter filter = filter(1);
        ChainProbe chain = new ChainProbe();

        call(filter, URL_A, chain);
        call(filter, URL_B, chain);

        assertThat(rate(wrapper(filter, URL_A))).isCloseTo(7.0, org.assertj.core.api.Assertions.within(1e-6));
        assertThat(rate(wrapper(filter, URL_B))).isCloseTo(1.0, org.assertj.core.api.Assertions.within(1e-6));
        System.out.println("[ThrottlingFilterTest] rates a=" + rate(wrapper(filter, URL_A)) + " b=" + rate(wrapper(filter, URL_B)));
    }

    /**
     * Catches the rate change: an unchanged rate keeps the same limiter (and its state); a changed rate updates it in
     * place and restarts the grace window, so a throttled URL is granted again right after the change.
     */
    @Test
    void rateChange_updatesTheLimiterInPlace_andRestartsTheGraceWindow() {
        ThrottlingFilter filter = filter(1);
        ChainProbe chain = new ChainProbe();
        call(filter, URL_A, chain);
        Object limiter = wrapper(filter, URL_A);
        call(filter, URL_A, chain);
        assertThat(wrapper(filter, URL_A)).as("unchanged rate keeps the limiter").isSameAs(limiter);

        endGraceWindow(limiter);
        call(filter, URL_A, chain);
        expectThrottled(filter, URL_A, chain);
        assertThat((long) ReflectionTestUtils.getField(limiter, "initMillis")).isZero();

        urlLimits.set(Map.of(URL_A, 50));
        call(filter, URL_A, chain);

        assertThat(wrapper(filter, URL_A)).as("updated in place").isSameAs(limiter);
        assertThat(rate(limiter)).isCloseTo(50.0, org.assertj.core.api.Assertions.within(1e-6));
        assertThat((long) ReflectionTestUtils.getField(limiter, "initMillis")).as("grace window restarted").isPositive();
    }

    /** Catches the init reading the wrong config key, types or default. */
    @Test
    @SuppressWarnings("unchecked")
    void init_readsTheUrlRateLimiterFromTheThresholdConfig() {
        ConfigCenter configCenter = mock(ConfigCenter.class);
        ConfigInstance threshold = mock(ConfigInstance.class);
        Conf<Map<String, Integer>> conf = mock(Conf.class);
        when(configCenter.threshold()).thenReturn(threshold);
        when(threshold.ofMap(eq("urlRateLimiter"), eq(String.class), eq(Integer.class), eq(Map.of()))).thenReturn(conf);
        when(conf.get()).thenReturn(new HashMap<>(Map.of(URL_A, 9)));
        ThrottlingFilter filter = new ThrottlingFilter();
        ReflectionTestUtils.setField(filter, "defaultApiRateLimit", 2);
        ReflectionTestUtils.setField(filter, "configCenter", configCenter);

        ReflectionTestUtils.invokeMethod(filter, "init");
        call(filter, URL_A, new ChainProbe());

        verify(threshold).ofMap(eq("urlRateLimiter"), eq(String.class), eq(Integer.class), eq(Map.of()));
        assertThat(rate(wrapper(filter, URL_A))).isCloseTo(9.0, org.assertj.core.api.Assertions.within(1e-6));
        assertThat(filter.getOrder()).isEqualTo(FilterOrder.THROTTLING.getOrder());
    }
}
