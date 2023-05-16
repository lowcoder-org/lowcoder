package org.lowcoder.api.authentication.dto;

import org.lowcoder.domain.user.model.User;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserLoginEndMessage {
    private User user;
    private boolean signUp;
    private String signUpSource;
    private String requestDomain;
    private String thirdPartyLoginOrgId;
}
