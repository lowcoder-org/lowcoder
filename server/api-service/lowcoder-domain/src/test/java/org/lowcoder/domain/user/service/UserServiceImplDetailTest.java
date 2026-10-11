package org.lowcoder.domain.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.lowcoder.domain.user.service.UserServiceFixture.ORG_ID;
import static org.lowcoder.domain.user.service.UserServiceFixture.USER_ID;
import static org.lowcoder.sdk.constants.GlobalContext.CLIENT_IP;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.util.SystemGroups;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.ConnectionAuthToken;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserDetail;
import org.lowcoder.sdk.constants.AuthSourceConstants;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

/**
 * {@code buildUserDetail} and its helpers (unit U10, task L3-2): which connection's token is exposed, what lands in
 * {@code extra}, which groups the user sees, and the anonymous shortcut.
 */
class UserServiceImplDetailTest {

    private static final String ACTIVE_AUTH_ID = "auth-active";
    private static final String GITHUB = "GITHUB";
    private static final String IP = "10.1.2.3";

    private UserServiceFixture fixture;
    private UserServiceImpl service;

    @BeforeEach
    void setUp() {
        fixture = new UserServiceFixture();
        service = fixture.service;
        stubMember(MemberRole.MEMBER);
        when(fixture.groupMemberService.getUserGroupIdsInOrg(ORG_ID, USER_ID)).thenReturn(Mono.just(List.of()));
        when(fixture.groupMemberService.getNonDynamicUserGroupIdsInOrg(ORG_ID, USER_ID)).thenReturn(Mono.just(List.of()));
        when(fixture.groupService.getByIds(any())).thenReturn(Flux.empty());
    }

    private void stubMember(MemberRole role) {
        when(fixture.orgMemberService.getCurrentOrgMember(USER_ID))
                .thenReturn(Mono.just(OrgMember.builder().orgId(ORG_ID).userId(USER_ID).role(role).build()));
    }

    private Mono<UserDetail> detail(User user, boolean withoutDynamicGroups) {
        return service.buildUserDetail(user, withoutDynamicGroups).contextWrite(Context.of(CLIENT_IP, IP));
    }

    private static Connection connection(String authId, String source, Map<String, Object> rawUserInfo,
            ConnectionAuthToken token) {
        return Connection.builder().authId(authId).source(source).rawId("raw-" + authId).name("name-" + authId)
                .rawUserInfo(rawUserInfo).authConnectionAuthToken(token).build();
    }

    private static User userWith(String activeAuthId, Connection... connections) {
        return User.builder().id(USER_ID).name("Jane").activeAuthId(activeAuthId).connections(Set.of(connections)).build();
    }

    // ---------------------------------------------------------------- anonymous

    /** Catches the anonymous shortcut (:498) being lost: no org or group lookup for an anonymous user. */
    @Test
    void buildUserDetail_anonymousUser_returnsAnonymousDetailWithoutLookups() {
        User anonymous = User.builder().id(USER_ID).isAnonymous(true).build();

        StepVerifier.create(service.buildUserDetail(anonymous, false))
                .expectNext(UserDetail.ANONYMOUS_CURRENT_USER)
                .verifyComplete();
        verifyNoInteractions(fixture.orgMemberService, fixture.groupService, fixture.groupMemberService);
        System.out.println("[UserServiceImplDetailTest] anonymous user -> ANONYMOUS_CURRENT_USER, no lookups");
    }

    // ---------------------------------------------------------------- userAuth

    static Stream<Arguments> userAuthCases() {
        ConnectionAuthToken token = ConnectionAuthToken.builder().accessToken("access-token-123").build();
        Map<String, Object> raw = Map.of();
        return Stream.of(
                Arguments.of("email login exposes no jwt",
                        connection(ACTIVE_AUTH_ID, AuthSourceConstants.EMAIL, raw, token), ACTIVE_AUTH_ID,
                        "", AuthSourceConstants.EMAIL),
                Arguments.of("sso login exposes its access token",
                        connection(ACTIVE_AUTH_ID, GITHUB, raw, token), ACTIVE_AUTH_ID, "access-token-123", GITHUB),
                Arguments.of("sso login without a stored token exposes an empty jwt",
                        connection(ACTIVE_AUTH_ID, GITHUB, raw, null), ACTIVE_AUTH_ID, "", GITHUB),
                Arguments.of("no connection matches the active auth id",
                        connection("other-auth", GITHUB, raw, token), ACTIVE_AUTH_ID, null, null));
    }

    /**
     * Catches the JWT of an email login leaking (:530), the null-token guard being dropped (:533), and another
     * connection's token being exposed (:510).
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("userAuthCases")
    void buildUserDetail_userAuthFollowsTheActiveConnection(String label, Connection connection, String activeAuthId,
            String expectedJwt, String expectedProvider) {
        User user = userWith(activeAuthId, connection);

        StepVerifier.create(detail(user, false))
                .assertNext(detail -> {
                    if (expectedProvider == null) {
                        assertThat(detail.getUserAuth()).isEmpty();
                    } else {
                        assertThat(detail.getUserAuth()).containsEntry("jwt", expectedJwt)
                                .containsEntry("provider", expectedProvider)
                                .hasSize(2);
                    }
                })
                .verifyComplete();
        System.out.println("[UserServiceImplDetailTest] userAuth: " + label);
    }

    /** Catches the token of an inactive connection being exposed instead of the active one's. */
    @Test
    void buildUserDetail_userAuth_ignoresTheInactiveConnections() {
        ConnectionAuthToken inactiveToken = ConnectionAuthToken.builder().accessToken("inactive-token").build();
        ConnectionAuthToken activeToken = ConnectionAuthToken.builder().accessToken("active-token").build();
        User user = userWith(ACTIVE_AUTH_ID,
                connection("auth-inactive", "GOOGLE", Map.of(), inactiveToken),
                connection(ACTIVE_AUTH_ID, GITHUB, Map.of(), activeToken));

        StepVerifier.create(detail(user, false))
                .assertNext(detail -> assertThat(detail.getUserAuth())
                        .containsEntry("jwt", "active-token").containsEntry("provider", GITHUB))
                .verifyComplete();
        System.out.println("[UserServiceImplDetailTest] only the active connection's token is exposed");
    }

    // ---------------------------------------------------------------- fields and extra

    /** Catches the field mapping of buildUserDetail: name fallback (:514), ip from the context, copied fields. */
    @Test
    void buildUserDetail_copiesFieldsAndFallsBackToIdWhenNameIsEmpty() {
        User user = User.builder().id(USER_ID).name("").email("jane@example.com").uiLanguage("de")
                .activeAuthId(ACTIVE_AUTH_ID).build();

        StepVerifier.create(detail(user, false))
                .assertNext(detail -> {
                    assertThat(detail.getId()).isEqualTo(USER_ID);
                    assertThat(detail.getName()).as("empty name falls back to the id").isEqualTo(USER_ID);
                    assertThat(detail.getEmail()).isEqualTo("jane@example.com");
                    assertThat(detail.getUiLanguage()).isEqualTo("de");
                    assertThat(detail.getIp()).isEqualTo(IP);
                })
                .verifyComplete();

        User named = User.builder().id(USER_ID).name("Jane").activeAuthId(ACTIVE_AUTH_ID).build();
        StepVerifier.create(detail(named, false))
                .assertNext(detail -> assertThat(detail.getName()).isEqualTo("Jane"))
                .verifyComplete();
        System.out.println("[UserServiceImplDetailTest] fields copied, name falls back to the id, ip from the context");
    }

    /** Catches extra being taken from the wrong place: the org's transformed info wins when present (:560-562). */
    @Test
    void buildUserDetail_extraComesFromTheOrgTransformedInfoWhenPresent() {
        User user = userWith(ACTIVE_AUTH_ID, connection(ACTIVE_AUTH_ID, GITHUB, Map.of("login", "jane"), null));
        User.OrgTransformedUserInfo info = new User.OrgTransformedUserInfo();
        info.set(ORG_ID, new User.TransformedUserInfo(1L, Map.of("department", "R&D")));
        user.setOrgTransformedUserInfo(info);

        StepVerifier.create(detail(user, false))
                .assertNext(detail -> assertThat(detail.getExtra()).isEqualTo(Map.of("department", "R&D")))
                .verifyComplete();
        System.out.println("[UserServiceImplDetailTest] extra taken from the org transformed info");
    }

    /** Catches extra not falling back to the active connection when the info is for another org (:561). */
    @Test
    void buildUserDetail_extraFallsBackToTheActiveSsoConnectionRawInfo() {
        Map<String, Object> rawInfo = Map.of("login", "jane");
        User user = userWith(ACTIVE_AUTH_ID,
                connection(ACTIVE_AUTH_ID, GITHUB, rawInfo, null),
                connection("auth-inactive", "GOOGLE", Map.of("sub", "x"), null));
        User.OrgTransformedUserInfo info = new User.OrgTransformedUserInfo();
        info.set("another-org", new User.TransformedUserInfo(1L, Map.of("department", "other")));
        user.setOrgTransformedUserInfo(info);

        StepVerifier.create(detail(user, false))
                .assertNext(detail -> assertThat(detail.getExtra()).isEqualTo(Map.of(GITHUB, rawInfo)))
                .verifyComplete();
        System.out.println("[UserServiceImplDetailTest] extra from the active SSO connection only");
    }

    /** Catches e-mail and phone connections leaking into extra (:586-587). */
    @ParameterizedTest
    @MethodSource("emailAndPhoneSources")
    void buildUserDetail_extraExcludesEmailAndPhoneConnections(String source) {
        User user = userWith(ACTIVE_AUTH_ID, connection(ACTIVE_AUTH_ID, source, Map.of("k", "v"), null));

        StepVerifier.create(detail(user, false))
                .assertNext(detail -> assertThat(detail.getExtra()).isEmpty())
                .verifyComplete();
        System.out.println("[UserServiceImplDetailTest] extra excludes the " + source + " connection");
    }

    static Stream<String> emailAndPhoneSources() {
        return Stream.of(AuthSourceConstants.EMAIL, AuthSourceConstants.PHONE);
    }

    // ---------------------------------------------------------------- groups

    private static Group group(String id, String name, long createdAtMillis) {
        Group group = Group.builder().id(id).name(name).organizationId(ORG_ID).build();
        group.setCreatedAt(Instant.ofEpochMilli(createdAtMillis));
        return group;
    }

    static Stream<Arguments> groupCases() {
        return Stream.of(
                Arguments.of(MemberRole.ADMIN, false, List.of("Alpha", "Beta")),
                Arguments.of(MemberRole.ADMIN, true, List.of("Alpha", "Beta")),
                Arguments.of(MemberRole.SUPER_ADMIN, false, List.of("Alpha", "Beta")),
                Arguments.of(MemberRole.MEMBER, false, List.of("Own all")),
                Arguments.of(MemberRole.MEMBER, true, List.of("Own static")));
    }

    /**
     * Catches an admin not seeing every org group (:570), dynamic groups being shown when excluded (:573), and the
     * all-users group not being filtered out (:579). The admin's groups arrive unsorted and must come back sorted.
     */
    @ParameterizedTest(name = "{0} withoutDynamicGroups={1}")
    @MethodSource("groupCases")
    void buildUserDetail_groupsDependOnRoleAndDynamicGroupFlag(MemberRole role, boolean withoutDynamicGroups,
            List<String> expectedNames) {
        stubMember(role);
        Group allUsers = group("g-all", "All users", 1);
        allUsers.setType(SystemGroups.ALL_USER);
        when(fixture.groupService.getByOrgId(ORG_ID)).thenReturn(Flux.just(
                group("g-beta", "Beta", 200), allUsers, group("g-alpha", "Alpha", 100)));
        when(fixture.groupMemberService.getUserGroupIdsInOrg(ORG_ID, USER_ID)).thenReturn(Mono.just(List.of("g-own-all")));
        when(fixture.groupMemberService.getNonDynamicUserGroupIdsInOrg(ORG_ID, USER_ID)).thenReturn(Mono.just(List.of("g-own-static")));
        when(fixture.groupService.getByIds(List.of("g-own-all"))).thenReturn(Flux.just(group("g-own-all", "Own all", 1), allUsers));
        when(fixture.groupService.getByIds(List.of("g-own-static"))).thenReturn(Flux.just(group("g-own-static", "Own static", 1)));

        StepVerifier.create(detail(User.builder().id(USER_ID).activeAuthId(ACTIVE_AUTH_ID).build(), withoutDynamicGroups))
                .assertNext(detail -> assertThat(detail.getGroups())
                        .extracting(g -> g.get("groupName")).containsExactlyElementsOf(expectedNames))
                .verifyComplete();
        if (role == MemberRole.MEMBER) {
            verify(fixture.groupService, never()).getByOrgId(any());
        }
        System.out.println("[UserServiceImplDetailTest] groups for " + role + " withoutDynamicGroups=" + withoutDynamicGroups
                + " -> " + expectedNames);
    }

    /** Catches a null group id breaking the map (Map.of rejects null) and system group names not being localised. */
    @Test
    void buildUserDetail_groupWithoutIdGetsEmptyIdAndSystemGroupNameIsLocalised() {
        Group devGroup = group(null, "ignored-raw-name", 1);
        devGroup.setType(SystemGroups.DEV);
        when(fixture.groupMemberService.getUserGroupIdsInOrg(ORG_ID, USER_ID)).thenReturn(Mono.just(List.of("g-dev")));
        when(fixture.groupService.getByIds(List.of("g-dev"))).thenReturn(Flux.just(devGroup));

        StepVerifier.create(detail(User.builder().id(USER_ID).activeAuthId(ACTIVE_AUTH_ID).build(), false))
                .assertNext(detail -> {
                    assertThat(detail.getGroups()).hasSize(1);
                    Map<String, String> only = detail.getGroups().get(0);
                    assertThat(only.get("groupId")).isEmpty();
                    assertThat(only.get("groupName")).isEqualTo(devGroup.getName(Locale.ENGLISH))
                            .isNotEqualTo("ignored-raw-name");
                })
                .verifyComplete();
        System.out.println("[UserServiceImplDetailTest] null group id -> \"\", dev group name localised");
    }

    // ---------------------------------------------------------------- convertEmail

    /** Catches convertEmail returning another source's name or failing on no e-mail connection (:592-595). */
    @Test
    void convertEmail_returnsTheFirstEmailConnectionNameOrEmpty() {
        Set<Connection> connections = Set.of(
                connection("a", GITHUB, new HashMap<>(), null),
                connection("b", AuthSourceConstants.EMAIL, new HashMap<>(), null));
        assertThat(service.convertEmail(connections)).isEqualTo("name-b");
        assertThat(service.convertEmail(Set.of(connection("a", GITHUB, new HashMap<>(), null)))).isEmpty();
        System.out.println("[UserServiceImplDetailTest] convertEmail -> e-mail connection name, else empty");
    }
}
