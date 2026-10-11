package org.lowcoder.sdk.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.web.cors.CorsConfiguration;

/**
 * DEFECT pinned (plan section 9 row "CORS domains split without trimming: ' b.com' never matches (CommonConfig:112,
 * SecurityConfig:226)"; D-6, fix deferred). The environment variable LOWCODER_CORS_DOMAINS (application.yaml:75, documented in
 * app.json:32 as "If there are multiple domains, please separate them with commas") reaches
 * {@code CommonConfig.Security.corsAllowedDomainString}, which {@code getAllCorsAllowedDomains} splits on "," without
 * trimming (CommonConfig.java:112). "https://a.com, https://b.com" therefore yields the entry {@code " https://b.com"}, and
 * SecurityConfig.java:226 passes the list to {@code CorsConfiguration.setAllowedOriginPatterns}, which then rejects the origin
 * https://b.com. A fix that trims each entry turns the rejection assertions red.
 */
public class CorsAllowedDomainsTrimTest {

    private static CorsConfiguration corsFor(String corsAllowedDomainString) {
        CommonConfig.Security security = new CommonConfig.Security();
        security.setCorsAllowedDomainString(corsAllowedDomainString);
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOriginPatterns(security.getAllCorsAllowedDomains());
        return cors;
    }

    @Test
    public void aCommaFollowedByABlankKeepsTheBlankInTheEntryAndTheOriginIsRejected() {
        CommonConfig.Security security = new CommonConfig.Security();
        security.setCorsAllowedDomainString("https://a.com, https://b.com");
        CorsConfiguration cors = corsFor("https://a.com, https://b.com");

        System.out.println("[CorsAllowedDomainsTrimTest] entries " + security.getAllCorsAllowedDomains().stream().map(e -> "'" + e + "'").toList()
                + ", a.com -> " + cors.checkOrigin("https://a.com") + ", b.com -> " + cors.checkOrigin("https://b.com"));
        assertEquals(List.of("https://a.com", " https://b.com"), security.getAllCorsAllowedDomains());
        assertEquals("https://a.com", cors.checkOrigin("https://a.com"));
        assertNull(cors.checkOrigin("https://b.com"), "the second domain of the documented comma list never matches");
    }

    @Test
    public void theSameListWithoutTheBlankAcceptsBothOrigins() {
        CorsConfiguration cors = corsFor("https://a.com,https://b.com");

        assertEquals("https://a.com", cors.checkOrigin("https://a.com"));
        assertEquals("https://b.com", cors.checkOrigin("https://b.com"));
        assertNull(cors.checkOrigin("https://c.com"));
        assertNotNull(corsFor("*").checkOrigin("https://anything.example"), "the default of the application yaml allows every origin");
    }
}
