package org.lowcoder.api.usermanagement;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.apache.commons.lang3.RandomUtils;
import org.junit.jupiter.api.Test;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.sdk.util.IDUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * {@link OrgMemberService#addMember} for each user, followed by {@link OrgMemberService#getOrganizationMembers(String)} against the
 * MongoDB test container: every added user comes back exactly once. Moved here from lowcoder-domain, where it never ran
 * (a JUnit 4 test in a module without the vintage engine, and a {@code @SpringBootTest} without an application class).
 */
@SpringBootTest
@ActiveProfiles("test")
public class OrgMemberServiceTest {

    private static final int MIN_MEMBERS = 100;
    private static final int MAX_MEMBERS = 500;

    @Autowired
    private OrgMemberService orgMemberService;

    @Test
    public void testGetAllOrganizationMembers() {
        int totalCount = RandomUtils.nextInt(MIN_MEMBERS, MAX_MEMBERS);
        String orgId = IDUtils.generate();
        Set<String> userIds = IntStream.rangeClosed(1, totalCount).mapToObj(i -> IDUtils.generate()).collect(Collectors.toSet());
        Mono<List<String>> listMono = Flux.fromIterable(userIds)
                .flatMap(userId -> orgMemberService.addMember(orgId, userId, MemberRole.MEMBER))
                .thenMany(orgMemberService.getOrganizationMembers(orgId))
                .map(OrgMember::getUserId)
                .collectList();

        StepVerifier.create(listMono)
                .assertNext(list -> {
                    System.out.println("[org-members] org " + orgId + ": added " + userIds.size() + ", listed " + list.size());
                    assertEquals(totalCount, list.size());
                    assertEquals(userIds, new HashSet<>(list));
                })
                .verifyComplete();
    }
}
