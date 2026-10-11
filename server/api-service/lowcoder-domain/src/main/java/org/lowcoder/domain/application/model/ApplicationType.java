package org.lowcoder.domain.application.model;

import java.util.Arrays;

import lombok.Getter;

@Getter
public enum ApplicationType {
    ALL(0),
    APPLICATION(1),
    MODULE(2),
    NAV_LAYOUT(3),
    FOLDER(4),
    MOBILE_TAB_LAYOUT(6),
    NAVIGATION(7),
    BUNDLE(8);

    private final int value;

    ApplicationType(int value) {
        this.value = value;
    }

    public static ApplicationType fromValue(int value) {
        return Arrays.stream(values())
                .filter(it -> it.value == value)
                .findFirst()
                .orElse(null);
    }

}
