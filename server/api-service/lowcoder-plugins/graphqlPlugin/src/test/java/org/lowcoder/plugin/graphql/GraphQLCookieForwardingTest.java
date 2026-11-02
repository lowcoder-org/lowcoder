package org.lowcoder.plugin.graphql;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.plugin.graphql.GraphQLCallSupport.SESSION_COOKIE;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
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
    /** NEW-100 (T156b-3): a session cookie name that selects no cookie to exclude. */
    private static final String BLANK_SESSION_COOKIE_NAME = " ";

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

    /** The values of the Cookie header(s) the server recorded for one call made with {@code callSupport}; none: empty. */
    private List<String> cookieValuesSentFor(GraphQLCallSupport callSupport, GraphQLDatasourceConfig.GraphQLDatasourceConfigBuilder datasource,
            MultiValueMap<String, HttpCookie> cookies) {
        callSupport.run(datasource.url(server.baseUrl() + PATH).build(), GraphQLCallSupport.query(), GraphQLCallSupport.visitor(cookies, null));
        List<RecordingHttpServer.Request> requests = GraphQLCallSupport.requestsTo(server, PATH);
        assertThat(requests).hasSize(1);
        return requests.get(0).header("Cookie");
    }

    private String cookieHeaderSentFor(GraphQLDatasourceConfig.GraphQLDatasourceConfigBuilder datasource, MultiValueMap<String, HttpCookie> cookies) {
        String cookie = String.join("; ", cookieValuesSentFor(support, datasource, cookies));
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

    private static Stream<Arguments> blankOrNullSessionCookieNameAndSelection() {
        return Stream.of(
                Arguments.of(BLANK_SESSION_COOKIE_NAME, "forward-all", GraphQLDatasourceConfig.builder().forwardAllCookies(true)),
                Arguments.of(null, "forward-all", GraphQLDatasourceConfig.builder().forwardAllCookies(true)),
                Arguments.of(BLANK_SESSION_COOKIE_NAME, "allow-list", GraphQLDatasourceConfig.builder().forwardCookies(Set.of("a"))),
                Arguments.of(null, "allow-list", GraphQLDatasourceConfig.builder().forwardCookies(Set.of("a"))));
    }

    /**
     * NEW-100 (T156b-3): with a blank or null session cookie name the cookie to exclude is unknown, so nothing is forwarded,
     * under forward-all or an allow-list alike (the executor used to forward every cookie under forward-all, the session cookie
     * included, and every listed cookie under an allow-list). Catches that. Prints the number of Cookie values, never a value.
     */
    @ParameterizedTest(name = "session cookie name [{0}], {1}")
    @MethodSource("blankOrNullSessionCookieNameAndSelection")
    void aBlankOrNullSessionCookieNameSendsNoCookieHeaderNEW100(String sessionCookieName, String selection,
            GraphQLDatasourceConfig.GraphQLDatasourceConfigBuilder datasource) {
        List<String> values = cookieValuesSentFor(new GraphQLCallSupport(sessionCookieName), datasource,
                GraphQLCallSupport.cookies(SESSION_COOKIE, SESSION_VALUE, "a", "1"));

        System.out.println("[GraphQLCookieForwardingTest] session cookie name [" + sessionCookieName + "], " + selection
                + ": Cookie header values sent " + values.size());
        assertThat(values).as("no Cookie header").isEmpty();
    }
}
