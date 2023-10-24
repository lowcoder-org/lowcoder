package org.lowcoder.api.home;

import io.jsonwebtoken.Claims;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.infra.annotation.NonEmptyMono;

import reactor.core.publisher.Mono;

public interface SessionUserService {

    @NonEmptyMono
    Mono<User> getVisitor();

    @NonEmptyMono
    Mono<String> getVisitorId();

    @NonEmptyMono
    Mono<OrgMember> getVisitorOrgMemberCache();

    Mono<OrgMember> getVisitorOrgMember();

    Mono<Boolean> isAnonymousUser();

    Mono<Void> saveUserSession(String sessionId, User user, String source);

    Mono<Void> extendValidity(String sessionId);

    Mono<Void> removeUserSession(String sessionId);

    Mono<User> resolveSessionUserFromCookie(String token);

    Mono<User> resolveSessionUserForJWT(Claims claims, String token);

    Mono<Boolean> tokenExist(String token);
}
