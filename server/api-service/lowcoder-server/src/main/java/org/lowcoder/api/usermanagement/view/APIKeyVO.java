package org.lowcoder.api.usermanagement.view;

import lombok.Builder;
import lombok.Getter;
import org.lowcoder.domain.user.model.APIKey;

@Builder
@Getter
public class APIKeyVO {

    private final String id;
    private final String token;

    public static APIKeyVO from(APIKey apiKey) {
        return APIKeyVO.builder()
                .id(apiKey.getId())
                .token(apiKey.getToken())
                .build();
    }

}
