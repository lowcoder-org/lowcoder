package org.lowcoder.domain.organization.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.model.*;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.infra.annotation.PossibleEmptyMono;
import org.lowcoder.infra.birelation.BiRelation;
import org.lowcoder.infra.birelation.BiRelationService;
import org.lowcoder.infra.util.FluxHelper;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.CommonConfig.Workspace;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.lowcoder.infra.birelation.BiRelationBizType.ORG_MEMBER;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrgMemberServiceImpl implements OrgMemberService {

    /** The org roles whose holders count as administrators in {@link #doesAtleastOneAdminExist()}. */
    private static final List<MemberRole> ADMIN_ROLES = List.of(MemberRole.ADMIN, MemberRole.SUPER_ADMIN);

    private final BiRelationService biRelationService;
    private final GroupMemberService groupMemberService;
    private final GroupService groupService;
    @Lazy
    private final OrganizationService organizationService;
    private final CommonConfig commonConfig;

    @Override
    public Flux<OrgMember> getOrganizationMembers(String orgId) {
        return FluxHelper.getAllPageByPage(pageable -> biRelationService.getBySourceId(ORG_MEMBER, orgId, pageable), PageRequest.ofSize(100))
                .map(OrgMember::from);
    }

    @Override
    public Flux<OrgMember> getOrganizationMembers(String orgId, int page, int count) {
        return biRelationService.getBySourceId(ORG_MEMBER, orgId, PageRequest.of(page - 1, count))
                .map(OrgMember::from);
    }

    /**
     * get all active organizations by user id.
     */
    @Override
    public Flux<OrgMember> getAllActiveOrgs(String userId) {
        // get all.
        Flux<OrgMember> orgMemberFlux = membershipsOf(userId)
                // read once, for the active org ids and for the answer
                .cache();

        // get all active org ids.
        Mono<ActiveOrgIds> activeOrgIds = orgMemberFlux.map(OrgMember::getOrgId)
                .collectList()
                .flatMapMany(organizationService::getByIds)
                .filter(organization -> organization.getState() != OrganizationState.DELETED)
                .map(Organization::getId)
                .collectList()
                // enterprise mode
                .flatMap(orgIds -> {
                    Workspace workspace = commonConfig.getWorkspace();
                    if (workspace.getMode() == WorkspaceMode.ENTERPRISE) {
                        String enterpriseOrgId = workspace.getEnterpriseOrgId();
                        if (StringUtils.isNotBlank(enterpriseOrgId)) {
                            if (orgIds.contains(enterpriseOrgId)) {
                                return Mono.just(new ActiveOrgIds(List.of(enterpriseOrgId), false));
                            }
                            return addMember(enterpriseOrgId, userId, MemberRole.MEMBER)
                                    .thenReturn(new ActiveOrgIds(List.of(enterpriseOrgId), true));
                        }
                        if (orgIds.size() > 1) {
                            return Mono.just(new ActiveOrgIds(orgIds.subList(0, 1), false));
                        }
                    }
                    return Mono.just(new ActiveOrgIds(orgIds, false));
                })
                // BF-131: after an enrolment the answer reads the memberships again, as orgMemberFlux predates it
                .cache();

        // filter by activeOrgIds.
        return activeOrgIds.flatMapMany(active -> (active.enrolled() ? membershipsOf(userId) : orgMemberFlux)
                .filter(orgMember -> active.orgIds().contains(orgMember.getOrgId())));
    }

    /**
     * count all active organizations.
     */
    @Override
    public Mono<Long> countAllActiveOrgs(String userId) {
        return getAllActiveOrgs(userId)
                .collectList()
                .map(list -> Long.valueOf(list.size()));
    }

    @Override
    public Mono<Long> getOrgMemberCount(String orgId) {
        return biRelationService.countBySourceId(ORG_MEMBER, orgId);
    }

    /**
     * Whether any organization has an administrator, a member with the ADMIN or the SUPER_ADMIN role (BF-013): the super
     * admin a deployment configures is created as SUPER_ADMIN of its first organization, so it counts as that
     * deployment's admin.
     */
    @Override
    public Mono<Boolean> doesAtleastOneAdminExist() {
        return Flux.fromIterable(ADMIN_ROLES)
                .concatMap(role -> biRelationService.countByRelation(ORG_MEMBER, role.getValue()))
                .any(count -> count != 0);
    }

    @Override
    public Mono<Boolean> addMember(String orgId, String userId, MemberRole memberRole) {
        return biRelationService.addBiRelation(ORG_MEMBER, orgId,
                        userId, memberRole.getValue(), OrgMemberState.NORMAL.getValue())
                .delayUntil(biRelation -> onOrgMemberAdded(orgId, userId))
                .hasElement();
    }

    private Mono<Void> onOrgMemberAdded(String orgId, String userId) {
        return addToAllUserGroup(orgId, userId)
                .then();
    }

    private Mono<Void> addToAllUserGroup(String orgId, String userId) {
        return groupService.getAllUsersGroup(orgId)
                .flatMap(group -> groupMemberService.addMember(orgId, group.getId(), userId, MemberRole.MEMBER))
                .then();
    }

    @Override
    public Mono<Boolean> updateMemberRole(String orgId, String userId, MemberRole memberRole) {
        // BF-130: whether a membership was modified; hasElement() answered true for the update's false too
        return biRelationService.updateRelation(ORG_MEMBER, orgId, userId, memberRole.getValue());
    }

    @Override
    public Mono<Boolean> removeMember(String orgId, String userId) {
        return biRelationService.removeBiRelation(ORG_MEMBER, orgId, userId);
    }

    @Override
    public Mono<Boolean> deleteOrgMembers(String orgId) {
        return biRelationService.removeAllBiRelations(ORG_MEMBER, orgId);
    }

    @Override
    public Mono<OrgMember> getOrgMember(String orgId, String userId) {
        return biRelationService.getBiRelation(ORG_MEMBER, orgId, userId)
                .map(OrgMember::from);
    }

    @Override
    public Mono<Boolean> tryAddOrgMember(String orgId, String userId, MemberRole role) {
        return getOrgMember(orgId, userId)
                .hasElement()
                .flatMap(hasElement -> {
                    if (hasElement) {
                        return Mono.just(false);
                    }
                    return addMember(orgId, userId, role);
                });
    }

    @Override
    public Mono<Map<String, OrgMember>> getOrgMemberRoles(Collection<String> orgIds, String userId) {
        return biRelationService.getByTargetIdAndSourceIds(ORG_MEMBER, userId, orgIds)
                .collectMap(BiRelation::getSourceId, OrgMember::from);
    }

    @Override
    @PossibleEmptyMono
    public Mono<OrgMember> getCurrentOrgMember(String userId) {

        Flux<OrgMember> orgMemberFlux = getAllActiveOrgs(userId).cache();

        return orgMemberFlux
                .filter(OrgMember::isCurrentOrg)
                .next()
                .switchIfEmpty(orgMemberFlux.next().delayUntil(this::markAsUserCurrentOrgId));
    }

    @Override
    public Mono<UserOrgMemberInfo> getUserOrgMemberInfo(String userId) {

        Flux<OrgMember> orgMemberFlux = getAllActiveOrgs(userId).cache();

        return orgMemberFlux
                .filter(OrgMember::isCurrentOrg)
                .next()
                .switchIfEmpty(orgMemberFlux.next().delayUntil(this::markAsUserCurrentOrgId))
                .zipWith(orgMemberFlux.collectList())
                .flatMap(tuple -> {
                    OrgMember current = tuple.getT1();
                    List<OrgMember> orgMembers = tuple.getT2();
                    return Mono.just(new UserOrgMemberInfo(current, orgMembers));
                });
    }

    private Mono<Boolean> markAsUserCurrentOrgId(OrgMember orgMember) {
        return markAsUserCurrentOrgId(orgMember.getOrgId(), orgMember.getUserId());
    }

    @Override
    public Mono<Boolean> markAsUserCurrentOrgId(String orgId, String userId) {
        return biRelationService.updateState(ORG_MEMBER, orgId, userId, OrgMemberState.CURRENT.getValue());
    }

    @Override
    public Mono<Boolean> removeCurrentOrgMark(String previousCurrentOrgId, String userId) {
        return biRelationService.updateState(ORG_MEMBER, previousCurrentOrgId, userId, OrgMemberState.NORMAL.getValue());
    }

    @Override
    public Mono<List<OrgMember>> getAllOrgAdmins(String orgId) {
        return biRelationService.getBySourceIdAndRelation(ORG_MEMBER, orgId, MemberRole.ADMIN.getValue())
                .map(OrgMember::from)
                .collectList();
    }

    @Override
    public Mono<Void> bulkAddToOrgs(Collection<String> orgIds, String userId, MemberRole memberRole) {
        List<BiRelation> biRelations = (List<BiRelation>)orgIds.stream()
                .map(orgId -> BiRelation.builder()
                        .bizType(ORG_MEMBER)
                        .sourceId(orgId)
                        .targetId(userId)
                        .relation(memberRole.getValue())
                        .state(OrgMemberState.NORMAL.getValue())
                        .build())
                .toList();
        return biRelationService.batchAddBiRelation(biRelations)
                .then(bulkAddToAllUserGroup(orgIds, userId, memberRole));
    }

    @Override
    public Mono<Void> addToAllOrgAsAdminIfNot(String userId) {
        Flux<String> oldOrgIdsFlux = getAllActiveOrgs(userId).map(OrgMember::getOrgId);
        Flux<String> allOrgIdsFlux = organizationService.getAllActive().map(HasIdAndAuditing::getId);
        Flux<String> newOrgIdsMono = oldOrgIdsFlux.collectList().flatMapMany(oldList -> allOrgIdsFlux.filter(item -> !oldList.contains(item)));
        return newOrgIdsMono.collectList().flatMapMany(newOrgIds -> bulkAddToOrgs(newOrgIds, userId, MemberRole.SUPER_ADMIN)).then();
    }

    private Mono<Void> bulkAddToAllUserGroup(Collection<String> orgIds, String userId, MemberRole memberRole) {
        return Flux.fromIterable(orgIds).flatMap(orgId -> groupService.getAllUsersGroup(orgId)
                .flatMap(group -> groupMemberService.addMember(orgId, group.getId(), userId, memberRole))).then();
    }

    private Flux<OrgMember> membershipsOf(String userId) {
        return biRelationService.getByTargetId(ORG_MEMBER, userId)
                .map(OrgMember::from);
    }

    /**
     * The org ids {@link #getAllActiveOrgs} answers memberships of, and whether finding them enrolled the user in the
     * enterprise org, a membership written after the memberships were read (BF-131).
     */
    private record ActiveOrgIds(HashSet<String> orgIds, boolean enrolled) {

        private ActiveOrgIds(List<String> orgIds, boolean enrolled) {
            this(new HashSet<>(orgIds), enrolled);
        }
    }
}
