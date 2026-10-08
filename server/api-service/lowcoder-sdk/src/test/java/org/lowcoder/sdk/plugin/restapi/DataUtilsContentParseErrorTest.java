package org.lowcoder.sdk.plugin.restapi;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Locale;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.util.LocaleUtils;

/**
 * BF-116 (fixed; was pinned as plan section 9 row "CONTENT_PARSE_ERROR is unformattable", D-6): the text of
 * {@code CONTENT_PARSE_ERROR} (locale_en.properties:184 and locale_zh.properties:184) quotes its braces
 * ({@code '{'data:base64 string, name:string'}'}), so {@code MessageFormat} reads them as text and the three sites that
 * report a bad upload value (DataUtils.java:193 and DataUtils.java:196, called from RestApiExecutor.java:207) throw the
 * coded {@link PluginException} with the upload-format hint. The braces were unquoted, so building the message threw an
 * IllegalArgumentException ("can't parse argument number: data:base64 string") instead.
 */
public class DataUtilsContentParseErrorTest {

    private static final String KEY = "CONTENT_PARSE_ERROR";
    private static final String HINT_EN = "Resolve upload data failed, it requires format {data:base64 string, name:string} or an array of it";
    private static final String HINT_ZH = "解决上传数据失败，需要格式{data:base64 string, name:string}或其数组";

    private static PluginException convert(String value) {
        return assertThrows(PluginException.class, () -> DataUtils.convertToMultiformFileValue(value, Map.of()), value);
    }

    @Test
    public void everyPathThatBuildsTheContentParseErrorThrowsTheCodedUploadHintBF116() {
        // DataUtils.java:196: valid JSON that is neither an object nor an array
        PluginException scalar = convert("5");
        // DataUtils.java:193: a NullPointerException inside the try (no data key / no name key) and a parse failure are wrapped
        PluginException noData = convert("{\"name\":\"a.txt\"}");
        PluginException noName = convert("{\"data\":\"QQ==\"}");
        PluginException notJson = convert("{");

        for (PluginException failure : new PluginException[] {scalar, noData, noName, notJson}) {
            System.out.println("[DataUtilsContentParseErrorTest] " + failure.getError() + " / " + failure.getMessageKey() + " / " + failure.getMessage());
            assertEquals(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, failure.getError());
            assertEquals(KEY, failure.getMessageKey());
            assertEquals(HINT_EN, failure.getMessage());
        }
    }

    @Test
    public void theMessageIsBuiltInEnglishAndChineseBF116() {
        PluginException constructor = new PluginException(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, KEY);

        assertEquals(HINT_EN, constructor.getMessage());
        assertEquals(HINT_EN, LocaleUtils.getMessage(Locale.ENGLISH, KEY));
        assertEquals(HINT_ZH, LocaleUtils.getMessage(Locale.CHINESE, KEY));
        assertEquals(HINT_ZH, constructor.getLocaleMessage(Locale.CHINESE));
    }
}
