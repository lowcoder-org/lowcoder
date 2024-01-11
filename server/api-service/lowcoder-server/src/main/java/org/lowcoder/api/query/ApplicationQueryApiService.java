package org.lowcoder.api.query;

import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.query.view.QueryExecutionRequest;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.query.model.ApplicationQuery;
import org.lowcoder.domain.query.model.BaseQuery;
import org.lowcoder.domain.query.model.LibraryQueryCombineId;
import org.lowcoder.domain.query.model.LibraryQueryRecord;
import org.lowcoder.domain.query.service.LibraryQueryRecordService;
import org.lowcoder.domain.query.service.LibraryQueryService;
import org.lowcoder.domain.query.service.QueryExecutionService;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.infra.util.TupleUtils;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.models.JsDatasourceConnectionConfig;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.graphql.GraphQLDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.RestApiDatasourceConfig;
import org.lowcoder.sdk.plugin.restapi.auth.OAuthInheritAuthConfig;
import org.lowcoder.sdk.query.QueryVisitorContext;
import org.lowcoder.sdk.util.ExceptionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpCookie;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Timed;

import javax.annotation.Nullable;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.lowcoder.domain.permission.model.ResourceAction.READ_APPLICATIONS;
import static org.lowcoder.sdk.exception.BizError.DATASOURCE_AND_APP_ORG_NOT_MATCH;
import static org.lowcoder.sdk.exception.BizError.INVALID_PARAMETER;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

@Service
public class ApplicationQueryApiService {

    @Autowired
    private SessionUserService sessionUserService;

    @Autowired
    private LibraryQueryService libraryQueryService;

    @Autowired
    private LibraryQueryRecordService libraryQueryRecordService;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private ResourcePermissionService resourcePermissionService;

    @Autowired
    private DatasourceService datasourceService;

    @Autowired
    private QueryExecutionService queryExecutionService;

    @Autowired
    private CommonConfig commonConfig;

    @Value("${server.port}")
    private int port;

    public Mono<QueryExecutionResult> executeApplicationQuery(ServerWebExchange exchange, QueryExecutionRequest queryExecutionRequest) {
        if (StringUtils.isBlank(queryExecutionRequest.getQueryId())) {
            return ExceptionUtils.ofError(INVALID_PARAMETER, "INVALID_QUERY_ID");
        }
        String appId = queryExecutionRequest.getApplicationId();
        if (StringUtils.isBlank(appId)) {
            return ExceptionUtils.ofError(INVALID_PARAMETER, "INVALID_APP_ID");
        }
        boolean viewMode = queryExecutionRequest.isViewMode();
        String queryId = queryExecutionRequest.getQueryId();
        Mono<Application> appMono = applicationService.findById(appId).cache();
        Mono<ApplicationQuery> appQueryMono = appMono
                .map(app -> app.getQueryByViewModeAndQueryId(viewMode, queryId))
                .cache();

        Mono<BaseQuery> baseQueryMono = appQueryMono.flatMap(this::getBaseQuery).cache();
        Mono<Datasource> datasourceMono = baseQueryMono.flatMap(query -> datasourceService.getById(query.getDatasourceId())
                        .switchIfEmpty(deferredError(BizError.DATASOURCE_NOT_FOUND, "DATASOURCE_NOT_FOUND", query.getDatasourceId())))
                .cache();

        return sessionUserService.getVisitor()
                .delayUntil(user -> checkExecutePermission(user.getId(), queryExecutionRequest.getPath(), appId,
                        queryExecutionRequest.isViewMode()))
                .zipWhen(visitorId -> Mono.zip(appMono, appQueryMono, baseQueryMono, datasourceMono), TupleUtils::merge)
                .flatMap(tuple -> {
                    String userId = tuple.getT1().getId();
                    Application app = tuple.getT2();
                    ApplicationQuery appQuery = tuple.getT3();
                    BaseQuery baseQuery = tuple.getT4();
                    Datasource datasource = tuple.getT5();

                    if (shouldCheckDatasourceOrgMatch(datasource) && !StringUtils.equals(datasource.getOrganizationId(), app.getOrganizationId())) {
                        return ofError(DATASOURCE_AND_APP_ORG_NOT_MATCH, "DATASOURCE_AND_APP_ORG_NOT_MATCH");
                    }

                    MultiValueMap<String, HttpCookie> cookies = exchange.getRequest().getCookies();

                    Mono<List<Property>> paramsAndHeadersInheritFromLogin = Mono.empty();


                    // Check if oauth inherited from login and save token
                    if(datasource.getDetailConfig() instanceof RestApiDatasourceConfig restApiDatasourceConfig
                            && restApiDatasourceConfig.isOauth2InheritFromLogin()) {
                        paramsAndHeadersInheritFromLogin = getAuthParamsAndHeadersInheritFromLogin(tuple.getT1(), ((OAuthInheritAuthConfig)restApiDatasourceConfig.getAuthConfig()).getAuthId(), false);
                    }

                    if(datasource.getDetailConfig() instanceof GraphQLDatasourceConfig graphQLDatasourceConfig
                            && graphQLDatasourceConfig.isOauth2InheritFromLogin()) {
                        paramsAndHeadersInheritFromLogin = getAuthParamsAndHeadersInheritFromLogin(tuple.getT1(), ((OAuthInheritAuthConfig)graphQLDatasourceConfig.getAuthConfig()).getAuthId(), false);
                    }


                    if(datasource.getDetailConfig() instanceof JsDatasourceConnectionConfig jsDatasourceConnectionConfig
                            && jsDatasourceConnectionConfig.isOauth2InheritFromLogin()) {
                        paramsAndHeadersInheritFromLogin = getAuthParamsAndHeadersInheritFromLogin(tuple.getT1(), jsDatasourceConnectionConfig.getAuthId(), true);
                    }

                    QueryVisitorContext queryVisitorContext = new QueryVisitorContext(userId, app.getOrganizationId(), port, cookies, paramsAndHeadersInheritFromLogin, commonConfig.getDisallowedHosts());
                    return queryExecutionService.executeQuery(datasource, baseQuery.getQueryConfig(), queryExecutionRequest.paramMap(),
                                    appQuery.getTimeoutStr(), queryVisitorContext
                            )
                            .timed()
                            .doOnNext(timed -> onNextOrError(queryExecutionRequest, queryVisitorContext, appQuery, baseQuery,
                                    app, datasource, timed.elapsed().toMillis(), true))
                            .doOnError(throwable -> onNextOrError(queryExecutionRequest, queryVisitorContext, appQuery, baseQuery,
                                    app, datasource, 0, false))
                            .map(Timed::get);
                });
    }

    private boolean shouldCheckDatasourceOrgMatch(Datasource datasource) {
        return !datasource.isSystemStatic() && !datasource.isLegacyQuickRestApi() && !datasource.isLegacyLowcoderApi();
    }

    protected Mono<Void> checkExecutePermission(String userId, String[] path, String appId, boolean viewMode) {
        if (viewMode) {
            return checkAppPathAndReturnRootAppId(path, appId, true)
                    .flatMap(rootAppId -> resourcePermissionService.checkResourcePermissionWithError(userId, rootAppId,
                            READ_APPLICATIONS));
        }
        return resourcePermissionService.checkResourcePermissionWithError(userId, appId, READ_APPLICATIONS);
    }

    private Mono<String> checkAppPathAndReturnRootAppId(String[] path, String appId, boolean viewMode) {
        String rootAppId = getRootAppIdFromPath(path);
        if (StringUtils.isBlank(rootAppId)) {
            return Mono.just(appId);
        }
        Mono<List<Application>> allDependentModules = applicationService.getAllDependentModulesFromApplicationId(rootAppId, viewMode);
        return allDependentModules
                .map(modules -> modules.stream().map(Application::getId).collect(Collectors.toSet()))
                .flatMap(modules -> {
                    if (!modules.contains(appId)) {
                        return ofError(INVALID_PARAMETER, "INVALID_PARAMETER");
                    }
                    return Mono.just(rootAppId);
                });
    }

    @Nullable
    private String getRootAppIdFromPath(String[] path) {
        if (ArrayUtils.isEmpty(path)) {
            return null;
        }
        return path[0];
    }

    private Mono<BaseQuery> getBaseQuery(ApplicationQuery applicationQuery) {
        if (applicationQuery.isUsingLibraryQuery()) {
            return getBaseQueryFromLibraryQuery(applicationQuery);
        }
        return Mono.just(applicationQuery.getBaseQuery());
    }

    private Mono<BaseQuery> getBaseQueryFromLibraryQuery(ApplicationQuery query) {
        LibraryQueryCombineId libraryQueryCombineId = query.getLibraryRecordQueryId();
        if (libraryQueryCombineId.isUsingLiveRecord()) {
            return libraryQueryService.getLiveBaseQueryByLibraryQueryId(libraryQueryCombineId.libraryQueryId());
        }
        return libraryQueryRecordService.getById(libraryQueryCombineId.libraryQueryRecordId())
                .map(LibraryQueryRecord::getQuery);
    }

    protected Mono<List<Property>> getAuthParamsAndHeadersInheritFromLogin(User user, String authId, boolean isJsQuery) {
        if(authId == null) {
            return Mono.empty();
        }
        Optional<Connection> activeConnectionOptional = user.getConnections()
                .stream()
                .filter(connection -> connection.getAuthId().equals(authId))
                .findFirst();
        if(!activeConnectionOptional.isPresent() || activeConnectionOptional.get().getAuthConnectionAuthToken() == null) {
            return Mono.empty();
        }
        if(isJsQuery) {
            return Mono.just(Collections.singletonList(new Property("OAUTH_ACCESS_TOKEN",activeConnectionOptional.get().getAuthConnectionAuthToken().getAccessToken(),"header")));
        } else {
            return Mono.just(Collections.singletonList(new Property("Authorization","Bearer " + activeConnectionOptional.get().getAuthConnectionAuthToken().getAccessToken(),"header")));
        }
    }

    protected void onNextOrError(QueryExecutionRequest queryExecutionRequest, QueryVisitorContext queryVisitorContext,
            ApplicationQuery applicationQuery, BaseQuery baseQuery, Application application, Datasource datasource,
            long executeTime, boolean success) {
        // do nothing
    }
}
