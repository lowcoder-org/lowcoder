package org.lowcoder.plugin.graphql;

import static java.util.Collections.emptyMap;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.lowcoder.plugin.graphql.model.GraphQLQueryExecutionContext;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.contract.RecordingHttpServer.Response;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.lowcoder.sdk.query.QueryVisitorContext;
import org.springframework.http.HttpCookie;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

/**
 * What the GraphQL executor tests of L4-10 share (the counterpart of the REST API plugin's RestApiCallSupport): an
 * executor whose {@code CommonConfig} names the Lowcoder session cookie, a visitor context with cookies and an OAuth
 * token Mono, and one call that builds the execution context and runs it against a {@link RecordingHttpServer}. New
 * file; the existing contract tests keep their own setup.
 */
final class GraphQLCallSupport {

    static final String SESSION_COOKIE = "LOWCODER_SESSION";
    static final Duration TIMEOUT = Duration.ofSeconds(20);
    static final String QUERY = "query { hero { name } }";

    private final GraphQLExecutor executor;

    GraphQLCallSupport() {
        CommonConfig config = new CommonConfig();
        config.setCookieName(SESSION_COOKIE);
        executor = new GraphQLExecutor(config);
    }

    static QueryVisitorContext visitor(MultiValueMap<String, HttpCookie> cookies, Mono<List<Property>> authToken) {
        return new QueryVisitorContext("visitor-1", "org-1", 8080, cookies, authToken, Set.of());
    }

    static MultiValueMap<String, HttpCookie> cookies(String... nameValuePairs) {
        MultiValueMap<String, HttpCookie> cookies = new LinkedMultiValueMap<>();
        for (int i = 0; i < nameValuePairs.length; i += 2) {
            cookies.add(nameValuePairs[i], new HttpCookie(nameValuePairs[i], nameValuePairs[i + 1]));
        }
        return cookies;
    }

    /**
     * The query map of a GraphQL query: the query text in {@code body} and an empty {@code variables} list. The key is
     * always given: a query config without {@code variables} fails with a NullPointerException (probe GP4, L4-10).
     */
    static Map<String, Object> query() {
        return Map.of("body", QUERY, "variables", List.of());
    }

    /** {@link #query()} plus the given entries (keys of the query config: path, headers, params, bodyFormData, variables, body). */
    static Map<String, Object> query(Map<String, Object> extra) {
        Map<String, Object> merged = new java.util.HashMap<>(query());
        merged.putAll(extra);
        return merged;
    }

    GraphQLQueryExecutionContext buildContext(GraphQLDatasourceConfig datasource, Map<String, Object> query, Map<String, Object> params,
            QueryVisitorContext visitor) {
        return executor.buildQueryExecutionContext(datasource, query, params, visitor);
    }

    GraphQLQueryExecutionContext buildContext(GraphQLDatasourceConfig datasource, Map<String, Object> query, QueryVisitorContext visitor) {
        return buildContext(datasource, query, emptyMap(), visitor);
    }

    /** Builds the context and runs it; an exception of the call is thrown by {@code block}. */
    QueryExecutionResult run(GraphQLDatasourceConfig datasource, Map<String, Object> query, QueryVisitorContext visitor) {
        return executor.executeQuery(null, buildContext(datasource, query, visitor)).block(TIMEOUT);
    }

    /** The exception of a call that must throw (null if it did not). */
    Throwable failureOf(GraphQLDatasourceConfig datasource, Map<String, Object> query, QueryVisitorContext visitor) {
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

    static List<RecordingHttpServer.Request> requestsTo(RecordingHttpServer server, String path) {
        return server.requests().stream().filter(request -> request.pathAndQuery().split("\\?")[0].equals(path)).toList();
    }
}
