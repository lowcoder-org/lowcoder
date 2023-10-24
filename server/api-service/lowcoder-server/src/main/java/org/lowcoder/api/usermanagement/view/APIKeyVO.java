package org.lowcoder.api.usermanagement.view;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class APIKeyVO {

    private final String token;

    public static APIKeyVO from(String token) {
        return APIKeyVO.builder()
                .token(token)
                .build();
    }

}
