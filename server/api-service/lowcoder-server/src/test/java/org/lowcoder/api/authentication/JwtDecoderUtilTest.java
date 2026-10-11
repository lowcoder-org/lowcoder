package org.lowcoder.api.authentication;

import org.junit.jupiter.api.Test;
import org.lowcoder.api.authentication.util.JwtDecoderUtil;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class JwtDecoderUtilTest {

    @Test
    void testDecodeJwtPayload_ValidJwt() throws Exception {
        // Example JWT with payload: {"sub":"1234567890","name":"John Doe","iat":1516239022}
        String jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

        Map<String, Object> payload = JwtDecoderUtil.decodeJwtPayload(jwt);

        assertNotNull(payload);
        assertEquals("1234567890", payload.get("sub"));
        assertEquals("John Doe", payload.get("name"));
        assertEquals(1516239022, payload.get("iat"));
    }

    @Test
    void testDecodeJwtPayload_InvalidJwtFormat() {
        // Example of an invalid JWT (missing parts)
        String jwt = "invalid-jwt";

        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            JwtDecoderUtil.decodeJwtPayload(jwt);
        });

        assertEquals("Invalid JWT format.", exception.getMessage());
    }

    @Test
    void testDecodeJwtPayload_InvalidBase64() {
        // Example of a JWT with an invalid base64 payload part
        String jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid-base64.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

        Exception exception = assertThrows(Exception.class, () -> {
            JwtDecoderUtil.decodeJwtPayload(jwt);
        });

        assertTrue(exception instanceof IllegalArgumentException || exception instanceof java.io.IOException);
    }

    @Test
    void testDecodeJwtPayload_EmptyPayload() throws Exception {
        // Example of a JWT with an empty payload
        String jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

        Exception exception = assertThrows(Exception.class, () -> {
            JwtDecoderUtil.decodeJwtPayload(jwt);
        });

        assertTrue(exception instanceof java.io.IOException);
    }
}