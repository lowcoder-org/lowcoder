package org.lowcoder.plugin.sql;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.common.sql.SqlBasedQueryExecutionContext;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.SQLFeatureNotSupportedException;
import java.sql.Time;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.lowcoder.plugin.sql.H2SqlTestSupport.assertPluginError;
import static org.lowcoder.sdk.exception.PluginCommonError.PREPARED_STATEMENT_BIND_PARAMETERS_ERROR;

/**
 * Unit SB-1 (task L5-1): {@link GeneralSqlExecutor#bindParam} binds each Java type with the right setter, shown by a
 * round trip through a real H2 table (what {@code SqlBindContractTest} cannot show: it records calls on a fake and never
 * reaches Float/Double, byte[], Date/Time/Timestamp, nor the unsupported-type error). Pins defect D2 (the bind error
 * cannot name the parameter: the name is always the empty string).
 */
public class GeneralSqlExecutorBindTest {

    static final String PARAM = "v";
    static final String BIND_ERROR_KEY = "PS_BIND_ERROR";
    static final String TABLE = "bind_target";
    /** 18 significant digits: more than a double holds, so a conversion through double is visible. */
    static final String BIG_DECIMAL = "123456789012345.123";

    private static final String URL = H2SqlTestSupport.newUrl("bind");
    private static Connection connection;
    private final GeneralSqlExecutor executor = new GeneralSqlExecutor();

    @BeforeAll
    static void open() {
        connection = H2SqlTestSupport.open(URL);
    }

    @AfterAll
    static void close() throws Exception {
        connection.close();
    }

    @BeforeEach
    void freshTable() {
        H2SqlTestSupport.run(connection, "drop table if exists " + TABLE,
                "create table " + TABLE + " (id int, d decimal(30,15), b varbinary(16), dt date, tm time, ts timestamp, s varchar(200), i int)");
    }

    private void insert(String column, Object value) {
        Map<String, Object> params = new HashMap<>();
        params.put(PARAM, value);
        SqlBasedQueryExecutionContext context = SqlBasedQueryExecutionContext.builder()
                .query("insert into " + TABLE + " (" + column + ") values ({{" + PARAM + "}})").requestParams(params).build();
        executor.execute(connection, context);
    }

    private Object stored(String column) {
        return H2SqlTestSupport.scalar(connection, "select " + column + " from " + TABLE);
    }

    private String storedText(String column) {
        return String.valueOf(H2SqlTestSupport.scalar(connection, "select cast(" + column + " as varchar) from " + TABLE + " where " + column + " is not null"));
    }

    @Test
    public void floatAndDoubleRoundTripWithoutBinaryNoise() {
        insert("d", 0.1f);
        assertEquals(0, new BigDecimal("0.1").compareTo((BigDecimal) stored("d")), "0.1f must be stored as 0.1, got " + stored("d"));
        H2SqlTestSupport.run(connection, "delete from " + TABLE);
        insert("d", 0.1d);
        assertEquals(0, new BigDecimal("0.1").compareTo((BigDecimal) stored("d")), "0.1d must be stored as 0.1, got " + stored("d"));
        System.out.println("[GeneralSqlExecutorBindTest] float and double 0.1 stored as 0.1 (BigDecimal of String.valueOf)");
    }

    @Test
    public void bigDecimalRoundTripKeepsScale() {
        insert("d", new BigDecimal(BIG_DECIMAL));
        assertEquals(0, new BigDecimal(BIG_DECIMAL).compareTo((BigDecimal) stored("d")), "stored " + stored("d"));
        System.out.println("[GeneralSqlExecutorBindTest] BigDecimal " + BIG_DECIMAL + " round trip: " + stored("d"));
    }

    @Test
    public void bytesRoundTrip() {
        byte[] bytes = {0, 1, 2, (byte) 0xFF, 42};
        insert("b", bytes);
        assertArrayEquals(bytes, (byte[]) stored("b"));
        System.out.println("[GeneralSqlExecutorBindTest] byte[] round trip: " + Arrays.toString((byte[]) stored("b")));
    }

    @Test
    public void dateTimeAndTimestampEachKeepTheirOwnPrecision() {
        insert("dt", Date.valueOf("2024-02-29"));
        insert("tm", Time.valueOf("13:14:15"));
        insert("ts", Timestamp.valueOf("2024-02-29 13:14:15"));
        assertEquals("2024-02-29", storedText("dt"));
        assertEquals("13:14:15", storedText("tm"));
        assertEquals("2024-02-29 13:14:15", storedText("ts"));
        System.out.println("[GeneralSqlExecutorBindTest] date, time, timestamp: " + storedText("dt") + " | " + storedText("tm") + " | " + storedText("ts"));
    }

    @Test
    public void mapAndCollectionAreBoundAsJsonText() {
        insert("s", Map.of("k", 1));
        assertEquals("{\"k\":1}", stored("s"));
        H2SqlTestSupport.run(connection, "delete from " + TABLE);
        insert("s", List.of(1, "two"));
        assertEquals("[1,\"two\"]", stored("s"));
        System.out.println("[GeneralSqlExecutorBindTest] map and list stored as JSON text: " + stored("s"));
    }

    @Test
    public void nullIsBoundAsSqlNullIntoTypedColumns() {
        insert("i", null);
        insert("s", null);
        assertEquals(2L, H2SqlTestSupport.scalar(connection, "select count(*) from " + TABLE));
        assertEquals(2L, H2SqlTestSupport.scalar(connection, "select count(*) from " + TABLE + " where i is null and s is null"));
        System.out.println("[GeneralSqlExecutorBindTest] two rows with SQL NULL in the integer and in the varchar column");
    }

    /**
     * A driver that cannot describe its parameters (the case the production code catches, as Oracle can): the statement
     * wrapper refuses {@code getParameterMetaData}, so null must still be bound, as {@code Types.NULL}.
     */
    @Test
    public void nullFallsBackToTypesNullWhenTheDriverCannotDescribeTheParameter() {
        List<String> setNulls = new ArrayList<>();
        Connection refusing = (Connection) Proxy.newProxyInstance(getClass().getClassLoader(), new Class<?>[] {Connection.class},
                (proxy, method, args) -> {
                    Object result = invoke(connection, method, args);
                    if (!method.getName().equals("prepareStatement")) {
                        return result;
                    }
                    return Proxy.newProxyInstance(getClass().getClassLoader(), new Class<?>[] {PreparedStatement.class},
                            (statementProxy, statementMethod, statementArgs) -> {
                                if (statementMethod.getName().equals("getParameterMetaData")) {
                                    throw new SQLFeatureNotSupportedException("no parameter metadata");
                                }
                                if (statementMethod.getName().equals("setNull")) {
                                    setNulls.add(Arrays.toString(statementArgs));
                                }
                                return invoke(result, statementMethod, statementArgs);
                            });
                });
        Map<String, Object> params = new HashMap<>();
        params.put(PARAM, null);
        executor.execute(refusing, SqlBasedQueryExecutionContext.builder()
                .query("insert into " + TABLE + " (s) values ({{" + PARAM + "}})").requestParams(params).build());
        assertEquals(List.of("[1, " + Types.NULL + "]"), setNulls);
        assertEquals(1L, H2SqlTestSupport.scalar(connection, "select count(*) from " + TABLE + " where s is null"));
        System.out.println("[GeneralSqlExecutorBindTest] no parameter metadata: setNull calls " + setNulls);
    }

    private static Object invoke(Object target, java.lang.reflect.Method method, Object[] args) throws Throwable {
        try {
            return method.invoke(target, args);
        } catch (InvocationTargetException e) {
            throw e.getCause();
        }
    }

    /** Pins defect D2: the parameter name in the error is always the empty string; a fix changes this test on purpose. */
    @Test
    public void unsupportedTypeIsRejectedAsBindErrorWithoutNamingTheParameter() {
        PluginException thrown = assertPluginError(PREPARED_STATEMENT_BIND_PARAMETERS_ERROR, BIND_ERROR_KEY,
                () -> insert("s", UUID.randomUUID()));
        assertEquals("", thrown.getArgs()[0], "D2: the parameter name is empty today");
        assertEquals("UUID", thrown.getArgs()[1]);
        assertEquals(0L, H2SqlTestSupport.scalar(connection, "select count(*) from " + TABLE), "nothing may be stored");
        System.out.println("[GeneralSqlExecutorBindTest] UUID rejected: " + Arrays.toString(thrown.getArgs()) + " (D2: empty name)");
    }
}
