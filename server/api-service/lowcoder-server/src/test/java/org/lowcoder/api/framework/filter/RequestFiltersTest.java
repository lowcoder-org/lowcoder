package org.lowcoder.api.framework.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.NoSuchElementException;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.lowcoder.api.framework.filter.FilterTestSupport.ChainProbe;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.user.model.UserStatus;
import org.lowcoder.domain.user.service.UserStatusService;
import org.lowcoder.sdk.constants.Authentication;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.WebFilter;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/** Tests of the small filters: {@link UserBanFilter}, {@link RequestCostFilter}, {@link ReactiveRequestContextFilter}. */
class RequestFiltersTest {

    private SessionUserService sessionUserService;
    private UserStatusService userStatusService;
    private UserBanFilter banFilter;

    @BeforeEach
    void setUp() {
        sessionUserService = mock(SessionUserService.class);
        userStatusService = mock(UserStatusService.class);
        banFilter = new UserBanFilter();
        ReflectionTestUtils.setField(banFilter, "sessionUserService", sessionUserService);
        ReflectionTestUtils.setField(banFilter, "userStatusService", userStatusService);
    }

    // ------------------------------------------------------------------ UserBan

    /** Catches a banned user passing: the chain must NOT be invoked and the error is USER_BANNED. */
    @Test
    void userBan_bannedUser_failsWithUserBanned_andTheChainIsNotInvoked() {
        when(sessionUserService.getVisitorId()).thenReturn(Mono.just("user-1"));
        when(userStatusService.findByUserId("user-1")).thenReturn(Mono.just(UserStatus.builder().banned(true).build()));
        ChainProbe chain = new ChainProbe();

        StepVerifier.create(banFilter.filter(FilterTestSupport.exchange("/api/x"), chain))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(BizException.class);
                    assertThat(((BizException) error).getError()).isEqualTo(BizError.USER_BANNED);
                    System.out.println("[RequestFiltersTest] banned user -> " + error.getMessage());
                })
                .verify();

        assertThat(chain.invoked).hasValue(0);
    }

    /** Catches the status lookup for anonymous visitors, and users without a status row (not banned) being blocked. */
    @Test
    void userBan_anonymousUserIsSkipped_missingStatusIsNotBanned_unbannedPasses() {
        ChainProbe chain = new ChainProbe();

        when(sessionUserService.getVisitorId()).thenReturn(Mono.just(Authentication.ANONYMOUS_USER_ID));
        StepVerifier.create(banFilter.filter(FilterTestSupport.exchange("/api/x"), chain)).verifyComplete();
        verify(userStatusService, never()).findByUserId(org.mockito.ArgumentMatchers.anyString());
        assertThat(chain.invoked).as("anonymous passes").hasValue(1);

        when(sessionUserService.getVisitorId()).thenReturn(Mono.just("user-2"));
        when(userStatusService.findByUserId("user-2")).thenReturn(Mono.empty());
        StepVerifier.create(banFilter.filter(FilterTestSupport.exchange("/api/x"), chain)).verifyComplete();
        assertThat(chain.invoked).as("no status row passes").hasValue(2);

        when(userStatusService.findByUserId("user-2")).thenReturn(Mono.just(UserStatus.builder().banned(false).build()));
        StepVerifier.create(banFilter.filter(FilterTestSupport.exchange("/api/x"), chain)).verifyComplete();
        assertThat(chain.invoked).as("not banned passes").hasValue(3);
        System.out.println("[RequestFiltersTest] anonymous, missing status and unbanned users reach the chain");
    }

    /** Catches a filter order that no longer follows {@link FilterOrder}. */
    @ParameterizedTest
    @EnumSource(value = FilterOrder.class, names = {"REQUEST_COST", "API_DELAY_FILTER", "USER_BAN"})
    void orderedFilters_useTheirFilterOrder(FilterOrder order) {
        Ordered filter = switch (order) {
            case REQUEST_COST -> new RequestCostFilter();
            case API_DELAY_FILTER -> new APIDelayFilter();
            case USER_BAN -> banFilter;
            default -> throw new IllegalArgumentException(order.name());
        };

        assertThat(filter.getOrder()).isEqualTo(order.getOrder());
        System.out.println("[RequestFiltersTest] " + filter.getClass().getSimpleName() + " order " + filter.getOrder());
    }

    // -------------------------------------------------------------- RequestCost

    /** Catches the cost header missing or duplicated: it is added when the response is committed. */
    @Test
    void requestCost_addsOneCostHeader_atCommit() {
        MockServerWebExchange exchange = FilterTestSupport.exchange("/api/x");
        WebFilter filter = new RequestCostFilter();

        StepVerifier.create(filter.filter(exchange, ex -> ex.getResponse().setComplete())).verifyComplete();

        assertThat(exchange.getResponse().getHeaders().get("X-REQUEST-COST")).hasSize(1);
        assertThat(exchange.getResponse().getHeaders().getFirst("X-REQUEST-COST")).matches("\\d+ms");
        System.out.println("[RequestFiltersTest] cost header " + exchange.getResponse().getHeaders().getFirst("X-REQUEST-COST"));
    }

    // -------------------------------------------------- ReactiveRequestContext

    /** Catches the request not being put into the Reactor context for the chain. */
    @Test
    void reactiveRequestContext_putsTheRequestIntoTheContext_forTheChain() {
        MockServerWebExchange exchange = FilterTestSupport.exchange("/api/context");
        AtomicReference<ServerHttpRequest> seen = new AtomicReference<>();
        WebFilter filter = new ReactiveRequestContextFilter();

        StepVerifier.create(filter.filter(exchange, ex -> ReactiveRequestContextHolder.getRequest().doOnNext(seen::set).then())).verifyComplete();

        assertThat(seen.get()).isSameAs(exchange.getRequest());
    }

    /** Pins today's behaviour (no §9 row): outside the filter the holder fails with NoSuchElementException. */
    @Test
    void reactiveRequestContextHolder_withoutTheFilter_failsWithNoSuchElement() {
        StepVerifier.create(ReactiveRequestContextHolder.getRequest()).expectError(NoSuchElementException.class).verify();
    }
}
