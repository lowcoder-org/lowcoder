package org.lowcoder.api.framework.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.test.web.reactive.server.WebTestClient;

/**
 * BF-142 through the production request stack: the CORS configuration that {@code SecurityConfig} builds from
 * {@code LOWCODER_CORS_DOMAINS} (here the property {@code common.security.corsAllowedDomainString}), written with a blank
 * after the comma as app.json documents it. A preflight from either listed origin is allowed, with credentials, on an
 * endpoint of the allow-list configuration ({@code /**}) under both {@code /api} and {@code /api/v1}; another origin is
 * refused with 403 and no allow header. Before the fix the second origin was refused.
 *
 * <p>Limits: preflights only (an actual cross-origin request gets the same origin check from the same configuration); the
 * endpoints that allow every origin ({@code SecurityConfig.buildCorsConfigurationSource}) are not exercised.
 * Isolation: its own profile ({@code corsAllowedDomains}), so its own context and database.
 */
@SpringBootTest(properties = CorsAllowedDomainsPreflightTest.CORS_DOMAINS_PROPERTY + "=" + CorsAllowedDomainsPreflightTest.CORS_DOMAINS)
@ActiveProfiles("corsAllowedDomains")
class CorsAllowedDomainsPreflightTest {

    static final String CORS_DOMAINS_PROPERTY = "common.security.corsAllowedDomainString";
    static final String FIRST_ORIGIN = "https://a.example";
    static final String SECOND_ORIGIN = "https://b.example";
    static final String OTHER_ORIGIN = "https://c.example";
    /** The documented comma list, with a blank after the comma. */
    static final String CORS_DOMAINS = FIRST_ORIGIN + ", " + SECOND_ORIGIN;
    /** {@code POST} of the invitation mail: under the allow-list configuration, mounted under {@code /api} and {@code /api/v1}. */
    static final String INVITATION_MAIL_PATH = "/email/invite";
    /** An endpoint under the allow-list configuration, in the current and the legacy mount. */
    static final List<String> ALLOW_LIST_PATHS = List.of(NewUrl.INVITATION_URL + INVITATION_MAIL_PATH, Url.INVITATION_URL + INVITATION_MAIL_PATH);
    /** The server the requests go to; CORS compares the request's scheme and host with the origin, so it must be absolute. */
    private static final String SERVER = "http://lowcoder.test";
    private static final String TRUE = "true";
    private static final Duration WAIT = Duration.ofSeconds(30);

    @Autowired
    private ApplicationContext context;

    private WebTestClient web;

    @BeforeEach
    void setUp() {
        web = WebTestClient.bindToApplicationContext(context).configureClient().responseTimeout(WAIT).build();
    }

    private EntityExchangeResult<byte[]> preflight(String path, String origin) {
        EntityExchangeResult<byte[]> result = web.options().uri(SERVER + path)
                .header(HttpHeaders.ORIGIN, origin)
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, HttpMethod.POST.name())
                .exchange()
                .expectBody().returnResult();
        System.out.println("[CorsAllowedDomainsPreflightTest] OPTIONS " + path + " from " + origin + " -> " + result.getStatus()
                + " allow-origin=" + result.getResponseHeaders().getAccessControlAllowOrigin());
        return result;
    }

    /** Catches: the second domain of the list keeping its blank and never matching, on either mount. */
    @Test
    void bothOriginsOfACommaAndBlankListAreAllowedBF142() {
        for (String path : ALLOW_LIST_PATHS) {
            for (String origin : List.of(FIRST_ORIGIN, SECOND_ORIGIN)) {
                EntityExchangeResult<byte[]> result = preflight(path, origin);
                assertThat(result.getStatus()).as(path + " " + origin).isEqualTo(HttpStatus.OK);
                assertThat(result.getResponseHeaders().getAccessControlAllowOrigin()).as(path + " " + origin).isEqualTo(origin);
                assertThat(result.getResponseHeaders().getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS)).as(path + " " + origin).isEqualTo(TRUE);
            }
        }
    }

    /** Catches: the trimming turning the list into a wildcard or otherwise letting an unlisted origin in. */
    @Test
    void anUnlistedOriginIsRefusedBF142() {
        for (String path : ALLOW_LIST_PATHS) {
            EntityExchangeResult<byte[]> result = preflight(path, OTHER_ORIGIN);
            assertThat(result.getStatus()).as(path).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(result.getResponseHeaders().getAccessControlAllowOrigin()).as(path).isNull();
        }
    }
}
