package org.lowcoder.domain.user.model;

import jakarta.annotation.Nullable;
import lombok.*;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.domain.authentication.context.AuthRequestContext;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthUser {

    private String uid;
    private String username;
    private String avatar;
    private Map<String, Object> rawUserInfo;
    private Map<String, Object> extra;

    private String orgId;

    private AuthRequestContext authContext;

    /**
     * While user is authenticated by oauth 2.0, we store the token information which may be used in the future datasource or query.
     */
    @Nullable
    private AuthToken authToken;

    public String getSource() {
        return getAuthContext().getAuthConfig().getSource();
    }

    public Connection toAuthConnection() {
        return Connection.builder()
                .authId(getAuthContext().getAuthConfig().getId())
                .source(getSource())
                .name(getUsername())
                .rawId(getUid())
                .avatar(getAvatar())
                .orgIds(StringUtils.isBlank(getOrgId()) ? Set.of() : Set.of(getOrgId()))
                .authConnectionAuthToken(Optional.ofNullable(authToken).map(ConnectionAuthToken::of).orElse(null))
                .rawUserInfo(getRawUserInfo())
                .build();
    }
}
