package org.lowcoder.sdk.plugin.sheet.changeset;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.util.JsonUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static java.util.Collections.emptyMap;
import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_GUI_SETTINGS;
import static org.lowcoder.sdk.util.MustacheHelper.renderMustacheJson;

@Slf4j
public class SheetKeyValuePairChangeSet extends SheetChangeSet {

    /** What a value without content writes: a sheet cell has no NULL, so it is left empty. */
    static final String EMPTY_CELL = "";

    private Map<String, String> map = emptyMap();

    /**
     * The column values; a later entry of a column replaces an earlier one, and an entry without a value (or with a
     * null one) is kept (BF-047: {@code Collectors.toMap} refused the null value with a NullPointerException).
     */
    @SuppressWarnings("unchecked")
    public SheetKeyValuePairChangeSet(Object comp) {
        if (!(comp instanceof List<?> list)) {
            return;
        }
        Map<String, String> columnValues = new HashMap<>();
        for (Object o : list) {
            if (!(o instanceof Map<?, ?> map)) {
                throw new PluginException(INVALID_GUI_SETTINGS, "GUI_CHANGE_SET_TYPE_ERROR", o.getClass().getSimpleName());
            }
            String column = MapUtils.getString((Map<String, ?>) map, "column");
            if (StringUtils.isBlank(column)) {
                throw new PluginException(INVALID_GUI_SETTINGS, "GUI_CHANGE_SET_FIELD_EMPTY");
            }
            columnValues.put(column, MapUtils.getString((Map<String, ?>) map, "value"));
        }
        map = columnValues;
    }

    /** A null value writes {@link #EMPTY_CELL}; the sheet handlers write every value as text, so a null would be "null". */
    @Override
    public SheetChangeSetRow render(Map<String, Object> requestMap) {
        List<SheetChangeSetItem> result = new ArrayList<>();
        for (String column : map.keySet()) {
            String value = map.get(column);
            Object renderedValue = value == null ? EMPTY_CELL : JsonUtils.jsonNodeToObject(renderMustacheJson(value, requestMap));
            result.add(new SheetChangeSetItem(column, renderedValue));
        }
        return new SheetChangeSetRow(result);
    }

}
