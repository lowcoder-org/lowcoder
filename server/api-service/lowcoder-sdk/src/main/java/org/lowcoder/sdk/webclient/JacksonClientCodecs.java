package org.lowcoder.sdk.webclient;

import org.springframework.http.codec.ClientCodecConfigurer;
import org.springframework.http.codec.json.JacksonJsonDecoder;
import org.springframework.http.codec.json.JacksonJsonEncoder;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * Gives the JSON codecs of the application's outbound {@code WebClient}s the Jackson 2 configuration they had before
 * Jackson 3: dates written as timestamps, properties in declaration order, unknown properties ignored.
 *
 * <p>Spring's default Jackson 3 codecs write dates as ISO strings and sort bean properties alphabetically, which changes
 * the bytes of every request body that holds a bean or a date. A codec set explicitly wins over the default, so this sets
 * both slots, with one mapper each, as the defaults do.
 *
 * <p>Limits: it covers only the clients that call it ({@link WebClientBuildHelper} and the exchange strategies declared by
 * the code that does not go through the helper). A {@code WebClient} or {@code ExchangeStrategies} built anywhere else
 * keeps Spring's defaults. The mappers are not the production mapper ({@code JsonUtils}): they register none of its
 * subtypes.
 */
public final class JacksonClientCodecs {

    private JacksonClientCodecs() {
    }

    /** Sets a JSON encoder and decoder with the Jackson 2 configuration on {@code configurer}'s default codecs. */
    public static void apply(ClientCodecConfigurer configurer) {
        configurer.defaultCodecs().jacksonJsonEncoder(new JacksonJsonEncoder(mapper()));
        configurer.defaultCodecs().jacksonJsonDecoder(new JacksonJsonDecoder(mapper()));
    }

    private static JsonMapper mapper() {
        return JsonMapper.builderWithJackson2Defaults()
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .build();
    }
}
