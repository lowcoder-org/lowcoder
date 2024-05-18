package org.lowcoder.sdk.plugin.sheet.changeset;

import com.fasterxml.jackson.databind.JsonNode;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.util.MustacheHelper;

import java.util.Map;

import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_GUI_SETTINGS;
import static org.lowcoder.sdk.plugin.common.constant.Constants.RECORD_FORM_KEY;

public class SheetBulkObjectChangeSet {

    private final String str;

    public SheetBulkObjectChangeSet(String str) {
        this.str = str;
    }

    public SheetChangeSetRows render(Map<String, Object> requestMap) {
        JsonNode jsonNode;
        try {
            jsonNode = MustacheHelper.renderMustacheJson(str, requestMap);
        } catch (Throwable e) {
            throw new PluginException(INVALID_GUI_SETTINGS, "GUI_INVALID_JSON_ARRAY_FORMAT");
        }

        return SheetChangeSetRows.fromJsonNode(jsonNode);
    }

    public static SheetBulkObjectChangeSet parseBulkRecords(Map<String, Object> commandDetail) {
        Object o = commandDetail.get(RECORD_FORM_KEY);
        if (!(o instanceof String str)) {
            throw new PluginException(INVALID_GUI_SETTINGS, "GUI_CHANGE_SET_EMPTY");
        }
        return new SheetBulkObjectChangeSet(str);
    }
}
