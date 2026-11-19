package org.lowcoder.domain.datasource.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Locale;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.lowcoder.sdk.util.LocaleUtils;

/**
 * BF-110 (fixed; was pinned as the plan section 9 row "Datasource.getDisplayName(JS_CODE_ID) returns the
 * INTERNAL_SERVER_ERROR text; key JS_CODE_DATASOURCE_NAME in no .properties", task L3-7): the key is now in locale_en,
 * locale_de and locale_zh, so the JS code datasource has a name. {@code LocaleUtils.getMessage} answered the
 * INTERNAL_SERVER_ERROR text.
 */
class DatasourceJsCodeDisplayNamePinTest {

    private static final String INTERNAL_SERVER_ERROR_KEY = "INTERNAL_SERVER_ERROR";

    @ParameterizedTest
    @CsvSource({"en,JS Code", "de,JS-Code", "zh,JS 代码"})
    void theJsCodeDatasourceIsNamedInEveryBundleBF110(String language, String expectedName) {
        Locale locale = Locale.forLanguageTag(language);

        String name = Datasource.getDisplayName(Datasource.JS_CODE_ID, locale);

        System.out.println("[DatasourceJsCodeDisplayNamePinTest] " + locale + " JS code name=[" + name + "]");
        assertThat(name).isEqualTo(expectedName).isNotEqualTo(LocaleUtils.getMessage(locale, INTERNAL_SERVER_ERROR_KEY));
    }
}
