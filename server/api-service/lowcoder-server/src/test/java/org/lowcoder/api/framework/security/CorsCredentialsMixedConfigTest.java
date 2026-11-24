package org.lowcoder.api.framework.security;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * {@code corsAllowedDomainString=*,https://a.example}: the critical case, proving the two branches (credentialed
 * listed origin vs. any-origin-no-credentials) compose correctly in ONE configuration, not just in isolation. The
 * listed origin gets credentials everywhere, exactly as in {@link CorsCredentialsListedOriginTest}; an unlisted
 * origin gets a 200 without credentials EVERYWHERE too (the literal {@code "*"} entry covers every path when
 * present, not only the former any-origin paths) — not a 403, unlike that same test's unlisted origin, because the
 * {@code "*"} entry is present in this mixed configuration.
 */
@SpringBootTest(properties = AbstractCorsCredentialsTest.CORS_DOMAINS_PROPERTY + "=" + CorsCredentialsMixedConfigTest.MIXED_DOMAINS)
@ActiveProfiles("corsCredentialsMixedConfig")
class CorsCredentialsMixedConfigTest extends AbstractCorsCredentialsTest {

    static final String LISTED_ORIGIN = "https://a.example";
    static final String MIXED_DOMAINS = "*," + LISTED_ORIGIN;
    private static final String UNLISTED_ORIGIN = "https://evil.example";

    @Test
    void theListedOriginGetsCredentialsEverywhereEvenWithTheWildcardAlsoConfigured() {
        assertAllowedWithCredentials(FORMER_ANY_ORIGIN_PATH, LISTED_ORIGIN, FORMER_ANY_ORIGIN_METHOD);
        for (String path : ALLOW_LIST_PATHS) {
            assertAllowedWithCredentials(path, LISTED_ORIGIN, ALLOW_LIST_METHOD);
        }
    }

    @Test
    void anUnlistedOriginGetsNoCredentialsEverywhereButIsNotRefusedBecauseOfTheWildcard() {
        assertAllowedWithoutCredentials(FORMER_ANY_ORIGIN_PATH, UNLISTED_ORIGIN, FORMER_ANY_ORIGIN_METHOD);
        for (String path : ALLOW_LIST_PATHS) {
            assertAllowedWithoutCredentials(path, UNLISTED_ORIGIN, ALLOW_LIST_METHOD);
        }
    }
}
