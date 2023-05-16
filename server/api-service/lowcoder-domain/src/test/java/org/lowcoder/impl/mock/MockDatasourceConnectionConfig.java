package org.lowcoder.impl.mock;

import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.sdk.models.DatasourceConnectionConfig;

public record MockDatasourceConnectionConfig(Datasource datasource) implements DatasourceConnectionConfig {

    @Override
    public DatasourceConnectionConfig mergeWithUpdatedConfig(DatasourceConnectionConfig detailConfig) {
        throw new UnsupportedOperationException();
    }
}
