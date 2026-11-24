package org.lowcoder.api.framework.security;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * {@code corsAllowedDomainString=*}: the shipped default. Every cross-origin answer stays non-credentialed, so a
 * browser on another origin cannot read a credentialed answer (case (a) of the credentials fix).
 */
@SpringBootTest(properties = AbstractCorsCredentialsTest.CORS_DOMAINS_PROPERTY + "=*")
@ActiveProfiles("corsCredentialsWildcardOnly")
class CorsCredentialsWildcardOnlyTest extends AbstractCorsCredentialsTest {

    private static final String UNLISTED_ORIGIN = "https://evil.example";

    @Test
    void anyOriginGetsNoCredentialsOnTheFormerAnyOriginPaths() {
        assertAllowedWithoutCredentials(FORMER_ANY_ORIGIN_PATH, UNLISTED_ORIGIN, FORMER_ANY_ORIGIN_METHOD);
        assertAllowedWithoutCredentials(FORMER_ANY_ORIGIN_PATH_QUERY, UNLISTED_ORIGIN, FORMER_ANY_ORIGIN_QUERY_METHOD);
    }
}
