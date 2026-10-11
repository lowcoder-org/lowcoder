package org.lowcoder.domain.user.model;

import jakarta.annotation.Nullable;
import lombok.*;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.domain.authentication.context.AuthRequestContext;
import org.lowcoder.sdk.util.EmailUtils;

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
    private String email;
    private String avatar;
    private Map<String, Object> rawUserInfo;
    private Map<String, Object> extra;

    private String orgId;

    // Add groupId for group mapping
    private String groupId;

    private AuthRequestContext authContext;

    /**
     * While user is authenticated by oauth 2.0, we store the token information which may be used in the future datasource or query.
     */
    @Nullable
    private AuthToken authToken;

    public String getSource() {
        return getAuthContext().getAuthConfig().getSource();
    }

    /**
     * The connection to persist for this authenticated identity.
     *
     * <p>Every path that creates a <i>connection</i> goes through here -- form register, SSO just-in-time
     * provisioning and {@code /tp/link} all end at this method -- so it is where connection email values
     * are put into canonical form. Normalizing here rather than at each call site is what keeps newly
     * written connections consistent without having to find every writer. It is not the only path that
     * creates a <i>user</i>: SCIM provisioning builds a {@code User} directly and deliberately attaches no
     * connection, so it normalizes its own address
     * (see {@code UserController#createSCIMUserAndAddToOrg}).
     *
     * <p>{@code email}, when present, is an address, and is normalized. It is frequently absent: several
     * providers leave the email claim unset and carry the address in {@code username} instead, so null
     * must survive as null rather than becoming {@code ""}.
     *
     * <p>{@code rawId} is only an address when the source is {@code EMAIL}; for every other source it is
     * the opaque IdP subject and is stored byte-for-byte, because normalizing it would let the subject
     * {@code AbC} authenticate as {@code abc}.
     */
    public Connection toAuthConnection() {
        return Connection.builder()
                .authId(getAuthContext().getAuthConfig().getId())
                .source(getSource())
                .name(getUsername())
                // Null-preserving: an SSO provider that returns no email claim must leave this null, not "".
                // An empty string is a value, and it would later look like an address that nothing can
                // resolve.
                .email(getEmail() == null ? null : EmailUtils.normalize(getEmail()))
                .rawId(EmailUtils.normalizeIfEmailSource(getSource(), getUid()))
                .avatar(getAvatar())
                .orgIds(StringUtils.isBlank(getOrgId()) ? Set.of() : Set.of(getOrgId()))
                .authConnectionAuthToken(Optional.ofNullable(authToken).map(ConnectionAuthToken::of).orElse(null))
                .rawUserInfo(getRawUserInfo())
                .build();
    }
}
