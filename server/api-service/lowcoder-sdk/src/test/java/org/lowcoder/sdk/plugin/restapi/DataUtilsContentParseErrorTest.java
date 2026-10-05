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
 * DEFECT pinned (plan section 9 row "CONTENT_PARSE_ERROR is unformattable"; D-6, fix deferred). The text of
 * {@code CONTENT_PARSE_ERROR} (locale_en.properties:183 and locale_zh.properties:183) contains
 * {@code {data:base64 string, name:string}}, which {@code MessageFormat} reads as a format element. Building any
 * {@link PluginException} with that key therefore throws an {@link IllegalArgumentException} from the constructor
 * ({@code LocaleUtils.getMessage}), so the three sites that mean to report a bad upload value (DataUtils.java:193 and
 * DataUtils.java:196, called from RestApiExecutor.java:190) throw the IAE instead. Escaping the braces in the two bundle
 * lines turns every assertion here red.
 */
public class DataUtilsContentParseErrorTest {

    private static final String IAE_TEXT = "can't parse argument number: data:base64 string";

    private static IllegalArgumentException convert(String value) {
        return assertThrows(IllegalArgumentException.class, () -> DataUtils.convertToMultiformFileValue(value, Map.of()), value);
    }

    @Test
    public void everyPathThatBuildsTheContentParseErrorThrowsAnIllegalArgumentExceptionPinsTheSection9Row() {
        // DataUtils.java:196: valid JSON that is neither an object nor an array
        IllegalArgumentException scalar = convert("5");
        // DataUtils.java:193: a NullPointerException inside the try (no data key / no name key) and a parse failure are wrapped
        IllegalArgumentException noData = convert("{\"name\":\"a.txt\"}");
        IllegalArgumentException noName = convert("{\"data\":\"QQ==\"}");
        IllegalArgumentException notJson = convert("{");

        for (IllegalArgumentException failure : new IllegalArgumentException[] {scalar, noData, noName, notJson}) {
            System.out.println("[DataUtilsContentParseErrorTest] " + failure.getMessage());
            assertEquals(IAE_TEXT, failure.getMessage());
        }
    }

    @Test
    public void theMessageCannotBeBuiltInAnyLocalePinsTheSection9Row() {
        IllegalArgumentException constructor = assertThrows(IllegalArgumentException.class,
                () -> new PluginException(PluginCommonError.DATASOURCE_ARGUMENT_ERROR, "CONTENT_PARSE_ERROR"));
        IllegalArgumentException english = assertThrows(IllegalArgumentException.class, () -> LocaleUtils.getMessage(Locale.ENGLISH, "CONTENT_PARSE_ERROR"));
        IllegalArgumentException chinese = assertThrows(IllegalArgumentException.class, () -> LocaleUtils.getMessage(Locale.CHINESE, "CONTENT_PARSE_ERROR"));

        assertEquals(IAE_TEXT, constructor.getMessage());
        assertEquals(IAE_TEXT, english.getMessage());
        assertEquals(IAE_TEXT, chinese.getMessage());
    }
}
