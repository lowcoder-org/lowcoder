package org.lowcoder.api.authentication.util;

import static java.util.Collections.emptyMap;
import static reactor.core.scheduler.Schedulers.newBoundedElastic;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang.StringUtils;
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
     *
     * @param map            Object
     * @param sourceMappings
     * @return AuthToken
     */
    public static AuthToken mapToAuthToken(Map<String, Object> map, HashMap<String, String> sourceMappings) {
        return AuthToken.builder()
                .accessToken(MapUtils.getString(map, "access_token"))
                .expireIn(MapUtils.getIntValue(map, "expires_in"))
                .refreshToken(MapUtils.getString(map, "refresh_token"))
                .jwt(AdvancedMapUtils.getString(map, MapUtils.getString(sourceMappings, "jwt", "access_token")))
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
        String uid = AdvancedMapUtils.getString(map, MapUtils.getString(sourceMappings, "uid"));
        String email = AdvancedMapUtils.getString(map, MapUtils.getString(sourceMappings, "email"));
        String username = AdvancedMapUtils.getString(map, MapUtils.getString(sourceMappings, "username"));
        if(StringUtils.isEmpty(username)) username = email;
        if(StringUtils.isEmpty(username)) username = uid;
        String avatar = AdvancedMapUtils.getString(map, MapUtils.getString(sourceMappings, "avatar"));
        return AuthUser.builder()
                .uid(uid)
                .username(username)
                .email(email)
                .avatar(avatar)
                .rawUserInfo(map)
                .build();
    }

    /**
     * Merge two AuthUser object - overwrite high into low
     * @param low base object for merge
     * @param high overwriting object
     * @return
     */
    public static AuthUser mergeAuthUser(AuthUser low, AuthUser high) {
        return AuthUser.builder()
                .uid(high.getUid() != null ? high.getUid() : low.getUid())
                .username(high.getUsername() != null ? high.getUsername() : low.getUsername())
                .email(high.getEmail() != null ? high.getEmail() : low.getEmail())
                .avatar(high.getAvatar() != null ? high.getAvatar() : low.getAvatar())
                .rawUserInfo(high.getRawUserInfo() != null ? high.getRawUserInfo() : low.getRawUserInfo())
                .authToken(high.getAuthToken() != null ? high.getAuthToken() : low.getAuthToken())
                .build();
    }
}
