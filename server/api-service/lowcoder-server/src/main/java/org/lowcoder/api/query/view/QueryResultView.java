package org.lowcoder.api.query.view;

import java.util.Collection;
import java.util.Locale;

import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.util.LocaleUtils;

import com.fasterxml.jackson.databind.JsonNode;

public class QueryResultView {

    private final QueryExecutionResult queryResult;
    private final Locale locale;

    public QueryResultView(QueryExecutionResult queryResult, Locale locale) {
        this.queryResult = queryResult;
        this.locale = locale;
    }

    /**
     * this code means whether server side handles current query successfully
     */
    public int getCode() {
        return 1;
    }

    public String getQueryCode() {
        return queryResult.getQueryCode();
    }

    public boolean isSuccess() {
        return queryResult.isSuccess();
    }

    public JsonNode getHeaders() {
        return queryResult.getHeaders();
    }

    public Object getData() {
        return queryResult.getData();
    }

    public String getMessage() {
        return queryResult.getLocaleMessage() != null ? LocaleUtils.getMessage(locale, queryResult.getLocaleMessage()) : queryResult.getMessage();
    }

    public Collection<String> getHintMessages() {
        return queryResult.getHintLocaleMessages()
                .stream()
                .map(msg -> LocaleUtils.getMessage(locale, msg))
                .toList();
    }
}
