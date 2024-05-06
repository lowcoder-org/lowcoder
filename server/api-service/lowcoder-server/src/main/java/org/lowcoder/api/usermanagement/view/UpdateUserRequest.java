package org.lowcoder.api.usermanagement.view;

import lombok.Data;
import org.lowcoder.sdk.constants.UiConstants;

@Data
public class UpdateUserRequest {
    private String name;
    private String uiLanguage = UiConstants.DEFAULT_UI_LANGUAGE;
}
