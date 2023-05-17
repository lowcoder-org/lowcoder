package org.lowcoder.sdk.models;

public record LocaleMessage(String messageKey, Object... args) {

    public LocaleMessage(String messageKey) {
        this(messageKey, new Object[0]);
    }
}
