package org.lowcoder.api.authentication.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Base64;
import java.util.Map;

public class JwtDecoderUtil {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Decodes the payload of a JWT without verifying its signature.
     *
     * @param jwt The JWT string.
     * @return A Map representing the decoded JWT payload.
     * @throws Exception if there is an error decoding the JWT.
     */
    public static Map<String, Object> decodeJwtPayload(String jwt) throws Exception {
        // Split the JWT into its components
        String[] parts = jwt.split("\\.");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Invalid JWT format.");
        }

        // Base64-decode the payload
        String payload = parts[1];
        byte[] decodedBytes = Base64.getUrlDecoder().decode(payload);

        // Convert the decoded bytes to a JSON string
        String decodedString = new String(decodedBytes, PAYLOAD_CHARSET);

        // Convert the JSON string to a Map
        return objectMapper.readValue(decodedString, Map.class);
    }

    /**
     * The payload's JSON charset, UTF-8 (RFC 8259 section 8.1), not the JVM default (GH-01). Limits: invalid UTF-8 bytes become
     * U+FFFD, not refused; the signature is still not verified.
     */
    private static final java.nio.charset.Charset PAYLOAD_CHARSET = java.nio.charset.StandardCharsets.UTF_8;
}