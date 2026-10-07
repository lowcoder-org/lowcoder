/**
 * Copyright 2021 Appsmith Inc.
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * <p>
 */
package org.lowcoder.plugin.mongo.commands;

import static org.lowcoder.plugin.mongo.constants.MongoFieldName.COLLECTION;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;
import static org.lowcoder.sdk.plugin.common.QueryExecutionUtils.validConfigurationPresentInFormData;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.bson.Document;
import org.lowcoder.sdk.exception.PluginException;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * This is the base class which every Mongo Command extends. Common functions across all mongo commands
 * are implemented here including reading and validating the collection. This also defines functions which should be
 * implemented by all the commands.
 */
@Getter
@Setter
@NoArgsConstructor
public abstract class MongoCommand {

    /**
     * The batch size of a find or aggregate whose limit field is absent or blank: no limit (BF-031). Only the first batch of
     * the cursor is read ({@code MongoQueryUtils}), so the server's own cap on a first batch (16 MB) still applies.
     */
    protected static final int UNLIMITED = Integer.MAX_VALUE;

    /**
     * The key under which the server puts the query's timeout, in milliseconds, into every query config before it runs the
     * query ({@code QueryExecutionServiceImpl.executeQuery}): the timeout set on the query, or the default, capped by the
     * configured maximum.
     */
    static final String QUERY_TIMEOUT_MS = "timeoutMs";

    /** The command field that makes the server abort a read that runs longer than this many milliseconds. */
    static final String MAX_TIME_MS = "maxTimeMS";

    private String collection;
    /** The query's timeout from {@link #QUERY_TIMEOUT_MS}; null when the config has none or it is not a number. */
    private Integer timeoutMs;
    private String type;

    List<String> fieldNamesWithNoConfiguration;

    protected static final ObjectMapper objectMapper = new ObjectMapper();

    public MongoCommand(Map<String, Object> formData) {

        this.fieldNamesWithNoConfiguration = new ArrayList<>();

        if (validConfigurationPresentInFormData(formData, COLLECTION)) {
            this.collection = (String) formData.get(COLLECTION);
        }

        timeoutMs = MapUtils.getInteger(formData, QUERY_TIMEOUT_MS);
    }

    public boolean isValid() {
        if (StringUtils.isBlank(this.collection)) {
            fieldNamesWithNoConfiguration.add(COLLECTION);
            return false;
        }
        return true;
    }

    public Document parseCommand() {
        throw new PluginException(QUERY_EXECUTION_ERROR, "INVALID_MONGODB_OPERATION");
    }

    public String getCollection() {
        return collection;
    }

    /**
     * BF-061: puts the query's timeout into a read command as {@code maxTimeMS}, so the server stops the read when the query
     * times out instead of running it to the end after the caller has given up. Nothing is put when there is no positive
     * timeout ({@code maxTimeMS} 0 would mean no limit).
     * <p>
     * Limits: used by the read commands only (find, aggregate, count, distinct). Insert, update and delete do not get it: a
     * write stopped part-way leaves the documents written so far, and which server versions accept the field on a write was
     * not established. A raw command is sent as written, so it carries {@code maxTimeMS} only when the user writes it. The
     * server's own wait for the query ends at the same timeout, so the caller usually gets that timeout first; this limit
     * makes MongoDB stop the work too.
     */
    protected void putMaxTimeMs(Document command) {
        if (timeoutMs != null && timeoutMs > 0) {
            command.put(MAX_TIME_MS, timeoutMs);
        }
    }

    public String getType() {
        return type;
    }

    protected boolean isArrayStr(String input) {
        input = input.trim();
        return input.startsWith("[") && input.endsWith("]");
    }
}
