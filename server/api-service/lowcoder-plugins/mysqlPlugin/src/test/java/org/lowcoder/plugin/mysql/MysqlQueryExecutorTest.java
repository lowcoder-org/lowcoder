package org.lowcoder.plugin.mysql;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.plugin.sqlcommand.command.mysql.MysqlBulkInsertCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.mysql.MysqlBulkUpdateCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.mysql.MysqlDeleteCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.mysql.MysqlInsertCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.mysql.MysqlUpdateCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.mysql.MysqlUpsertCommand;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;

/**
 * Unit MY-1 (c), the part that needs no server (task L5-2): {@link MysqlQueryExecutor#parseSqlCommand} maps each GUI type
 * to its MySQL command class (the SQL they produce is run by {@code MysqlDatabaseTest}). The error cases assert the
 * MissingResourceException that stands in for the PluginException (plan section 9 row "mysqlPlugin's empty
 * locale.properties and locale_en.properties", D-6: fix deferred), see {@code MysqlDatabaseTest}.
 */
public class MysqlQueryExecutorTest {

    static final Map<String, Object> KEY_VALUES = Map.of("compType", "KEY_VALUE_PAIRS", "comp", List.of(Map.of("column", "a", "value", "1")));
    static final List<Map<String, Object>> FILTER = List.of(Map.of("column", "id", "condition", "=", "value", "1"));
    static final Map<String, Map<String, Object>> DETAILS = Map.of(
            "insert", Map.of("table", "t", "changeSet", KEY_VALUES),
            "update", Map.of("table", "t", "changeSet", KEY_VALUES, "filterBy", FILTER),
            "upsert", Map.of("table", "t", "insertChangeSet", KEY_VALUES, "updateChangeSet", KEY_VALUES),
            "delete", Map.of("table", "t", "filterBy", FILTER),
            "bulk_insert", Map.of("table", "t", "records", "[{\"a\":1}]"),
            "bulk_update", Map.of("table", "t", "primaryKey", "a", "records", "[{\"a\":1}]"));
    static final Map<String, Class<? extends GuiSqlCommand>> TYPES = Map.of(
            "insert", MysqlInsertCommand.class, "update", MysqlUpdateCommand.class, "upsert", MysqlUpsertCommand.class,
            "delete", MysqlDeleteCommand.class, "bulk_insert", MysqlBulkInsertCommand.class, "bulk_update", MysqlBulkUpdateCommand.class);

    private final MysqlQueryExecutor executor = new MysqlQueryExecutor();

    @Test
    public void everyGuiTypeMapsToItsOwnCommandInAnyCase() {
        TYPES.forEach((type, commandClass) -> {
            assertInstanceOf(commandClass, executor.parseSqlCommand(type, DETAILS.get(type)), type);
            assertInstanceOf(commandClass, executor.parseSqlCommand(type.toUpperCase(Locale.ROOT), DETAILS.get(type)), type.toUpperCase(Locale.ROOT));
        });
        System.out.println("[MysqlQueryExecutorTest] " + TYPES.size() + " GUI types mapped, lower and upper case");
    }

    @Test
    public void unknownGuiTypeIsRejected() {
        RuntimeException thrown = EmptyLocaleBundle.assertThrown(() -> executor.parseSqlCommand("MERGE", DETAILS.get("insert")));
        System.out.println("[MysqlQueryExecutorTest] unknown type rejected with " + thrown.getClass().getSimpleName());
    }

    /**
     * Pins defect D17 (plan section 9: default-locale toUpperCase): under a Turkish default locale "insert" becomes
     * "INSERT" with a dotted capital I and falls into the error branch. A fix ({@code Locale.ROOT}) changes this test on
     * purpose. The default locale is global state: restored in finally.
     */
    @Test
    public void guiTypeInsertFailsUnderATurkishDefaultLocale_pinsD17() {
        Locale saved = Locale.getDefault();
        try {
            Locale.setDefault(Locale.forLanguageTag("tr-TR"));
            System.out.println("[MysqlQueryExecutorTest] default locale: " + Locale.getDefault() + ", upper case of insert: " + "insert".toUpperCase());
            EmptyLocaleBundle.assertThrown(() -> executor.parseSqlCommand("insert", DETAILS.get("insert")));
        } finally {
            Locale.setDefault(saved);
        }
        assertInstanceOf(MysqlInsertCommand.class, executor.parseSqlCommand("insert", DETAILS.get("insert")), "locale restored: " + Locale.getDefault());
    }
}
