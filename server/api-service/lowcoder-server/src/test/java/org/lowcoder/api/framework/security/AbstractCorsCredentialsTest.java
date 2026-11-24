package org.lowcoder.api.framework.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.lowcoder.infra.constant.NewUrl;
import org.lowcoder.infra.constant.Url;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.test.web.reactive.server.WebTestClient;

/**
 * Shared preflight helper and assertions for the {@code SecurityConfig.buildCorsConfigurationSource} credentials
 * cases below: a listed, non-wildcard origin gets credentials everywhere; an unlisted origin gets a 200 without
 * credentials only on a path the configuration used to grant "any origin, with credentials" unconditionally, or on
 * any path at all when the configured domains contain the literal {@code "*"} entry; otherwise it is refused, same
 * as {@link CorsAllowedDomainsPreflightTest}.
 */
abstract class AbstractCorsCredentialsTest {

    static final String CORS_DOMAINS_PROPERTY = "common.security.corsAllowedDomainString";
    /** A {@code GET}-only path the configuration used to grant "any origin, with credentials" unconditionally, before this fix. */
    static final String FORMER_ANY_ORIGIN_PATH = Url.USER_URL + "/me";
    static final HttpMethod FORMER_ANY_ORIGIN_METHOD = HttpMethod.GET;
    /** A {@code POST}-only path, same former-any-origin status as {@link #FORMER_ANY_ORIGIN_PATH}. */
    static final String FORMER_ANY_ORIGIN_PATH_QUERY = Url.QUERY_URL + "/execute";
    static final HttpMethod FORMER_ANY_ORIGIN_QUERY_METHOD = HttpMethod.POST;
    /** {@code POST} of the invitation mail: under the allow-list configuration, mounted under {@code /api} and {@code /api/v1}. */
    private static final String INVITATION_MAIL_PATH = "/email/invite";
    static final HttpMethod ALLOW_LIST_METHOD = HttpMethod.POST;
    /** An endpoint under the allow-list configuration, in the current and the legacy mount. Never a former any-origin path. */
    static final List<String> ALLOW_LIST_PATHS = List.of(NewUrl.INVITATION_URL + INVITATION_MAIL_PATH, Url.INVITATION_URL + INVITATION_MAIL_PATH);
    /** The server the requests go to; CORS compares the request's scheme and host with the origin, so it must be absolute. */
    private static final String SERVER = "http://lowcoder.test";
    private static final String TRUE = "true";
    private static final Duration WAIT = Duration.ofSeconds(30);

    @Autowired
    private ApplicationContext context;

    private WebTestClient web;

    @BeforeEach
    void setUpClient() {
        web = WebTestClient.bindToApplicationContext(context).configureClient().responseTimeout(WAIT).build();
    }

    final EntityExchangeResult<byte[]> preflight(String path, String origin, HttpMethod requestMethod) {
        EntityExchangeResult<byte[]> result = web.options().uri(SERVER + path)
                .header(HttpHeaders.ORIGIN, origin)
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, requestMethod.name())
                .exchange()
                .expectBody().returnResult();
        System.out.println("[" + getClass().getSimpleName() + "] OPTIONS " + path + " (" + requestMethod + ") from " + origin + " -> "
                + result.getStatus() + " allow-origin=" + result.getResponseHeaders().getAccessControlAllowOrigin()
                + " allow-credentials=" + result.getResponseHeaders().getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS));
        return result;
    }

    final void assertAllowedWithCredentials(String path, String origin, HttpMethod requestMethod) {
        EntityExchangeResult<byte[]> result = preflight(path, origin, requestMethod);
        assertThat(result.getStatus()).as(path + " " + origin).isEqualTo(HttpStatus.OK);
        assertThat(result.getResponseHeaders().getAccessControlAllowOrigin()).as(path + " " + origin).isEqualTo(origin);
        assertThat(result.getResponseHeaders().getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS)).as(path + " " + origin).isEqualTo(TRUE);
    }

    final void assertAllowedWithoutCredentials(String path, String origin, HttpMethod requestMethod) {
        EntityExchangeResult<byte[]> result = preflight(path, origin, requestMethod);
        assertThat(result.getStatus()).as(path + " " + origin).isEqualTo(HttpStatus.OK);
        assertThat(result.getResponseHeaders().getAccessControlAllowOrigin()).as(path + " " + origin).isEqualTo(origin);
        assertThat(result.getResponseHeaders().getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS)).as(path + " " + origin).isNull();
    }

    final void assertRefused(String path, String origin, HttpMethod requestMethod) {
        EntityExchangeResult<byte[]> result = preflight(path, origin, requestMethod);
        assertThat(result.getStatus()).as(path + " " + origin).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(result.getResponseHeaders().getAccessControlAllowOrigin()).as(path + " " + origin).isNull();
    }
}
