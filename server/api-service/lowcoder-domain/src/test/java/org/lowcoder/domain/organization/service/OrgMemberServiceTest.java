package org.lowcoder.domain.organization.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.apache.commons.lang3.RandomUtils;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.sdk.util.IDUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@SpringBootTest
@RunWith(SpringRunner.class)
public class OrgMemberServiceTest {

    @Autowired
    private OrgMemberService orgMemberService;

    @Test
    public void testGetAllOrganizationMembers() {
        int totalCount = RandomUtils.nextInt(100, 500);
        String orgId = IDUtils.generate();
        Set<String> userIds = IntStream.rangeClosed(1, totalCount).mapToObj(i -> IDUtils.generate()).collect(Collectors.toSet());
        Mono<List<String>> listMono = orgMemberService.bulkAddMember(orgId, userIds, MemberRole.MEMBER)
                .thenMany(orgMemberService.getOrganizationMembers(orgId))
                .map(OrgMember::getUserId)
                .collectList();

        StepVerifier.create(listMono)
                .assertNext(list -> {
                    Assert.assertEquals(totalCount, list.size());
                    Assert.assertEquals(userIds, new HashSet<>(list));
                })
                .verifyComplete();
    }
}