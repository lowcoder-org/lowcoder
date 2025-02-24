package org.lowcoder.domain.user.model;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import lombok.Builder;
import lombok.Getter;
import org.lowcoder.sdk.constants.UiConstants;

@Builder
@Getter
public class UserDetail {
    public static final UserDetail ANONYMOUS_CURRENT_USER = UserDetail.builder()
            .id("")
            .name("ANONYMOUS")
            .avatarUrl("")
            .uiLanguage("en")
            .email("")
            .ip("")
            .groups(Collections.emptyList())
            .extra(Collections.emptyMap())
            .build();

    private String id;
    private String name;
    private String avatarUrl;
    @Builder.Default
    private String uiLanguage = UiConstants.DEFAULT_UI_LANGUAGE;
    private String email;
    private String ip;
    private List<Map<String, String>> groups;
    private Map<String, Object> extra;
    private Map<String, Object> userAuth;
}
