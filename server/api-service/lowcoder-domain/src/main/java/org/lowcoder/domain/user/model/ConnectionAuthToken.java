package org.lowcoder.domain.user.model;

import lombok.Builder;
import lombok.Data;

/**
 * data object
 *
 * @see AuthToken business object
 */
@Data
@Builder
public class ConnectionAuthToken {

    private String accessToken;
    // in seconds
    private Long expireAt;
    private String refreshToken;
    // in seconds
    private Long refreshTokenExpireAt;
    @Deprecated
    private String source;

    public boolean isAccessTokenExpired() {
        return expireAt == null || expireAt < System.currentTimeMillis() / 1000;
    }

    public boolean isRefreshTokenExpired() {
        return refreshTokenExpireAt == null || refreshTokenExpireAt < System.currentTimeMillis() / 1000;
    }

    public static ConnectionAuthToken of(AuthToken token) {

        Long accessTokenExpiry = 0L;
        if(token.getExpireIn() != 0) {
            accessTokenExpiry = System.currentTimeMillis() / 1000 + token.getExpireIn() - 60;
        }

        Long refreshTokenExpiry = 0L;
        if(token.getRefreshTokenExpireIn() != 0) {
            refreshTokenExpiry = System.currentTimeMillis() / 1000 + token.getRefreshTokenExpireIn() - 60;
        }

        return ConnectionAuthToken.builder()
                .accessToken(token.getAccessToken())
                .expireAt(accessTokenExpiry)
                .refreshToken(token.getRefreshToken())
                .refreshTokenExpireAt(refreshTokenExpiry)
                .source(null)
                .build();
    }
}
