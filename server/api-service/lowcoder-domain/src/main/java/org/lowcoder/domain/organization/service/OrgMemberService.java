package org.lowcoder.domain.organization.service;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.infra.annotation.PossibleEmptyMono;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface OrgMemberService {

    Flux<OrgMember> getOrganizationMembers(String orgId);

    Flux<OrgMember> getOrganizationMembers(String orgId, int page, int count);

    Mono<OrgMember> getCurrentOrgMember(String userId);

    @PossibleEmptyMono
    Flux<OrgMember> getAllActiveOrgs(String userId);

    Mono<Long> getOrgMemberCount(String orgId);

    Mono<Boolean> doesAtleastOneAdminExist();

    Mono<Long> countAllActiveOrgs(String userId);

    /**
     * Every RAW membership row this user has, untouched by {@link #getAllActiveOrgs}/{@link #countAllActiveOrgs}'s
     * ENTERPRISE-mode collapsing (which, with a configured enterprise org, answers a single row regardless of how
     * many real memberships exist, and otherwise truncates to the first). A caller
     * that needs to know whether an account's membership is genuinely EXCLUSIVE -- not merely "counts as 1 after
     * enterprise collapsing" -- must read this instead.
     */
    Mono<List<OrgMember>> getRawOrgMemberships(String userId);

    Mono<OrgMember> getOrgMember(String orgId, String userId);

    Mono<Boolean> addMember(String orgId, String userId, MemberRole memberRole);

    Mono<Boolean> updateMemberRole(String orgId, String user, MemberRole memberRole);

    Mono<Boolean> removeMember(String orgId, String userId);

    Mono<Boolean> deleteOrgMembers(String orgId);

    Mono<Boolean> tryAddOrgMember(String orgId, String userId, MemberRole role);

    Mono<Map<String, OrgMember>> getOrgMemberRoles(Collection<String> orgIds, String userId);

    Mono<UserOrgMemberInfo> getUserOrgMemberInfo(String userId);

    Mono<Boolean> markAsUserCurrentOrgId(String orgId, String userId);

    Mono<Boolean> removeCurrentOrgMark(String previousCurrentOrgId, String userId);

    Mono<List<OrgMember>> getAllOrgAdmins(String orgId);

    Mono<Void> bulkAddToOrgs(Collection<String> orgIds, String userId, MemberRole memberRole);

    Mono<Void> addToAllOrgAsAdminIfNot(String userId);

    record UserOrgMemberInfo(OrgMember currentOrgMember, List<OrgMember> orgMembers) {
    }

}
