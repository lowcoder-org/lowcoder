package org.lowcoder.sdk.contract;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.sql.Array;
import java.sql.Blob;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.sql.Statement;
import java.sql.Time;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * JDBC objects that answer fixed rows, so the plugins' result parsing ({@code ResultSetParser},
 * {@code PostgresResultParser}, {@code GeneralSqlExecutor}, {@code ClickHouseQueryExecutor}) runs on the values a
 * driver hands out without a database (docs/API_PAYLOAD_TEST_PLAN.md §4.6, task T8.2).
 *
 * <p>A {@link #resultSet} answers {@code getObject} with the cell as given, and the typed getters the parsers call
 * ({@code getDate}, {@code getTime}, {@code getString}, {@code getBlob}, {@code getArray}, {@code getObject(i, type)})
 * from it the way a driver converts. A {@link #connection} hands out one statement that yields the given
 * {@link StatementResult}s in order, through {@code execute}, {@code getResultSet}, {@code getUpdateCount},
 * {@code getMoreResults} and {@code getGeneratedKeys}; given a bind log, it records every {@code set...(index, value)}
 * call of a prepared statement as {@code setString(1, java.lang.String:text)}, in call order. {@link SqlArray} is an
 * array value as a driver hands it out.
 *
 * <p>Limits: only the methods named here are implemented; any other call fails with
 * {@link SQLFeatureNotSupportedException} naming the method, so a parser that starts calling another method fails
 * the test instead of reading a default. The conversions are those of the JDBC specification, not of one driver.
 */
public final class FakeJdbc {

    /** {@code getUpdateCount} when the current result is a result set or there are no more results. */
    public static final int NO_UPDATE_COUNT = -1;
    private static final String SETTER_PREFIX = "set";

    /** A column: the label and name the parser reads, and the database type name it switches on. */
    public record Column(String label, String typeName) {
    }

    /**
     * A cell whose {@code getObject} throws an {@link SQLException} with {@code message} (as MySQL does for a TIME
     * value that is a duration) and whose {@code getString} gives {@code text}.
     */
    public record FailingCell(String message, String text) {
    }

    /** One result of a statement: rows, or an update count with the generated keys (none: {@code null}). */
    public sealed interface StatementResult permits Rows, UpdateCount {
    }

    public record Rows(ResultSet resultSet) implements StatementResult {
    }

    public record UpdateCount(int count, ResultSet generatedKeys) implements StatementResult {
    }

    /** An array value as a driver hands it out: the elements, and their base type for {@code getBaseType(Name)}. */
    public record SqlArray(String baseTypeName, int baseType, Object[] elements) implements Array {
        @Override
        public String getBaseTypeName() {
            return baseTypeName;
        }

        @Override
        public int getBaseType() {
            return baseType;
        }

        @Override
        public Object getArray() {
            return elements.clone();
        }

        @Override
        public Object getArray(Map<String, Class<?>> map) {
            return getArray();
        }

        @Override
        public Object getArray(long index, int count) {
            return Arrays.copyOfRange(elements, (int) index - 1, (int) index - 1 + count);
        }

        @Override
        public Object getArray(long index, int count, Map<String, Class<?>> map) {
            return getArray(index, count);
        }

        @Override
        public ResultSet getResultSet() throws SQLException {
            throw unsupported(Array.class, "getResultSet");
        }

        @Override
        public ResultSet getResultSet(Map<String, Class<?>> map) throws SQLException {
            throw unsupported(Array.class, "getResultSet");
        }

        @Override
        public ResultSet getResultSet(long index, int count) throws SQLException {
            throw unsupported(Array.class, "getResultSet");
        }

        @Override
        public ResultSet getResultSet(long index, int count, Map<String, Class<?>> map) throws SQLException {
            throw unsupported(Array.class, "getResultSet");
        }

        @Override
        public void free() {
        }
    }

    private FakeJdbc() {
    }

    /** A result set of {@code rows}, each a list of cells in column order. */
    public static ResultSet resultSet(List<Column> columns, List<List<Object>> rows) {
        ResultSetMetaData metaData = proxy(ResultSetMetaData.class, (self, method, args) -> switch (method.getName()) {
            case "getColumnCount" -> columns.size();
            case "getColumnLabel", "getColumnName" -> columns.get((int) args[0] - 1).label();
            case "getColumnTypeName" -> columns.get((int) args[0] - 1).typeName();
            default -> throw unsupported(ResultSetMetaData.class, method.getName());
        });
        int[] row = {-1};
        return proxy(ResultSet.class, (self, method, args) -> switch (method.getName()) {
            case "getMetaData" -> metaData;
            case "next" -> ++row[0] < rows.size();
            case "close" -> null;
            case "getObject" -> args.length == 1 ? object(rows.get(row[0]).get((int) args[0] - 1))
                    : typed(rows.get(row[0]).get((int) args[0] - 1), (Class<?>) args[1]);
            case "getString" -> string(rows.get(row[0]).get((int) args[0] - 1));
            case "getDate" -> date(rows.get(row[0]).get((int) args[0] - 1));
            case "getTime" -> time(rows.get(row[0]).get((int) args[0] - 1));
            case "getBlob" -> typed(rows.get(row[0]).get((int) args[0] - 1), Blob.class);
            case "getArray" -> typed(rows.get(row[0]).get((int) args[0] - 1), Array.class);
            default -> throw unsupported(ResultSet.class, method.getName());
        });
    }

    /** A connection whose every statement (plain or prepared) yields {@code results} in order. */
    public static Connection connection(List<StatementResult> results) {
        return connection(results, null);
    }

    /**
     * A connection whose every statement yields {@code results} in order and records each parameter it is given in
     * {@code binds} ({@code null}: parameters are refused).
     */
    public static Connection connection(List<StatementResult> results, List<String> binds) {
        return proxy(Connection.class, (self, method, args) -> switch (method.getName()) {
            case "createStatement", "prepareStatement" -> statement(method.getReturnType(), results, binds);
            case "close" -> null;
            case "isClosed" -> false;
            default -> throw unsupported(Connection.class, method.getName());
        });
    }

    private static Object statement(Class<?> type, List<StatementResult> results, List<String> binds) {
        List<StatementResult> remaining = new ArrayList<>(results);
        return proxy(type, (self, method, args) -> switch (method.getName()) {
            case "execute" -> !remaining.isEmpty() && remaining.get(0) instanceof Rows;
            case "getResultSet" -> remaining.get(0) instanceof Rows rows ? rows.resultSet() : null;
            case "getUpdateCount" -> !remaining.isEmpty() && remaining.get(0) instanceof UpdateCount count ? count.count() : NO_UPDATE_COUNT;
            case "getGeneratedKeys" -> remaining.get(0) instanceof UpdateCount count ? count.generatedKeys() : null;
            case "getMoreResults" -> {
                remaining.remove(0);
                yield !remaining.isEmpty() && remaining.get(0) instanceof Rows;
            }
            case "close" -> null;
            default -> {
                if (binds == null || !method.getName().startsWith(SETTER_PREFIX) || args.length < 2 || !(args[0] instanceof Integer index)) {
                    throw unsupported(type, method.getName());
                }
                binds.add(method.getName() + "(" + index + ", " + describe(args[1]) + ")");
                yield null;
            }
        });
    }

    /** {@code class:value} of a bound parameter. */
    private static String describe(Object value) {
        return value == null ? String.valueOf((Object) null) : value.getClass().getName() + ":" + value;
    }

    private static Object object(Object cell) throws SQLException {
        if (cell instanceof FailingCell failing) {
            throw new SQLException(failing.message());
        }
        return cell;
    }

    private static Object typed(Object cell, Class<?> type) throws SQLException {
        Object value = object(cell);
        if (value == null || type.isInstance(value)) {
            return value;
        }
        throw new SQLException("cell of " + value.getClass().getName() + " is not a " + type.getName());
    }

    private static String string(Object cell) {
        if (cell instanceof FailingCell failing) {
            return failing.text();
        }
        return cell == null ? null : cell.toString();
    }

    private static java.sql.Date date(Object cell) throws SQLException {
        Object value = object(cell);
        if (value instanceof java.util.Date date) {
            return new java.sql.Date(date.getTime());
        }
        if (value instanceof LocalDate localDate) {
            return java.sql.Date.valueOf(localDate);
        }
        return (java.sql.Date) typed(value, java.sql.Date.class);
    }

    private static Time time(Object cell) throws SQLException {
        Object value = object(cell);
        if (value instanceof java.util.Date date) {
            return new Time(date.getTime());
        }
        return (Time) typed(value, Time.class);
    }

    private static <T> T proxy(Class<T> type, InvocationHandler handler) {
        return type.cast(Proxy.newProxyInstance(FakeJdbc.class.getClassLoader(), new Class<?>[] {type}, (self, method, args) -> {
            if (method.getDeclaringClass() == Object.class) {
                return switch (method.getName()) {
                    case "equals" -> self == args[0];
                    case "hashCode" -> System.identityHashCode(self);
                    default -> "FakeJdbc " + type.getSimpleName();
                };
            }
            return handler.invoke(self, method, args == null ? new Object[0] : args);
        }));
    }

    private static SQLFeatureNotSupportedException unsupported(Class<?> type, String method) {
        return new SQLFeatureNotSupportedException("FakeJdbc does not implement " + type.getSimpleName() + "." + method);
    }
}
