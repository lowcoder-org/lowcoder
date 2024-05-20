package org.lowcoder.sdk.exception;

import com.google.common.base.Preconditions;
import lombok.Getter;
import org.lowcoder.sdk.util.LocaleUtils;

import java.util.Locale;

@Getter
public class PluginException extends BaseException {
    private final PluginError error;
    private final String messageKey;
    private final transient Object[] args;

    public PluginException(PluginError errorCode, String messageKey, Object... args) {
        super(LocaleUtils.getMessage(Locale.ENGLISH, messageKey, args));
        Preconditions.checkNotNull(errorCode);
        this.error = errorCode;
        this.messageKey = messageKey;
        this.args = args;
    }

    @Override
    public String getMessage() {
        return LocaleUtils.getMessage(Locale.ENGLISH, messageKey, args);
    }

    public String getLocaleMessage(Locale locale) {
        return LocaleUtils.getMessage(locale, messageKey, args);
    }
}
