package org.lowcoder.sdk.plugin.lowcoderapi;

import org.lowcoder.sdk.models.DatasourceConnectionConfig;

public class LowcoderApiDatasourceConfig implements DatasourceConnectionConfig {

    public static final LowcoderApiDatasourceConfig INSTANCE = new LowcoderApiDatasourceConfig();

    @Override
    public DatasourceConnectionConfig mergeWithUpdatedConfig(DatasourceConnectionConfig detailConfig) {
        return detailConfig;
    }
}
