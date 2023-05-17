package org.lowcoder.plugin.googlesheets.queryhandler;


import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;

import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.lowcoder.sdk.exception.PluginException;

import com.google.common.collect.Lists;

public class GoogleSheetsActionHandlerFactory {
    private static final Map<String, ? extends GoogleSheetsActionHandler> HANDLER_MAP;

    static {
        HANDLER_MAP = Lists.newArrayList(new GoogleSheetsReadDataHandler(),
                        new GoogleSheetsAppendDataHandler(),
                        new GoogleSheetsUpdateDataHandler(),
                        new GoogleSheetsClearDataHandler(),
                        new GoogleSheetsDeleteDataHandler())
                .stream()
                .collect(Collectors.toMap(GoogleSheetsActionHandler::getActionType, Function.identity()));
    }

    public static GoogleSheetsActionHandler getGoogleSheetsActionHandler(String actionType) {
        GoogleSheetsActionHandler googleSheetsActionHandler = HANDLER_MAP.get(actionType);
        if (googleSheetsActionHandler == null) {
            throw new PluginException(QUERY_ARGUMENT_ERROR, "GOOGLESHEETS_QUERY_PARAM_ERROR", actionType);
        }
        return googleSheetsActionHandler;
    }
}
