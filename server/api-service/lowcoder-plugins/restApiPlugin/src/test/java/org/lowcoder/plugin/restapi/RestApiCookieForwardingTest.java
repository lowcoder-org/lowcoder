package org.lowcoder.plugin.restapi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.plugin.restapi.RestApiCallSupport.SESSION_COOKIE;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.contract.RecordingHttpServer;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.springframework.util.MultiValueMap;
import org.springframework.http.HttpCookie;

/**
 * Cookie forwarding of {@link RestApiExecutor}: which of the visitor's request cookies reach the third-party API. The
 * Lowcoder session cookie must never be one of them. Each test reads the {@code Cookie} header the local server
 * recorded.
 */
class RestApiCookieForwardingTest {

    private static final String PATH = "/echo";
    private static final String SESSION_VALUE = "session-secret";
    /** NEW-18 (T156b-2): a session cookie name that selects no cookie to exclude. */
    private static final String BLANK_SESSION_COOKIE_NAME = " ";

    private final RestApiCallSupport support = new RestApiCallSupport();
    private RecordingHttpServer server;

    @BeforeEach
    void startServer() {
        server = RecordingHttpServer.start(Map.of(PATH, RestApiCallSupport.json(200, "{}")));
    }

    @AfterEach
    void stopServer() {
        server.close();
    }

    /** The values of the Cookie header(s) the server recorded for one call made with {@code callSupport}; none: empty. */
    private List<String> cookieValuesSentFor(RestApiCallSupport callSupport, RestApiDatasourceConfig.RestApiDatasourceConfigBuilder datasource,
            MultiValueMap<String, HttpCookie> cookies) {
        callSupport.run(datasource.url(server.baseUrl() + PATH).build(), Map.of("httpMethod", "GET"), RestApiCallSupport.visitor(cookies, null));
        List<RecordingHttpServer.Request> requests = RestApiCallSupport.requestsTo(server, PATH);
        assertThat(requests).hasSize(1);
        return requests.get(0).header("Cookie");
    }

    private String cookieHeaderSentFor(RestApiDatasourceConfig.RestApiDatasourceConfigBuilder datasource, MultiValueMap<String, HttpCookie> cookies) {
        String cookie = String.join("; ", cookieValuesSentFor(support, datasource, cookies));
        System.out.println("[RestApiCookieForwardingTest] Cookie header sent: '" + cookie + "'");
        return cookie;
    }

    @Test
    void forwardAllCookiesSendsEveryCookieExceptTheLowcoderSessionCookie() {
        String cookie = cookieHeaderSentFor(RestApiDatasourceConfig.builder().forwardAllCookies(true),
                RestApiCallSupport.cookies(SESSION_COOKIE, SESSION_VALUE, "a", "1", "a", "2", "b", "3"));

        assertThat(cookie).contains("a=1", "a=2", "b=3").doesNotContain(SESSION_VALUE).doesNotContain(SESSION_COOKIE);
    }

    @Test
    void theAllowListForwardsOnlyTheListedCookiesAndNeverTheSessionCookieEvenWhenListed() {
        String cookie = cookieHeaderSentFor(RestApiDatasourceConfig.builder().forwardCookies(Set.of("a", SESSION_COOKIE)),
                RestApiCallSupport.cookies(SESSION_COOKIE, SESSION_VALUE, "a", "1", "b", "3"));

        assertThat(cookie).contains("a=1").doesNotContain("b=3").doesNotContain(SESSION_VALUE);
    }

    @Test
    void withoutRequestCookiesNoCookieHeaderIsSent() {
        String cookie = cookieHeaderSentFor(RestApiDatasourceConfig.builder().forwardAllCookies(true).forwardCookies(Set.of("a")), null);

        assertThat(cookie).isEmpty();
    }

    @Test
    void withAnEmptyAllowListAndForwardAllOffNoCookieIsSent() {
        String cookie = cookieHeaderSentFor(RestApiDatasourceConfig.builder().forwardCookies(Set.of()),
                RestApiCallSupport.cookies(SESSION_COOKIE, SESSION_VALUE, "a", "1"));

        assertThat(cookie).isEmpty();
    }

    /**
     * NEW-18 (T156b-2): with a blank session cookie name the cookie to exclude is unknown, so nothing is forwarded, not even
     * under forward-all (the executor used to forward every cookie then, the session cookie included). Catches that.
     */
    @Test
    void aBlankSessionCookieNameSendsNoCookieHeaderEvenWithForwardAllNEW18() {
        List<String> values = cookieValuesSentFor(new RestApiCallSupport(BLANK_SESSION_COOKIE_NAME),
                RestApiDatasourceConfig.builder().forwardAllCookies(true),
                RestApiCallSupport.cookies(SESSION_COOKIE, SESSION_VALUE, "a", "1"));

        System.out.println("[RestApiCookieForwardingTest] blank session cookie name: Cookie header values sent " + values.size());
        assertThat(values).as("no Cookie header").isEmpty();
    }
}
