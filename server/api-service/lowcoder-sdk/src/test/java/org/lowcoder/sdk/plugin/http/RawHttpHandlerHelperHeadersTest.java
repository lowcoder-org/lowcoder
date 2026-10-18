package org.lowcoder.sdk.plugin.http;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.ResourceLock;
import org.junit.jupiter.api.parallel.Resources;
import org.lowcoder.sdk.models.Property;

/**
 * {@link RawHttpHandlerHelper#buildHeaders}: the header names are trimmed and lower-cased, a blank name or value is
 * dropped and the last value of a name wins. No production class of this repository calls the helper (sdk API for
 * plugins, as {@code RawHttpBodyContractTest} notes), so it is called directly.
 */
class RawHttpHandlerHelperHeadersTest {

    /** A default locale whose case mapping of {@code i} and {@code I} differs from {@code Locale.ROOT}'s (NEW-40). */
    private static final Locale TURKISH = Locale.forLanguageTag("tr-TR");
    private static final String UPPER_CASE_NAME = " X-API-KEY ";
    private static final String LOWER_CASE_NAME = "x-api-key";
    private static final String FIRST_VALUE = "k-1";
    private static final String LAST_VALUE = "k-2";
    private static final String BLANK = " ";
    private static final String OTHER_NAME = "Other";

    /**
     * NEW-40: under a Turkish default locale the names are lower-cased with {@code Locale.ROOT}'s rule too; the default
     * locale's rule made {@code X-API-KEY} {@code x-apı-key}, a header of another name. The case holds JUnit's
     * {@code Resources.LOCALE} lock while it changes the default locale; the lock orders it only against tests that
     * hold the same lock, and it restores the locale after its calls, which block, have completed.
     */
    @Test
    @ResourceLock(Resources.LOCALE)
    void headerNamesAreLowerCasedWithTheRootLocaleRuleUnderATurkishDefaultLocaleNEW40() {
        List<Property> headers = List.of(new Property(UPPER_CASE_NAME, FIRST_VALUE), new Property(LOWER_CASE_NAME, LAST_VALUE),
                new Property(BLANK, FIRST_VALUE), new Property(OTHER_NAME, BLANK));
        Locale previous = Locale.getDefault();
        Locale.setDefault(TURKISH);
        try {
            Map<String, String> built = RawHttpHandlerHelper.buildHeaders(headers);
            System.out.println("[RawHttpHandlerHelperHeadersTest] under " + Locale.getDefault() + ": " + built);
            assertThat(built).containsExactly(Map.entry(LOWER_CASE_NAME, LAST_VALUE));
        } finally {
            Locale.setDefault(previous);
        }
    }
}
