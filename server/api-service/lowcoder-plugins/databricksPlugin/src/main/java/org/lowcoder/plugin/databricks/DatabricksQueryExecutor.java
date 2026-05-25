package org.lowcoder.plugin.databricks;

import static org.lowcoder.plugin.databricks.util.DatabricksStructureParser.parseTableAndColumns;
import static org.lowcoder.sdk.exception.PluginCommonError.DATASOURCE_GET_STRUCTURE_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.lowcoder.plugin.databricks.gui.DatabricksDeleteCommand;
import org.lowcoder.plugin.databricks.gui.DatabricksInsertCommand;
import org.lowcoder.plugin.databricks.gui.DatabricksUpdateCommand;
import org.lowcoder.plugin.databricks.gui.DatabricksBulkInsertCommand;
import org.lowcoder.plugin.databricks.gui.DatabricksBulkUpdateCommand;
import org.lowcoder.plugin.databricks.util.DatabricksResultParser;
import org.lowcoder.plugin.sql.GeneralSqlExecutor;
import org.lowcoder.plugin.sql.SqlBasedQueryExecutor;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceStructure.Table;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedDatasourceConnectionConfig;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.pf4j.Extension;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Extension
public class DatabricksQueryExecutor extends SqlBasedQueryExecutor {

    // PF4J requires a public no-arg constructor
    public DatabricksQueryExecutor() {
        super(new GeneralSqlExecutor() {
            @Override
            protected List<Map<String, Object>> parseDataRows(ResultSet resultSet) throws SQLException {
                ResultSetMetaData metaData = resultSet.getMetaData();
                int columnCount = metaData.getColumnCount();
                List<Map<String, Object>> result = new ArrayList<>();
                while (resultSet.next()) {
                    Map<String, Object> row = DatabricksResultParser.parseRowValue(resultSet, metaData, columnCount);
                    result.add(row);
                }
                return result;
            }
            // Prepared statement support is handled by the base class using the query config's disablePreparedStatement flag.
        });
    }

    @Override
    protected DatasourceStructure getDatabaseMetadata(Connection connection, SqlBasedDatasourceConnectionConfig connectionConfig) {
        Map<String, Table> tablesByName = new LinkedHashMap<>();
        try (Statement statement = connection.createStatement()) {
            parseTableAndColumns(tablesByName, statement);
        } catch (SQLException throwable) {
            throw new PluginException(DATASOURCE_GET_STRUCTURE_ERROR, "DATASOURCE_GET_STRUCTURE_ERROR", throwable.getMessage());
        }

        DatasourceStructure structure = new DatasourceStructure(new ArrayList<>(tablesByName.values()));
        for (Table table : structure.getTables()) {
            table.getKeys().sort(Comparator.naturalOrder());
        }
        return structure;
    }

    @Override
    protected GuiSqlCommand parseSqlCommand(String guiStatementType, Map<String, Object> detail) {
        // Use new field names and allow for future extensibility
        String type = guiStatementType != null ? guiStatementType : "";
        return switch (type.toUpperCase()) {
            case "INSERT" -> DatabricksInsertCommand.from(detail);
            case "UPDATE" -> DatabricksUpdateCommand.from(detail);
            case "DELETE" -> DatabricksDeleteCommand.from(detail);
            case "BULK_INSERT" -> DatabricksBulkInsertCommand.from(detail);
            case "BULK_UPDATE" -> DatabricksBulkUpdateCommand.from(detail);
            default -> throw new PluginException(QUERY_ARGUMENT_ERROR, "INVALID_GUI_COMMAND_TYPE", type);
        };
    }
}
