package org.lowcoder.plugin.mongo.model;

import org.bson.Document;
import org.lowcoder.sdk.query.QueryExecutionContext;

import lombok.Builder;

@Builder
public class MongoQueryExecutionContext extends QueryExecutionContext {

    private String databaseName;
    private Document command;

    public Document getCommand() {
        return command;
    }

    public String getDatabaseName() {
        return databaseName;
    }

}
