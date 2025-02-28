package org.lowcoder.api.meta.view;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.domain.bundle.model.Bundle;

@SuperBuilder
@Getter
public class BundleMetaView {
    private String id;
    private String name;

    public static BundleMetaView of(Bundle bundle) {
        return BundleMetaView.builder()
                    .id(bundle.getId())
                    .name(bundle.getName())
                    .build();
    }
}
