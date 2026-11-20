package org.lowcoder.api.contract;

import tools.jackson.core.StreamReadConstraints;
import tools.jackson.databind.introspect.AnnotatedClass;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.jsontype.NamedType;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractHarness;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.ClientCodecs;
import org.lowcoder.sdk.contract.ClientCodecs.MapperProfile;
import org.lowcoder.sdk.contract.JacksonIntrospection;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.http.codec.json.JacksonJsonDecoder;
import org.springframework.http.codec.json.JacksonJsonEncoder;

import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guard of the server codecs and the production mapper (docs/API_PAYLOAD_TEST_PLAN.md §5.4, group
 * {@code server-codec-guard}; evidence E3, E4, E7). It pins today's configuration, so a Jackson or Spring upgrade
 * that changes a default the application does not set fails here first.
 *
 * <p>Sites: {@code CustomWebFluxConfiguration.java:34} (the {@code objectMapper} bean), {@code :49} and {@code :51}
 * (decoder and encoder), and that file's attested import row.
 */
class ServerCodecGuardTest {

    private static final String OBJECT_MAPPER_BEAN_NAME = "objectMapper";
    /** E7: {@code spring.http.codecs.max-in-memory-size} defaults to 20MB ({@code CustomWebFluxConfiguration.java:29-30}). */
    static final int SERVER_MAX_IN_MEMORY_SIZE = 20 * 1024 * 1024;
    /** E3: the Jackson 2 limits, which {@code JsonUtils} sets because the Jackson 3 defaults differ (nesting depth, string length). */
    private static final int MAX_NESTING_DEPTH = 1000;
    private static final int MAX_NUMBER_LENGTH = 1000;
    private static final int MAX_STRING_LENGTH = 20_000_000;
    /** E4. */
    private static final MapperProfile PRODUCTION_PROFILE = new MapperProfile(true, true, false, List.of());
    /** The type ids registered at {@code JsonUtils.java:36-41}; they are part of the wire contract. */
    private static final Set<String> AUTH_CONFIG_TYPE_IDS = Set.of("FORM", "GITHUB", "GOOGLE", "ORY", "KEYCLOAK", "GENERIC");

    private static AnnotationConfigApplicationContext context;

    @BeforeAll
    static void startContext() {
        context = ContractHarness.codecContext();
        context.refresh();
    }

    @AfterAll
    static void closeContext() {
        context.close();
    }

    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/framework/configuration/CustomWebFluxConfiguration.java#CustomWebFluxConfiguration.objectMapper#getObjectMapper#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/framework/configuration/CustomWebFluxConfiguration.java#CustomWebFluxConfiguration.configureHttpMessageCodecs#jacksonJsonDecoder#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/framework/configuration/CustomWebFluxConfiguration.java#CustomWebFluxConfiguration.configureHttpMessageCodecs#jacksonJsonEncoder#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/framework/configuration/CustomWebFluxConfiguration.java#<file>#import#1"})
    @Test
    void serverCodecsUseTheProductionMapper() {
        ServerCodecConfigurer codecs = context.getBean(ServerCodecConfigurer.class);
        JacksonJsonEncoder encoder = ClientCodecs.encoder(codecs.getWriters());
        JacksonJsonDecoder decoder = ClientCodecs.decoder(codecs.getReaders());
        JsonMapper production = JsonUtils.getObjectMapper();
        System.out.println("[ServerCodecGuardTest] encoder mapper " + ClientCodecs.profile(encoder.getMapper())
                + ", decoder maxInMemorySize " + decoder.getMaxInMemorySize());
        assertThat(encoder.getMapper()).as("server encoder mapper").isSameAs(production);
        assertThat(decoder.getMapper()).as("server decoder mapper").isSameAs(production);
        assertThat(context.getBean(OBJECT_MAPPER_BEAN_NAME)).as("objectMapper bean").isSameAs(production);
        assertThat(decoder.getMaxInMemorySize()).as("server decoder maxInMemorySize").isEqualTo(SERVER_MAX_IN_MEMORY_SIZE);
    }

    @Test
    void productionMapperFeaturesAndModulesAreUnchanged() {
        MapperProfile profile = ClientCodecs.profile(JsonUtils.getObjectMapper());
        System.out.println("[ServerCodecGuardTest] production mapper " + profile);
        assertThat(profile).isEqualTo(PRODUCTION_PROFILE);
    }

    @Test
    void productionMapperReadLimitsAreUnchanged() {
        StreamReadConstraints constraints = JsonUtils.getObjectMapper().tokenStreamFactory().streamReadConstraints();
        System.out.println("[ServerCodecGuardTest] StreamReadConstraints nesting=" + constraints.getMaxNestingDepth()
                + " number=" + constraints.getMaxNumberLength() + " string=" + constraints.getMaxStringLength());
        assertThat(constraints.getMaxNestingDepth()).isEqualTo(MAX_NESTING_DEPTH);
        assertThat(constraints.getMaxNumberLength()).isEqualTo(MAX_NUMBER_LENGTH);
        assertThat(constraints.getMaxStringLength()).isEqualTo(MAX_STRING_LENGTH);
    }

    @Test
    void productionMapperRegistersTheSixAuthConfigTypeIds() {
        JsonMapper mapper = JsonUtils.getObjectMapper();
        AnnotatedClass authConfig = JacksonIntrospection.serializationClass(mapper, mapper.constructType(AbstractAuthConfig.class));
        Set<String> typeIds = JacksonIntrospection.subtypesByTypeId(mapper, authConfig).stream()
                .filter(NamedType::hasName)
                .map(NamedType::getName)
                .collect(Collectors.toCollection(TreeSet::new));
        System.out.println("[ServerCodecGuardTest] AbstractAuthConfig type ids " + typeIds);
        assertThat(typeIds).isEqualTo(AUTH_CONFIG_TYPE_IDS);
    }
}
