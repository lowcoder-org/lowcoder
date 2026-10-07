package org.lowcoder.sdk.plugin.sqlcommand.command;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.lowcoder.sdk.plugin.common.constant.Constants.ALLOW_MULTI_MODIFY_KEY;
import static org.lowcoder.sdk.plugin.common.constant.Constants.CHANGE_SET_FORM_KEY;
import static org.lowcoder.sdk.plugin.common.constant.Constants.CHANGE_SET_TYPE_KEY_VALUE_PAIRS;
import static org.lowcoder.sdk.plugin.common.constant.Constants.CHANGE_SET_TYPE_OBJECT;
import static org.lowcoder.sdk.plugin.common.constant.Constants.COMP_KEY;
import static org.lowcoder.sdk.plugin.common.constant.Constants.COMP_TYPE_KEY;
import static org.lowcoder.sdk.plugin.common.constant.Constants.INSERT_CHANGE_SET_FORM_KEY;
import static org.lowcoder.sdk.plugin.common.constant.Constants.PRIMARY_KEY_FORM_KEY;
import static org.lowcoder.sdk.plugin.common.constant.Constants.RECORD_FORM_KEY;
import static org.lowcoder.sdk.plugin.common.constant.Constants.TABLE_KEY;
import static org.lowcoder.sdk.plugin.common.constant.Constants.UPDATE_CHANGE_SET_FORM_KEY;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand.GuiSqlCommandRenderResult;
import org.lowcoder.sdk.plugin.sqlcommand.command.mysql.MysqlBulkInsertCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.mysql.MysqlBulkUpdateCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.mysql.MysqlDeleteCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.mysql.MysqlInsertCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.mysql.MysqlUpdateCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.mysql.MysqlUpsertCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresBulkInsertCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresBulkUpdateCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresDeleteCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresInsertCommand;
import org.lowcoder.sdk.plugin.sqlcommand.command.postgres.PostgresUpdateCommand;

/**
 * Rendering of the GUI SQL commands (insert, update, delete, bulk insert/update, upsert) for MySQL and PostgreSQL,
 * built through the public {@code from(commandDetail)} factories like the query executor does. Complements
 * PostgresCommandTest and MysqlGuiCommandTest, which render happy paths only: this class covers the error branches,
 * the multi-modify safety flag, the single-row guard result and the dialect differences.
 */
class GuiSqlCommandRenderTest {

    private static final String TABLE = "users";
    private static final String TEMPLATE_TABLE = "{{tbl}}";
    private static final Map<String, Object> TABLE_PARAM = Map.of("tbl", TABLE);
    private static final Map<String, Object> NO_PARAMS = Map.of();
    /** the random-tag dollar quoting of {@code SqlGuiUtils.POSTGRES_SQL_STR_ESCAPE}; {@code group} is the number of the capture group holding the tag */
    private static String pgQuoted(String value, int group) {
        return "\\$([A-Za-z]{7})\\$" + value + "\\$\\" + group + "\\$";
    }

    // ---- command detail builders ----

    private static Map<String, Object> keyValueChangeSet(Object... columnValue) {
        List<Object> comp = new ArrayList<>();
        for (int i = 0; i < columnValue.length; i += 2) {
            Map<String, Object> item = new HashMap<>();
            item.put("column", columnValue[i]);
            item.put("value", columnValue[i + 1]);
            comp.add(item);
        }
        Map<String, Object> changeSet = new HashMap<>();
        changeSet.put(COMP_TYPE_KEY, CHANGE_SET_TYPE_KEY_VALUE_PAIRS);
        changeSet.put(COMP_KEY, comp);
        return changeSet;
    }

    private static Map<String, Object> objectChangeSet(String json) {
        Map<String, Object> changeSet = new HashMap<>();
        changeSet.put(COMP_TYPE_KEY, CHANGE_SET_TYPE_OBJECT);
        changeSet.put(COMP_KEY, json);
        return changeSet;
    }

    private static Map<String, Object> filter(String column, String condition, Object value) {
        Map<String, Object> map = new HashMap<>();
        map.put("column", column);
        map.put("condition", condition);
        map.put("value", value);
        return map;
    }

    private static Map<String, Object> detail(String table, boolean allowMultiModify, List<Map<String, Object>> filters, Map<String, Object> changeSet) {
        Map<String, Object> detail = new HashMap<>();
        detail.put(TABLE_KEY, table);
        detail.put(ALLOW_MULTI_MODIFY_KEY, allowMultiModify);
        if (filters != null) {
            detail.put("filterBy", filters);
        }
        if (changeSet != null) {
            detail.put(CHANGE_SET_FORM_KEY, changeSet);
        }
        return detail;
    }

    private static Map<String, Object> bulkDetail(String records, String primaryKey) {
        Map<String, Object> detail = new HashMap<>();
        detail.put(TABLE_KEY, TABLE);
        detail.put(RECORD_FORM_KEY, records);
        if (primaryKey != null) {
            detail.put(PRIMARY_KEY_FORM_KEY, primaryKey);
        }
        return detail;
    }

    private static GuiSqlCommandRenderResult print(String label, GuiSqlCommandRenderResult result) {
        System.out.println("[GuiSqlCommandRenderTest] " + label + " -> [" + result.sql().replace("\n", "\\n") + "] " + result.bindParams()
                + (result instanceof UpdateOrDeleteSingleCommandRenderResult single ? " guard=[" + single.getSelectQuery() + "] " + single.getSelectBindParams() : ""));
        return result;
    }

    private static void assertPluginError(Runnable action, PluginCommonError error, String messageKey, Object... args) {
        assertThatThrownBy(action::run).isInstanceOfSatisfying(PluginException.class, e -> {
            assertThat(e.getError()).isEqualTo(error);
            assertThat(e.getMessageKey()).isEqualTo(messageKey);
            assertThat(e.getArgs()).containsExactly(args);
        });
    }

    // ---- delete ----

    @Test
    void postgresDeleteWithoutFilterRespectsTheMultiModifyFlag() {
        GuiSqlCommandRenderResult guarded = print("pg delete, no filter, multi off",
                PostgresDeleteCommand.from(detail(TABLE, false, List.of(), null)).render(NO_PARAMS));
        assertThat(guarded).isInstanceOf(UpdateOrDeleteSingleCommandRenderResult.class);
        assertThat(guarded.sql()).isEqualTo("delete from users");
        assertThat(((UpdateOrDeleteSingleCommandRenderResult) guarded).getSelectQuery()).isEqualTo("select count(1) as count from users");

        GuiSqlCommandRenderResult plain = print("pg delete, no filter, multi on",
                PostgresDeleteCommand.from(detail(TABLE, true, List.of(), null)).render(NO_PARAMS));
        assertThat(plain).isNotInstanceOf(UpdateOrDeleteSingleCommandRenderResult.class);
        assertThat(plain.sql()).isEqualTo("delete from users");
        assertThat(plain.bindParams()).isEmpty();
    }

    @Test
    void postgresDeleteWithFilterBuildsTheGuardFromTheSameWhereAndRendersTheTable() {
        List<Map<String, Object>> filters = List.of(filter("id", "=", 5));

        GuiSqlCommandRenderResult guarded = print("pg delete, filter, multi off",
                PostgresDeleteCommand.from(detail(TEMPLATE_TABLE, false, filters, null)).render(TABLE_PARAM));
        assertThat(guarded).isInstanceOf(UpdateOrDeleteSingleCommandRenderResult.class);
        assertThat(guarded.sql()).isEqualTo("delete from users where \"id\" = 5");
        UpdateOrDeleteSingleCommandRenderResult single = (UpdateOrDeleteSingleCommandRenderResult) guarded;
        assertThat(single.getSelectQuery()).isEqualTo("select count(1) as count from users where \"id\" = 5");

        GuiSqlCommandRenderResult plain = print("pg delete, filter, multi on",
                PostgresDeleteCommand.from(detail(TEMPLATE_TABLE, true, filters, null)).render(TABLE_PARAM));
        assertThat(plain).isNotInstanceOf(UpdateOrDeleteSingleCommandRenderResult.class);
        assertThat(plain.sql()).isEqualTo("delete from users where \"id\" = 5");
    }

    /**
     * BF-070: a PostgreSQL delete without filters and without multi-modify builds the single-row guard's count query from
     * the rendered table ({@code users}), the same table the delete uses, not from the mustache template ({@code {{tbl}}}).
     */
    @Test
    void postgresDeleteWithoutFilterBuildsTheCountQueryFromTheRenderedTable() {
        UpdateOrDeleteSingleCommandRenderResult result = (UpdateOrDeleteSingleCommandRenderResult) print("pg delete, mustache table, no filter",
                PostgresDeleteCommand.from(detail(TEMPLATE_TABLE, false, List.of(), null)).render(TABLE_PARAM));

        assertThat(result.sql()).isEqualTo("delete from users");
        assertThat(result.getSelectQuery()).isEqualTo("select count(1) as count from users");
    }

    @Test
    void mysqlDeleteAddsLimitOneUnlessMultiModifyIsOn() {
        List<Map<String, Object>> filters = List.of(filter("id", "=", 5));

        assertThat(print("mysql delete, filter, multi off", MysqlDeleteCommand.from(detail(TEMPLATE_TABLE, false, filters, null)).render(TABLE_PARAM)).sql())
                .isEqualTo("delete from users where `id` = ?  limit 1");
        GuiSqlCommandRenderResult multi = print("mysql delete, filter, multi on", MysqlDeleteCommand.from(detail(TABLE, true, filters, null)).render(NO_PARAMS));
        assertThat(multi.sql()).isEqualTo("delete from users where `id` = ? ");
        assertThat(multi.bindParams()).containsExactly(5);

        GuiSqlCommandRenderResult noFilterSingle = print("mysql delete, no filter, multi off", MysqlDeleteCommand.from(detail(TABLE, false, List.of(), null)).render(NO_PARAMS));
        assertThat(noFilterSingle.sql()).isEqualTo("delete from users limit 1");
        assertThat(noFilterSingle.bindParams()).isEmpty();
        assertThat(print("mysql delete, no filter, multi on", MysqlDeleteCommand.from(detail(TABLE, true, List.of(), null)).render(NO_PARAMS)).sql())
                .isEqualTo("delete from users");
    }

    // ---- update ----

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void updateWithAnEmptyChangeSetIsRejectedForBothDialects(boolean allowMultiModify) {
        Map<String, Object> mysql = detail(TABLE, allowMultiModify, List.of(filter("id", "=", 1)), keyValueChangeSet());

        assertPluginError(() -> MysqlUpdateCommand.from(mysql).render(NO_PARAMS), PluginCommonError.INVALID_UPDATE_COMMAND, "UPDATE_DATA_EMPTY");
        assertPluginError(() -> PostgresUpdateCommand.from(mysql).render(NO_PARAMS), PluginCommonError.INVALID_UPDATE_COMMAND, "UPDATE_DATA_EMPTY");
    }

    @Test
    void mysqlUpdateWithFilterBindsSetValuesBeforeFilterValuesAndLimitsToOneRow() {
        Map<String, Object> detail = detail(TEMPLATE_TABLE, false, List.of(filter("id", "=", 5)), keyValueChangeSet("name", "jack", "age", 30));

        GuiSqlCommandRenderResult result = print("mysql update, filter, multi off", MysqlUpdateCommand.from(detail).render(TABLE_PARAM));

        assertThat(result.sql()).isEqualTo("update users set `name`=?,`age`=? where `id` = ?  limit 1");
        assertThat(result.bindParams()).containsExactly("jack", 30, 5);
        assertThat(result).isNotInstanceOf(UpdateOrDeleteSingleCommandRenderResult.class);
    }

    @Test
    void postgresUpdateGuardsASingleRowWhenMultiModifyIsOffAndIsPlainWhenOn() {
        Map<String, Object> single = detail(TABLE, false, List.of(filter("id", "=", 5)), keyValueChangeSet("age", 30));
        GuiSqlCommandRenderResult guarded = print("pg update, filter, multi off", PostgresUpdateCommand.from(single).render(NO_PARAMS));
        assertThat(guarded).isInstanceOf(UpdateOrDeleteSingleCommandRenderResult.class);
        assertThat(guarded.sql()).isEqualTo("update users set \"age\"=30 where \"id\" = 5");
        assertThat(((UpdateOrDeleteSingleCommandRenderResult) guarded).getSelectQuery()).isEqualTo("select count(1) as count from users where \"id\" = 5");

        GuiSqlCommandRenderResult noFilter = print("pg update, no filter, multi off",
                PostgresUpdateCommand.from(detail(TABLE, false, List.of(), keyValueChangeSet("age", 30))).render(NO_PARAMS));
        assertThat(noFilter).as("without a filter the guard still counts every row").isInstanceOf(UpdateOrDeleteSingleCommandRenderResult.class);
        assertThat(noFilter.sql()).isEqualTo("update users set \"age\"=30");
        assertThat(((UpdateOrDeleteSingleCommandRenderResult) noFilter).getSelectQuery()).isEqualTo("select count(1) as count from users");

        GuiSqlCommandRenderResult multi = print("pg update, filter, multi on",
                PostgresUpdateCommand.from(detail(TABLE, true, List.of(filter("id", "=", 5)), keyValueChangeSet("age", 30))).render(NO_PARAMS));
        assertThat(multi).isNotInstanceOf(UpdateOrDeleteSingleCommandRenderResult.class);
        assertThat(multi.sql()).isEqualTo("update users set \"age\"=30 where \"id\" = 5");
    }

    /**
     * BF-030 (plan section 9 row "UpdateCommand.render without filters returns a plain result before appendLimit"): a
     * MySQL GUI update with multi-modify off and no filter is limited to one row, as the delete in the same case is; with
     * multi-modify on it still has no limit.
     */
    @Test
    void mysqlUpdateWithoutFilterIsLimitedToOneRowUnlessMultiModifyBF030() {
        GuiSqlCommandRenderResult single = print("mysql update, no filter, multi off",
                MysqlUpdateCommand.from(detail(TABLE, false, List.of(), keyValueChangeSet("age", 30))).render(NO_PARAMS));
        GuiSqlCommandRenderResult multi = print("mysql update, no filter, multi on",
                MysqlUpdateCommand.from(detail(TABLE, true, List.of(), keyValueChangeSet("age", 30))).render(NO_PARAMS));

        assertThat(single.sql()).isEqualTo("update users set `age`=? limit 1");
        assertThat(single.bindParams()).containsExactly(30);
        assertThat(multi.sql()).isEqualTo("update users set `age`=?");
        assertThat(MysqlDeleteCommand.from(detail(TABLE, false, List.of(), null)).render(NO_PARAMS).sql())
                .as("the delete in the same case").endsWith(" limit 1");
    }

    // ---- insert ----

    @Test
    void insertRendersPlaceholdersForMysqlAndDollarQuotedLiteralsForPostgres() {
        Map<String, Object> detail = detail(TABLE, false, null, keyValueChangeSet("name", "jack", "age", 30));

        GuiSqlCommandRenderResult mysql = print("mysql insert", MysqlInsertCommand.from(detail).render(NO_PARAMS));
        assertThat(mysql.sql()).isEqualTo("insert into users (`name`,`age`) values (?,?)");
        assertThat(mysql.bindParams()).containsExactly("jack", 30);

        GuiSqlCommandRenderResult postgres = print("pg insert", PostgresInsertCommand.from(detail).render(NO_PARAMS));
        assertThat(postgres.sql()).matches("insert into users \\(\"name\",\"age\"\\) values \\(" + pgQuoted("jack", 1) + ",30\\);");
        assertThat(postgres.bindParams()).isEmpty();
    }

    @Test
    void insertWithAnEmptyChangeSetIsRejected() {
        Map<String, Object> empty = detail(TABLE, false, null, keyValueChangeSet());

        assertPluginError(() -> MysqlInsertCommand.from(empty).render(NO_PARAMS), PluginCommonError.INVALID_INSERT_COMMAND, "INSERT_DATA_EMPTY");
        assertPluginError(() -> PostgresInsertCommand.from(empty).render(NO_PARAMS), PluginCommonError.INVALID_INSERT_COMMAND, "INSERT_DATA_EMPTY");
    }

    @Test
    void insertWithAnObjectChangeSetRendersTheJsonObjectAndRejectsNonObjects() {
        GuiSqlCommandRenderResult result = print("mysql insert, object change set",
                MysqlInsertCommand.from(detail(TABLE, false, null, objectChangeSet("{\"a\":1,\"b\":\"x\"}"))).render(NO_PARAMS));
        assertThat(result.sql()).isEqualTo("insert into users (`a`,`b`) values (?,?)");
        assertThat(result.bindParams()).containsExactly(1, "x");

        assertPluginError(() -> MysqlInsertCommand.from(detail(TABLE, false, null, objectChangeSet("[1,2]"))).render(NO_PARAMS),
                PluginCommonError.INVALID_GUI_SETTINGS, "GUI_INVALID_JSON_MAP_TYPE");
        assertPluginError(() -> MysqlInsertCommand.from(detail(TABLE, false, null, objectChangeSet("not json"))).render(NO_PARAMS),
                PluginCommonError.INVALID_GUI_SETTINGS, "GUI_INVALID_JSON_MAP_TYPE");
    }

    // ---- bulk insert ----

    @Test
    void bulkInsertRendersOneValuesGroupPerRowInBothDialects() {
        Map<String, Object> detail = bulkDetail("[{\"a\":1,\"b\":\"x\"},{\"a\":2,\"b\":\"y\"}]", null);

        GuiSqlCommandRenderResult mysql = print("mysql bulk insert", MysqlBulkInsertCommand.from(detail).render(NO_PARAMS));
        assertThat(mysql.sql()).isEqualTo("insert into users (`a`,`b`) values (?,?),(?,?)");
        assertThat(mysql.bindParams()).containsExactly(1, "x", 2, "y");

        GuiSqlCommandRenderResult postgres = print("pg bulk insert", PostgresBulkInsertCommand.from(detail).render(NO_PARAMS));
        assertThat(postgres.sql()).matches("insert into users \\(\"a\",\"b\"\\) values \\(1," + pgQuoted("x", 1) + "\\),\\(2,"
                + pgQuoted("y", 2) + "\\)");
        assertThat(postgres.bindParams()).isEmpty();
    }

    /** BF-050: a render result asks for generated keys unless its command says otherwise; the shared bulk insert does. */
    @Test
    void renderResultsAskForGeneratedKeysUnlessTheCommandSaysOtherwiseBF050() {
        Map<String, Object> detail = bulkDetail("[{\"a\":1,\"b\":\"x\"},{\"a\":2,\"b\":\"y\"}]", null);
        GuiSqlCommandRenderResult mysql = MysqlBulkInsertCommand.from(detail).render(NO_PARAMS);
        GuiSqlCommandRenderResult postgres = PostgresBulkInsertCommand.from(detail).render(NO_PARAMS);
        System.out.println("[GuiSqlCommandRenderTest] generated keys: mysql bulk " + mysql.returnsGeneratedKeys() + ", pg bulk " + postgres.returnsGeneratedKeys());
        assertThat(mysql.returnsGeneratedKeys()).isTrue();
        assertThat(postgres.returnsGeneratedKeys()).isTrue();
        assertThat(new GuiSqlCommandRenderResult("select 1", List.of()).returnsGeneratedKeys()).isTrue();
        assertThat(new GuiSqlCommandRenderResult("select 1", List.of(), false).returnsGeneratedKeys()).isFalse();
    }

    @Test
    void bulkInsertRejectsEmptyMisalignedAndMalformedRecords() {
        assertPluginError(() -> MysqlBulkInsertCommand.from(bulkDetail("[]", null)).render(NO_PARAMS),
                PluginCommonError.INVALID_INSERT_COMMAND, "INSERT_DATA_EMPTY");
        assertPluginError(() -> MysqlBulkInsertCommand.from(bulkDetail("[{\"a\":1},{\"b\":2}]", null)).render(NO_PARAMS),
                PluginCommonError.INVALID_INSERT_COMMAND, "INVALID_INSERT_DATA");
        assertPluginError(() -> MysqlBulkInsertCommand.from(bulkDetail("[{\"a\":1,\"b\":1},{\"a\":2}]", null)).render(NO_PARAMS),
                PluginCommonError.INVALID_INSERT_COMMAND, "INVALID_INSERT_DATA");
        assertPluginError(() -> MysqlBulkInsertCommand.from(bulkDetail("not json", null)).render(NO_PARAMS),
                PluginCommonError.INVALID_GUI_SETTINGS, "GUI_INVALID_JSON_ARRAY_FORMAT");
        assertPluginError(() -> MysqlBulkInsertCommand.from(bulkDetail("{\"a\":1}", null)).render(NO_PARAMS),
                PluginCommonError.INVALID_GUI_SETTINGS, "GUI_INVALID_JSON_ARRAY_FORMAT");
        Map<String, Object> noRecords = new HashMap<>();
        noRecords.put(TABLE_KEY, TABLE);
        assertPluginError(() -> MysqlBulkInsertCommand.from(noRecords), PluginCommonError.INVALID_GUI_SETTINGS, "GUI_CHANGE_SET_EMPTY");
    }

    // ---- bulk update ----

    @Test
    void bulkUpdateRendersCaseWhenPerColumnWithBindsInOrderForMysql() {
        Map<String, Object> detail = bulkDetail("[{\"id\":1,\"name\":\"a\"},{\"id\":2,\"name\":\"b\"}]", "id");

        GuiSqlCommandRenderResult result = print("mysql bulk update", MysqlBulkUpdateCommand.from(detail).render(NO_PARAMS));

        assertThat(result.sql()).isEqualTo("UPDATE users set\n`name` = CASE WHEN `id` = ? THEN ? WHEN `id` = ? THEN ? ELSE `name` END\nwhere `id` in (?,?)");
        assertThat(result.bindParams()).as("pk and value per WHEN, then the pks of the where").containsExactly(1, "a", 2, "b", 1, 2);
    }

    @Test
    void bulkUpdateRendersLiteralsForPostgres() {
        Map<String, Object> detail = bulkDetail("[{\"id\":1,\"qty\":5},{\"id\":2,\"qty\":6}]", "id");

        GuiSqlCommandRenderResult result = print("pg bulk update", PostgresBulkUpdateCommand.from(detail).render(NO_PARAMS));

        assertThat(result.sql()).isEqualTo("UPDATE users set\n\"qty\" = CASE WHEN \"id\" = 1 THEN 5 WHEN \"id\" = 2 THEN 6 ELSE \"qty\" END\nwhere \"id\" in (1,2)");
        assertThat(result.bindParams()).isEmpty();
    }

    @Test
    void bulkUpdateRejectsEmptyRecordsAMissingPrimaryKeyInARowAndAMissingPrimaryKeySetting() {
        assertPluginError(() -> MysqlBulkUpdateCommand.from(bulkDetail("[]", "id")).render(NO_PARAMS),
                PluginCommonError.INVALID_INSERT_COMMAND, "UPDATE_DATA_EMPTY");
        assertPluginError(() -> MysqlBulkUpdateCommand.from(bulkDetail("[{\"id\":1,\"a\":1},{\"a\":2}]", "id")).render(NO_PARAMS),
                PluginCommonError.INVALID_INSERT_COMMAND, "BULK_UPDATE_DATA_NOT_CONTAIN_PRIMARY_KEY");
        assertPluginError(() -> MysqlBulkUpdateCommand.from(bulkDetail("[{\"id\":1}]", null)),
                PluginCommonError.INVALID_GUI_SETTINGS, "GUI_PRIMARY_KEY_EMPTY");
    }

    // ---- upsert ----

    private static Map<String, Object> upsertDetail(Map<String, Object> insertChangeSet, Map<String, Object> updateChangeSet) {
        Map<String, Object> detail = new HashMap<>();
        detail.put(TABLE_KEY, TABLE);
        detail.put(INSERT_CHANGE_SET_FORM_KEY, insertChangeSet);
        detail.put(UPDATE_CHANGE_SET_FORM_KEY, updateChangeSet);
        return detail;
    }

    @Test
    void mysqlUpsertWithAnUpdateSetUsesOnDuplicateKeyUpdate() {
        GuiSqlCommandRenderResult result = print("mysql upsert",
                MysqlUpsertCommand.from(upsertDetail(keyValueChangeSet("id", 1, "name", "a"), keyValueChangeSet("name", "b"))).render(NO_PARAMS));

        assertThat(result.sql()).isEqualTo("insert into users (`id`,`name`) values (?,?) on duplicate key update `name`=?");
        assertThat(result.bindParams()).containsExactly(1, "a", "b");
    }

    @Test
    void mysqlUpsertWithAnEmptyUpdateSetBecomesInsertIgnore() {
        GuiSqlCommandRenderResult result = print("mysql upsert, no update set",
                MysqlUpsertCommand.from(upsertDetail(keyValueChangeSet("id", 1), keyValueChangeSet())).render(NO_PARAMS));

        assertThat(result.sql()).isEqualTo("insert ignore into users (`id`) values (?)");
        assertThat(result.bindParams()).containsExactly(1);
    }

    @Test
    void mysqlUpsertRejectsAnEmptyInsertSetAndMissingChangeSets() {
        assertPluginError(() -> MysqlUpsertCommand.from(upsertDetail(keyValueChangeSet(), keyValueChangeSet("a", 1))).render(NO_PARAMS),
                PluginCommonError.INVALID_UPSERT_COMMAND, "UPSERT_DATA_EMPTY");
        assertPluginError(() -> MysqlUpsertCommand.from(upsertDetail(null, keyValueChangeSet("a", 1))),
                PluginCommonError.INVALID_GUI_SETTINGS, "GUI_OPERATION_DATA_EMPTY");
    }

    // ---- shared behaviour ----

    @Test
    void mustacheKeysOfEveryCommandComeFromItsFiltersAndChangeSets() {
        Map<String, Object> filtered = detail(TABLE, false, List.of(filter("id", "=", "{{fid}}")), keyValueChangeSet("a", "{{val}}"));

        assertThat(MysqlUpdateCommand.from(filtered).extractMustacheKeys()).containsExactlyInAnyOrder("{{fid}}", "{{val}}");
        assertThat(MysqlDeleteCommand.from(filtered).extractMustacheKeys()).containsExactly("{{fid}}");
        assertThat(MysqlInsertCommand.from(filtered).extractMustacheKeys()).containsExactly("{{val}}");
        assertThat(MysqlBulkInsertCommand.from(bulkDetail("{{rows}}", null)).extractMustacheKeys()).containsExactly("{{rows}}");
        assertThat(MysqlBulkUpdateCommand.from(bulkDetail("{{rows}}", "id")).extractMustacheKeys()).containsExactly("{{rows}}");
        assertThat(MysqlUpsertCommand.from(upsertDetail(keyValueChangeSet("a", "{{i}}"), keyValueChangeSet("b", "{{u}}"))).extractMustacheKeys())
                .containsExactlyInAnyOrder("{{i}}", "{{u}}");
    }

    @Test
    void onlyInsertAndUpsertCommandsAreInsertCommands() {
        Map<String, Object> detail = detail(TABLE, false, List.of(filter("id", "=", 1)), keyValueChangeSet("a", 1));
        List<GuiSqlCommand> inserting = List.of(MysqlInsertCommand.from(detail), MysqlBulkInsertCommand.from(bulkDetail("[]", null)),
                MysqlUpsertCommand.from(upsertDetail(keyValueChangeSet("a", 1), keyValueChangeSet())));
        List<GuiSqlCommand> notInserting = List.of(MysqlUpdateCommand.from(detail), MysqlDeleteCommand.from(detail),
                MysqlBulkUpdateCommand.from(bulkDetail("[]", "id")));

        assertThat(inserting).allSatisfy(command -> assertThat(command.isInsertCommand()).isTrue());
        assertThat(notInserting).allSatisfy(command -> assertThat(command.isInsertCommand()).isFalse());
    }

    @Test
    void fromRejectsABlankTable() {
        assertPluginError(() -> MysqlDeleteCommand.from(detail(" ", false, List.of(), null)), PluginCommonError.INVALID_GUI_SETTINGS, "GUI_FIELD_EMPTY");
    }
}
