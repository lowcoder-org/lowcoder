package org.lowcoder.sdk.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.constants.GlobalContext;
import org.lowcoder.sdk.models.LocaleMessage;
import reactor.util.context.ContextView;

import java.text.MessageFormat;
import java.util.Locale;
import java.util.ResourceBundle;

@Slf4j
public final class LocaleUtils {
    private static final String BUNDLE_BASE_NAME = "locale";
    private static final String ENTERPRISE_BUNDLE_BASE_NAME = "locale_ee";
    private static final String INTERNAL_SERVER_ERROR_KEY = "INTERNAL_SERVER_ERROR";

    private LocaleUtils() {
    }

    public static String getMessage(Locale locale, LocaleMessage localeMessage) {
        return getMessage(locale, localeMessage.messageKey(), localeMessage.args());
    }

    /**
     * The text of {@code key} for {@code locale}, formatted with {@code args}: from the enterprise bundle {@code locale_ee}
     * when the one selected for the locale is of the locale's language and has the key, else from the bundle
     * {@code locale} selected for the locale. A key that bundle lacks is logged as an error, as before, and is now formatted
     * from {@code locale_en}, the bundle of {@link #getDefaultLocale()} (NEW-35: {@code locale_de} has fewer keys than
     * {@code locale_en}, and a German request for any other key got the German INTERNAL_SERVER_ERROR text); a key
     * {@code locale_en} lacks too gives the INTERNAL_SERVER_ERROR text of the bundle selected for the locale, as before.
     * <p>
     * Limits: the English text is used only when the enterprise block returned no text and the selected {@code locale}
     * bundle lacks the key; it is read from {@code locale_en} only, not from an English enterprise bundle (the repository
     * has none; not tested); a text the selected bundle has is never replaced, however incomplete that bundle is; the missing
     * key is logged also when English supplies the text; the key is trimmed for the lookup and must not be null (a
     * NullPointerException, as before); texts stored earlier with the busy text are not changed.
     */
    public static String getMessage(Locale locale, String key, Object... args) {

        try {
            ResourceBundle eeBundle = ResourceBundle.getBundle(ENTERPRISE_BUNDLE_BASE_NAME, locale);
            if (StringUtils.equals(eeBundle.getLocale().getLanguage(), locale.getLanguage())
                    && eeBundle.containsKey(key.trim())) {
                return new MessageFormat(eeBundle.getString(key.trim())).format(args);
            }
        } catch (Exception e) {
            // ignore
        }

        ResourceBundle bundle = ResourceBundle.getBundle(BUNDLE_BASE_NAME, locale);
        if (!bundle.containsKey(key.trim())) {
            log.error("message key not exist ,  {} - {}", locale, key);
            ResourceBundle fallbackBundle = ResourceBundle.getBundle(BUNDLE_BASE_NAME, getDefaultLocale());
            if (fallbackBundle.containsKey(key.trim())) {
                return new MessageFormat(fallbackBundle.getString(key.trim())).format(args);
            }
            return bundle.getString(INTERNAL_SERVER_ERROR_KEY);
        }
        return new MessageFormat(bundle.getString(key.trim())).format(args);
    }

    public static Locale getLocale(ContextView contextView) {
        return contextView.getOrDefault(GlobalContext.CLIENT_LOCALE, getDefaultLocale());
    }

    public static Locale getDefaultLocale() {
        return Locale.ENGLISH;
    }
}
