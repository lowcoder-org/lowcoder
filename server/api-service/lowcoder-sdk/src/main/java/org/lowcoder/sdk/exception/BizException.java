package org.lowcoder.sdk.exception;

import lombok.Getter;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.util.LocaleUtils;
import org.springframework.http.HttpHeaders;

import java.util.Locale;
import java.util.Map;

@Getter
public class BizException extends BaseException {

    private final BizError error;
    private final String messageKey;
    private final transient Object[] args;
    private transient HttpHeaders headers;

    public BizException(BizError error, String messageKey, Object... args) {
        super(LocaleUtils.getMessage(Locale.ENGLISH, messageKey, args));
        this.error = error;
        this.messageKey = messageKey;
        this.args = args;
    }

    public BizException(BizError error, String messageKey, HttpHeaders headers, Object... args) {
        this(error, messageKey, args);
        this.headers = headers;
    }

    public int getHttpStatus() {
        return error == null ? 500 : error.getHttpErrorCode();
    }

    public int getBizErrorCode() {
        return error == null ? -1 : error.getBizErrorCode();
    }

    @Override
    public String getMessage() {
        return error == null ? super.getMessage() : LocaleUtils.getMessage(Locale.ENGLISH, messageKey, args);
    }

    public String getMessage(Locale locale) {
        return error == null ? super.getMessage() : LocaleUtils.getMessage(locale, messageKey, args);
    }

    public void addHeader(String header, String value) {
        if (StringUtils.isAnyBlank(header, value)) {
            return;
        }
        if (headers == null) {
            headers = new HttpHeaders();
        }
        headers.add(header, value);
    }
}
