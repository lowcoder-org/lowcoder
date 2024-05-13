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
// adapted for mongodb queries
package org.lowcoder.plugin.mongo;

import com.google.common.base.Joiner;
import com.google.common.collect.ImmutableSet;
import com.mongodb.MongoCommandException;
import com.mongodb.MongoSocketWriteException;
import com.mongodb.MongoTimeoutException;
import com.mongodb.reactivestreams.client.MongoClients;
import com.mongodb.reactivestreams.client.MongoDatabase;
import jakarta.annotation.Nonnull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.bson.Document;
import org.json.JSONObject;
import org.lowcoder.plugin.mongo.commands.MongoCommand;
import org.lowcoder.plugin.mongo.constants.MongoSpecialDataTypes;
import org.lowcoder.plugin.mongo.model.MongoConnection;
import org.lowcoder.plugin.mongo.model.MongoConnectionUriParser;
import org.lowcoder.plugin.mongo.model.MongoDatasourceConfig;
import org.lowcoder.plugin.mongo.model.MongoQueryExecutionContext;
import org.lowcoder.plugin.mongo.utils.MongoQueryUtils;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceStructure;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.DatasourceQueryEngine;
import org.lowcoder.sdk.query.QueryVisitorContext;
import org.pf4j.Extension;
import org.pf4j.Plugin;
import org.pf4j.PluginWrapper;
import org.reactivestreams.Publisher;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.math.BigInteger;
import java.time.Duration;
import java.util.*;
import java.util.Map.Entry;
import java.util.concurrent.TimeoutException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.google.common.collect.Maps.newHashMap;
import static org.lowcoder.plugin.mongo.MongoPluginError.MONGO_COMMAND_ERROR;
import static org.lowcoder.plugin.mongo.MongoPluginError.MONGO_EXECUTION_ERROR;
import static org.lowcoder.plugin.mongo.constants.MongoFieldName.*;
import static org.lowcoder.plugin.mongo.model.MongoConnectionUriParser.extractInfoFromConnectionStringURI;
import static org.lowcoder.plugin.mongo.utils.MongoQueryUtils.isRawCommand;
import static org.lowcoder.plugin.mongo.utils.MongoQueryUtils.parseResultBody;
import static org.lowcoder.sdk.exception.PluginCommonError.*;
import static org.lowcoder.sdk.plugin.common.QueryExecutionUtils.getValueSafelyFromFormData;
import static org.lowcoder.sdk.plugin.common.QueryExecutionUtils.querySharedScheduler;
import static org.lowcoder.sdk.util.JsonUtils.toJson;
import static org.lowcoder.sdk.util.MustacheHelper.renderMustacheJsonString;
import static org.lowcoder.sdk.util.MustacheHelper.renderMustacheString;

public class MongoPlugin extends Plugin {

    public MongoPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class MongoEngine implements DatasourceQueryEngine<MongoDatasourceConfig, MongoConnection, MongoQueryExecutionContext> {

        private static final Integer MONGO_COMMAND_EXCEPTION_UNAUTHORIZED_ERROR_CODE = 13;

        private static final Joiner PATH_JOINER = Joiner.on(".");
        private static final Set<String> BSON_FIELD_PATHS = new HashSet<>(Arrays.asList(AGGREGATE_PIPELINE,
                COUNT_QUERY,
                DELETE_QUERY,
                DISTINCT_QUERY,
                FIND_QUERY,
                FIND_SORT,
                FIND_PROJECTION,
                INSERT_DOCUMENT,
                UPDATE_QUERY,
                UPDATE_OPERATION
        ));

        private final Scheduler scheduler = querySharedScheduler();
        private final Conf<Duration> datasourceValidateTimeout;

        public MongoEngine(ConfigCenter configCenter) {
            datasourceValidateTimeout = configCenter.mongoPlugin().ofInteger("datasourceValidateTimeoutMillis", 6000)
                    .then(Duration::ofMillis);
        }

        @Override
        public Mono<QueryExecutionResult> executeQuery(MongoConnection mongoConnection, MongoQueryExecutionContext context) {

            Document command = context.getCommand();

            Publisher<Document> source;
            try {
                source = mongoConnection.getDatabase().runCommand(command);
            } catch (Exception e) {
                throw new PluginException(MONGO_COMMAND_ERROR, "MONGODB_COMMAND_ERROR", e.getMessage());
            }

            return Mono.from(source)
                    .onErrorMap(MongoTimeoutException.class,
                            error -> new PluginException(QUERY_EXECUTION_TIMEOUT, "QUERY_TIMEOUT_ERROR", error.getMessage()))
                    .onErrorMap(MongoCommandException.class, error -> new PluginException(QUERY_ARGUMENT_ERROR, "QUERY_ARGUMENT_ERROR",
                            error.getErrorMessage()))
                    .onErrorMap(MongoSocketWriteException.class,
                            error -> new PluginException(CONNECTION_ERROR, "CONNECTION_ERROR", error.getMessage()))
                    .flatMap(mongoOutput -> {

                        try {
                            JSONObject outputJson = new JSONObject(mongoOutput.toJson());
                            BigInteger status = outputJson.getBigInteger("ok");
                            if (!BigInteger.ONE.equals(status)) {
                                return Mono.just(QueryExecutionResult.error(MONGO_EXECUTION_ERROR, "MONGODB_EXECUTE_ERROR", status));
                            }
                            return Mono.just(QueryExecutionResult.success(parseResultBody(outputJson)));

                        } catch (Exception e) {
                            return Mono.error(new PluginException(QUERY_EXECUTION_ERROR, "QUERY_EXECUTION_ERROR", e.getMessage()));
                        }
                    })
                    .onErrorResume(error -> {
                        if (error instanceof PluginException) {
                            return Mono.error(error);
                        }

                        return Mono.just(QueryExecutionResult.error(MONGO_EXECUTION_ERROR, "MONGODB_EXECUTE_ERROR", error.getMessage()));
                    })
                    .subscribeOn(scheduler);
        }

        @Nonnull
        @Override
        public MongoDatasourceConfig resolveConfig(Map<String, Object> configMap) {
            return MongoDatasourceConfig.buildFrom(configMap);
        }

        @Override
        public MongoQueryExecutionContext buildQueryExecutionContext(MongoDatasourceConfig datasourceConfig,
                Map<String, Object> queryConfig,
                Map<String, Object> requestParams, QueryVisitorContext queryVisitorContext) {

            queryConfig = newHashMap(queryConfig);

            if (isRawCommand(queryConfig)) {
                Object body = getValueSafelyFromFormData(queryConfig, RAW_COMMAND);

                if (!(body instanceof String bodyStr)) {
                    throw new PluginException(INVALID_QUERY_SETTINGS, "INVALID_RAW_REQUEST_PARAM");
                }

                if (StringUtils.isBlank(bodyStr)) {
                    throw new PluginException(INVALID_QUERY_SETTINGS, "RAW_REQUEST_PARAM_EMPTY");
                }

                try {
                    String updatedRawQuery = renderMustacheJsonString(bodyStr, requestParams);
                    updatedRawQuery = removeOrAddQuotesAroundSpecialTypes(updatedRawQuery);

                    return MongoQueryExecutionContext.builder()
                            .command(Document.parse(updatedRawQuery))
                            .databaseName(datasourceConfig.getParsedDatabase())
                            .build();
                } catch (Exception e) {
                    if (e instanceof PluginException pluginException) {
                        throw pluginException;
                    }
                    throw new PluginException(INVALID_QUERY_SETTINGS, "INVALID_QUERY_SETTINGS", e.getMessage());
                }
            }

            List<String> currentPath = new ArrayList<>();
            Map<String, Object> evaluatedQueryConfig = traverseAndEvaluate(queryConfig, requestParams, currentPath);

            MongoCommand mongoCommand = MongoQueryUtils.convertMongoFormInputToRawCommand(evaluatedQueryConfig);

            Document command;
            try {
                command = mongoCommand.parseCommand();
            } catch (Exception e) {
                throw new PluginException(INVALID_QUERY_SETTINGS, "INVALID_QUERY_SETTINGS", e.getMessage());
            }
            return MongoQueryExecutionContext.builder()
                    .command(command)
                    .databaseName(datasourceConfig.getParsedDatabase())
                    .build();
        }

        @SuppressWarnings(value = {"unchecked", "rawtypes"})
        private <T> T traverseAndEvaluate(T object, Map<String, Object> paramMap, List<String> pathStack) {
            if (object == null) {
                return null;
            }

            if (object instanceof List) {
                List renderedList = new ArrayList();
                for (Object childValue : (List) object) {
                    renderedList.add(traverseAndEvaluate(childValue, paramMap, pathStack));
                }

                return (T) renderedList;
            }

            if (object instanceof Map map) {
                Map<String, Object> renderedMap = new HashMap<>();
                for (Object entry : map.entrySet()) {
                    String key = (String) ((Entry) entry).getKey();
                    pathStack.add(key);
                    renderedMap.put(key, traverseAndEvaluate(((Map.Entry) entry).getValue(), paramMap, pathStack));
                    pathStack.remove(pathStack.size() - 1);
                }

                return (T) renderedMap;
            }

            String leafNodePath = PATH_JOINER.join(pathStack);
            if (!(object instanceof String strValue)) {
                throw new PluginException(INVALID_QUERY_SETTINGS, "INVALID_FORMAT", leafNodePath, object.getClass().getSimpleName());
            }


            return (T) evaluateString(strValue, paramMap, leafNodePath);
        }

        private String evaluateString(String str, Map<String, Object> paramMap, String path) {

            if (BSON_FIELD_PATHS.contains(path)) {
                String renderedJsonStr = renderMustacheJsonString(str, paramMap);
                return removeOrAddQuotesAroundSpecialTypes(renderedJsonStr);
            }

            return renderMustacheString(str, paramMap);
        }

        private String removeOrAddQuotesAroundSpecialTypes(String query) {

            String result = query;

            for (MongoSpecialDataTypes specialType : MongoSpecialDataTypes.values()) {

                Map<String, String> objectIdMap = new LinkedHashMap<>();

                Pattern pattern = specialType.getRegexPattern();

                Matcher matcher = pattern.matcher(result);
                while (matcher.find()) {
                    // e.g."ObjectId('someId')":
                    //  o Group 1 = "ObjectId('someId')"
                    //  o Group 2 = ObjectId(someId)
                    //  o Group 3 = 'someId'
                    //  o Group 4 = someId
                    if (matcher.group(1) != null) {
                        String objectIdWithQuotes = matcher.group(1);
                        String objectIdWithoutQuotes = matcher.group(2);
                        String argWithQuotes = matcher.group(3);
                        String argWithoutQuotes = matcher.group(4);
                        if (specialType.isQuotesRequiredAroundParameter() && StringUtils.isNotEmpty(argWithQuotes)) {
                            argWithoutQuotes = toJson(argWithoutQuotes);
                        }
                        objectIdMap.put(objectIdWithQuotes, objectIdWithoutQuotes);
                        if (StringUtils.isNotEmpty(argWithQuotes)) {
                            objectIdMap.put(argWithQuotes, argWithoutQuotes);
                        }
                    }
                }

                for (Map.Entry<String, String> entry : objectIdMap.entrySet()) {
                    String objectIdWithQuotes = (entry).getKey();
                    String objectIdWithoutQuotes = (entry).getValue();
                    result = result.replace(objectIdWithQuotes, objectIdWithoutQuotes);
                }
            }
            return result;
        }

        @Override
        public Mono<MongoConnection> createConnection(MongoDatasourceConfig connectionConfig) {
            return Mono.just(buildClientUri(connectionConfig))
                    .map(MongoClients::create)
                    .map(mongoClient -> new MongoConnection(mongoClient, connectionConfig.getParsedDatabase()))
                    .onErrorMap(
                            IllegalArgumentException.class,
                            error -> new PluginException(DATASOURCE_ARGUMENT_ERROR, "DATASOURCE_ARGUMENT_ERROR", error.getMessage())
                    )
                    .onErrorMap(e -> {
                        if (!(e instanceof PluginException)) {
                            return new PluginException(QUERY_EXECUTION_ERROR, "QUERY_EXECUTION_ERROR", e.getMessage());
                        }

                        return e;
                    })
                    .subscribeOn(scheduler);
        }

        private String buildClientUri(MongoDatasourceConfig mongoDatasourceConfig) {

            if (mongoDatasourceConfig.isUsingUri()) {
                if (StringUtils.isBlank(mongoDatasourceConfig.getUri())) {
                    throw new PluginException(DATASOURCE_ARGUMENT_ERROR, "MONGODB_URL_EMPTY");
                }

                String uri = mongoDatasourceConfig.getUri();
                Map<String, String> extractedInfo = extractInfoFromConnectionStringURI(uri);
                if (extractedInfo == null) {
                    throw new PluginException(DATASOURCE_ARGUMENT_ERROR, "MONGODB_URL_EXTRACT_ERROR");
                }

                return uri;
            }

            StringBuilder builder = new StringBuilder();
            boolean isSrv = mongoDatasourceConfig.isSrvMode();

            if (isSrv) {
                builder.append("mongodb+srv://");
            } else {
                builder.append("mongodb://");
            }

            String username = mongoDatasourceConfig.getUsername();
            String password = mongoDatasourceConfig.getPassword();

            boolean hasUsername = StringUtils.isNotEmpty(username);
            boolean hasPassword = StringUtils.isNotEmpty(password);
            if (hasUsername) {
                builder.append(MongoQueryUtils.urlEncode(username));
            }
            if (hasPassword) {
                builder.append(':').append(MongoQueryUtils.urlEncode(password));
            }
            if (hasUsername || hasPassword) {
                builder.append('@');
            }

            String host = mongoDatasourceConfig.getHost();
            builder.append(host);
            builder.append(isSrv ? "" : ":" + mongoDatasourceConfig.getPort());
            builder.append('/').append(mongoDatasourceConfig.getParsedDatabase());

            List<String> queryParams = new ArrayList<>();
            if (mongoDatasourceConfig.isSsl()) {
                queryParams.add("ssl=true");
            } else {
                queryParams.add("ssl=false");
            }

            if (hasUsername && mongoDatasourceConfig.getAuthMechanism() != null) {
                queryParams.add("authMechanism=" + mongoDatasourceConfig.getAuthMechanism().getValue());
            }

            builder.append('?');
            for (String param : queryParams) {
                builder.append(param).append('&');
            }
            // Delete the trailing ampersand.
            builder.deleteCharAt(builder.length() - 1);
            return builder.toString();
        }

        @Override
        public Mono<Void> destroyConnection(MongoConnection mongoConnection) {
            return mongoConnection.close();
        }

        private boolean hostStringHasConnectionURIHead(String host) {
            return StringUtils.isNotBlank(host) && (host.contains("mongodb://") || host.contains("mongodb+srv"));
        }

        @Override
        public Set<String> validateConfig(MongoDatasourceConfig connectionConfig) {
            Set<String> invalids = new HashSet<>();

            if (connectionConfig.isUsingUri()) {
                if (StringUtils.isBlank(connectionConfig.getUri())) {
                    return ImmutableSet.of("MONGODB_URL_EMPTY_PLZ_CHECK");
                }

                String mongoUri = connectionConfig.getUri();
                if (!MongoConnectionUriParser.isValid(mongoUri)) {
                    return ImmutableSet.of("INVALID_MONGODB_URL_PLZ_CHECK");
                }

                Map<String, String> extractedInfo = extractInfoFromConnectionStringURI(mongoUri);
                if (extractedInfo == null) {
                    return ImmutableSet.of("INVALID_MONGODB_URL_PLZ_CHECK");
                }

                return invalids;
            }


            String host = connectionConfig.getHost();
            if (StringUtils.isBlank(host)) {
                invalids.add("HOST_EMPTY_PLZ_CHECK");
            }

            if (hostStringHasConnectionURIHead(host)) {
                invalids.add("HOST_EMPTY_PLZ_CHECK");
            }

            if (StringUtils.equalsIgnoreCase(host, "localhost") || StringUtils.equals(host, "127.0.0.1")) {
                invalids.add("INVALID_HOST");
            }

            if (StringUtils.isEmpty(connectionConfig.getDatabase())) {
                invalids.add("DATABASE_EMPTY");
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testConnection(MongoDatasourceConfig connectionConfig) {
            return doCreateConnection(connectionConfig)
                    .flatMap(connection -> connection.ping()
                            .then(connection.close())
                    )
                    .timeout(datasourceValidateTimeout.get())
                    .thenReturn(DatasourceTestResult.testSuccess())
                    .onErrorMap(TimeoutException.class, error -> new PluginException(DATASOURCE_TIMEOUT_ERROR, "DATASOURCE_TIMEOUT_ERROR"))
                    .onErrorResume(error -> Mono.just(DatasourceTestResult.testFail(error)))
                    .subscribeOn(scheduler);
        }

        @Override
        public Mono<DatasourceStructure> getStructure(MongoConnection mongoClient,
                MongoDatasourceConfig connectionConfig) {
            final DatasourceStructure structure = new DatasourceStructure();
            List<DatasourceStructure.Table> tables = new ArrayList<>();
            structure.setTables(tables);

            MongoDatabase mongoDatabase = mongoClient.getDatabase();

            return Flux.from(mongoDatabase.listCollectionNames())
                    .flatMap(collectionName -> {
                        final ArrayList<DatasourceStructure.Column> columns = new ArrayList<>();
                        final ArrayList<DatasourceStructure.Template> templates = new ArrayList<>();
                        tables.add(new DatasourceStructure.Table(
                                DatasourceStructure.TableType.COLLECTION,
                                null,
                                collectionName,
                                columns,
                                new ArrayList<>(),
                                templates
                        ));

                        return Mono.zip(
                                Mono.just(columns),
                                Mono.just(templates),
                                Mono.just(collectionName),
                                Mono.from(mongoDatabase.getCollection(collectionName).find().limit(1).first())
                        );
                    })
                    .flatMap(tuple -> {
                        final ArrayList<DatasourceStructure.Column> columns = tuple.getT1();
                        Document document = tuple.getT4();
                        MongoQueryUtils.generateTemplatesAndStructureForACollection(document, columns);
                        return Mono.just(structure);
                    })
                    .collectList()
                    .thenReturn(structure)
                    .onErrorMap(MongoCommandException.class,
                            error -> {
                                if (MONGO_COMMAND_EXCEPTION_UNAUTHORIZED_ERROR_CODE.equals(error.getErrorCode())) {
                                    return new PluginException(DATASOURCE_GET_STRUCTURE_ERROR, "GET_MONGODB_STRUCTURE_ERROR");
                                }
                                return error;
                            }
                    )
                    .subscribeOn(scheduler);
        }

    }

}
