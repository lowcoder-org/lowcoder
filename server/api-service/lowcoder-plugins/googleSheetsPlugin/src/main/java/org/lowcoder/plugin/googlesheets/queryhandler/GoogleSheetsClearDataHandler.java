package org.lowcoder.plugin.googlesheets.queryhandler;

import org.lowcoder.plugin.googlesheets.model.GoogleSheetsClearDataRequst;
import org.lowcoder.plugin.googlesheets.model.GoogleSheetsQueryExecutionContext;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.QueryExecutionUtils;

import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.model.ClearValuesRequest;
import com.google.api.services.sheets.v4.model.ClearValuesResponse;

import reactor.core.publisher.Mono;

public class GoogleSheetsClearDataHandler extends GoogleSheetsActionHandler {

    @Override
    public String getActionType() {
        return CLEAR_DATA;
    }

    @Override
    public Mono<QueryExecutionResult> execute(Object o, GoogleSheetsQueryExecutionContext context) {
        GoogleSheetsClearDataRequst googleSheetsActionRequest = (GoogleSheetsClearDataRequst) context.getGoogleSheetsActionRequest();
        final int rowClear = googleSheetsActionRequest.getRowIndex() + 1;
        Sheets sheetService = GoogleSheetsGetPreParameters.GetSheetsService(context);
        String range = googleSheetsActionRequest.getSheetName() + "!" + rowClear + ":" + rowClear;
        ClearValuesRequest requestBody = new ClearValuesRequest();
        return Mono.fromCallable(() -> {
                    Sheets.Spreadsheets.Values.Clear request =
                            sheetService.spreadsheets().values().clear(googleSheetsActionRequest.getSpreadsheetId(), range, requestBody);
                    ClearValuesResponse response = request.execute();
                    return QueryExecutionResult.success(response.values());
                })
                .subscribeOn(QueryExecutionUtils.querySharedScheduler());
    }
}
