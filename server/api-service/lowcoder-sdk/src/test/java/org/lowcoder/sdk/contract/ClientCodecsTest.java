package org.lowcoder.sdk.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
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
        assertThat(ClientCodecs.encoder(strategies).getObjectMapper())
                .isNotSameAs(ClientCodecs.decoder(strategies).getObjectMapper());
        assertThat(ClientCodecs.decoder(strategies).getMaxInMemorySize()).isEqualTo(ClientCodecs.UNLIMITED);
    }

    @Test
    public void guardRejectsTheProductionMapper() {
        ObjectMapper production = JsonUtils.getObjectMapper();
        ExchangeStrategies drifted = ExchangeStrategies.builder().codecs(configurer -> {
            configurer.defaultCodecs().jackson2JsonEncoder(new Jackson2JsonEncoder(production));
            configurer.defaultCodecs().jackson2JsonDecoder(new Jackson2JsonDecoder(new ObjectMapper()));
        }).build();
        assertRejected(drifted, ClientCodecs.UNLIMITED, "encoder mapper must not be the production mapper");
    }

    @Test
    public void guardRejectsOneSharedMapper() {
        ObjectMapper shared = new ObjectMapper();
        ExchangeStrategies drifted = ExchangeStrategies.builder().codecs(configurer -> {
            configurer.defaultCodecs().jackson2JsonEncoder(new Jackson2JsonEncoder(shared));
            configurer.defaultCodecs().jackson2JsonDecoder(new Jackson2JsonDecoder(shared));
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
            configurer.defaultCodecs().jackson2JsonEncoder(new Jackson2JsonEncoder(new ObjectMapper()));
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
