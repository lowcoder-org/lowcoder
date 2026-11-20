package org.lowcoder.sdk.contract;

import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.ObjectMapper;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.webclient.JacksonClientCodecs;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.springframework.http.codec.DecoderHttpMessageReader;
import org.springframework.http.codec.EncoderHttpMessageWriter;
import org.springframework.http.codec.HttpMessageReader;
import org.springframework.http.codec.HttpMessageWriter;
import org.springframework.http.codec.json.JacksonJsonDecoder;
import org.springframework.http.codec.json.JacksonJsonEncoder;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import tools.jackson.databind.cfg.DateTimeFeature;

import java.lang.reflect.Method;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Spring's default client codecs as the application builds them (docs/API_PAYLOAD_TEST_PLAN.md §1.1, §3.2, §5.4).
 *
 * <p>The application builds its client codecs in six places, and each sets {@link JacksonClientCodecs#apply} and then
 * {@code maxInMemorySize} on the default codecs: {@code WebClientBuildHelper.java:131-136} (20 MB by default),
 * {@code JsLibraryController.java:63-69} (-1), {@code DatasourcePluginClient.java:43-49} (-1),
 * {@code GraphQLExecutor.java:90-96} (10 MB), {@code RestApiExecutor.java:104-110} (-1) and
 * {@code MarketplaceRenderClient.java:23-28} (2 MiB). {@link #strategies(int)} builds the same thing, so tests can encode
 * and decode with the client codecs without a network client.
 *
 * <p><b>Effective limit (plan §9, O11; evidence E14).</b> {@code JsLibraryController}, {@code GraphQLExecutor} and
 * {@code RestApiExecutor} pass their strategies to a builder from {@code WebClientBuildHelper}, whose own
 * {@code codecs(...)} configurer sets its 20 MB default when the client is built. With Spring WebFlux 6.1.5 that
 * configurer reaches the decoder instance shared with the declared strategies, so every request runs with 20 MB and the
 * declared value is overwritten. {@link #effectiveThroughWebClientBuildHelper} returns what a request gets.
 *
 * <p>{@link #DEFAULT_CODEC_PROFILE} pins the configuration of the mapper inside those codecs as observed in E8
 * (docs/tools/plan-evidence.out): the Jackson 2 settings that {@link JacksonClientCodecs} keeps. Jackson 3 has the
 * java time and parameter name support built in, so the profile lists no module.
 */
public final class ClientCodecs {

    public static final int UNLIMITED = -1;
    public static final int WEB_CLIENT_BUILD_HELPER_DEFAULT_SIZE = 20 * 1024 * 1024;
    private static final String INIT_EXCHANGE_STRATEGIES = "initExchangeStrategies";

    /** E8: the codec mapper writes dates as timestamps, reads them as nanoseconds, ignores unknown properties. */
    public static final MapperProfile DEFAULT_CODEC_PROFILE = new MapperProfile(true, true, false, List.of());

    private ClientCodecs() {
    }

    /** The settings of a mapper that the plan's guards compare: three features and the registered modules. */
    public record MapperProfile(boolean writeDatesAsTimestamps, boolean readDateTimestampsAsNanoseconds,
            boolean failOnUnknownProperties, List<String> moduleIds) {
    }

    public static MapperProfile profile(ObjectMapper mapper) {
        return new MapperProfile(mapper.isEnabled(DateTimeFeature.WRITE_DATES_AS_TIMESTAMPS),
                mapper.isEnabled(DateTimeFeature.READ_DATE_TIMESTAMPS_AS_NANOSECONDS),
                mapper.isEnabled(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES),
                mapper.registeredModules().stream().map(module -> String.valueOf(module.getRegistrationId())).collect(Collectors.toList()));
    }

    /**
     * The strategies a {@link WebClient} built by the application from {@code declared} really uses: a builder from
     * {@code WebClientBuildHelper.builder().systemProxy().toWebClientBuilder()} with {@code exchangeStrategies(declared)},
     * as {@code JsLibraryController.java:152-156}, {@code GraphQLExecutor.java:252-275} and
     * {@code RestApiExecutor.java:241-267} build it. Their other builder calls (headers, cookies, filters, SSL, timeout,
     * disallowed hosts) do not touch the codecs.
     *
     * <p>Limit: it reads Spring's non-public {@code DefaultWebClientBuilder#initExchangeStrategies}, so a Spring upgrade
     * may require adjusting the reflection. Like production, it mutates the decoder shared with {@code declared}.
     */
    public static ExchangeStrategies effectiveThroughWebClientBuildHelper(ExchangeStrategies declared) {
        return effective(WebClientBuildHelper.builder().systemProxy().toWebClientBuilder().exchangeStrategies(declared));
    }

    /** The strategies {@code builder.build()} would give its client. */
    public static ExchangeStrategies effective(WebClient.Builder builder) {
        try {
            Method init = builder.getClass().getDeclaredMethod(INIT_EXCHANGE_STRATEGIES);
            init.setAccessible(true);
            return (ExchangeStrategies) init.invoke(builder);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("cannot read the exchange strategies of " + builder.getClass(), e);
        }
    }

    /** The exchange strategies of the application's clients: {@link JacksonClientCodecs#apply}, then {@code maxInMemorySize(n)}. */
    public static ExchangeStrategies strategies(int maxInMemorySize) {
        return ExchangeStrategies.builder()
                .codecs(configurer -> {
                    JacksonClientCodecs.apply(configurer);
                    configurer.defaultCodecs().maxInMemorySize(maxInMemorySize);
                })
                .build();
    }

    public static JacksonJsonEncoder encoder(ExchangeStrategies strategies) {
        return encoder(strategies.messageWriters());
    }

    public static JacksonJsonDecoder decoder(ExchangeStrategies strategies) {
        return decoder(strategies.messageReaders());
    }

    /**
     * The client-codec guard of plan §5.4 for one real construction, read from the application's own object:
     * its encoder and decoder mappers are two separate instances, neither is the production mapper, both have
     * {@link #DEFAULT_CODEC_PROFILE}, the decoder has {@code expectedMaxInMemorySize}, and {@link #strategies(int)}
     * builds an equal configuration.
     */
    public static void assertDefaultClientCodecs(String construction, ExchangeStrategies real, int expectedMaxInMemorySize) {
        JacksonJsonEncoder encoder = encoder(real);
        JacksonJsonDecoder decoder = decoder(real);
        MapperProfile encoderProfile = profile(encoder.getMapper());
        MapperProfile decoderProfile = profile(decoder.getMapper());
        System.out.println("[client-codec-guard] " + construction + ": encoder " + encoderProfile + ", decoder "
                + decoderProfile + ", maxInMemorySize " + decoder.getMaxInMemorySize());
        ObjectMapper production = JsonUtils.getObjectMapper();
        assertTrue(construction + ": encoder mapper must not be the production mapper", encoder.getMapper() != production);
        assertTrue(construction + ": decoder mapper must not be the production mapper", decoder.getMapper() != production);
        assertTrue(construction + ": encoder and decoder must have separate mappers", encoder.getMapper() != decoder.getMapper());
        assertEquals(construction + ": decoder maxInMemorySize", expectedMaxInMemorySize, decoder.getMaxInMemorySize());
        assertEquals(construction + ": encoder mapper", DEFAULT_CODEC_PROFILE, encoderProfile);
        assertEquals(construction + ": decoder mapper", DEFAULT_CODEC_PROFILE, decoderProfile);
        ExchangeStrategies rebuilt = strategies(expectedMaxInMemorySize);
        assertEquals(construction + ": ClientCodecs rebuild", encoderProfile, profile(encoder(rebuilt).getMapper()));
        assertEquals(construction + ": ClientCodecs rebuild maxInMemorySize", expectedMaxInMemorySize,
                decoder(rebuilt).getMaxInMemorySize());
    }

    private static void assertTrue(String message, boolean condition) {
        if (!condition) {
            throw new AssertionError(message);
        }
    }

    private static void assertEquals(String message, Object expected, Object actual) {
        if (!expected.equals(actual)) {
            throw new AssertionError(message + ": expected " + expected + ", actual " + actual);
        }
    }

    /** The Jackson JSON encoder among {@code writers}; fails if there is none. */
    public static JacksonJsonEncoder encoder(List<HttpMessageWriter<?>> writers) {
        return writers.stream()
                .filter(writer -> writer instanceof EncoderHttpMessageWriter<?> encoderWriter
                        && encoderWriter.getEncoder() instanceof JacksonJsonEncoder)
                .map(writer -> (JacksonJsonEncoder) ((EncoderHttpMessageWriter<?>) writer).getEncoder())
                .findFirst()
                .orElseThrow(() -> new AssertionError("no JacksonJsonEncoder among " + writers));
    }

    /** The Jackson JSON decoder among {@code readers}; fails if there is none. */
    public static JacksonJsonDecoder decoder(List<HttpMessageReader<?>> readers) {
        return readers.stream()
                .filter(reader -> reader instanceof DecoderHttpMessageReader<?> decoderReader
                        && decoderReader.getDecoder() instanceof JacksonJsonDecoder)
                .map(reader -> (JacksonJsonDecoder) ((DecoderHttpMessageReader<?>) reader).getDecoder())
                .findFirst()
                .orElseThrow(() -> new AssertionError("no JacksonJsonDecoder among " + readers));
    }
}
