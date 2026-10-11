package org.lowcoder.api.meta.view;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.domain.organization.model.Organization;

@SuperBuilder
@Getter
public class OrgMetaView {
    private String id;
    private String name;

    public static OrgMetaView of(Organization user) {
        return OrgMetaView.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .build();
    }
}
