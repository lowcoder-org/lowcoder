package org.lowcoder.api.bizthreshold;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.lowcoder.domain.application.model.ApplicationStatus;
import org.lowcoder.domain.application.service.ApplicationService;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.test.util.ReflectionTestUtils;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Unit tests of {@link AbstractBizThresholdChecker} with a small concrete subclass whose limits and white lists the test sets,
 * and the four collaborating services mocked.
 *
 * <p>Every limit and white list read here comes from the {@code threshold.*} server configuration keys, which only the
 * deployment's super admin may write since BF-001 (it was the plan section 9 server-config row, tested through the request
 * stack by ServerConfigWriteAuthorisationTest). Who may change them is not tested here: this class tests what the checker
 * does with the values it is given.
 *
 * <p>Boundary arithmetic (behaviour, not a defect): the org, member, application and group checks run BEFORE the creation and
 * reject at {@code count >= limit}, so at most {@code limit} items exist afterwards; {@code checkMaxDeveloperCount} puts the
 * new user into its set and rejects at {@code size > limit}, so at most {@code limit} developers exist afterwards.
 */
class AbstractBizThresholdCheckerTest {

    private static final String USER_ID = "user-1";
    private static final String OTHER_ID = "other-1";
    private static final String ORG_ID = "org-1";
    private static final String GROUP_ID = "dev-group-1";
    private static final int LIMIT = 5;
    private static final int WHITE_LISTED_LIMIT = 8;
    private static final int LOWER_THAN_LIMIT = 2;
    /** The limit of every check the test is NOT about: far from LIMIT, so reading the wrong limit changes the outcome. */
    private static final int UNRELATED_LIMIT = 50;

    /** The checker with every limit and white list under the test's control. */
    private static class TestChecker extends AbstractBizThresholdChecker {
        int maxOrgPerUser = UNRELATED_LIMIT;
        int maxOrgMemberCount = UNRELATED_LIMIT;
        int maxOrgGroupCount = UNRELATED_LIMIT;
        int maxOrgAppCount = UNRELATED_LIMIT;
        int maxDeveloperCount = UNRELATED_LIMIT;
        Map<String, Integer> userOrgCountWhiteList = new HashMap<>();
        Map<String, Integer> orgMemberCountWhiteList = new HashMap<>();
        Map<String, Integer> orgAppCountWhiteList = new HashMap<>();

        @Override protected int getMaxOrgPerUser() { return maxOrgPerUser; }
        @Override protected int getMaxOrgMemberCount() { return maxOrgMemberCount; }
        @Override protected int getMaxOrgGroupCount() { return maxOrgGroupCount; }
        @Override protected int getMaxOrgAppCount() { return maxOrgAppCount; }
        @Override protected Map<String, Integer> getUserOrgCountWhiteList() { return userOrgCountWhiteList; }
        @Override protected Map<String, Integer> getOrgMemberCountWhiteList() { return orgMemberCountWhiteList; }
        @Override protected Map<String, Integer> getOrgAppCountWhiteList() { return orgAppCountWhiteList; }
        @Override protected Mono<Integer> getMaxDeveloperCount() { return Mono.just(maxDeveloperCount); }
    }

    private TestChecker checker;
    private OrgMemberService orgMemberService;
    private GroupService groupService;
    private GroupMemberService groupMemberService;
    private ApplicationService applicationService;

    @BeforeEach
    void setUp() {
        checker = new TestChecker();
        orgMemberService = mock(OrgMemberService.class);
        groupService = mock(GroupService.class);
        groupMemberService = mock(GroupMemberService.class);
        applicationService = mock(ApplicationService.class);
        ReflectionTestUtils.setField(checker, "orgMemberService", orgMemberService);
        ReflectionTestUtils.setField(checker, "groupService", groupService);
        ReflectionTestUtils.setField(checker, "groupMemberService", groupMemberService);
        ReflectionTestUtils.setField(checker, "applicationService", applicationService);
    }

    private static OrgMember member(String userId) {
        return OrgMember.builder().orgId(ORG_ID).userId(userId).build();
    }

    private static GroupMember groupMember(String userId) {
        return GroupMember.builder().groupId(GROUP_ID).userId(userId).orgId(ORG_ID).build();
    }

    private static void assertExceeds(Throwable error, BizError expected, String messageKey) {
        assertThat(error).isInstanceOf(BizException.class);
        BizException biz = (BizException) error;
        assertThat(biz.getError()).isEqualTo(expected);
        assertThat(biz.getMessageKey()).isEqualTo(messageKey);
    }

    private static void say(String format, Object... args) {
        System.out.println("[AbstractBizThresholdCheckerTest] " + String.format(format, args));
    }

    /**
     * Counts around the effective limit: {@code effective - 1} passes, {@code effective} and above are rejected. The
     * effective limit is the larger of the configured limit and the white-list value of the subject.
     */
    static Stream<Arguments> countCases() {
        return Stream.of(
                // label, white list value for the subject (null = no entry), white list value for another subject, count, accepted
                Arguments.of("below the limit", null, null, (long) LIMIT - 1, true),
                Arguments.of("at the limit", null, null, (long) LIMIT, false),
                Arguments.of("above the limit", null, null, (long) LIMIT + 3, false),
                Arguments.of("zero", null, null, 0L, true),
                Arguments.of("white list raises: at the old limit", WHITE_LISTED_LIMIT, null, (long) LIMIT, true),
                Arguments.of("white list raises: below the new limit", WHITE_LISTED_LIMIT, null, (long) WHITE_LISTED_LIMIT - 1, true),
                Arguments.of("white list raises: at the new limit", WHITE_LISTED_LIMIT, null, (long) WHITE_LISTED_LIMIT, false),
                Arguments.of("white list below the limit never lowers it (Math.max)", LOWER_THAN_LIMIT, null, (long) LIMIT - 1, true),
                Arguments.of("white list below the limit: at the limit", LOWER_THAN_LIMIT, null, (long) LIMIT, false),
                Arguments.of("another subject's white list entry is ignored", null, WHITE_LISTED_LIMIT, (long) LIMIT, false));
    }

    private static Map<String, Integer> whiteList(Integer subjectValue, String subjectId, Integer otherValue) {
        Map<String, Integer> map = new HashMap<>();
        if (subjectValue != null) {
            map.put(subjectId, subjectValue);
        }
        if (otherValue != null) {
            map.put(OTHER_ID, otherValue);
        }
        return map;
    }

    private static void verifyOutcome(Mono<Void> result, boolean accepted, BizError error, String messageKey) {
        if (accepted) {
            StepVerifier.create(result).verifyComplete();
        } else {
            StepVerifier.create(result).expectErrorSatisfies(e -> assertExceeds(e, error, messageKey)).verify();
        }
    }

    /**
     * The user's org count against {@code max(userOrgCountWhiteList[userId], maxOrgPerUser)}: below passes, at the limit is
     * rejected with EXCEED_MAX_USER_ORG_COUNT. A white list only raises the limit (Math.max), keyed by the user id. The limit
     * and the white list are server configuration (super admin only since BF-001; not tested here).
     */
    @ParameterizedTest(name = "org count: {0}")
    @MethodSource("countCases")
    void checkMaxOrgCount_boundaryAndWhiteList(String label, Integer subjectValue, Integer otherValue, long count, boolean accepted) {
        checker.maxOrgPerUser = LIMIT;
        checker.userOrgCountWhiteList = whiteList(subjectValue, USER_ID, otherValue);
        when(orgMemberService.countAllActiveOrgs(USER_ID)).thenReturn(Mono.just(count));

        verifyOutcome(checker.checkMaxOrgCount(USER_ID), accepted, BizError.EXCEED_MAX_USER_ORG_COUNT, "EXCEED_MAX_USER_ORG_COUNT");
        say("checkMaxOrgCount %s count=%d -> accepted=%s", label, count, accepted);
    }

    /** The same matrix on the org's member count and {@code orgMemberCountWhiteList[orgId]} (server configuration, super admin only since BF-001; not tested here). */
    @ParameterizedTest(name = "org member count: {0}")
    @MethodSource("countCases")
    void checkMaxOrgMemberCount_boundaryAndWhiteList(String label, Integer subjectValue, Integer otherValue, long count, boolean accepted) {
        checker.maxOrgMemberCount = LIMIT;
        checker.orgMemberCountWhiteList = whiteList(subjectValue, ORG_ID, otherValue);
        when(orgMemberService.getOrgMemberCount(ORG_ID)).thenReturn(Mono.just(count));

        verifyOutcome(checker.checkMaxOrgMemberCount(ORG_ID), accepted, BizError.EXCEED_MAX_ORG_MEMBER_COUNT, "EXCEED_MAX_ORG_MEMBER_COUNT");
        say("checkMaxOrgMemberCount %s count=%d -> accepted=%s", label, count, accepted);
    }

    /**
     * The same matrix on the application count with {@code orgAppCountWhiteList[orgId]}; the count is asked for the NORMAL
     * applications of the org of the member that is passed in (server configuration, super admin only since BF-001; not tested here).
     */
    @ParameterizedTest(name = "org application count: {0}")
    @MethodSource("countCases")
    void checkMaxOrgApplicationCount_boundaryAndWhiteList(String label, Integer subjectValue, Integer otherValue, long count, boolean accepted) {
        checker.maxOrgAppCount = LIMIT;
        checker.orgAppCountWhiteList = whiteList(subjectValue, ORG_ID, otherValue);
        when(applicationService.countByOrganizationId(ORG_ID, ApplicationStatus.NORMAL)).thenReturn(Mono.just(count));

        verifyOutcome(checker.checkMaxOrgApplicationCount(member(USER_ID)), accepted, BizError.EXCEED_MAX_APP_COUNT, "EXCEED_MAX_APP_COUNT");
        say("checkMaxOrgApplicationCount %s count=%d -> accepted=%s", label, count, accepted);
    }

    /**
     * The org's group count of the member's org against {@code maxOrgGroupCount}; there is no white list for groups. The limit
     * is server configuration (super admin only since BF-001; not tested here).
     */
    @ParameterizedTest(name = "group count {0} -> accepted {1}")
    @MethodSource("groupCases")
    void checkMaxGroupCount_boundary(long count, boolean accepted) {
        checker.maxOrgGroupCount = LIMIT;
        when(groupService.getOrgGroupCount(ORG_ID)).thenReturn(Mono.just(count));
        // a white list entry for the org changes nothing for groups: the other white lists are not consulted
        checker.orgMemberCountWhiteList.put(ORG_ID, WHITE_LISTED_LIMIT);
        checker.orgAppCountWhiteList.put(ORG_ID, WHITE_LISTED_LIMIT);

        verifyOutcome(checker.checkMaxGroupCount(member(USER_ID)), accepted, BizError.EXCEED_MAX_GROUP_COUNT, "EXCEED_MAX_GROUP_COUNT");
        say("checkMaxGroupCount count=%d -> accepted=%s", count, accepted);
    }

    static Stream<Arguments> groupCases() {
        return Stream.of(Arguments.of(0L, true), Arguments.of((long) LIMIT - 1, true), Arguments.of((long) LIMIT, false),
                Arguments.of((long) LIMIT + 1, false));
    }

    /**
     * Developers are the SET of org admins, members of the developer group and the new user, so a user that is already an
     * admin or a group member (or in both lists) is not counted twice: size equal to the limit is accepted, one more is
     * rejected. The limit is server configuration (super admin only since BF-001; not tested here).
     */
    static Stream<Arguments> developerCases() {
        return Stream.of(
                // label, admin ids, group member ids, new user id, accepted
                Arguments.of("well below", List.of("a1"), List.of("m1"), "n", true),
                Arguments.of("exactly the limit with a new user", List.of("a1", "a2"), List.of("m1", "m2"), "n", true),
                Arguments.of("one above the limit", List.of("a1", "a2", "a3"), List.of("m1", "m2"), "n", false),
                Arguments.of("overlap between the two lists counts once", List.of("a1", "a2", "x"), List.of("x", "m1"), "n", true),
                Arguments.of("overlap, one more new user is still within", List.of("a1", "a2", "x"), List.of("x", "m1", "n"), "n", true),
                Arguments.of("an existing admin re-added at the limit", List.of("a1", "a2", "a3", "a4", "a5"), List.of(), "a1", true),
                Arguments.of("an existing group member re-added at the limit", List.of("a1", "a2"), List.of("m1", "m2", "m3"), "m2", true),
                Arguments.of("a new user above the limit with five existing", List.of("a1", "a2", "a3", "a4", "a5"), List.of(), "n", false),
                Arguments.of("the new user alone", List.of(), List.of(), "n", true));
    }

    @ParameterizedTest(name = "developers: {0}")
    @MethodSource("developerCases")
    void checkMaxDeveloperCount_countsTheUnionOnce(String label, List<String> adminIds, List<String> memberIds, String newUserId,
            boolean accepted) {
        checker.maxDeveloperCount = LIMIT;
        when(orgMemberService.getAllOrgAdmins(ORG_ID)).thenReturn(Mono.just(adminIds.stream().map(AbstractBizThresholdCheckerTest::member).toList()));
        when(groupMemberService.getGroupMembers(GROUP_ID)).thenReturn(Mono.just(memberIds.stream().map(AbstractBizThresholdCheckerTest::groupMember).toList()));

        verifyOutcome(checker.checkMaxDeveloperCount(ORG_ID, GROUP_ID, newUserId), accepted, BizError.EXCEED_MAX_DEVELOPER_COUNT,
                "EXCEED_MAX_DEVELOPER_COUNT");
        say("checkMaxDeveloperCount %s -> accepted=%s", label, accepted);
    }

    @Test
    void checkMaxDeveloperCount_usesTheConfiguredLimit() {
        checker.maxDeveloperCount = 2;
        when(orgMemberService.getAllOrgAdmins(ORG_ID)).thenReturn(Mono.just(List.of(member("a1"))));
        when(groupMemberService.getGroupMembers(GROUP_ID)).thenReturn(Mono.just(List.of(groupMember("m1"))));

        StepVerifier.create(checker.checkMaxDeveloperCount(ORG_ID, GROUP_ID, "n"))
                .expectErrorSatisfies(e -> assertExceeds(e, BizError.EXCEED_MAX_DEVELOPER_COUNT, "EXCEED_MAX_DEVELOPER_COUNT"))
                .verify();
        StepVerifier.create(checker.checkMaxDeveloperCount(ORG_ID, GROUP_ID, "a1")).verifyComplete();
    }

    /** The admins are read for the org id and the members for the developer group id (different values, so a swap breaks one lookup). */
    @Test
    void checkMaxDeveloperCount_asksTheRightScopes() {
        when(orgMemberService.getAllOrgAdmins(ORG_ID)).thenReturn(Mono.just(List.of(member("a1"))));
        when(groupMemberService.getGroupMembers(GROUP_ID)).thenReturn(Mono.just(List.of(groupMember("m1"))));

        StepVerifier.create(checker.checkMaxDeveloperCount(ORG_ID, GROUP_ID, "n")).verifyComplete();

        org.mockito.Mockito.verify(orgMemberService).getAllOrgAdmins(ORG_ID);
        org.mockito.Mockito.verify(groupMemberService).getGroupMembers(GROUP_ID);
    }

    /**
     * Behaviour, a design inconsistency and not a reachable defect: an EMPTY count Mono means "exceeded" for the three count
     * checks (switchIfEmpty ends in the EXCEED error) and the group check, while an empty admin or member list Mono makes
     * checkMaxDeveloperCount complete without any check (zipWith of an empty Mono is empty), so empty means "exceeded" for the
     * counts and "unchecked" for developers. The test shows the checker's reaction only; it does not show that production reaches
     * it (the counting services return Mono&lt;Long&gt; from count queries, which were not verified to never complete empty).
     */
    @Test
    void emptyUpstreams_meanExceededForTheCounts_andUncheckedForDevelopers() {
        when(orgMemberService.countAllActiveOrgs(USER_ID)).thenReturn(Mono.empty());
        when(orgMemberService.getOrgMemberCount(ORG_ID)).thenReturn(Mono.empty());
        when(applicationService.countByOrganizationId(ORG_ID, ApplicationStatus.NORMAL)).thenReturn(Mono.empty());
        when(groupService.getOrgGroupCount(ORG_ID)).thenReturn(Mono.empty());

        verifyOutcome(checker.checkMaxOrgCount(USER_ID), false, BizError.EXCEED_MAX_USER_ORG_COUNT, "EXCEED_MAX_USER_ORG_COUNT");
        verifyOutcome(checker.checkMaxOrgMemberCount(ORG_ID), false, BizError.EXCEED_MAX_ORG_MEMBER_COUNT, "EXCEED_MAX_ORG_MEMBER_COUNT");
        verifyOutcome(checker.checkMaxOrgApplicationCount(member(USER_ID)), false, BizError.EXCEED_MAX_APP_COUNT, "EXCEED_MAX_APP_COUNT");
        verifyOutcome(checker.checkMaxGroupCount(member(USER_ID)), false, BizError.EXCEED_MAX_GROUP_COUNT, "EXCEED_MAX_GROUP_COUNT");

        // developers: even five admins beyond the limit pass when the other list is an empty Mono
        when(orgMemberService.getAllOrgAdmins(ORG_ID)).thenReturn(Mono.just(
                List.of(member("a1"), member("a2"), member("a3"), member("a4"), member("a5"), member("a6"))));
        when(groupMemberService.getGroupMembers(GROUP_ID)).thenReturn(Mono.empty());
        StepVerifier.create(checker.checkMaxDeveloperCount(ORG_ID, GROUP_ID, "n")).verifyComplete();
        when(orgMemberService.getAllOrgAdmins(ORG_ID)).thenReturn(Mono.empty());
        when(groupMemberService.getGroupMembers(GROUP_ID)).thenReturn(Mono.just(List.of(groupMember("m1"))));
        StepVerifier.create(checker.checkMaxDeveloperCount(ORG_ID, GROUP_ID, "n")).verifyComplete();
    }

    /** An error of the counting service reaches the caller unchanged: it is not turned into "exceeded" or into "ok". */
    @Test
    void upstreamErrors_propagateUnchanged() {
        IllegalStateException failure = new IllegalStateException("database down");
        when(orgMemberService.countAllActiveOrgs(USER_ID)).thenReturn(Mono.error(failure));
        when(orgMemberService.getOrgMemberCount(ORG_ID)).thenReturn(Mono.error(failure));
        when(applicationService.countByOrganizationId(ORG_ID, ApplicationStatus.NORMAL)).thenReturn(Mono.error(failure));
        when(groupService.getOrgGroupCount(ORG_ID)).thenReturn(Mono.error(failure));
        when(orgMemberService.getAllOrgAdmins(ORG_ID)).thenReturn(Mono.error(failure));
        when(groupMemberService.getGroupMembers(GROUP_ID)).thenReturn(Mono.just(List.of()));

        for (Mono<Void> result : List.of(checker.checkMaxOrgCount(USER_ID), checker.checkMaxOrgMemberCount(ORG_ID),
                checker.checkMaxOrgApplicationCount(member(USER_ID)), checker.checkMaxGroupCount(member(USER_ID)),
                checker.checkMaxDeveloperCount(ORG_ID, GROUP_ID, "n"))) {
            StepVerifier.create(result).expectErrorSatisfies(e -> assertThat(e).isSameAs(failure)).verify();
        }
    }
}
