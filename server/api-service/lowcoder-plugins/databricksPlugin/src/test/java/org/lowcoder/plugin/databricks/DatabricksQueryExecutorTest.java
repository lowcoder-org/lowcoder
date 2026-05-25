package org.lowcoder.plugin.databricks;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedDatasourceConnectionConfig;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DatabricksQueryExecutorTest {

    @Test
    void testGetDatabaseMetadata() throws Exception {
        DatabricksQueryExecutor executor = new DatabricksQueryExecutor();
        Connection conn = mock(Connection.class);
        Statement stmt = mock(Statement.class);
        ResultSet rs = mock(ResultSet.class);

        when(conn.createStatement()).thenReturn(stmt);
        when(stmt.executeQuery(anyString())).thenReturn(rs);
        when(rs.next()).thenReturn(true, false);
        when(rs.getString("table_name")).thenReturn("my_table");
        when(rs.getString("table_schema")).thenReturn("default");
        when(rs.getString("column_name")).thenReturn("id");
        when(rs.getString("data_type")).thenReturn("int");

        SqlBasedDatasourceConnectionConfig config = mock(SqlBasedDatasourceConnectionConfig.class);
        when(config.getExtParams()).thenReturn(Map.of("catalog", "hive_metastore", "schema", "default"));

        DatasourceStructure structure = executor.getDatabaseMetadata(conn, config);

        assertNotNull(structure);
        assertEquals(1, structure.getTables().size());
        assertEquals("my_table", structure.getTables().get(0).getName());
        assertEquals(1, structure.getTables().get(0).getColumns().size());
        assertEquals("id", structure.getTables().get(0).getColumns().get(0).getName());
    }
}
