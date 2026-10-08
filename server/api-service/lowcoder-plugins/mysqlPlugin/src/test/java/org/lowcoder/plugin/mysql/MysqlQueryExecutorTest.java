package org.lowcoder.plugin.mysql;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginException;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;

/**
 * Unit MY-1 (c), the part that needs no server (task L5-2): {@link MysqlQueryExecutor#parseSqlCommand} maps each GUI type
 * to its MySQL command class (the SQL they produce is run by {@code MysqlDatabaseTest}). The error cases assert the coded
 * PluginException (BF-127: before, the module's empty locale files turned it into a MissingResourceException).
 */
public class MysqlQueryExecutorTest {

    static final String INVALID_GUI_COMMAND_TYPE_KEY = "INVALID_GUI_COMMAND_TYPE";
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

    /**
     * BF-127: an unknown GUI type is the coded INVALID_GUI_COMMAND_TYPE naming it. Before BF-127 the module's empty
     * {@code locale_en.properties} shadowed the sdk's on the test classpath, so building the PluginException threw a
     * MissingResourceException here (never in production, where the plugin jar is loaded by pf4j and the sdk's bundle is read).
     */
    @Test
    public void unknownGuiTypeIsRejectedWithItsNameBF127() {
        PluginException thrown = assertThrows(PluginException.class, () -> executor.parseSqlCommand("MERGE", DETAILS.get("insert")));
        System.out.println("[MysqlQueryExecutorTest] unknown type rejected: " + thrown.getError() + " / " + thrown.getMessageKey() + ": " + thrown.getMessage());
        assertEquals(QUERY_ARGUMENT_ERROR, thrown.getError());
        assertEquals(INVALID_GUI_COMMAND_TYPE_KEY, thrown.getMessageKey());
        assertEquals("Invalid GUI command type MERGE.", thrown.getMessage());
    }

    /** The default locale under which upper-casing "i" gives a dotted capital I. */
    private static final Locale TURKISH = Locale.forLanguageTag("tr-TR");

    /**
     * BF-122 (D17): the GUI type was upper-cased with the default locale, so under a Turkish default locale "insert" became
     * "INSERT" with a dotted capital I and fell into the error branch. It is upper-cased with {@code Locale.ROOT} now. The
     * default locale is global state: restored in finally.
     */
    @Test
    public void guiTypeInsertIsReadUnderATurkishDefaultLocaleBF122() {
        Locale saved = Locale.getDefault();
        try {
            Locale.setDefault(TURKISH);
            System.out.println("[MysqlQueryExecutorTest] default locale: " + Locale.getDefault() + ", upper case of insert: " + "insert".toUpperCase());
            assertInstanceOf(MysqlInsertCommand.class, executor.parseSqlCommand("insert", DETAILS.get("insert")), "under " + Locale.getDefault());
        } finally {
            Locale.setDefault(saved);
        }
        assertInstanceOf(MysqlInsertCommand.class, executor.parseSqlCommand("insert", DETAILS.get("insert")), "locale restored: " + Locale.getDefault());
    }
}
