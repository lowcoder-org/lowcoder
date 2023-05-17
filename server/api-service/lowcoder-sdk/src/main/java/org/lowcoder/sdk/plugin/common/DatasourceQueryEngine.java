package org.lowcoder.sdk.plugin.common;

import org.lowcoder.sdk.models.DatasourceConnectionConfig;
import org.lowcoder.sdk.query.QueryExecutionContext;

/**
 * This interface is responsible for:
 * 1. datasource config parsing & validation
 * 2. connection's life cycle management: creation/destroy/test
 * 3. query context building and execution(structure can be seen as a special case)
 */
public interface DatasourceQueryEngine<DatasourceConfig extends DatasourceConnectionConfig, Connection, Context extends QueryExecutionContext>
        extends DatasourceConnector<Connection, DatasourceConfig>, QueryExecutor<DatasourceConfig, Connection, Context> {

}
