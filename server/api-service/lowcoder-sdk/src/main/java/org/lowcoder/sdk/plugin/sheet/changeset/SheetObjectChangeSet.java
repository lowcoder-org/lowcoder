package org.lowcoder.sdk.plugin.sheet.changeset;


import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_GUI_SETTINGS;
import static org.lowcoder.sdk.plugin.sheet.changeset.SheetChangeSetRow.fromJsonNode;

import java.util.Map;

import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.util.MustacheHelper;

import com.fasterxml.jackson.databind.JsonNode;

public class SheetObjectChangeSet extends SheetChangeSet {
    private final String str;

    public SheetObjectChangeSet(String str) {
        this.str = str;
    }

    @Override
    public SheetChangeSetRow render(Map<String, Object> requestMap) {
        JsonNode jsonNode;
        try {
            jsonNode = MustacheHelper.renderMustacheJson(str, requestMap);
        } catch (Throwable e) {
            throw new PluginException(INVALID_GUI_SETTINGS, "GUI_INVALID_JSON_MAP_TYPE");
        }
        return fromJsonNode(jsonNode);
    }

}
