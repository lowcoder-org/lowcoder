package org.lowcoder.sdk.webclient;

import org.springframework.http.codec.ClientCodecConfigurer;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;

/**
 * Keeps the JSON codecs of the application's outbound {@code WebClient}s on Jackson 2.
 *
 * <p>Spring's default codecs choose the Jackson 3 JSON codecs whenever {@code tools.jackson.databind.ObjectMapper} is on
 * the class path, and Jackson 3 is there through Spring Boot's JSON starter. The request bodies the application writes are
 * Jackson 2 trees ({@code com.fasterxml.jackson.databind.JsonNode}); the Jackson 3 encoder does not know that type and
 * writes the tree's bean properties instead of its content. A codec set explicitly wins over the default, so this sets
 * both slots.
 *
 * <p>The no-argument codecs build their own mappers with {@code Jackson2ObjectMapperBuilder}, one per codec, as the
 * defaults of a class path without Jackson 3 do.
 *
 * <p>Limits: it covers only the clients that call it ({@link WebClientBuildHelper} and the exchange strategies declared by
 * the code that does not go through the helper). A {@code WebClient} or {@code ExchangeStrategies} built anywhere else, and
 * the {@code spring.http.codecs.preferred-json-mapper} property, which only Spring Boot's own codec configuration reads,
 * do not reach it.
 */
@SuppressWarnings({"deprecation", "removal"})
public final class Jackson2ClientCodecs {

    private Jackson2ClientCodecs() {
    }

    /** Sets a Jackson 2 JSON encoder and decoder on {@code configurer}'s default codecs. */
    public static void apply(ClientCodecConfigurer configurer) {
        configurer.defaultCodecs().jackson2JsonEncoder(new Jackson2JsonEncoder());
        configurer.defaultCodecs().jackson2JsonDecoder(new Jackson2JsonDecoder());
    }
}
