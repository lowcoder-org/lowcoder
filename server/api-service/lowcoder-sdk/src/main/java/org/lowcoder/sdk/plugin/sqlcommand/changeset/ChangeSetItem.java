package org.lowcoder.sdk.plugin.sqlcommand.changeset;

import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue;

public record ChangeSetItem(String column, GuiSqlValue guiSqlValue) {
}