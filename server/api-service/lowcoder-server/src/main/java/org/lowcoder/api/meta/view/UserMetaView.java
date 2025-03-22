package org.lowcoder.api.meta.view;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.domain.user.model.User;

@SuperBuilder
@Getter
public class UserMetaView {
    private String id;
    private String name;
    private String email;

    public static UserMetaView of(User user) {
        return UserMetaView.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .build();
    }
}
