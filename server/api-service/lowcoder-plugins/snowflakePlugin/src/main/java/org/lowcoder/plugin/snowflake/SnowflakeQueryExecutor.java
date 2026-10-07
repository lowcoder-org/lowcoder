package org.lowcoder.plugin.snowflake;

import jakarta.annotation.Nonnull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.plugin.sql.GeneralSqlExecutor;
import org.lowcoder.plugin.sql.SqlBasedQueryExecutor;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceStructure.Column;
import org.lowcoder.sdk.models.DatasourceStructure.Table;
import org.lowcoder.sdk.models.DatasourceStructure.TableType;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedDatasourceConnectionConfig;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.query.QueryVisitorContext;
import org.lowcoder.sdk.util.ExceptionUtils;
import org.pf4j.Extension;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.lowcoder.sdk.exception.PluginCommonError.DATASOURCE_GET_STRUCTURE_ERROR;

@SuppressWarnings({"SqlDialectInspection", "SqlNoDataSourceInspection"})
@Slf4j
@Extension
public class SnowflakeQueryExecutor extends SqlBasedQueryExecutor {

    public SnowflakeQueryExecutor() {
        super(new GeneralSqlExecutor(false));
    }

    /** The data source ext param that limits the structure to one schema; blank or absent lists every schema. */
    static final String SCHEMA_EXT_PARAM = "schema";

    /**
     * The structure query for one schema. The schema is a bind parameter (BF-069): it was replaced into the quoted literal,
     * so a quote in the value changed the statement. Escaping the quote would not have been enough, because Snowflake also
     * reads a backslash in a single-quoted literal as an escape.
     */
    @SuppressWarnings("SqlDialectInspection")
    public static final String COLUMNS_QUERY = """
            SELECT
               table_schema as "table_schema",
               concat(table_schema, '.', table_name) as "table_name",
               column_name as "column_name",
               data_type as "column_type"
               FROM INFORMATION_SCHEMA.COLUMNS
               where table_schema = ?
               ORDER BY table_name, ordinal_position""";

    @SuppressWarnings("SqlDialectInspection")
    private static final String COLUMNS_QUERY_WITHOUT_SCHEMA = """
            SELECT
             table_schema as "table_schema",
               concat(table_schema, '.', table_name) as "table_name",
               column_name as "column_name",
               data_type as "column_type"
               FROM INFORMATION_SCHEMA.COLUMNS
               ORDER BY table_name, ordinal_position
             """;

    /**
     * The user's query always runs as a plain statement, with its values rendered into the SQL, whatever the query config
     * says. The structure query ({@link #getDatabaseMetadata}) is separate: it binds its schema filter.
     */
    @Override
    public SqlBasedQueryExecutionContext buildQueryExecutionContext(SqlBasedDatasourceConnectionConfig datasourceConfig,
            Map<String, Object> queryConfig, Map<String, Object> requestParams, QueryVisitorContext queryVisitorContext) {
        return super.buildQueryExecutionContext(datasourceConfig, queryConfig, requestParams, queryVisitorContext)
                .toBuilder()
                .disablePreparedStatement(true)
                .build();
    }

    @Nonnull
    @Override
    protected DatasourceStructure getDatabaseMetadata(Connection connection, SqlBasedDatasourceConnectionConfig connectionConfig) {
        Map<String, Table> tablesByName = new LinkedHashMap<>();

        String schema = getSchemaFilter(connectionConfig);
        try (PreparedStatement statement = connection.prepareStatement(schema == null ? COLUMNS_QUERY_WITHOUT_SCHEMA : COLUMNS_QUERY)) {
            if (schema != null) {
                statement.setString(1, schema);
            }
            readStructure(statement, tablesByName);
        } catch (SQLException throwable) {
            throw ExceptionUtils.wrapException(DATASOURCE_GET_STRUCTURE_ERROR, "DATASOURCE_GET_STRUCTURE_ERROR", throwable);
        }
        return new DatasourceStructure(new ArrayList<>(tablesByName.values()));
    }

    private static void readStructure(PreparedStatement statement, Map<String, Table> tablesByName) throws SQLException {
        try (ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                String tableName = resultSet.getString("table_name");
                String schema = resultSet.getString("table_schema");
                Table table = tablesByName.computeIfAbsent(tableName, __ -> new Table(
                        TableType.TABLE, schema, tableName,
                        new ArrayList<>(),
                        new ArrayList<>(),
                        new ArrayList<>()
                ));

                table.addColumn(new Column(
                        resultSet.getString("column_name"),
                        resultSet.getString("column_type"),
                        null,
                        false
                ));
            }
        }
    }

    /**
     * The {@code schema} ext param, bound to {@link #COLUMNS_QUERY}, or null when it is absent or blank, for the query without
     * the filter. The value is compared as it is, as before: it is not trimmed and its case is not changed.
     * <p>
     * Limits: the tests run the structure query on H2, not on a Snowflake server; that the Snowflake driver sends the value
     * as a bind variable rests on its {@code PreparedStatement} implementation, which is not exercised here.
     */
    private static String getSchemaFilter(SqlBasedDatasourceConnectionConfig connectionConfig) {
        Object schema = connectionConfig.getExtParams().get(SCHEMA_EXT_PARAM);
        if (schema != null && StringUtils.isNotBlank(String.valueOf(schema))) {
            return String.valueOf(schema);
        }
        return null;
    }

    @Override
    protected GuiSqlCommand parseSqlCommand(String guiStatementType, Map<String, Object> detail) {
        throw new UnsupportedOperationException();
    }

}
