package org.lowcoder.sdk.plugin.sqlcommand.changeset;

import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_GUI_SETTINGS;
import static org.lowcoder.sdk.util.JsonUtils.toJson;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import javax.annotation.Nonnull;

import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.tuple.Pair;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.util.MustacheHelper;
import org.lowcoder.sdk.util.SqlGuiUtils;
import org.lowcoder.sdk.util.SqlGuiUtils.GuiSqlValue;

import com.google.common.annotations.VisibleForTesting;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class KeyValuePairChangeSet extends ChangeSet {

    private final Map<String, Object> columnValueMap;

    private KeyValuePairChangeSet(Map<String, Object> columnValueMap) {
        this.columnValueMap = columnValueMap;
    }

    public KeyValuePairChangeSet(Object comp) {
        this(parseColumnValueMap(comp));
    }

    @SuppressWarnings("unchecked")
    @Nonnull
    private static Map<String, Object> parseColumnValueMap(Object comp) {
        if (!(comp instanceof List<?> list)) {
            throw new PluginException(INVALID_GUI_SETTINGS, "GUI_INVALID_PARAM", toJson(comp));
        }

        return list.stream()
                .map(o -> {
                    if (!(o instanceof Map<?, ?> map)) {
                        throw new PluginException(INVALID_GUI_SETTINGS, "GUI_CHANGE_SET_TYPE_ERROR", o.getClass().getSimpleName());
                    }

                    String column = MapUtils.getString((Map<String, ?>) map, "column");
                    if (StringUtils.isBlank(column)) {
                        throw new PluginException(INVALID_GUI_SETTINGS, "GUI_CHANGE_SET_FIELD_EMPTY");
                    }

                    Object value = MapUtils.getObject((Map<String, ?>) map, "value");
                    return Pair.of(column, value);
                })
                .collect(Collectors.toMap(Pair::getKey, Pair::getValue, (a, b) -> b, LinkedHashMap::new));
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
