package org.lowcoder.api.meta.view;

import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.lowcoder.domain.datasource.model.Datasource;

@SuperBuilder
@Getter
public class DatasourceMetaView {
    private String id;
    private String name;

    public static DatasourceMetaView of(Datasource datasource) {
        return DatasourceMetaView.builder()
                    .id(datasource.getId())
                    .name(datasource.getName())
                    .build();
    }
}
