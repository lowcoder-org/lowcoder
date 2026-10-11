package org.lowcoder.sdk.contract;

import com.fasterxml.jackson.databind.util.RawValue;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * A local HTTP server that answers by path and records every request, so a plugin's real HTTP client code (WebClient,
 * Elasticsearch's REST client) runs end to end without network access (docs/API_PAYLOAD_TEST_PLAN.md §4.6, §4.10; the
 * same technique as the {@code npm-outbound} tests of §4.9). The answer to a path is either fixed ({@link #start}) or
 * computed from the request ({@link #serve}), e.g. an echo of what the client sent.
 *
 * <p>Limits: it binds {@code 127.0.0.1} on a free port; the JDK server adds a {@code Date} header to every answer (the
 * tests drop it as volatile) and writes header values one byte per character, so a header value is sent as the
 * ISO-8859-1 bytes of its characters. A path without a response answers 404 with an empty body.
 */
public final class RecordingHttpServer implements AutoCloseable {

    public static final String LOOPBACK = "127.0.0.1";
    public static final int NOT_FOUND = 404;
    public static final String CONTENT_TYPE = "Content-Type";
    public static final String CONTENT_TYPE_KEY = "contentType";
    public static final String BODY_KEY = "body";
    /** {@code sendResponseHeaders}' length for a response without a body. */
    private static final int NO_BODY = -1;
    private static final int ANY_PORT = 0;
    private static final int BACKLOG = 0;
    private static final int STOP_DELAY_SECONDS = 0;

    /** A fixed answer: status, headers (each name with its values in order) and body ({@code null}: none). */
    public record Response(int status, Map<String, List<String>> headers, byte[] body) {
    }

    /** Computes the answer to a request; the request is recorded before the handler runs. */
    @FunctionalInterface
    public interface Handler {
        Response answer(Request request);
    }

    /** A recorded request: method, path with query, headers as the server received them, and body bytes. */
    public record Request(String method, String pathAndQuery, Map<String, List<String>> headers, byte[] body) {

        /** The values of header {@code name}, whatever the case of its name (none: an empty list). */
        public List<String> header(String name) {
            return headers.entrySet().stream().filter(header -> name.equalsIgnoreCase(header.getKey()))
                    .map(Map.Entry::getValue).findFirst().orElse(List.of());
        }

        /** The body bytes decoded as UTF-8. */
        public String bodyText() {
            return new String(body, StandardCharsets.UTF_8);
        }

        /**
         * The request as a {@code downstream-encode} report pins it: the content type it was sent with, and the body,
         * which must be JSON, embedded as received ({@link RawValue}), so the report keeps its number lexemes and its
         * escapes as the client wrote them.
         */
        public Map<String, Object> jsonBodyReport() {
            Map<String, Object> report = new LinkedHashMap<>();
            report.put(CONTENT_TYPE_KEY, header(CONTENT_TYPE));
            report.put(BODY_KEY, new RawValue(bodyText()));
            return report;
        }
    }

    private final HttpServer server;
    private final List<Request> requests = Collections.synchronizedList(new ArrayList<>());

    private RecordingHttpServer(Map<String, Handler> handlers) throws IOException {
        server = HttpServer.create(new InetSocketAddress(InetAddress.getByName(LOOPBACK), ANY_PORT), BACKLOG);
        server.createContext("/", exchange -> answer(exchange, handlers));
        server.start();
    }

    /** Starts a server answering {@code responses} by exact path (without query). */
    public static RecordingHttpServer start(Map<String, Response> responses) {
        Map<String, Handler> handlers = new LinkedHashMap<>();
        responses.forEach((path, response) -> handlers.put(path, request -> response));
        return serve(handlers);
    }

    /** Starts a server answering each request with the handler of its exact path (without query). */
    public static RecordingHttpServer serve(Map<String, Handler> handlers) {
        try {
            return new RecordingHttpServer(handlers);
        } catch (IOException e) {
            throw new UncheckedIOException("cannot start the local HTTP server", e);
        }
    }

    /** {@code http://127.0.0.1:<port>}. */
    public String baseUrl() {
        return "http://" + LOOPBACK + ":" + server.getAddress().getPort();
    }

    public int port() {
        return server.getAddress().getPort();
    }

    /** The requests received so far, in arrival order. */
    public List<Request> requests() {
        synchronized (requests) {
            return List.copyOf(requests);
        }
    }

    @Override
    public void close() {
        server.stop(STOP_DELAY_SECONDS);
    }

    private void answer(HttpExchange exchange, Map<String, Handler> handlers) throws IOException {
        try (exchange) {
            byte[] body = exchange.getRequestBody().readAllBytes();
            Map<String, List<String>> headers = new LinkedHashMap<>();
            exchange.getRequestHeaders().forEach((name, values) -> headers.put(name, List.copyOf(values)));
            String query = exchange.getRequestURI().getRawQuery();
            Request request = new Request(exchange.getRequestMethod(),
                    exchange.getRequestURI().getRawPath() + (query == null ? "" : "?" + query), headers, body);
            requests.add(request);
            Handler handler = handlers.get(exchange.getRequestURI().getPath());
            if (handler == null) {
                exchange.sendResponseHeaders(NOT_FOUND, NO_BODY);
                return;
            }
            Response response = handler.answer(request);
            response.headers().forEach((name, values) -> values.forEach(value -> exchange.getResponseHeaders().add(name, value)));
            exchange.sendResponseHeaders(response.status(), response.body() == null ? NO_BODY : response.body().length);
            if (response.body() != null) {
                exchange.getResponseBody().write(response.body());
            }
        }
    }
}
