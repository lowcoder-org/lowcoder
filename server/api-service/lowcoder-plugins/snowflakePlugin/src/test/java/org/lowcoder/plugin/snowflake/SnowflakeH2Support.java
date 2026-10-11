package org.lowcoder.plugin.snowflake;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.lowcoder.sdk.plugin.common.sql.HikariPerfWrapper;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Test support for the Snowflake executor unit of task L5-7: an in-memory H2 database (one per instance, named with a
 * counter) behind a started Hikari pool wrapped in {@link HikariPerfWrapper}, which is all the executor needs from a data
 * source ({@code SqlBasedQueryExecutor} only asks the wrapper for its pool). Snowflake itself is a hosted service and has no
 * container, so H2 stands in for the SQL dialect and for {@code INFORMATION_SCHEMA}. Not a test.
 */
final class SnowflakeH2Support implements AutoCloseable {

    private static final AtomicInteger COUNTER = new AtomicInteger();
    private static final int POOL_SIZE = 2;

    private final HikariDataSource dataSource;
    final HikariPerfWrapper pool;

    SnowflakeH2Support() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:h2:mem:l57_" + COUNTER.incrementAndGet() + ";MODE=Regular;DB_CLOSE_DELAY=-1");
        config.setMaximumPoolSize(POOL_SIZE);
        this.dataSource = new HikariDataSource(config);
        this.pool = HikariPerfWrapper.wrap(dataSource, () -> 0, () -> 0, () -> 0, () -> 0, null, null);
    }

    /** A plain connection of the same database; the caller closes it. */
    Connection connection() {
        try {
            return dataSource.getConnection();
        } catch (SQLException e) {
            throw new IllegalStateException("cannot connect", e);
        }
    }

    /** Runs the statements on a plain connection of the same database. */
    void execute(String... statements) {
        try (Connection connection = dataSource.getConnection(); Statement statement = connection.createStatement()) {
            for (String sql : statements) {
                statement.execute(sql);
            }
        } catch (SQLException e) {
            throw new IllegalStateException("statement failed", e);
        }
    }

    List<Map<String, Object>> rows(String sql) {
        List<Map<String, Object>> rows = new ArrayList<>();
        try (Connection connection = dataSource.getConnection(); Statement statement = connection.createStatement(); ResultSet resultSet = statement.executeQuery(sql)) {
            ResultSetMetaData metaData = resultSet.getMetaData();
            while (resultSet.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                for (int i = 1; i <= metaData.getColumnCount(); i++) {
                    row.put(metaData.getColumnLabel(i), resultSet.getObject(i));
                }
                rows.add(row);
            }
        } catch (SQLException e) {
            throw new IllegalStateException("read failed: " + sql, e);
        }
        return rows;
    }

    @Override
    public void close() {
        dataSource.close();
    }
}
