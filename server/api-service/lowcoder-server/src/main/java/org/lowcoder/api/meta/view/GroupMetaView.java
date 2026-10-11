package org.lowcoder.api.meta.view;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.domain.group.model.Group;

import java.util.Locale;

@SuperBuilder
@Getter
public class GroupMetaView {
    private String id;
    private String name;

    public static GroupMetaView of(Group group, Locale locale) {
        return GroupMetaView.builder()
                    .id(group.getId())
                    .name(group.getName(locale))
                    .build();
    }
}
