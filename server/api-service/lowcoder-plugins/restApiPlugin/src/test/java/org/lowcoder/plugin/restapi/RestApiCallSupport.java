package org.lowcoder.plugin.restapi;

import static java.util.Collections.emptyMap;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.lowcoder.plugin.restapi.model.RestApiQueryExecutionContext;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.query.QueryVisitorContext;
import org.springframework.http.HttpCookie;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

/**
 * What the REST API executor tests of L4-9 share: an executor whose {@code CommonConfig} names the Lowcoder session
 * cookie, a visitor context with cookies and an OAuth token Mono, and one call that builds the execution context and
 * runs it against a {@link RecordingHttpServer} (a real WebClient, no network). New file; the existing
 * RestApiEngineTest keeps its own helpers.
 */
final class RestApiCallSupport {

    static final String SESSION_COOKIE = "LOWCODER_SESSION";
    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final String VISITOR_ID = "visitor-1";
    static final String ORG_ID = "org-1";
    static final int SYSTEM_PORT = 8080;

    private final RestApiExecutor executor;

    RestApiCallSupport() {
        CommonConfig config = new CommonConfig();
        config.setCookieName(SESSION_COOKIE);
        executor = new RestApiExecutor(config);
    }

    static QueryVisitorContext visitor(MultiValueMap<String, HttpCookie> cookies, Mono<List<Property>> authToken) {
        return new QueryVisitorContext(VISITOR_ID, ORG_ID, SYSTEM_PORT, cookies, authToken, Set.of());
    }

    static MultiValueMap<String, HttpCookie> cookies(String... nameValuePairs) {
        MultiValueMap<String, HttpCookie> cookies = new LinkedMultiValueMap<>();
        for (int i = 0; i < nameValuePairs.length; i += 2) {
            cookies.add(nameValuePairs[i], new HttpCookie(nameValuePairs[i], nameValuePairs[i + 1]));
        }
        return cookies;
    }

    /** Builds the execution context only (the part that throws for an invalid query). */
    RestApiQueryExecutionContext buildContext(RestApiDatasourceConfig datasource, Map<String, Object> query, QueryVisitorContext visitor) {
        return executor.doBuildQueryExecutionContext(datasource, query, emptyMap(), visitor);
    }

    /** Builds the context and runs it; an error of the call is thrown by {@code block}. */
    QueryExecutionResult run(RestApiDatasourceConfig datasource, Map<String, Object> query, QueryVisitorContext visitor) {
        return executor.doExecuteQuery(null, buildContext(datasource, query, visitor)).block(TIMEOUT);
    }

    /** The error of a call that must fail (null if it did not). */
    Throwable failureOf(RestApiDatasourceConfig datasource, Map<String, Object> query, QueryVisitorContext visitor) {
        try {
            run(datasource, query, visitor);
            return null;
        } catch (Throwable t) {
            return t;
        }
    }

    static Response json(int status, String body) {
        return new Response(status, Map.of("Content-Type", List.of("application/json")), body.getBytes(StandardCharsets.UTF_8));
    }

    static Response redirect(int status, String location) {
        return new Response(status, Map.of("Location", List.of(location)), null);
    }

    /** The recorded requests whose path (without query) is {@code path}. */
    static List<RecordingHttpServer.Request> requestsTo(RecordingHttpServer server, String path) {
        return server.requests().stream().filter(request -> request.pathAndQuery().split("\\?")[0].equals(path)).toList();
    }
}
