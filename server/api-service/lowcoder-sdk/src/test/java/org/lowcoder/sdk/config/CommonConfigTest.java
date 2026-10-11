package org.lowcoder.sdk.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.constants.WorkspaceMode;

/**
 * {@link CommonConfig}: the human-readable size normalisation behind the three {@code max*Size} settings, the combination
 * of the two CORS settings, and the small derived values.
 */
public class CommonConfigTest {

    @Test
    public void sizesWithAUnitAreNormalisedToNumberLetterAndBAndOtherTextIsKept() {
        Map<String, String> expected = new LinkedHashMap<>();
        expected.put("10m", "10MB");
        expected.put("10M", "10MB");
        expected.put("10 MB", "10MB");
        expected.put("  1.5 g  ", "1.5GB");
        expected.put("2k", "2KB");
        expected.put("3T", "3TB");
        expected.put("5MB", "5MB");
        expected.put("5mb", "5MB");
        expected.put("512", "512");
        expected.put("7 b", "7");
        expected.put("abc", "abc");
        expected.put("10 xb", "10 xb");
        expected.put("-5m", "-5m");
        expected.put("1.m", "1.m");
        expected.put("", "");
        expected.forEach((input, normalized) -> {
            System.out.println("[CommonConfigTest] '" + input + "' -> '" + CommonConfig.normalizeDataUnits(input) + "'");
            assertEquals(normalized, CommonConfig.normalizeDataUnits(input), "'" + input + "'");
        });
    }

    @Test
    public void theThreeSizeSettersNormaliseAndTheDefaultsAreTwentyMegabytes() {
        CommonConfig config = new CommonConfig();
        assertEquals("20MB", config.getMaxUploadSize());
        assertEquals("20MB", config.getMaxQueryRequestSize());
        assertEquals("20MB", config.getMaxQueryResponseSize());
        assertEquals(300, config.getMaxQueryTimeout());

        config.setMaxUploadSize("5m");
        config.setMaxQueryRequestSize("1 g");
        config.setMaxQueryResponseSize("100k");

        assertEquals("5MB", config.getMaxUploadSize());
        assertEquals("1GB", config.getMaxQueryRequestSize());
        assertEquals("100KB", config.getMaxQueryResponseSize());
    }

    @Test
    public void corsDomainsFromTheListAndTheCommaStringAreCombinedListFirst() {
        CommonConfig.Security security = new CommonConfig.Security();
        assertEquals(List.of(), security.getAllCorsAllowedDomains(), "nothing configured");

        security.setCorsAllowedDomainString("a.com,b.com");
        assertEquals(List.of("a.com", "b.com"), security.getAllCorsAllowedDomains());

        security.setCorsAllowedDomains(List.of("x.com"));
        assertEquals(List.of("x.com", "a.com", "b.com"), security.getAllCorsAllowedDomains());

        security.setCorsAllowedDomainString("  ");
        assertEquals(List.of("x.com"), security.getAllCorsAllowedDomains(), "a blank string adds nothing");

        security.setCorsAllowedDomains(List.of());
        security.setCorsAllowedDomainString("*");
        assertEquals(List.of("*"), security.getAllCorsAllowedDomains(), "the default of the application yaml");
    }

    @Test
    public void derivedValuesFollowTheirSettings() {
        CommonConfig config = new CommonConfig();
        assertTrue(config.isSelfHost());
        assertFalse(config.isEnterpriseMode(), "the default workspace mode is saas");
        config.setCloud(true);
        config.getWorkspace().setMode(WorkspaceMode.ENTERPRISE);
        assertFalse(config.isSelfHost());
        assertTrue(config.isEnterpriseMode());

        assertEquals(24L * 3600, config.getCookie().getMaxAgeInSeconds(), "one day by default");
        config.getCookie().setMaxAgeInHours(2);
        assertEquals(7200L, config.getCookie().getMaxAgeInSeconds());

        assertEquals(List.of(), config.getSecurity().getForbiddenEndpoints(), "unset gives an empty list, not null");
        CommonConfig.ApiEndpoint endpoint = new CommonConfig.ApiEndpoint();
        endpoint.setUri("/x");
        config.getSecurity().setForbiddenEndpoints(List.of(endpoint));
        assertEquals(List.of(endpoint), config.getSecurity().getForbiddenEndpoints());
    }
}
