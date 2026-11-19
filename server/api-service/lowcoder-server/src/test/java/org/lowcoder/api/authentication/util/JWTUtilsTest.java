package org.lowcoder.api.authentication.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

import java.util.Date;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.sdk.config.AuthProperties;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

/**
 * Tests of {@link JWTUtils}: API-key token creation and validation, and bearer-token extraction. A token that fails
 * validation must yield {@code null}, never claims: that is what stops a forged or expired API key from authenticating.
 */
class JWTUtilsTest {

    private static final String SECRET = "a-sufficiently-long-secret-for-the-hs256-test-signature";
    private static final String OTHER_SECRET = "another-sufficiently-long-secret-for-hs256-signatures";
    private static final String USER_ID = "user-1";
    private static final String USER_NAME = "User One";
    private static final String AUTHORIZATION = "Authorization";
    /** NEW-134: the most pairs of tokens tried to get two inside one second. */
    private static final int SAME_SECOND_ATTEMPTS = 20;
    private static final String ID_CLAIM = "jti";
    private static final String USER_ID_CLAIM = "userId";
    private static final String CREATED_BY_CLAIM = "createdBy";
    private static final String NEW134_LOG = "[NEW-134] ";
    private static final long MILLIS_PER_SECOND = 1000L;

    private JWTUtils jwtUtils;

    private static JWTUtils jwtUtilsWithSecret(String secret) {
        AuthProperties properties = new AuthProperties();
        properties.getApiKey().setSecret(secret);
        JWTUtils utils = new JWTUtils();
        ReflectionTestUtils.setField(utils, "authProperties", properties);
        utils.setup();
        return utils;
    }

    private static User user(String id, String name) {
        return User.builder().id(id).name(name).build();
    }

    @BeforeEach
    void setUp() {
        jwtUtils = jwtUtilsWithSecret(SECRET);
    }

    /** Catches claims lost in the round trip, or an expiry sneaking in (API-key tokens live until revoked). */
    @Test
    void createToken_thenParse_returnsTheUsersClaims_withoutExpiry() {
        String token = jwtUtils.createToken(user(USER_ID, USER_NAME));

        Claims claims = jwtUtils.parseJwtClaims(token);

        assertThat(claims).isNotNull();
        assertThat(claims.getSubject()).isEqualTo(USER_ID);
        assertThat(claims.get("userId")).isEqualTo(USER_ID);
        assertThat(claims.get("createdBy")).isEqualTo(USER_NAME);
        assertThat(claims.getIssuedAt()).isNotNull();
        assertThat(claims.getExpiration()).isNull();
        System.out.println("[JWTUtilsTest] claims " + claims);
    }

    /** Catches a tampered token validating: the payload of one user under the signature of another is rejected. */
    @Test
    void parseJwtClaims_tamperedPayload_isNull() {
        String[] mine = jwtUtils.createToken(user(USER_ID, USER_NAME)).split("\\.");
        String[] theirs = jwtUtils.createToken(user("admin-1", "Admin")).split("\\.");

        String tampered = mine[0] + "." + theirs[1] + "." + mine[2];

        assertThat(jwtUtils.parseJwtClaims(tampered)).isNull();
        System.out.println("[JWTUtilsTest] payload swapped under another signature -> null");
    }

    /** Catches a token signed with another secret (a forged API key) validating. */
    @Test
    void parseJwtClaims_tokenSignedWithAnotherSecret_isNull() {
        String foreign = jwtUtilsWithSecret(OTHER_SECRET).createToken(user(USER_ID, USER_NAME));

        assertThat(jwtUtils.parseJwtClaims(foreign)).isNull();
        System.out.println("[JWTUtilsTest] foreign-secret token -> null");
    }

    /** Catches an expired token validating, even when correctly signed. */
    @Test
    void parseJwtClaims_expiredToken_isNull() {
        String base64Secret = (String) ReflectionTestUtils.getField(jwtUtils, "base64EncodedSecret");
        String expired = Jwts.builder().setSubject(USER_ID).setExpiration(new Date(System.currentTimeMillis() - 3_600_000L))
                .signWith(SignatureAlgorithm.HS256, base64Secret).compact();

        assertThat(jwtUtils.parseJwtClaims(expired)).isNull();
        System.out.println("[JWTUtilsTest] expired token -> null");
    }

    /**
     * NEW-134: two keys created by one user inside one second used to get the same token (equal claims, a deterministic HS256
     * signature), so deleting one left its token valid through the other. Fails, not passes, when no same-second pair is found.
     */
    @Test
    void createToken_twiceInOneSecond_givesTwoTokensNEW134() {
        User user = user(USER_ID, USER_NAME);
        for (int attempt = 1; attempt <= SAME_SECOND_ATTEMPTS; attempt++) {
            String first = jwtUtils.createToken(user);
            String second = jwtUtils.createToken(user);
            Claims a = jwtUtils.parseJwtClaims(first);
            Claims b = jwtUtils.parseJwtClaims(second);
            assertNotNull(a, "the first token does not parse");
            assertNotNull(b, "the second token does not parse");
            assertNotNull(a.getIssuedAt(), "the first token has no iat");
            assertNotNull(b.getIssuedAt(), "the second token has no iat");
            if (a.getIssuedAt().getTime() / MILLIS_PER_SECOND == b.getIssuedAt().getTime() / MILLIS_PER_SECOND) {
                System.out.println(NEW134_LOG + "attempt " + attempt + ": same iat second " + a.getIssuedAt().getTime() / MILLIS_PER_SECOND
                        + ", tokens equal: " + first.equals(second) + ", jti " + a.getId() + " / " + b.getId());
                assertAll(
                        () -> assertNotEquals(first, second, "two tokens created in one second are equal"),
                        () -> assertTrue(a.getId() != null && !a.getId().isBlank(), "the first token has no jti"),
                        () -> assertTrue(b.getId() != null && !b.getId().isBlank(), "the second token has no jti"),
                        () -> assertNotEquals(a.getId(), b.getId(), "the two jti values are equal"));
                return;
            }
        }
        fail("no same-second pair in " + SAME_SECOND_ATTEMPTS + " attempts");
    }

    /** NEW-134: a token issued before the jti existed (the four claims only) still parses; validation never reads a jti. */
    @Test
    void tokenWithoutJti_stillParsesNEW134() {
        String base64Secret = (String) ReflectionTestUtils.getField(jwtUtils, "base64EncodedSecret");
        String oldToken = Jwts.builder().setSubject(USER_ID).setIssuedAt(new Date())
                .claim(USER_ID_CLAIM, USER_ID).claim(CREATED_BY_CLAIM, USER_NAME)
                .signWith(SignatureAlgorithm.HS256, base64Secret).compact();

        Claims claims = jwtUtils.parseJwtClaims(oldToken);

        assertThat(claims).isNotNull();
        assertThat(claims.getId()).as(ID_CLAIM).isNull();
        assertThat(claims.getSubject()).isEqualTo(USER_ID);
        assertThat(claims.getIssuedAt()).isNotNull();
        assertThat(claims.get(USER_ID_CLAIM)).isEqualTo(USER_ID);
        assertThat(claims.get(CREATED_BY_CLAIM)).isEqualTo(USER_NAME);
        System.out.println(NEW134_LOG + "a token without a jti parses: " + claims);
    }

    @ParameterizedTest(name = "[{0}]")
    @NullAndEmptySource
    @ValueSource(strings = {"not-a-token", "a.b.c"})
    void parseJwtClaims_malformedOrMissingToken_isNull_andDoesNotThrow(String token) {
        assertThat(jwtUtils.parseJwtClaims(token)).isNull();
        System.out.println("[JWTUtilsTest] malformed token [" + token + "] -> null");
    }

    private static MockServerWebExchange exchange(String authorization) {
        MockServerHttpRequest.BaseBuilder<?> builder = MockServerHttpRequest.get("/api/x");
        if (authorization != null) {
            builder.header(AUTHORIZATION, authorization);
        }
        return MockServerWebExchange.from(builder.build());
    }

    /** Catches other schemes or a missing header yielding a token: only the exact {@code Bearer } prefix does. */
    @Test
    void resolveToken_acceptsOnlyTheBearerPrefix() {
        assertThat(jwtUtils.resolveToken(exchange("Bearer abc.def.ghi"))).isEqualTo("abc.def.ghi");
        assertThat(jwtUtils.resolveToken(exchange("bearer abc"))).as("prefix is case-sensitive").isNull();
        assertThat(jwtUtils.resolveToken(exchange("Basic abc"))).isNull();
        assertThat(jwtUtils.resolveToken(exchange("Bearer"))).as("no space, no token").isNull();
        assertThat(jwtUtils.resolveToken(exchange(null))).as("no header").isNull();
        System.out.println("[JWTUtilsTest] only 'Bearer <token>' resolves");
    }

    /** Pinned as today's behaviour (not a defect): the prefix alone resolves to an empty token. */
    @Test
    void resolveToken_prefixOnly_isTheEmptyString() {
        assertThat(jwtUtils.resolveToken(exchange("Bearer "))).isEmpty();
        System.out.println("[JWTUtilsTest] 'Bearer ' -> empty string (today's behaviour)");
    }
}
