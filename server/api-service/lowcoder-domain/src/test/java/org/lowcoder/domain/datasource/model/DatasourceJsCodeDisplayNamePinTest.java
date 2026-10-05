package org.lowcoder.domain.datasource.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Locale;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.util.LocaleUtils;

/**
 * Pins the plan section 9 row "Datasource.getDisplayName(JS_CODE_ID) returns the INTERNAL_SERVER_ERROR text; key
 * JS_CODE_DATASOURCE_NAME in no .properties" (task L3-7). The key is missing from every messages file, so
 * {@code LocaleUtils.getMessage} falls back to the INTERNAL_SERVER_ERROR text. A fix (adding the key) changes this
 * test on purpose.
 */
class DatasourceJsCodeDisplayNamePinTest {

    private static final String MISSING_KEY = "JS_CODE_DATASOURCE_NAME";
    private static final String INTERNAL_SERVER_ERROR_KEY = "INTERNAL_SERVER_ERROR";

    @Test
    void pinsTheJsCodeDatasourceDisplayNameBeingTheInternalServerErrorText() {
        for (Locale locale : new Locale[] {Locale.ENGLISH, Locale.CHINESE}) {
            String name = Datasource.getDisplayName(Datasource.JS_CODE_ID, locale);
            String internalError = LocaleUtils.getMessage(locale, INTERNAL_SERVER_ERROR_KEY);
            System.out.println("[DatasourceJsCodeDisplayNamePinTest] " + locale + " JS code name=[" + name + "]");
            assertThat(name).isEqualTo(internalError).isNotBlank();
        }
        assertThat(Datasource.getDisplayName(Datasource.JS_CODE_ID, Locale.ENGLISH))
                .isEqualTo("Oops! Service is busy, please try again later.");
        System.out.println("[DatasourceJsCodeDisplayNamePinTest] pinned: key " + MISSING_KEY + " is missing");
    }
}
