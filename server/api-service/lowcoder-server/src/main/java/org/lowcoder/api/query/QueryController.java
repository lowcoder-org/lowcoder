package org.lowcoder.api.query;

import static org.lowcoder.sdk.constants.GlobalContext.CLIENT_IP;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

import java.util.Locale;

import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.query.view.LibraryQueryRequestFromJs;
import org.lowcoder.api.query.view.QueryExecutionRequest;
import org.lowcoder.api.query.view.QueryResultView;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.util.CookieHelper;
import org.lowcoder.sdk.util.LocaleUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

@RestController
public class QueryController implements QueryEndpoints
{

    @Autowired
    private ApplicationQueryApiService applicationQueryApiService;

    @Autowired
    private LibraryQueryApiService libraryQueryApiService;

    @Autowired
    private CookieHelper cookieHelper;
    @Autowired
    private SessionUserService sessionUserService;
    @Autowired
    private BusinessEventPublisher businessEventPublisher;

    @Override
    public Mono<QueryResultView> execute(ServerWebExchange exchange,
            @RequestBody QueryExecutionRequest queryExecutionRequest) {
        return Mono.deferContextual(contextView -> {
            Locale locale = LocaleUtils.getLocale(contextView);
            return getQueryResult(exchange, queryExecutionRequest)
                    .map(result -> new QueryResultView(result, locale))
                    .onErrorResume(throwable -> {
                        if (throwable instanceof BizException bizException && bizException.getError() == BizError.LOGIN_EXPIRED) {
                            String cookieToken = cookieHelper.getCookieToken(exchange);
                            return sessionUserService.removeUserSession(cookieToken)
                                    .then(businessEventPublisher.publishUserLogoutEvent())
                                    .then(Mono.error(throwable));
                        }
                        return Mono.error(throwable);
                    });
        });
    }

    @Override
    public Mono<QueryResultView> executeLibraryQueryFromJs(ServerWebExchange exchange,
            @RequestBody LibraryQueryRequestFromJs queryExecutionRequest) {
        return Mono.deferContextual(contextView -> {
            Locale locale = LocaleUtils.getLocale(contextView);

            String ip = contextView.getOrDefault(CLIENT_IP, "");
            if (!checkIp(ip)) {
                return ofError(BizError.NOT_AUTHORIZED, "NOT_AUTHORIZED");
            }
            return libraryQueryApiService.executeLibraryQueryFromJs(exchange, queryExecutionRequest)
                    .map(result -> new QueryResultView(result, locale));
        });
    }

    private boolean checkIp(String ip) {
        return "127.0.0.1".equals(ip) || "localhost".equals(ip);
    }

    private Mono<QueryExecutionResult> getQueryResult(ServerWebExchange exchange, QueryExecutionRequest queryExecutionRequest) {
        if (queryExecutionRequest.isApplicationQueryRequest()) {
            return applicationQueryApiService.executeApplicationQuery(exchange, queryExecutionRequest);
        }
        return libraryQueryApiService.executeLibraryQuery(exchange, queryExecutionRequest);
    }


}
