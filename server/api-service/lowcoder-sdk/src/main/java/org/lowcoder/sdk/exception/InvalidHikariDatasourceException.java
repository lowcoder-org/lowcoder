package org.lowcoder.sdk.exception;

import static org.lowcoder.sdk.exception.PluginCommonError.CONNECTION_ERROR;

public class InvalidHikariDatasourceException extends PluginException {

    public InvalidHikariDatasourceException() {
        super(CONNECTION_ERROR, "CONNECTION_ERROR", "hikari datasource closed.");
    }
}
