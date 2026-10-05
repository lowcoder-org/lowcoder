package org.lowcoder.api.authentication.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.lowcoder.domain.user.model.AuthToken;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

/** Tests of {@link AuthenticationUtils}: user merging, claim mapping and the session authentication object. */
class AuthenticationUtilsTest {

    private static final AuthToken LOW_TOKEN = AuthToken.builder().accessToken("low").build();
    private static final AuthToken HIGH_TOKEN = AuthToken.builder().accessToken("high").build();

    private static AuthUser fullUser(String suffix, AuthToken token) {
        return AuthUser.builder().uid("uid-" + suffix).username("name-" + suffix).email("mail-" + suffix).avatar("avatar-" + suffix)
                .rawUserInfo(Map.of("raw", suffix)).authToken(token).build();
    }

    // -------------------------------------------------------------- mergeAuthUser

    /** Catches the user-info answer failing to overwrite the id-token values it does provide. */
    @Test
    void mergeAuthUser_theHighUsersValuesWin() {
        AuthUser merged = AuthenticationUtils.mergeAuthUser(fullUser("low", LOW_TOKEN), fullUser("high", HIGH_TOKEN));

        assertThat(merged.getUid()).isEqualTo("uid-high");
        assertThat(merged.getUsername()).isEqualTo("name-high");
        assertThat(merged.getEmail()).isEqualTo("mail-high");
        assertThat(merged.getAvatar()).isEqualTo("avatar-high");
        assertThat(merged.getRawUserInfo()).isEqualTo(Map.of("raw", "high"));
        assertThat(merged.getAuthToken()).isSameAs(HIGH_TOKEN);
        System.out.println("[AuthenticationUtilsTest] merge: high wins on every field");
    }

    /** Catches a provider that omits a claim erasing the value the id token carried. */
    @Test
    void mergeAuthUser_aFieldTheHighUserOmitsKeepsTheLowValue() {
        AuthUser merged = AuthenticationUtils.mergeAuthUser(fullUser("low", LOW_TOKEN), AuthUser.builder().build());

        assertThat(merged.getUid()).isEqualTo("uid-low");
        assertThat(merged.getUsername()).isEqualTo("name-low");
        assertThat(merged.getEmail()).isEqualTo("mail-low");
        assertThat(merged.getAvatar()).isEqualTo("avatar-low");
        assertThat(merged.getRawUserInfo()).isEqualTo(Map.of("raw", "low"));
        assertThat(merged.getAuthToken()).isSameAs(LOW_TOKEN);
        System.out.println("[AuthenticationUtilsTest] merge: low kept for every omitted field");
    }

    @Test
    void mergeAuthUser_aFieldBothOmit_staysNull() {
        AuthUser merged = AuthenticationUtils.mergeAuthUser(AuthUser.builder().uid("u").build(), AuthUser.builder().email("e").build());

        assertThat(merged.getUid()).isEqualTo("u");
        assertThat(merged.getEmail()).isEqualTo("e");
        assertThat(merged.getUsername()).isNull();
        assertThat(merged.getAvatar()).isNull();
        assertThat(merged.getAuthToken()).isNull();
        System.out.println("[AuthenticationUtilsTest] merge: fields neither user has stay null");
    }

    // ------------------------------------------------------------- mapToAuthUser

    private static HashMap<String, String> mappings() {
        HashMap<String, String> mappings = new HashMap<>();
        mappings.put("uid", "sub");
        mappings.put("email", "mail");
        mappings.put("username", "nick");
        mappings.put("avatar", "pic");
        mappings.put("group_id", "groups[0]");
        return mappings;
    }

    /** Catches a mapped attribute read from the wrong claim. */
    @Test
    void mapToAuthUser_readsEachAttributeFromItsMappedClaim() {
        Map<String, Object> claims = Map.of("sub", "u-1", "mail", "m@x.io", "nick", "neo", "pic", "https://pic", "groups", List.of("g1", "g2"));

        AuthUser user = AuthenticationUtils.mapToAuthUser(claims, mappings());

        assertThat(user.getUid()).isEqualTo("u-1");
        assertThat(user.getEmail()).isEqualTo("m@x.io");
        assertThat(user.getUsername()).isEqualTo("neo");
        assertThat(user.getAvatar()).isEqualTo("https://pic");
        assertThat(user.getGroupId()).isEqualTo("g1");
        assertThat(user.getRawUserInfo()).isSameAs(claims);
        System.out.println("[AuthenticationUtilsTest] mapped " + user.getUid() + "/" + user.getUsername() + "/" + user.getGroupId());
    }

    /** Catches a user without a display name: the username falls back to the email, then to the uid. */
    @Test
    void mapToAuthUser_usernameFallsBackToTheEmailThenTheUid() {
        AuthUser withEmail = AuthenticationUtils.mapToAuthUser(Map.of("sub", "u-1", "mail", "m@x.io"), mappings());
        AuthUser uidOnly = AuthenticationUtils.mapToAuthUser(Map.of("sub", "u-1"), mappings());

        assertThat(withEmail.getUsername()).isEqualTo("m@x.io");
        assertThat(uidOnly.getUsername()).isEqualTo("u-1");
        System.out.println("[AuthenticationUtilsTest] username fallbacks: " + withEmail.getUsername() + ", " + uidOnly.getUsername());
    }

    // ----------------------------------------------------------- toAuthentication

    /** Catches the session object not carrying the user as principal with the user role, or not being authenticated. */
    @Test
    void toAuthentication_carriesTheUserAsAnAuthenticatedPrincipalWithTheUserRole() {
        User user = User.builder().id("user-1").name("User One").build();

        Authentication authentication = AuthenticationUtils.toAuthentication(user);

        assertThat(authentication.getPrincipal()).isSameAs(user);
        assertThat(authentication.getName()).isEqualTo("User One");
        assertThat(authentication.isAuthenticated()).isTrue();
        assertThat(authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)).containsExactly("ROLE_USER");
        assertThat(authentication.getCredentials()).isEqualTo("");
        assertThat((Map<?, ?>) authentication.getDetails()).isEmpty();
        System.out.println("[AuthenticationUtilsTest] authentication principal " + user.getId() + ", authorities " + authentication.getAuthorities());
    }

    /** The authentication cannot be switched off: {@code setAuthenticated(false)} is ignored (pinned as today's behaviour). */
    @Test
    void toAuthentication_setAuthenticatedIsIgnored() {
        Authentication authentication = AuthenticationUtils.toAuthentication(User.builder().id("user-1").build());

        authentication.setAuthenticated(false);

        assertThat(authentication.isAuthenticated()).isTrue();
        System.out.println("[AuthenticationUtilsTest] setAuthenticated(false) ignored");
    }
}
