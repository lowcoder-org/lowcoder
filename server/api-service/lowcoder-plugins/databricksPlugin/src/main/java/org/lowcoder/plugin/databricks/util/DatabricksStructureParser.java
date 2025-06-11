package org.lowcoder.plugin.databricks.util;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Map;

import org.lowcoder.sdk.models.DatasourceStructure.Column;
import org.lowcoder.sdk.models.DatasourceStructure.Table;
import org.lowcoder.sdk.models.DatasourceStructure.TableType;

public class DatabricksStructureParser {

    public static final String COLUMNS_QUERY = """
        SELECT
          table_schema as "table_schema",
          table_schema || '.' || table_name as "table_name",
          column_name as "column_name",
          data_type as "column_type",
          ordinal_position as "ordinal_position",
          column_default as "column_default",
          is_nullable as "is_nullable"
        FROM information_schema.columns
        ORDER BY table_name, ordinal_position
        """;

    public static void parseTableAndColumns(Map<String, Table> tablesByName, Statement statement) throws SQLException {
        try (ResultSet columnsResultSet = statement.executeQuery(COLUMNS_QUERY)) {
            while (columnsResultSet.next()) {
                String tableName = columnsResultSet.getString("table_name");
                String schema = columnsResultSet.getString("table_schema");

                Table table = tablesByName.computeIfAbsent(tableName, __ -> new Table(
                        TableType.TABLE, schema, tableName,
                        new ArrayList<>(),
                        new ArrayList<>(),
                        new ArrayList<>()
                ));

                table.addColumn(new Column(
                        columnsResultSet.getString("column_name"),
                        columnsResultSet.getString("column_type"),
                        null,
                        false
                ));
            }
        }
    }
}
