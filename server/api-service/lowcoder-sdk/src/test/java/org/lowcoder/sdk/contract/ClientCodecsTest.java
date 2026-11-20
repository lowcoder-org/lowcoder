package org.lowcoder.sdk.contract;

import tools.jackson.databind.json.JsonMapper;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.http.codec.json.JacksonJsonDecoder;
import org.springframework.http.codec.json.JacksonJsonEncoder;
import org.springframework.web.reactive.function.client.ExchangeStrategies;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Self-test of {@link ClientCodecs}: the client-codec guard must reject each kind of drift it exists for
 * (docs/API_PAYLOAD_TEST_PLAN.md §5.4). The configurations below are wrong on purpose.
 */
public class ClientCodecsTest {

    private static final int TEN_BYTES = 10;

    @Test
    public void strategiesExposeSeparateEncoderAndDecoderMappers() {
        ExchangeStrategies strategies = ClientCodecs.strategies(ClientCodecs.UNLIMITED);
        assertThat(ClientCodecs.encoder(strategies).getMapper())
                .isNotSameAs(ClientCodecs.decoder(strategies).getMapper());
        assertThat(ClientCodecs.decoder(strategies).getMaxInMemorySize()).isEqualTo(ClientCodecs.UNLIMITED);
    }

    @Test
    public void guardRejectsTheProductionMapper() {
        JsonMapper production = JsonUtils.getObjectMapper();
        ExchangeStrategies drifted = ExchangeStrategies.builder().codecs(configurer -> {
            configurer.defaultCodecs().jacksonJsonEncoder(new JacksonJsonEncoder(production));
            configurer.defaultCodecs().jacksonJsonDecoder(new JacksonJsonDecoder(JsonMapper.builder().build()));
        }).build();
        assertRejected(drifted, ClientCodecs.UNLIMITED, "encoder mapper must not be the production mapper");
    }

    @Test
    public void guardRejectsOneSharedMapper() {
        JsonMapper shared = JsonMapper.builder().build();
        ExchangeStrategies drifted = ExchangeStrategies.builder().codecs(configurer -> {
            configurer.defaultCodecs().jacksonJsonEncoder(new JacksonJsonEncoder(shared));
            configurer.defaultCodecs().jacksonJsonDecoder(new JacksonJsonDecoder(shared));
        }).build();
        assertRejected(drifted, ClientCodecs.UNLIMITED, "encoder and decoder must have separate mappers");
    }

    @Test
    public void guardRejectsAnotherBufferLimit() {
        assertRejected(ClientCodecs.strategies(TEN_BYTES), ClientCodecs.UNLIMITED, "decoder maxInMemorySize: expected -1, actual 10");
    }

    @Test
    public void guardRejectsAnotherMapperConfiguration() {
        ExchangeStrategies drifted = ExchangeStrategies.builder().codecs(configurer -> {
            configurer.defaultCodecs().jacksonJsonEncoder(new JacksonJsonEncoder(JsonMapper.builder().build()));
            configurer.defaultCodecs().maxInMemorySize(ClientCodecs.UNLIMITED);
        }).build();
        assertRejected(drifted, ClientCodecs.UNLIMITED, "encoder mapper: expected " + ClientCodecs.DEFAULT_CODEC_PROFILE);
    }

    private static void assertRejected(ExchangeStrategies drifted, int expectedSize, String messageFragment) {
        assertThatThrownBy(() -> ClientCodecs.assertDefaultClientCodecs("drifted", drifted, expectedSize))
                .isInstanceOf(AssertionError.class)
                .satisfies(error -> System.out.println("[ClientCodecsTest] rejected: " + error.getMessage()))
                .hasMessageContaining(messageFragment);
    }
}
