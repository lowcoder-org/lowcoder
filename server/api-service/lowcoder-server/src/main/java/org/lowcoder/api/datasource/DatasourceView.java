package org.lowcoder.api.datasource;

import org.lowcoder.domain.datasource.model.Datasource;

public record DatasourceView(Datasource datasource, boolean edit, String creatorName) {

    public DatasourceView(Datasource datasource, boolean edit) {
        this(datasource, edit, null);
    }
}
