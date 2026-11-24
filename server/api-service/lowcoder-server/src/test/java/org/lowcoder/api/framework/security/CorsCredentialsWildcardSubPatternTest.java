package org.lowcoder.api.framework.security;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * {@code corsAllowedDomainString=https://*.example.com}: a wildcard SUB-pattern entry (case (c) of the credentials
 * fix), as opposed to the standalone {@code "*"} entry of {@link CorsCredentialsWildcardOnlyTest}. A matching
 * origin counts as listed and gets credentials everywhere, exactly like {@link CorsCredentialsListedOriginTest};
 * a non-matching origin is treated the same as that test's unlisted origin.
 */
@SpringBootTest(properties = AbstractCorsCredentialsTest.CORS_DOMAINS_PROPERTY + "=" + CorsCredentialsWildcardSubPatternTest.PATTERN)
@ActiveProfiles("corsCredentialsWildcardSubPattern")
class CorsCredentialsWildcardSubPatternTest extends AbstractCorsCredentialsTest {

    static final String PATTERN = "https://*.example.com";
    private static final String MATCHING_ORIGIN = "https://sub.example.com";
    private static final String NON_MATCHING_ORIGIN = "https://sub.other.com";

    @Test
    void aMatchingSubdomainGetsCredentialsOnAFormerAnyOriginPathAndOnTheAllowList() {
        assertAllowedWithCredentials(FORMER_ANY_ORIGIN_PATH, MATCHING_ORIGIN, FORMER_ANY_ORIGIN_METHOD);
        for (String path : ALLOW_LIST_PATHS) {
            assertAllowedWithCredentials(path, MATCHING_ORIGIN, ALLOW_LIST_METHOD);
        }
    }

    @Test
    void aNonMatchingOriginGetsNoCredentialsOnTheFormerAnyOriginPathAndIsRefusedOnTheAllowList() {
        assertAllowedWithoutCredentials(FORMER_ANY_ORIGIN_PATH, NON_MATCHING_ORIGIN, FORMER_ANY_ORIGIN_METHOD);
        for (String path : ALLOW_LIST_PATHS) {
            assertRefused(path, NON_MATCHING_ORIGIN, ALLOW_LIST_METHOD);
        }
    }
}
