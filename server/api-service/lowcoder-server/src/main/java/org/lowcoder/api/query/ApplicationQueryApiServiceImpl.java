package org.lowcoder.api.query;

import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.Strings;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.query.view.QueryExecutionRequest;
import org.lowcoder.domain.application.model.Application;
import org.lowcoder.domain.application.service.ApplicationRecordService;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpCookie;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Timed;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.lowcoder.domain.permission.model.ResourceAction.EDIT_APPLICATIONS;
import static org.lowcoder.domain.permission.model.ResourceAction.READ_APPLICATIONS;
import static org.lowcoder.sdk.exception.BizError.DATASOURCE_AND_APP_ORG_NOT_MATCH;
import static org.lowcoder.sdk.exception.BizError.INVALID_PARAMETER;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

@RequiredArgsConstructor
@Service
public class ApplicationQueryApiServiceImpl implements ApplicationQueryApiService {

    private final SessionUserService sessionUserService;
    private final LibraryQueryService libraryQueryService;
    private final LibraryQueryRecordService libraryQueryRecordService;
    private final ApplicationService applicationService;
    private final ResourcePermissionService resourcePermissionService;
    private final DatasourceService datasourceService;
    private final QueryExecutionService queryExecutionService;
    private final CommonConfig commonConfig;
    private final ApplicationRecordService applicationRecordService;

    @Value("${server.port}")
    private int port;

    @Override
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
        // a module run in another application's editor uses its published queries, which that editor shows (D-10)
        boolean useLiveQueries = viewMode || hostAppIdOf(queryExecutionRequest.getPath(), appId) != null;
        Mono<Application> appMono = applicationService.findById(appId).cache();
        Mono<ApplicationQuery> appQueryMono = appMono
                .flatMap(app -> app.getQueryByViewModeAndQueryId(useLiveQueries, queryId, applicationRecordService))
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

                    if (shouldCheckDatasourceOrgMatch(datasource) && !Strings.CS.equals(datasource.getOrganizationId(), app.getOrganizationId())) {
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

    /**
     * Permission required before a query runs (D-10):
     * <ul>
     *   <li>{@code viewMode: true} (any path): unchanged. Membership of {@code appId} in the root's live module set
     *       when a root is given (INVALID_PARAMETER otherwise, including a root equal to {@code appId}), then READ
     *       on the root.</li>
     *   <li>{@code viewMode: false}, own app (no host): EDIT_APPLICATIONS on {@code appId}.</li>
     *   <li>{@code viewMode: false}, module of a host H: (1) EDIT_APPLICATIONS on H; (2) {@code appId} is in H's
     *       module set built with {@code viewMode: false} (H's editing DSL for the first level, each module's live
     *       modules below), else INVALID_PARAMETER; (3) READ_APPLICATIONS on {@code appId} itself (the module) --
     *       kept unchanged from today's edit-mode check, since a host editor can write any module id into the host's
     *       DSL with no check (the save does not validate modules), so step 2 alone is only a membership test.</li>
     * </ul>
     * Limits (unchanged by this method): a never-published app or module has its draft as its live version, so READ
     * on it already runs that draft in view mode; view mode checks no right on the module itself, only membership
     * and READ on the root; intermediate modules of a nested path are not checked.
     */
    protected Mono<Void> checkExecutePermission(String userId, String[] path, String appId, boolean viewMode) {
        if (viewMode) {
            return checkAppPathAndReturnRootAppId(path, appId, true)
                    .flatMap(rootAppId -> resourcePermissionService.checkResourcePermissionWithError(userId, rootAppId,
                            READ_APPLICATIONS));
        }
        String hostAppId = hostAppIdOf(path, appId);
        if (hostAppId == null) {
            return resourcePermissionService.checkResourcePermissionWithError(userId, appId, EDIT_APPLICATIONS);
        }
        return resourcePermissionService.checkResourcePermissionWithError(userId, hostAppId, EDIT_APPLICATIONS)
                .then(Mono.defer(() -> checkAppPathAndReturnRootAppId(path, appId, false)))
                .then(Mono.defer(() -> resourcePermissionService.checkResourcePermissionWithError(userId, appId, READ_APPLICATIONS)));
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
                })
                // defensive: getAllDependentModulesFromApplicationId's collectList never completes empty today, so
                // this guard is not observable, but a module lookup that did complete empty must not let a request
                // pass the membership test by default.
                .switchIfEmpty(deferredError(INVALID_PARAMETER, "INVALID_PARAMETER"));
    }

    @Nullable
    static String getRootAppIdFromPath(String[] path) {
        if (ArrayUtils.isEmpty(path)) {
            return null;
        }
        return path[0];
    }

    /**
     * The host of a module query run inside another application (D-10): the first path entry when it is not blank and is
     * not {@code appId}; {@code null} for the application's own query (no path, a blank first entry, or the application
     * itself as first entry). The edit-mode permission check and the query selection both use it, so they always
     * classify a request the same way.
     */
    @Nullable
    static String hostAppIdOf(@Nullable String[] path, String appId) {
        String root = getRootAppIdFromPath(path);
        return StringUtils.isBlank(root) || root.equals(appId) ? null : root;
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

        String filterAuthId;
        if(StringUtils.isEmpty(authId)) filterAuthId = user.getActiveAuthId();
        else {
            filterAuthId = authId;
        }
        Optional<Connection> activeConnectionOptional = user.getConnections()
                .stream()
                .filter(connection -> connection.hasAuthId(filterAuthId))
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
