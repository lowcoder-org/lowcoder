package org.lowcoder.plugin.es;

import static org.lowcoder.plugin.es.EsError.ES_EXECUTION_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.TimeoutException;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.apache.commons.lang3.StringUtils;
import org.apache.http.util.EntityUtils;
import org.elasticsearch.client.Request;
import org.lowcoder.plugin.es.model.EsConnection;
import org.lowcoder.plugin.es.model.EsDatasourceConfig;
import org.lowcoder.plugin.es.model.EsQueryConfig;
import org.lowcoder.plugin.es.model.EsQueryExecutionContext;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.QueryExecutor;
import org.lowcoder.sdk.query.QueryVisitorContext;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.util.MustacheHelper;
import org.lowcoder.sdk.util.Preconditions;
import org.pf4j.Extension;

import com.google.common.base.Joiner;

import reactor.core.publisher.Mono;

@Extension
public class EsQueryExecutor implements QueryExecutor<EsDatasourceConfig, EsConnection, EsQueryExecutionContext> {

    private static final String PATH_SEPARATOR = "/";
    private static final Joiner JOINER = Joiner.on(PATH_SEPARATOR).skipNulls();
    /** The endpoints whose body is newline-delimited JSON, one JSON value per line (BF-056). */
    static final Set<String> NDJSON_ENDPOINTS = Set.of("_bulk", "_msearch", "_msearch/template");
    private static final String QUERY_STRING_START = "?";
    private static final Pattern LINE_BREAK = Pattern.compile("\\r?\\n");
    private static final String NDJSON_LINE_END = "\n";

    @Override
    public EsQueryExecutionContext buildQueryExecutionContext(EsDatasourceConfig datasourceConfig, Map<String, Object> queryConfig,
            Map<String, Object> requestParams, QueryVisitorContext queryVisitorContext) {
        EsQueryConfig esQueryConfig = JsonUtils.fromJson(JsonUtils.toJson(queryConfig), EsQueryConfig.class);

        // preconditions
        Preconditions.check(Objects.nonNull(esQueryConfig), QUERY_ARGUMENT_ERROR, "INVALID_ES_QUERY_CONFIG");

        // render
        String prefix = StringUtils.isBlank(esQueryConfig.getPrefix()) ? "" : MustacheHelper.renderMustacheString(esQueryConfig.getPrefix(),
                requestParams);
        String suffix = StringUtils.isBlank(esQueryConfig.getSuffix()) ? "" : MustacheHelper.renderMustacheString(esQueryConfig.getSuffix(),
                requestParams);
        String path = StringUtils.isBlank(esQueryConfig.getPath()) ? "" : MustacheHelper.renderMustacheString(esQueryConfig.getPath(),
                requestParams);

        // remove extra "/"
        String wholePath = prefix.trim() + PATH_SEPARATOR + path.trim() + PATH_SEPARATOR + suffix.trim();
        List<String> splits = Stream.of(wholePath.split(PATH_SEPARATOR)).filter(StringUtils::isNotBlank).toList();
        wholePath = JOINER.join(splits);

        String dsl;
        if (StringUtils.isBlank(esQueryConfig.getDsl())) {
            dsl = "";
        } else if (isNdjsonEndpoint(wholePath)) {
            dsl = renderNdjson(esQueryConfig.getDsl(), requestParams);
        } else {
            dsl = renderJson(esQueryConfig.getDsl(), requestParams);
        }

        return EsQueryExecutionContext.builder()
                .httpMethod(esQueryConfig.getHttpMethod())
                .path(wholePath)
                .dsl(dsl)
                .build();
    }

    /** Whether the path, without its query string, ends in one of the {@link #NDJSON_ENDPOINTS}. */
    static boolean isNdjsonEndpoint(String wholePath) {
        String pathOnly = StringUtils.substringBefore(wholePath, QUERY_STRING_START);
        return NDJSON_ENDPOINTS.stream().anyMatch(endpoint -> pathOnly.equals(endpoint) || pathOnly.endsWith(PATH_SEPARATOR + endpoint));
    }

    /**
     * The body of an NDJSON endpoint ({@code _bulk}, {@code _msearch}): each non-blank line rendered as one JSON value, the
     * lines joined with a line break and ended with one, as the endpoints require. Rendering the whole text as one JSON
     * value turned a bulk body into one JSON string literal, which the server refuses (BF-056). A line that is a single
     * placeholder whose value is a string is taken as NDJSON text as it is, so a body built in JavaScript (any number of
     * lines) can be sent; a line break inside that text is kept.
     * <p>
     * Limits: a JSON value written over several lines is not one line of NDJSON, so each of its lines is rendered alone
     * (as text, or a parse error when it holds a placeholder), as the server would also refuse it; the body is still sent
     * with the JSON content type, which Elasticsearch accepts for these endpoints.
     */
    static String renderNdjson(String dsl, Map<String, Object> requestParams) {
        StringBuilder body = new StringBuilder();
        for (String line : LINE_BREAK.split(dsl)) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            String rendered = renderNdjsonLine(trimmed, requestParams).strip();
            if (!rendered.isEmpty()) {
                body.append(rendered).append(NDJSON_LINE_END);
            }
        }
        return body.toString();
    }

    private static String renderNdjsonLine(String line, Map<String, Object> requestParams) {
        List<String> tokens = MustacheHelper.tokenize(line);
        if (tokens.size() == 1 && MustacheHelper.isMustacheToken(line)
                && requestParams.get(MustacheHelper.removeCurlyBraces(line)) instanceof String text) {
            return text;
        }
        return renderJson(line, requestParams);
    }

    /** The JSON text of a DSL, or of one NDJSON line, with its placeholders filled in. */
    private static String renderJson(String json, Map<String, Object> requestParams) {
        return MustacheHelper.renderMustacheJsonString(json, requestParams);
    }

    /**
     * non-blocked
     */
    @Override
    public Mono<QueryExecutionResult> executeQuery(EsConnection esConnection, EsQueryExecutionContext context) {
        // build request
        Request request = new Request(context.getHttpMethod().name(), "/" + context.getPath());
        if (StringUtils.isNotBlank(context.getDsl())) {
            request.setJsonEntity(context.getDsl());
        }
        return esConnection.reactorRestClientAdaptor()
                .request(request)
                .map(response -> {
                    try {
                        Map<String, Object> map = JsonUtils.fromJsonMap(EntityUtils.toString(response.getEntity()));
                        return QueryExecutionResult.success(map);
                    } catch (IOException e) {
                        return QueryExecutionResult.error(ES_EXECUTION_ERROR, "ES_EXECUTION_ERROR", e.getMessage());
                    }
                })
                .onErrorResume(throwable -> {
                    if (throwable instanceof TimeoutException) {
                        return Mono.just(QueryExecutionResult.error(QUERY_EXECUTION_ERROR, "EXECUTION_TIMEOUT"));
                    }
                    return Mono.just(QueryExecutionResult.error(ES_EXECUTION_ERROR, "ES_QUERY_ERROR", throwable.getMessage()));
                });
    }
}
