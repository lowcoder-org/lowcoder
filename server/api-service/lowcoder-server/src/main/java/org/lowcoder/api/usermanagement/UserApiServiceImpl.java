package org.lowcoder.api.usermanagement;

import static org.lowcoder.sdk.exception.BizError.UNSUPPORTED_OPERATION;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserDetail;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.domain.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Service
@Slf4j
public class UserApiServiceImpl implements UserApiService {

    @Lazy
    private final SessionUserService sessionUserService;
    private final OrgMemberService orgMemberService;
    private final UserService userService;
    private final UserRepository repository;

    @Override
    public Mono<UserDetail> getUserDetailById(String userId) {
        return checkAdminPermissionAndUserBelongsToCurrentOrg(userId)
                .then(userService.findById(userId)
                        .flatMap(user -> userService.buildUserDetail(user, false)));
    }

    private Mono<Void> checkAdminPermissionAndUserBelongsToCurrentOrg(String userId) {
        return sessionUserService.getVisitorOrgMemberCache()
                .flatMap(orgMember -> {
                    if (!orgMember.isAdmin() && !orgMember.isSuperAdmin()) {
                        return ofError(UNSUPPORTED_OPERATION, "BAD_REQUEST");
                    }
                    return orgMemberService.getOrgMember(orgMember.getOrgId(), userId)
                            .hasElement()
                            .flatMap(hasElement -> {
                                if (hasElement) {
                                    return Mono.empty();
                                }
                                return ofError(UNSUPPORTED_OPERATION, "BAD_REQUEST");
                            });
                });
    }

    @Override
    public Mono<String> resetPassword(String userId) {
        return checkAdminPermissionAndUserBelongsToCurrentOrg(userId)
                .then(userService.resetPassword(userId));
    }

    @Override
    public Mono<Boolean> lostPassword(String userEmail) {
        return userService.lostPassword(userEmail);
    }

    @Override
    public Mono<Boolean> resetLostPassword(String userEmail, String token, String newPassword) {
        return userService.resetLostPassword(userEmail, token, newPassword);
    }

    // ========================== TOKEN OPERATIONS START ==========================

    @Override
    public Mono<Void> saveToken(String userId, String source, String token) {
        return repository.findById(userId)
                .doOnNext(user -> user.getConnections().stream()
                        .filter(connection -> connection.getSource().equals(source))
                        .forEach(connection -> connection.addToken(token)))
                .flatMap(repository::save)
                .then();
    }

    /**
     * Remove the token.
     */
    @Override
    public Mono<Void> removeToken(String userId, String token) {
        return repository.findById(userId)
                .doOnNext(user -> removeToken(user, token))
                .flatMap(repository::save)
                .then();
    }

    private void removeToken(User user, String token) {
        user.getConnections().forEach(connection -> connection.removeToken(token));
    }

    @Override
    public Flux<String> getTokensByAuthId(String userId, String authId) {
        return repository.findById(userId)
                .flatMapIterable(User::getConnections)
                .filter(connection -> Objects.equals(connection.getAuthId(), authId))
                .flatMapIterable(Connection::getTokens);
    }

    /**
     * Token stored in redis will expire if there's no access while it stored in mongodb will not expire. These tokens still stored in mongodb
     * become invalid so that we should clear them.
     */
    @Override
    public Mono<Void> removeInvalidTokens(String userId) {
        return repository.findById(userId)
                .delayUntil(user -> getInvalidTokens(user).doOnNext(invalidToken -> removeToken(user, invalidToken)))
                .flatMap(repository::save)
                .then();
    }

    private Flux<String> getInvalidTokens(User user) {
        Set<String> allTokens = user.getConnections().stream()
                .map(Connection::getTokens)
                .flatMap(Set::stream)
                .collect(Collectors.toSet());
        return Flux.fromIterable(allTokens)
                // token not exist in redis
                .filterWhen(token -> sessionUserService.tokenExist(token).map(aBoolean -> !aBoolean));
    }

    // ========================== TOKEN OPERATIONS END ==========================
}
