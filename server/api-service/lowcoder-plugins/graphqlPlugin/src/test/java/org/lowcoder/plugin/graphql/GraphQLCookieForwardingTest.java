package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.plugin.graphql.GraphQLCallSupport.SESSION_COOKIE;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.springframework.http.HttpCookie;
import org.springframework.util.MultiValueMap;

/**
 * Cookie forwarding of {@link GraphQLExecutor}: which of the visitor's request cookies reach the GraphQL endpoint. The
 * Lowcoder session cookie must never be one of them. Each test reads the {@code Cookie} header the local server recorded.
 */
class GraphQLCookieForwardingTest {

    private static final String PATH = "/graphql";
    private static final String SESSION_VALUE = "session-secret";

    private final GraphQLCallSupport support = new GraphQLCallSupport();
    private RecordingHttpServer server;

    @BeforeEach
    void startServer() {
        server = RecordingHttpServer.start(Map.of(PATH, GraphQLCallSupport.json(200, "{}")));
    }

    @AfterEach
    void stopServer() {
        server.close();
    }

    private String cookieHeaderSentFor(GraphQLDatasourceConfig.GraphQLDatasourceConfigBuilder datasource, MultiValueMap<String, HttpCookie> cookies) {
        support.run(datasource.url(server.baseUrl() + PATH).build(), GraphQLCallSupport.query(), GraphQLCallSupport.visitor(cookies, null));
        List<RecordingHttpServer.Request> requests = GraphQLCallSupport.requestsTo(server, PATH);
        assertThat(requests).hasSize(1);
        String cookie = String.join("; ", requests.get(0).header("Cookie"));
        System.out.println("[GraphQLCookieForwardingTest] Cookie header sent: '" + cookie + "'");
        return cookie;
    }

    @Test
    void forwardAllCookiesSendsEveryCookieExceptTheLowcoderSessionCookie() {
        String cookie = cookieHeaderSentFor(GraphQLDatasourceConfig.builder().forwardAllCookies(true),
                GraphQLCallSupport.cookies(SESSION_COOKIE, SESSION_VALUE, "a", "1", "a", "2", "b", "3"));

        assertThat(cookie).contains("a=1", "a=2", "b=3").doesNotContain(SESSION_VALUE).doesNotContain(SESSION_COOKIE);
    }

    @Test
    void theAllowListForwardsOnlyTheListedCookiesAndNeverTheSessionCookieEvenWhenListed() {
        String cookie = cookieHeaderSentFor(GraphQLDatasourceConfig.builder().forwardCookies(Set.of("a", SESSION_COOKIE)),
                GraphQLCallSupport.cookies(SESSION_COOKIE, SESSION_VALUE, "a", "1", "b", "3"));

        assertThat(cookie).contains("a=1").doesNotContain("b=3").doesNotContain(SESSION_VALUE);
    }

    @Test
    void withoutRequestCookiesNoCookieHeaderIsSent() {
        String cookie = cookieHeaderSentFor(GraphQLDatasourceConfig.builder().forwardAllCookies(true).forwardCookies(Set.of("a")), null);

        assertThat(cookie).isEmpty();
    }

    @Test
    void withAnEmptyAllowListAndForwardAllOffNoCookieIsSent() {
        String cookie = cookieHeaderSentFor(GraphQLDatasourceConfig.builder().forwardCookies(Set.of()),
                GraphQLCallSupport.cookies(SESSION_COOKIE, SESSION_VALUE, "a", "1"));

        assertThat(cookie).isEmpty();
    }
}
