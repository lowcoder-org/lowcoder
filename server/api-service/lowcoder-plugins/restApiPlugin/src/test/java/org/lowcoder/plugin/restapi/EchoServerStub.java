package org.lowcoder.plugin.restapi;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Request;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * A local stand-in for the parts of postman-echo.com that {@link RestApiEngineTest} uses, served by
 * {@link RecordingHttpServer}, so the test needs no network access:
 * <ul>
 * <li>{@value #POST_PATH}: echoes the request as postman-echo does: {@code url} (as received, with its raw query),
 * {@code args}, {@code data} (the body parsed as JSON when sent as JSON, else its text), {@code json}, {@code form}
 * (url-encoded fields and multipart text parts) and {@code files} (multipart file parts as data URIs);</li>
 * <li>{@value #BASIC_AUTH_PATH} and {@value #DIGEST_AUTH_PATH}: {@code {"authenticated":true}} for the credentials
 * {@value #USERNAME}/{@value #PASSWORD}, else 401 (the digest path challenges first and checks the digest response of
 * RFC 7616 with MD5 and {@code qop=auth});</li>
 * <li>{@value #DIGEST_REDIRECT_PATH}: the same digest challenge, and for a valid digest response a 307 to
 * {@value #DIGEST_AUTH_PATH}, which challenges again;</li>
 * <li>{@value #RESPONSE_HEADERS_PATH}: every query parameter as a response header and as a member of the JSON body.</li>
 * </ul>
 *
 * <p>Limits: only what the test asserts is reproduced (postman-echo also echoes headers and more); the digest nonce is
 * fixed, and nonce counts are not checked for replay.
 */
final class EchoServerStub {

    static final String POST_PATH = "/post";
    static final String BASIC_AUTH_PATH = "/basic-auth";
    static final String DIGEST_AUTH_PATH = "/digest-auth";
    static final String DIGEST_REDIRECT_PATH = "/digest-auth-redirect";
    static final String RESPONSE_HEADERS_PATH = "/response-headers";
    static final String USERNAME = "postman";
    static final String PASSWORD = "password";

    static final int OK = 200;
    static final int UNAUTHORIZED = 401;
    static final int TEMPORARY_REDIRECT = 307;
    static final String AUTHENTICATED_BODY = "{\"authenticated\":true}";

    private static final String REALM = "Users";
    private static final String NONCE = "f2a8d2c6b1e04a7f9c3d5e6b7a8c9d0e";
    private static final String QOP = "auth";
    private static final String AUTHORIZATION = "Authorization";
    private static final String WWW_AUTHENTICATE = "WWW-Authenticate";
    private static final String LOCATION = "Location";
    private static final String HOST = "Host";
    private static final String JSON_UTF8 = "application/json; charset=utf-8";
    private static final String DEFAULT_FILE_TYPE = "application/octet-stream";
    private static final String BASIC_PREFIX = "Basic ";
    private static final String DIGEST_PREFIX = "Digest ";
    private static final String CRLF = "\r\n";
    private static final Pattern DIGEST_PARAM = Pattern.compile("(\\w+)=(?:\"([^\"]*)\"|([^,\\s]+))");
    private static final Pattern DISPOSITION_PARAM = Pattern.compile("(name|filename)=\"([^\"]*)\"");
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private EchoServerStub() {
    }

    static RecordingHttpServer start() {
        return RecordingHttpServer.serve(Map.of(
                POST_PATH, EchoServerStub::post,
                BASIC_AUTH_PATH, EchoServerStub::basicAuth,
                DIGEST_AUTH_PATH, EchoServerStub::digestAuth,
                DIGEST_REDIRECT_PATH, EchoServerStub::digestAuthThenRedirect,
                RESPONSE_HEADERS_PATH, EchoServerStub::responseHeaders));
    }

    private static Response post(Request request) {
        String contentType = request.header(RecordingHttpServer.CONTENT_TYPE).stream().findFirst().orElse("");
        String mediaType = contentType.split(";")[0].trim().toLowerCase(Locale.ROOT);
        ObjectNode echo = MAPPER.createObjectNode();
        echo.set("args", MAPPER.valueToTree(queryParameters(request)));
        ObjectNode form = MAPPER.createObjectNode();
        ObjectNode files = MAPPER.createObjectNode();
        echo.put("data", "");
        echo.putNull("json");
        switch (mediaType) {
            case "application/json" -> {
                JsonNode json = parseOrNull(request.bodyText());
                if (json == null) {
                    echo.put("data", request.bodyText());
                } else {
                    echo.set("data", json);
                    echo.set("json", json);
                }
            }
            case "application/x-www-form-urlencoded" -> decodeForm(request.bodyText()).forEach(form::put);
            case "multipart/form-data" -> readMultipart(request.body(), boundary(contentType), form, files);
            default -> echo.put("data", request.bodyText());
        }
        echo.set("files", files);
        echo.set("form", form);
        echo.put("url", "http://" + request.header(HOST).get(0) + request.pathAndQuery());
        return json(OK, echo.toString());
    }

    private static Response basicAuth(Request request) {
        String expected = BASIC_PREFIX + Base64.getEncoder()
                .encodeToString((USERNAME + ":" + PASSWORD).getBytes(StandardCharsets.UTF_8));
        boolean authenticated = request.header(AUTHORIZATION).contains(expected);
        return authenticated ? json(OK, AUTHENTICATED_BODY) : new Response(UNAUTHORIZED, Map.of(), null);
    }

    private static Response digestAuth(Request request) {
        String authorization = request.header(AUTHORIZATION).stream().findFirst().orElse("");
        if (authorization.startsWith(DIGEST_PREFIX) && validDigest(request, digestParameters(authorization))) {
            return json(OK, AUTHENTICATED_BODY);
        }
        String challenge = DIGEST_PREFIX + "realm=\"" + REALM + "\", nonce=\"" + NONCE + "\", qop=\"" + QOP + "\"";
        return new Response(UNAUTHORIZED, Map.of(WWW_AUTHENTICATE, List.of(challenge)), null);
    }

    private static Response responseHeaders(Request request) {
        Map<String, String> parameters = queryParameters(request);
        Map<String, List<String>> headers = new LinkedHashMap<>();
        parameters.forEach((name, value) -> headers.put(name, List.of(value)));
        try {
            return new Response(OK, headers, MAPPER.writeValueAsBytes(parameters));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    /** RFC 7616 with MD5: response = MD5(HA1:nonce:nc:cnonce:qop:HA2), or MD5(HA1:nonce:HA2) without qop. */
    private static Response digestAuthThenRedirect(Request request) {
        Response answer = digestAuth(request);
        return answer.status() == OK ? new Response(TEMPORARY_REDIRECT, Map.of(LOCATION, List.of(DIGEST_AUTH_PATH)), null) : answer;
    }

    private static boolean validDigest(Request request, Map<String, String> digest) {
        String path = request.pathAndQuery().split("\\?")[0];
        if (!USERNAME.equals(digest.get("username")) || !REALM.equals(digest.get("realm"))
                || !NONCE.equals(digest.get("nonce")) || !path.equals(digest.get("uri"))) {
            return false;
        }
        String ha1 = md5(USERNAME + ":" + REALM + ":" + PASSWORD);
        String ha2 = md5(request.method() + ":" + digest.get("uri"));
        String expected = digest.containsKey("qop")
                ? md5(ha1 + ":" + NONCE + ":" + digest.get("nc") + ":" + digest.get("cnonce") + ":" + digest.get("qop") + ":" + ha2)
                : md5(ha1 + ":" + NONCE + ":" + ha2);
        return expected.equals(digest.get("response"));
    }

    private static Map<String, String> digestParameters(String authorization) {
        Map<String, String> parameters = new HashMap<>();
        Matcher matcher = DIGEST_PARAM.matcher(authorization.substring(DIGEST_PREFIX.length()));
        while (matcher.find()) {
            parameters.put(matcher.group(1), matcher.group(2) != null ? matcher.group(2) : matcher.group(3));
        }
        return parameters;
    }

    private static Map<String, String> queryParameters(Request request) {
        String[] pathAndQuery = request.pathAndQuery().split("\\?", 2);
        return pathAndQuery.length < 2 ? Map.of() : decodeForm(pathAndQuery[1]);
    }

    private static Map<String, String> decodeForm(String encoded) {
        Map<String, String> fields = new LinkedHashMap<>();
        for (String pair : encoded.split("&")) {
            if (!pair.isEmpty()) {
                String[] nameAndValue = pair.split("=", 2);
                fields.put(URLDecoder.decode(nameAndValue[0], StandardCharsets.UTF_8),
                        nameAndValue.length < 2 ? "" : URLDecoder.decode(nameAndValue[1], StandardCharsets.UTF_8));
            }
        }
        return fields;
    }

    private static String boundary(String contentType) {
        for (String parameter : contentType.split(";")) {
            String trimmed = parameter.trim();
            if (trimmed.startsWith("boundary=")) {
                return trimmed.substring("boundary=".length()).replace("\"", "");
            }
        }
        throw new IllegalArgumentException("multipart request without a boundary: " + contentType);
    }

    /** Splits a multipart body into text fields ({@code form}) and file parts ({@code files}, as data URIs). */
    private static void readMultipart(byte[] body, String boundary, ObjectNode form, ObjectNode files) {
        // ISO-8859-1 maps every byte to one char, so file bytes survive the round trip through String
        String text = new String(body, StandardCharsets.ISO_8859_1);
        for (String part : text.split("--" + Pattern.quote(boundary))) {
            int headerEnd = part.indexOf(CRLF + CRLF);
            if (headerEnd < 0) {
                continue;
            }
            String headers = part.substring(0, headerEnd);
            String content = part.substring(headerEnd + 2 * CRLF.length());
            if (content.endsWith(CRLF)) {
                content = content.substring(0, content.length() - CRLF.length());
            }
            Map<String, String> disposition = new HashMap<>();
            String partType = DEFAULT_FILE_TYPE;
            for (String header : headers.split(CRLF)) {
                String lower = header.toLowerCase(Locale.ROOT);
                if (lower.startsWith("content-disposition:")) {
                    Matcher matcher = DISPOSITION_PARAM.matcher(header);
                    while (matcher.find()) {
                        disposition.put(matcher.group(1), matcher.group(2));
                    }
                } else if (lower.startsWith("content-type:")) {
                    partType = header.substring("content-type:".length()).trim();
                }
            }
            byte[] bytes = content.getBytes(StandardCharsets.ISO_8859_1);
            if (disposition.containsKey("filename")) {
                files.put(disposition.get("filename"), "data:" + partType + ";base64," + Base64.getEncoder().encodeToString(bytes));
            } else if (disposition.containsKey("name")) {
                form.put(disposition.get("name"), new String(bytes, StandardCharsets.UTF_8));
            }
        }
    }

    private static JsonNode parseOrNull(String text) {
        try {
            return MAPPER.readTree(text);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private static Response json(int status, String body) {
        return new Response(status, Map.of(RecordingHttpServer.CONTENT_TYPE, List.of(JSON_UTF8)), body.getBytes(StandardCharsets.UTF_8));
    }

    private static String md5(String text) {
        try {
            byte[] digest = MessageDigest.getInstance("MD5").digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
