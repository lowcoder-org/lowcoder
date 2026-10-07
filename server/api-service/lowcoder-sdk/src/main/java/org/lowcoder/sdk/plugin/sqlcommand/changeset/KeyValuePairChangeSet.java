package org.lowcoder.sdk.plugin.sqlcommand.changeset;

import com.google.common.annotations.VisibleForTesting;
import jakarta.annotation.Nonnull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.util.MustacheHelper;
import org.lowcoder.sdk.util.SqlGuiUtils;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue;

import java.util.*;
import java.util.stream.Collectors;

import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_GUI_SETTINGS;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

@Slf4j
public class KeyValuePairChangeSet extends ChangeSet {

    private final Map<String, Object> columnValueMap;

    private KeyValuePairChangeSet(Map<String, Object> columnValueMap) {
        this.columnValueMap = columnValueMap;
    }

    public KeyValuePairChangeSet(Object comp) {
        this(parseColumnValueMap(comp));
    }

    /**
     * The column values in the order written; a later entry of a column replaces an earlier one. An entry without a value
     * (or with a null one) sets the column to NULL (BF-047: {@code Collectors.toMap} refused the null value with a
     * NullPointerException, so a GUI insert or update could not set a column to NULL).
     */
    @SuppressWarnings("unchecked")
    @Nonnull
    private static Map<String, Object> parseColumnValueMap(Object comp) {
        if (!(comp instanceof List<?> list)) {
            throw new PluginException(INVALID_GUI_SETTINGS, "GUI_INVALID_PARAM", toJson(comp));
        }

        Map<String, Object> columnValueMap = new LinkedHashMap<>();
        for (Object o : list) {
            if (!(o instanceof Map<?, ?> map)) {
                throw new PluginException(INVALID_GUI_SETTINGS, "GUI_CHANGE_SET_TYPE_ERROR", o.getClass().getSimpleName());
            }

            String column = MapUtils.getString((Map<String, ?>) map, "column");
            if (StringUtils.isBlank(column)) {
                throw new PluginException(INVALID_GUI_SETTINGS, "GUI_CHANGE_SET_FIELD_EMPTY");
            }

            columnValueMap.put(column, MapUtils.getObject((Map<String, ?>) map, "value"));
        }
        return columnValueMap;
    }

    @VisibleForTesting
    public static KeyValuePairChangeSet buildForTest(Map<String, Object> kvMap) {
        return new KeyValuePairChangeSet(kvMap);
    }

    @Override
    public ChangeSetRow render(Map<String, Object> requestMap) {
        List<ChangeSetItem> result = new ArrayList<>();
        for (var entry : columnValueMap.entrySet()) {
            String column = entry.getKey();
            Object value = entry.getValue();
            GuiSqlValue guiSqlValue = SqlGuiUtils.renderPsBindValue(value, requestMap);
            result.add(new ChangeSetItem(column, guiSqlValue));
        }
        return new ChangeSetRow(result);
    }

    @Override
    public Set<String> extractMustacheKeys() {
        return columnValueMap.values().stream()
                .filter(String.class::isInstance)
                .flatMap(o -> MustacheHelper.extractMustacheKeysWithCurlyBraces((String) o).stream())
                .collect(Collectors.toSet());
    }
}
