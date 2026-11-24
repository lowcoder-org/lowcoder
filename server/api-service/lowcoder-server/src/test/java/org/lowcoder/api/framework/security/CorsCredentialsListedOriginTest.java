package org.lowcoder.api.framework.security;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * {@code corsAllowedDomainString=https://a.example}: a single listed, non-wildcard origin (case (b) of the
 * credentials fix). It gets credentials everywhere; an unlisted origin gets no credentials on a former any-origin
 * path and is refused outright on a path that was never one.
 */
@SpringBootTest(properties = AbstractCorsCredentialsTest.CORS_DOMAINS_PROPERTY + "=" + CorsCredentialsListedOriginTest.LISTED_ORIGIN)
@ActiveProfiles("corsCredentialsListedOrigin")
class CorsCredentialsListedOriginTest extends AbstractCorsCredentialsTest {

    static final String LISTED_ORIGIN = "https://a.example";
    private static final String UNLISTED_ORIGIN = "https://c.example";

    @Test
    void theListedOriginGetsCredentialsOnAFormerAnyOriginPathAndOnTheAllowList() {
        assertAllowedWithCredentials(FORMER_ANY_ORIGIN_PATH, LISTED_ORIGIN, FORMER_ANY_ORIGIN_METHOD);
        for (String path : ALLOW_LIST_PATHS) {
            assertAllowedWithCredentials(path, LISTED_ORIGIN, ALLOW_LIST_METHOD);
        }
    }

    @Test
    void anUnlistedOriginGetsNoCredentialsOnTheFormerAnyOriginPathAndIsRefusedOnTheAllowList() {
        assertAllowedWithoutCredentials(FORMER_ANY_ORIGIN_PATH, UNLISTED_ORIGIN, FORMER_ANY_ORIGIN_METHOD);
        for (String path : ALLOW_LIST_PATHS) {
            assertRefused(path, UNLISTED_ORIGIN, ALLOW_LIST_METHOD);
        }
    }
}
