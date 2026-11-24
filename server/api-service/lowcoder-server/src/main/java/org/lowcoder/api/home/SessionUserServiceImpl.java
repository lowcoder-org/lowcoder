package org.lowcoder.api.home;

import io.jsonwebtoken.Claims;
import jakarta.annotation.Nullable;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.usermanagement.UserApiService;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserState;
import org.lowcoder.domain.user.service.UserService;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.exception.BizError;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Objects;

import static org.lowcoder.sdk.constants.GlobalContext.CURRENT_ORG_MEMBER;
import static org.lowcoder.sdk.constants.GlobalContext.VISITOR_TOKEN;
import static org.lowcoder.sdk.exception.BizError.UNABLE_TO_FIND_VALID_ORG;
import static org.lowcoder.sdk.util.ExceptionUtils.deferredError;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;
import static org.lowcoder.sdk.util.JsonUtils.fromJsonQuietly;

@Slf4j
@Service
public class SessionUserServiceImpl implements SessionUserService {

    @Autowired
    private CommonConfig commonConfig;
    @Autowired
    private UserService userService;
    @Autowired
    private OrgMemberService orgMemberService;
    @Autowired
    private UserApiService userApiService;

    @Autowired
    private ReactiveRedisTemplate<String, String> reactiveTemplate;

    @SuppressWarnings("ReactiveStreamsNullableInLambdaInTransform")
    @Override
    public Mono<String> getVisitorId() {
        return getVisitor()
                .map(User::getId);
    }

    /**
     * @see org.lowcoder.api.framework.filter.GlobalContextFilter
     */
    @Override
    public Mono<User> getVisitor() {
        return ReactiveSecurityContextHolder.getContext()
                .map(securityContext -> (User) securityContext.getAuthentication().getPrincipal());
    }

    /**
     * @see org.lowcoder.api.framework.filter.GlobalContextFilter
     */
    @SuppressWarnings("unchecked")
    @Override
    public Mono<OrgMember> getVisitorOrgMemberCache() {
        return Mono.deferContextual(contextView -> (Mono<OrgMember>) contextView.get(CURRENT_ORG_MEMBER))
                .delayUntil(orgMember -> {
                    if (orgMember == OrgMember.NOT_EXIST) {
                        return deferredError(UNABLE_TO_FIND_VALID_ORG, "UNABLE_TO_FIND_VALID_ORG");
                    }
                    return Mono.empty();
                })
                .switchIfEmpty(deferredError(UNABLE_TO_FIND_VALID_ORG, "UNABLE_TO_FIND_VALID_ORG"));
    }

    @Override
    public Mono<OrgMember> getVisitorOrgMemberCacheSilent() {
        return Mono.deferContextual(contextView -> (Mono<OrgMember>) contextView.get(CURRENT_ORG_MEMBER))
                .delayUntil(Mono::just);
    }

    @Override
    public Mono<String> getVisitorToken() {
        return Mono.deferContextual(contextView -> Mono.just(contextView.get(VISITOR_TOKEN)));
    }

    @Override
    public Mono<OrgMember> getVisitorOrgMember() {
        return getVisitorId()
                .flatMap(userId -> orgMemberService.getCurrentOrgMember(userId))
                .switchIfEmpty(deferredError(UNABLE_TO_FIND_VALID_ORG, "UNABLE_TO_FIND_VALID_ORG"));
    }

    @Override
    public Mono<Boolean> isAnonymousUser() {
        return getVisitor()
                .map(User::isAnonymous);
    }

    @Override
    public Mono<Void> saveUserSession(String token, User user, String source) {
        ReactiveValueOperations<String, String> ops = reactiveTemplate.opsForValue();
        return ops.set(token, Objects.requireNonNull(user.getId()), getTokenExpireTime())
                .then(userApiService.removeInvalidTokens(user.getId()))
                .then(userApiService.saveToken(user.getId(), source, token));
    }

    @Override
    public Mono<Void> extendValidity(String token) {
        if (StringUtils.isBlank(token)) {
            return Mono.empty();
        }
        return reactiveTemplate.expire(token, getTokenExpireTime())
                .then();
    }

    private Duration getTokenExpireTime() {
        long maxAgeInSeconds = commonConfig.getCookie().getMaxAgeInSeconds();
        return Duration.ofSeconds(maxAgeInSeconds);
    }

    @Override
    public Mono<Void> removeUserSession(String token) {
        if (StringUtils.isBlank(token)) {
            return Mono.empty();
        }
        ReactiveValueOperations<String, String> ops = reactiveTemplate.opsForValue();
        return ops.get(token)
                .delayUntil(__ -> ops.delete(token))
                .flatMap(userId -> userApiService.removeToken(userId, token));
    }

    @Override
    public Mono<User> resolveSessionUserFromCookie(String token) {
        if (StringUtils.isBlank(token)) {
            return Mono.empty();
        }
        return reactiveTemplate.opsForValue().get(token)
                .flatMap(value -> {
                    User user = fromJsonQuietly(value, User.class);
                    if (user == null) {
                        return userService.findById(value);
                    }
                    // some compatible code
                    return userService.findById(user.getId());
                })
                .filter(user -> user.getState() != UserState.DELETED);
    }

    @Override
    public Mono<User> resolveSessionUserForJWT(Claims claims, String token) {
        String userId = claims.get("userId").toString();
        return userService.findById(userId)
                .filter(user -> user.getState() != UserState.DELETED)
                .filter(user -> {
                    long apiKeyFound = user.getApiKeysList().stream().filter(apiKey -> apiKey.getToken().equals(token)).count();
                    return apiKeyFound > 0;
                });
    }

    @Override
    public Mono<Boolean> tokenExist(String token) {
        return reactiveTemplate.hasKey(token);
    }

    /** One more attempt at a Redis delete that failed: a transient error should not leave a session alive. */
    private static final long SESSION_DELETE_RETRIES = 1;

    @Override
    public Mono<Void> endSessionsOfUser(String userId, @Nullable String keepToken) {
        return userService.findById(userId)
                .map(user -> tokensToEnd(user, keepToken))
                .flatMapMany(Flux::fromIterable)
                .concatMap(token -> endOneSession(userId, token)
                        .then(Mono.<String>empty())
                        .onErrorResume(error -> {
                            log.warn("D-34: a session of user {} could not be ended", userId, error);
                            return Mono.just(token);
                        }))
                .collectList()
                .filter(failed -> !failed.isEmpty())
                .flatMap(failed -> ofError(BizError.PASSWORD_CHANGED_SESSIONS_NOT_ENDED,
                        "PASSWORD_CHANGED_SESSIONS_NOT_ENDED", failed.size()))
                .then();
    }

    /** The Redis delete ends the session; then the Mongo copy is removed. A missing key is not an error. */
    private Mono<Void> endOneSession(String userId, String token) {
        return reactiveTemplate.opsForValue().delete(token)
                .retry(SESSION_DELETE_RETRIES)
                .then(Mono.defer(() -> userApiService.removeToken(userId, token))
                        .onErrorResume(error -> {
                            log.warn("D-34: user {} still lists an ended session", userId, error);
                            return Mono.empty();
                        }));
    }

    private static List<String> tokensToEnd(User user, @Nullable String keepToken) {
        return user.getConnections().stream()
                .flatMap(connection -> connection.getTokens().stream())
                .filter(StringUtils::isNotBlank)
                .filter(token -> !token.equals(keepToken))
                .distinct()
                .toList();
    }
}

