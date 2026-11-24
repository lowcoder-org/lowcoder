package org.lowcoder.api.home;

import io.jsonwebtoken.Claims;
import jakarta.annotation.Nullable;
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

    Mono<OrgMember> getVisitorOrgMemberCacheSilent();

    Mono<OrgMember> getVisitorOrgMember();

    Mono<Boolean> isAnonymousUser();

    Mono<Void> saveUserSession(String sessionId, User user, String source);

    Mono<Void> extendValidity(String sessionId);

    Mono<Void> removeUserSession(String sessionId);

    Mono<User> resolveSessionUserFromCookie(String token);

    Mono<User> resolveSessionUserForJWT(Claims claims, String token);

    Mono<Boolean> tokenExist(String token);

    Mono<String> getVisitorToken();

    /**
     * Ends every session whose token is stored on the user's connections, except {@code keepToken} (D-34). A null
     * or blank {@code keepToken} keeps none. Limits: a session whose token is not in the stored list is not found
     * (a login racing a password change can keep its session, or add a token that is never swept); API keys are
     * untouched.
     */
    Mono<Void> endSessionsOfUser(String userId, @Nullable String keepToken);
}
