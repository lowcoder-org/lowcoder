package org.lowcoder.sdk.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.web.cors.CorsConfiguration;

/**
 * BF-142 (plan section 9 row "CORS domains split without trimming: ' b.com' never matches (CommonConfig:112,
 * SecurityConfig:226)"), fixed. The environment variable LOWCODER_CORS_DOMAINS (application.yaml:75, documented in
 * app.json:32 as "If there are multiple domains, please separate them with commas") reaches
 * {@code CommonConfig.Security.corsAllowedDomainString}, which {@code getAllCorsAllowedDomains} splits on ","; SecurityConfig
 * passes the list to {@code CorsConfiguration.setAllowedOriginPatterns}, which does not trim a pattern. Each entry is now
 * trimmed and empty entries are dropped, so "https://a.com, https://b.com" allows both origins.
 */
public class CorsAllowedDomainsTrimTest {

    private static final String A = "https://a.com";
    private static final String B = "https://b.com";
    private static final String C = "https://c.com";

    private static CommonConfig.Security security(String corsAllowedDomainString) {
        CommonConfig.Security security = new CommonConfig.Security();
        security.setCorsAllowedDomainString(corsAllowedDomainString);
        return security;
    }

    private static CorsConfiguration corsFor(String corsAllowedDomainString) {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOriginPatterns(security(corsAllowedDomainString).getAllCorsAllowedDomains());
        return cors;
    }

    /** Catches: the entries not trimmed, so the documented comma-and-blank list refuses every domain but the first. */
    @Test
    public void aCommaFollowedByABlankIsTrimmedAndBothOriginsAreAcceptedBF142() {
        CommonConfig.Security security = security(A + ", " + B);
        CorsConfiguration cors = corsFor(A + ", " + B);

        System.out.println("[CorsAllowedDomainsTrimTest] entries " + security.getAllCorsAllowedDomains().stream().map(e -> "'" + e + "'").toList()
                + ", a.com -> " + cors.checkOrigin(A) + ", b.com -> " + cors.checkOrigin(B));
        assertEquals(List.of(A, B), security.getAllCorsAllowedDomains());
        assertEquals(A, cors.checkOrigin(A));
        assertEquals(B, cors.checkOrigin(B));
        assertNull(cors.checkOrigin(C));
    }

    /**
     * BF-142: blanks around every entry, a padded wildcard and empty entries (a doubled or trailing comma) leave only the
     * domains. Catches: only a leading blank removed, or empty entries kept as patterns.
     */
    @Test
    public void blanksAroundEntriesAndEmptyEntriesAreDroppedBF142() {
        List<String> entries = security("  " + A + " ,, " + B + "\t,").getAllCorsAllowedDomains();
        System.out.println("[CorsAllowedDomainsTrimTest] padded list -> " + entries.stream().map(e -> "'" + e + "'").toList());
        assertEquals(List.of(A, B), entries);

        assertEquals(List.of("*"), security(" * ").getAllCorsAllowedDomains());
        assertNotNull(corsFor(" * ").checkOrigin("https://anything.example"), "a padded wildcard still allows every origin");
    }

    @Test
    public void theSameListWithoutTheBlankAcceptsBothOrigins() {
        CorsConfiguration cors = corsFor(A + "," + B);

        assertEquals(A, cors.checkOrigin(A));
        assertEquals(B, cors.checkOrigin(B));
        assertNull(cors.checkOrigin(C));
        assertNotNull(corsFor("*").checkOrigin("https://anything.example"), "the default of the application yaml allows every origin");
    }
}
