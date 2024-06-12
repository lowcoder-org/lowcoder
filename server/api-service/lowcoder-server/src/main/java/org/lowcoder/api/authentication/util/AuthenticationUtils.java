package org.lowcoder.api.authentication.util;

import static java.util.Collections.emptyMap;
import static reactor.core.scheduler.Schedulers.newBoundedElastic;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.collections4.MapUtils;
import org.lowcoder.domain.user.model.AuthToken;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

import com.google.common.collect.ImmutableSet;

import reactor.core.scheduler.Scheduler;

public final class AuthenticationUtils {

    public static final int JUST_AUTH_THREAD_POOL_SIZE = 50;
    public static final Scheduler AUTH_REQUEST_THREAD_POOL = newBoundedElastic(JUST_AUTH_THREAD_POOL_SIZE, 5000, "auth-worker");

    public static Authentication toAuthentication(User user) {
        return new Authentication() {
            @Override
            public Collection<? extends GrantedAuthority> getAuthorities() {
                return ImmutableSet.of((GrantedAuthority) () -> "ROLE_USER"
                );
            }

            @Override
            public Object getCredentials() {
                return "";
            }

            @Override
            public Object getDetails() {
                return emptyMap();
            }

            @Override
            public Object getPrincipal() {
                return user;
            }

            @Override
            public boolean isAuthenticated() {
                return true;
            }

            @Override
            public void setAuthenticated(boolean isAuthenticated) {
            }

            @Override
            public String getName() {
                return user.getName();
            }
        };
    }

    /**
     * Utility method to map from Map to AuthToken
     * @param map Object
     * @return AuthToken
     */
    public static AuthToken mapToAuthToken(Map<String, Object> map) {
        return AuthToken.builder()
                .accessToken(MapUtils.getString(map, "access_token"))
                .expireIn(MapUtils.getIntValue(map, "expires_in"))
                .refreshToken(MapUtils.getString(map, "refresh_token"))
                .build();
    }

    /**
     * Utility method to map from Map to AuthUser
     *
     * @param map            Object
     * @param sourceMappings
     * @return AuthUser
     */
    public static AuthUser mapToAuthUser(Map<String, Object> map, HashMap<String, String> sourceMappings) {
        return AuthUser.builder()
                .uid(MapUtils.getString(map, MapUtils.getString(sourceMappings, "uid")))
                .username(MapUtils.getString(map, MapUtils.getString(sourceMappings, "username")))
                .avatar(MapUtils.getString(map, MapUtils.getString(sourceMappings, "avatar")))
                .rawUserInfo(map)
                .build();
    }
}
