package org.lowcoder.api.contract.boundary;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.authentication.util.JwtDecoderUtil;
import org.lowcoder.sdk.contract.BoundarySites;
import org.lowcoder.sdk.contract.GoldenJson;
import org.lowcoder.sdk.contract.JavaValueWalker;
import org.lowcoder.sdk.util.JsonUtils;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Group {@code jwt-claims} of docs/API_PAYLOAD_TEST_PLAN.md §4.9: {@code JwtDecoderUtil.decodeJwtPayload} reads a
 * JWT payload with its own bare {@code new ObjectMapper()} ({@code JwtDecoderUtil.java:9}), so a Jackson upgrade that
 * changes the untyped defaults changes the Java values the Generic OAuth provider maps claims from
 * ({@code GenericAuthRequest.getAuthUser}). The payload is {@code boundary/jwt-claims/claims.input.json}, byte for
 * byte, so every number lexeme of the input reaches the mapper; the Java class of every claim, the key order and the
 * values as the production mapper writes them are pinned in {@code boundary/jwt-claims/claims.read.json}.
 *
 * <p>Limits: the signature is never verified by production and is a fixed placeholder here. The input is ASCII
 * (non-ASCII written as JSON unicode escapes); raw non-ASCII bytes are decoded as UTF-8 (GH-01; before, with the platform
 * charset, plan §9, O30), which {@link #rawNonAsciiClaimsAreDecodedAsUtf8GH01} pins; that it holds under a non-UTF-8 default
 * charset is {@code UsAsciiDefaultCharsetTest}'s.
 */
public class JwtClaimsContractTest {

    public static final String INPUT_FIXTURE = "boundary/jwt-claims/claims.input.json";
    static final String READ_FIXTURE = "boundary/jwt-claims/claims.read.json";
    static final String VALUES_KEY = "values";
    static final String ERRORS_KEY = "errors";
    /** {"alg":"RS256","typ":"JWT"}, as providers send it. */
    static final String HEADER = "{\"alg\":\"RS256\",\"typ\":\"JWT\"}";
    static final String SIGNATURE = "c2lnbmF0dXJl";
    static final String NO_PAYLOAD_JWT = "eyJhbGciOiJub25lIn0";
    static final String NOT_JSON_PAYLOAD = "not json";
    static final String RAW_NON_ASCII_NAME = "Ján Žltý";
    static final String RAW_NON_ASCII_PAYLOAD = "{\"name\":\"" + RAW_NON_ASCII_NAME + "\"}";
    static final String NAME_CLAIM = "name";

    private static final ObjectMapper MAPPER = JsonUtils.getObjectMapper();
    private static final GoldenJson GOLDEN = GoldenJson.forModule();

    /** {@code text} with every non-ASCII character as a backslash, a lower-case u and four hex digits, so that a diagnostic reads the same under any console charset. */
    public static String escaped(String text) {
        StringBuilder out = new StringBuilder();
        text.chars().forEach(c -> out.append(c < 0x80 ? String.valueOf((char) c) : String.format("\\u%04x", c)));
        return out.toString();
    }

    /** A compact JWT whose payload segment is exactly {@code payload}'s UTF-8 bytes, base64url without padding. */
    public static String jwt(String payload) {
        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
        return encoder.encodeToString(HEADER.getBytes(StandardCharsets.UTF_8)) + "."
                + encoder.encodeToString(payload.getBytes(StandardCharsets.UTF_8)) + "." + SIGNATURE;
    }

    @BoundarySites({
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/util/JwtDecoderUtil.java#JwtDecoderUtil.objectMapper#new ObjectMapper#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/util/JwtDecoderUtil.java#JwtDecoderUtil.decodeJwtPayload#readValue#1",
            "lowcoder-server/src/main/java/org/lowcoder/api/authentication/util/JwtDecoderUtil.java#<file>#import#1"})
    @Test
    void claimsDecodeToPinnedJavaValues() throws Exception {
        String payload = GOLDEN.read(INPUT_FIXTURE);
        Map<String, Object> claims = JwtDecoderUtil.decodeJwtPayload(jwt(payload));
        Map<String, Object> read = JavaValueWalker.shape(claims);
        read.put(VALUES_KEY, claims);
        read.put(ERRORS_KEY, errors());
        String actual = MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(read);
        System.out.println("[JwtClaimsContractTest] " + claims.size() + " claims, classes "
                + read.get(JavaValueWalker.CLASSES_KEY) + "\n" + actual);
        GOLDEN.assertJson(READ_FIXTURE, actual);
    }

    /**
     * GH-01 (was O30, the platform charset): the payload bytes become a {@code String} as UTF-8 before Jackson reads
     * them, so the claim equals the UTF-8 text whichever charset the JVM defaults to.
     */
    @Test
    void rawNonAsciiClaimsAreDecodedAsUtf8GH01() throws Exception {
        Map<String, Object> claims = JwtDecoderUtil.decodeJwtPayload(jwt(RAW_NON_ASCII_PAYLOAD));
        System.out.println("[JwtClaimsContractTest] name claim " + escaped(String.valueOf(claims.get(NAME_CLAIM))) + ", expected " + escaped(RAW_NON_ASCII_NAME));
        assertThat(claims.get(NAME_CLAIM)).isEqualTo(RAW_NON_ASCII_NAME);
    }

    /** The exception class of each malformed input; Generic's caller swallows every one of them. */
    private static Map<String, String> errors() {
        Map<String, String> errors = new LinkedHashMap<>();
        errors.put("noPayloadSegment", errorOf(NO_PAYLOAD_JWT));
        errors.put("payloadNotJson", errorOf(jwt(NOT_JSON_PAYLOAD)));
        errors.put("payloadNotAnObject", errorOf(jwt("[1]")));
        return errors;
    }

    private static String errorOf(String jwt) {
        try {
            return "no error: " + JwtDecoderUtil.decodeJwtPayload(jwt);
        } catch (IllegalArgumentException e) {
            return e.getClass().getName() + ": " + e.getMessage();
        } catch (JsonProcessingException e) {
            return e.getClass().getName();
        } catch (Exception e) {
            throw new AssertionError("unexpected exception for " + jwt, e);
        }
    }
}
