package org.lowcoder.plugin.googlesheets.model;


import static org.lowcoder.sdk.exception.PluginCommonError.DATASOURCE_ARGUMENT_ERROR;
import static org.lowcoder.sdk.util.MustacheHelper.renderMustacheString;

import java.util.Map;

import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetChangeSet;
import org.lowcoder.sdk.plugin.sheet.changeset.SheetChangeSetRow;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class GoogleSheetsUpdateDataRequest implements GoogleSheetsActionRequest {
    private String spreadsheetId;
    private String sheetName;
    private int rowIndex;
    private String rowIndexString;
    private SheetChangeSet changeSet;

    private SheetChangeSetRow changeSetItems;

    public static GoogleSheetsUpdateDataRequest from(Map<String, Object> commandDetail) {
        SheetChangeSet changeSet = SheetChangeSet.parseChangeSet(commandDetail);
        String spreadsheetId = MapUtils.getString(commandDetail, "spreadsheetId");
        String sheetName = MapUtils.getString(commandDetail, "sheetName");
        String rowIndexString = MapUtils.getString(commandDetail, "rowIndexString");
        GoogleSheetsUpdateDataRequest googleSheetsUpdateDataRequest = new GoogleSheetsUpdateDataRequest();
        googleSheetsUpdateDataRequest.setSpreadsheetId(spreadsheetId);
        googleSheetsUpdateDataRequest.setSheetName(sheetName);
        googleSheetsUpdateDataRequest.setRowIndexString(rowIndexString);
        googleSheetsUpdateDataRequest.setChangeSet(changeSet);
        return googleSheetsUpdateDataRequest;
    }

    @Override
    public void renderParams(Map<String, Object> paramMap) {
        spreadsheetId = renderMustacheString(spreadsheetId, paramMap);
        sheetName = renderMustacheString(sheetName, paramMap);
        changeSetItems = changeSet.render(paramMap);
        String rowIndexTemp = renderMustacheString(rowIndexString, paramMap);
        try {
            rowIndex = Integer.parseInt(rowIndexTemp);
        } catch (NumberFormatException e) {
            throw new PluginException(DATASOURCE_ARGUMENT_ERROR, "DATASOURCE_ARGUMENT_ERROR");
        }
    }

    @Override
    public boolean hasInvalidData() {
        return StringUtils.isAnyBlank(spreadsheetId, sheetName);
    }
}
