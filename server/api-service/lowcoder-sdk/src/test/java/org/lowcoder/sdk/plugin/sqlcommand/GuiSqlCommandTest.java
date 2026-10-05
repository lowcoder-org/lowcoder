package org.lowcoder.sdk.plugin.sqlcommand;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.lowcoder.sdk.plugin.common.constant.Constants.ALLOW_MULTI_MODIFY_KEY;
import static org.lowcoder.sdk.plugin.common.constant.Constants.TABLE_KEY;

import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.exception.PluginCommonError;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sqlcommand.GuiSqlCommand.GuiSqlCommandRenderResult;

/** The shared parsing helpers and defaults of the {@link GuiSqlCommand} interface. */
class GuiSqlCommandTest {

    private static final GuiSqlCommand MINIMAL = new GuiSqlCommand() {
        @Override
        public GuiSqlCommandRenderResult render(Map<String, Object> requestMap) {
            return new GuiSqlCommandRenderResult("select 1", List.of());
        }

        @Override
        public boolean isInsertCommand() {
            return false;
        }

        @Override
        public Set<String> extractMustacheKeys() {
            return Set.of();
        }
    };

    @Test
    void parseTableReturnsTheTableAndRejectsMissingOrBlank() {
        assertThat(GuiSqlCommand.parseTable(Map.of(TABLE_KEY, "users"))).isEqualTo("users");
        for (Map<String, Object> detail : List.of(Map.<String, Object>of(), Map.<String, Object>of(TABLE_KEY, " "))) {
            assertThatThrownBy(() -> GuiSqlCommand.parseTable(detail)).isInstanceOfSatisfying(PluginException.class, e -> {
                assertThat(e.getError()).isEqualTo(PluginCommonError.INVALID_GUI_SETTINGS);
                assertThat(e.getMessageKey()).isEqualTo("GUI_FIELD_EMPTY");
            });
        }
    }

    @Test
    void parseAllowMultiModifyDefaultsToFalseAndReadsBooleansAndBooleanStrings() {
        assertThat(GuiSqlCommand.parseAllowMultiModify(Map.of())).as("absent means one row only").isFalse();
        assertThat(GuiSqlCommand.parseAllowMultiModify(Map.of(ALLOW_MULTI_MODIFY_KEY, true))).isTrue();
        assertThat(GuiSqlCommand.parseAllowMultiModify(Map.of(ALLOW_MULTI_MODIFY_KEY, "true"))).isTrue();
        assertThat(GuiSqlCommand.parseAllowMultiModify(Map.of(ALLOW_MULTI_MODIFY_KEY, false))).isFalse();
    }

    @Test
    void defaultsRenderWithBindParametersAndRefuseToEscapeWithoutADialect() {
        assertThat(MINIMAL.isRenderWithRawSql()).isFalse();
        assertThatThrownBy(() -> MINIMAL.escapeStrFunc().escape("x")).isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void renderResultExposesSqlAndBindParams() {
        GuiSqlCommandRenderResult result = new GuiSqlCommandRenderResult("select ?", List.of(1));

        assertThat(result.sql()).isEqualTo("select ?");
        assertThat(result.bindParams()).containsExactly(1);
    }
}
