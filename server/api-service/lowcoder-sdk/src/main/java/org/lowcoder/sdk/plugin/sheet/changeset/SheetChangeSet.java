package org.lowcoder.sdk.plugin.sheet.changeset;

import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.exception.PluginException;

import java.util.Map;

import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_GUI_SETTINGS;
import static org.lowcoder.sdk.plugin.common.constant.Constants.*;

public abstract class SheetChangeSet {

    public abstract SheetChangeSetRow render(Map<String, Object> requestMap);

    public static SheetChangeSet parseChangeSet(Map<String, Object> commandDetail) {

        Object c = commandDetail.get(CHANGE_SET_FORM_KEY);
        if (c instanceof Map<?, ?>) {
            return getFromChangeSet((Map<String, Object>) c);
        }

        throw new PluginException(INVALID_GUI_SETTINGS, "GUI_OPERATION_DATA_EMPTY");
    }

    private static SheetChangeSet getFromChangeSet(Map<String, Object> changeSet) {
        if (MapUtils.isEmpty(changeSet)) {
            throw new PluginException(INVALID_GUI_SETTINGS, "GUI_OPERATION_DATA_EMPTY");
        }

        String changeSetType = MapUtils.getString(changeSet, COMP_TYPE_KEY, "").toUpperCase();
        if (StringUtils.isBlank(changeSetType)) {
            throw new PluginException(INVALID_GUI_SETTINGS, "GUI_OPERATION_DATA_TYPE_ERROR");
        }

        Object data = MapUtils.getObject(changeSet, COMP_KEY);

        if (changeSetType.equals(CHANGE_SET_TYPE_KEY_VALUE_PAIRS)) {
            return new SheetKeyValuePairChangeSet(data);
        }

        if (changeSetType.equals(CHANGE_SET_TYPE_OBJECT)) {
            if (!(data instanceof String)) {
                throw new PluginException(INVALID_GUI_SETTINGS, "GUI_INVALID_PARAM", data.getClass().getSimpleName());
            }
            return new SheetObjectChangeSet((String) data);
        }

        throw new PluginException(INVALID_GUI_SETTINGS, "GUI_INVALID_DATA_TYPE", changeSetType);
    }
}
