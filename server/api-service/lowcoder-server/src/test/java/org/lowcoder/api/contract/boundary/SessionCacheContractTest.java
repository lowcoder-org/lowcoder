package org.lowcoder.api.contract.boundary;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.framework.warmup.WarmupHelper;
import org.lowcoder.api.home.SessionUserServiceImpl;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.runner.task.IoHeartBeatTask;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.util.JsonUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.data.redis.connection.ReactiveRedisConnection;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Group {@code session-cache} of docs/API_PAYLOAD_TEST_PLAN.md §4.9. A session token's Redis value is a plain user id
 * today ({@code SessionUserServiceImpl.saveUserSession}); older versions stored the user as JSON, so
 * {@code resolveSessionUserFromCookie} first tries {@code fromJsonQuietly(value, User.class)}
 * ({@code SessionUserServiceImpl.java:141}) and falls back to the id when that gives {@code null}. Pinned in
 * {@code boundary/session-cache/session-values.read.json}: what {@code fromJsonQuietly} makes of a legacy user JSON
 * ({@code boundary/session-cache/legacy-user.json}, unknown properties included) and of plain ids, which must give
 * {@code null}, not throw; and that both forms, written through the service's own template into Redis, resolve to the
 * seeded user.
 *
 * <p><b>Redis wiring (C9-A1, E12).</b> {@code RedisConfig} declares a {@code @Primary} template whose value
 * serializer is {@code Jackson2JsonRedisSerializer}, but every {@code ReactiveRedisTemplate<String, String>}
 * injection point (this service, {@code IoHeartBeatTask}, {@code WarmupHelper}) receives
 * {@code reactiveStringRedisTemplate}. {@link #sessionTemplatesWriteStringsNotJson} requires each of them to write
 * {@value #SAMPLE_VALUE} as the bytes {@value #STRING_SERIALIZER_BYTES}; a rewiring that makes Jackson write session
 * values (a JSON string literal, {@code 22...22}) fails it.
 *
 * <p>Limits: it runs with the "test" profile, whose {@code SessionUserServiceImplTest} subclass inherits the injected
 * field unchanged; the template fields are read by name, so renaming one fails the test rather than skipping it.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SessionCacheContractTest {

    static final String READ_FIXTURE = "boundary/session-cache/session-values.read.json";
    static final String LEGACY_USER_FIXTURE = "boundary/session-cache/legacy-user.json";
    static final String SEEDED_USER_ID = "user01";
    static final String TOKEN_PREFIX = "contract-session-";
    static final Duration SESSION_TTL = Duration.ofMinutes(1);
    static final Duration BLOCK_TIMEOUT = Duration.ofSeconds(30);
    static final String SAMPLE_VALUE = "u1\"é";
    static final String STRING_SERIALIZER_BYTES = "753122c3a9";
    static final String JACKSON_TEMPLATE_BEAN = "reactiveRedisOperations";
    static final String SESSION_TEMPLATE_FIELD = "reactiveTemplate";
    static final String TASK_TEMPLATE_FIELD = "reactiveRedisTemplate";
    static final String FROM_JSON_QUIETLY_KEY = "fromJsonQuietly";
    static final String THROUGH_REDIS_KEY = "throughRedis";

    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    @Autowired
    private ApplicationContext context;
    @Autowired
    private SessionUserServiceImpl sessionUserService;
    @Autowired
    private IoHeartBeatTask ioHeartBeatTask;
    @Autowired
    private WarmupHelper warmupHelper;
    @Autowired
    private ReactiveRedisConnectionFactory connectionFactory;
    @Autowired
    private InitData initData;

    @BeforeAll
    void seed() {
        initData.init();
    }

    /** The session values a token may hold: the legacy user JSON and plain ids, one of them valid JSON. */
    private Map<String, String> storedValues() {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("legacyUserJson", GOLDEN.read(LEGACY_USER_FIXTURE).strip());
        values.put("plainUserId", SEEDED_USER_ID);
        values.put("numericUserId", "1767225650");
        values.put("quotedUserId", "\"" + SEEDED_USER_ID + "\"");
        return values;
    }

    @BoundarySites("lowcoder-server/src/main/java/org/lowcoder/api/home/SessionUserServiceImpl.java#SessionUserServiceImpl.resolveSessionUserFromCookie#fromJsonQuietly#1")
    @Test
    void sessionValuesResolveToTheirUser() {
        Map<String, Object> fromJsonQuietly = new LinkedHashMap<>();
        storedValues().forEach((name, value) -> fromJsonQuietly.put(name, describe(JsonUtils.fromJsonQuietly(value, User.class))));

        ReactiveRedisOperations<String, String> template = template(sessionUserService, SESSION_TEMPLATE_FIELD);
        Map<String, Object> throughRedis = new LinkedHashMap<>();
        Map<String, String> sessionForms = new LinkedHashMap<>(storedValues());
        sessionForms.keySet().retainAll(List.of("legacyUserJson", "plainUserId"));
        sessionForms.forEach((name, value) -> {
            String token = TOKEN_PREFIX + name;
            try {
                assertThat(template.opsForValue().set(token, value, SESSION_TTL).block(BLOCK_TIMEOUT)).isTrue();
                byte[] stored = rawValue(token);
                User resolved = sessionUserService.resolveSessionUserFromCookie(token).block(BLOCK_TIMEOUT);
                Map<String, Object> outcome = new LinkedHashMap<>();
                outcome.put("storedBytesAreTheValueInUtf8", Arrays.equals(stored, value.getBytes(StandardCharsets.UTF_8)));
                outcome.put("resolvedUserId", resolved == null ? null : resolved.getId());
                outcome.put("resolvedUserName", resolved == null ? null : resolved.getName());
                throughRedis.put(name, outcome);
            } finally {
                template.delete(token).block(BLOCK_TIMEOUT);
            }
        });

        Map<String, Object> read = new LinkedHashMap<>();
        read.put(FROM_JSON_QUIETLY_KEY, fromJsonQuietly);
        read.put(THROUGH_REDIS_KEY, throughRedis);
        String actual = pretty(read);
        System.out.println("[SessionCacheContractTest] session values:\n" + actual);
        GOLDEN.assertJson(READ_FIXTURE, actual);
    }

    @BoundarySites("lowcoder-domain/src/main/java/org/lowcoder/domain/configurations/RedisConfig.java#<file>#import#1")
    @Test
    void sessionTemplatesWriteStringsNotJson() {
        Map<String, ReactiveRedisOperations<String, String>> injected = new LinkedHashMap<>();
        injected.put("SessionUserServiceImpl." + SESSION_TEMPLATE_FIELD, template(sessionUserService, SESSION_TEMPLATE_FIELD));
        injected.put("IoHeartBeatTask." + TASK_TEMPLATE_FIELD, template(ioHeartBeatTask, TASK_TEMPLATE_FIELD));
        injected.put("WarmupHelper." + TASK_TEMPLATE_FIELD, template(warmupHelper, TASK_TEMPLATE_FIELD));
        String jacksonBytes = valueBytes(template(context.getBean(JACKSON_TEMPLATE_BEAN)));
        System.out.println("[SessionCacheContractTest] RedisConfig." + JACKSON_TEMPLATE_BEAN + " writes " + SAMPLE_VALUE + " as " + jacksonBytes);
        assertThat(jacksonBytes).as("the Jackson template this guard tells apart").isNotEqualTo(STRING_SERIALIZER_BYTES);
        injected.forEach((point, template) -> {
            String bytes = valueBytes(template);
            System.out.println("[SessionCacheContractTest] " + point + " (" + template.getClass().getSimpleName() + ") writes "
                    + SAMPLE_VALUE + " as " + bytes);
            assertThat(bytes).as(point).isEqualTo(STRING_SERIALIZER_BYTES);
        });
    }

    private byte[] rawValue(String key) {
        ReactiveRedisConnection connection = connectionFactory.getReactiveConnection();
        try {
            ByteBuffer value = connection.stringCommands().get(ByteBuffer.wrap(key.getBytes(StandardCharsets.UTF_8))).block(BLOCK_TIMEOUT);
            byte[] bytes = new byte[value.remaining()];
            value.get(bytes);
            return bytes;
        } finally {
            connection.close();
        }
    }

    private static Map<String, Object> describe(User user) {
        if (user == null) {
            return null;
        }
        Map<String, Object> described = new LinkedHashMap<>();
        described.put("class", user.getClass().getName());
        described.put("id", user.getId());
        described.put("name", user.getName());
        described.put("email", user.getEmail());
        described.put("state", user.getState());
        described.put("isEnabled", user.getIsEnabled());
        described.put("superAdmin", user.getSuperAdmin());
        described.put("connectionRawIds", user.getConnections().stream().map(Connection::getRawId).toList());
        return described;
    }

    private static ReactiveRedisOperations<String, String> template(Object holder, String field) {
        return template(ReflectionTestUtils.getField(holder, field));
    }

    @SuppressWarnings("unchecked")
    private static ReactiveRedisOperations<String, String> template(Object template) {
        assertThat(template).isInstanceOf(ReactiveRedisOperations.class);
        return (ReactiveRedisOperations<String, String>) template;
    }

    private static String valueBytes(ReactiveRedisOperations<String, String> template) {
        ByteBuffer written = template.getSerializationContext().getValueSerializationPair().write(SAMPLE_VALUE);
        byte[] bytes = new byte[written.remaining()];
        written.get(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private static String pretty(Object value) {
        try {
            return JsonUtils.getObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(value);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("cannot write " + value, e);
        }
    }
}
