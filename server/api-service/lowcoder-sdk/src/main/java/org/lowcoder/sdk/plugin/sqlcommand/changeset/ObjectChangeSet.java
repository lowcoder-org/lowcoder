package org.lowcoder.sdk.plugin.sqlcommand.changeset;

import com.fasterxml.jackson.databind.JsonNode;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.util.MustacheHelper;

import java.util.Map;
import java.util.Set;

import static org.lowcoder.sdk.exception.PluginCommonError.INVALID_GUI_SETTINGS;

public class ObjectChangeSet extends ChangeSet {
    private final String str;

    public ObjectChangeSet(String str) {
        this.str = str;
    }

    @Override
    public ChangeSetRow render(Map<String, Object> requestMap) {
        JsonNode jsonNode;
        try {
            jsonNode = MustacheHelper.renderMustacheJson(str, requestMap);
        } catch (Throwable e) {
            throw new PluginException(INVALID_GUI_SETTINGS, "GUI_INVALID_JSON_MAP_TYPE");
        }

        return new ChangeSetRow(jsonNode);
    }

    @Override
    public Set<String> extractMustacheKeys() {
        return MustacheHelper.extractMustacheKeysWithCurlyBraces(str);
    }
}
