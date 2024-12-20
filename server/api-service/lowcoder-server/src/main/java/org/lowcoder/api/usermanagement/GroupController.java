package org.lowcoder.api.usermanagement;

import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

import java.util.List;

import jakarta.validation.Valid;

import org.apache.commons.lang3.StringUtils;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.view.*;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.sdk.exception.BizError;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

@RestController
public class GroupController implements GroupEndpoints
{

    @Autowired
    private GroupApiService groupApiService;
    @Autowired
    private SessionUserService sessionUserService;
    @Autowired
    private GroupMemberService groupMemberService;
    @Autowired
    private BusinessEventPublisher businessEventPublisher;
    @Autowired
    private GroupService groupService;
    @Autowired
    private GidService gidService;
    @Autowired
    private OrgMemberService orgMemberService;

    @Override
    public Mono<ResponseView<GroupView>> create(@Valid @RequestBody CreateGroupRequest newGroup) {
        return groupApiService.create(newGroup)
                .delayUntil(group -> businessEventPublisher.publishGroupCreateEvent(group))
                .flatMap(group -> GroupView.from(group, MemberRole.ADMIN.getValue(), 1, 1, List.of()))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Boolean>> update(@PathVariable String groupId,
            @Valid @RequestBody UpdateGroupRequest updateGroupRequest) {
        return gidService.convertGroupIdToObjectId(groupId).flatMap(objectId ->
            groupService.getById(objectId)
                .zipWhen(group -> groupApiService.update(objectId, updateGroupRequest))
                .delayUntil(tuple -> businessEventPublisher.publishGroupUpdateEvent(tuple.getT2(), tuple.getT1(), updateGroupRequest.getGroupName()))
                .map(tuple -> ResponseView.success(tuple.getT2())));
    }

    @Override
    public Mono<ResponseView<Boolean>> delete(@PathVariable String groupId) {
        return gidService.convertGroupIdToObjectId(groupId).flatMap(objectId ->
            groupService.getById(objectId)
                .zipWhen(group -> groupApiService.deleteGroup(objectId))
                .delayUntil(tuple -> businessEventPublisher.publishGroupDeleteEvent(tuple.getT2(), tuple.getT1()))
                .map(tuple -> ResponseView.success(tuple.getT2())));
    }

    @Override
    public Mono<GroupListResponseView<List<GroupView>>> getOrgGroups(@RequestParam(required = false, defaultValue = "1") Integer pageNum,
            @RequestParam(required = false, defaultValue = "0") Integer pageSize) {
        return groupApiService.getGroups().flatMap(groupList -> {
            if(groupList.isEmpty()) return Mono.just(new GroupListResponseView<>(ResponseView.SUCCESS,
                    "", List.of(), 0, 0, 0, 0, 0, pageNum, pageSize));
            return sessionUserService.getVisitorOrgMemberCache()
                .map(OrgMember::getOrgId)
                .flatMap(orgId -> orgMemberService.getOrganizationMembers(orgId)
                    .collectList()
                    .zipWith(groupService.getDevGroup(orgId).flatMap(devGroup -> groupMemberService.getGroupMembers(devGroup.getId())))
                    .map(tuple -> {
                        List<OrgMember> orgMembers = tuple.getT1();
                        List<GroupMember> devMembers = tuple.getT2();
                        int totalAdmins = orgMembers.stream().filter(OrgMember::isAdmin).toList().size();
                        int totalAdminsAndDevelopers = orgMembers.stream()
                            .filter(orgMember -> orgMember.isAdmin() ||
                                devMembers.stream().anyMatch(devMember -> devMember.getUserId().equals(orgMember.getUserId()))).toList().size();
                        int totalDevelopersOnly = orgMembers.stream()
                            .filter(orgMember -> !orgMember.isAdmin() && !orgMember.isSuperAdmin() &&
                                devMembers.stream().anyMatch(devMember -> devMember.getUserId().equals(orgMember.getUserId()))).toList().size();
                        int totalOtherMembers = orgMembers.stream()
                            .filter(orgMember -> !orgMember.isAdmin() && !orgMember.isSuperAdmin() &&
                                devMembers.stream().noneMatch(devMember -> devMember.getUserId().equals(orgMember.getUserId()))).toList().size();

                        var subList = groupList.subList((pageNum - 1) * pageSize, pageSize <= 0?groupList.size():Math.min(pageNum * pageSize, groupList.size()));
                        return new GroupListResponseView<>(ResponseView.SUCCESS,
                            "",
                            subList,
                            totalAdmins,
                            totalAdminsAndDevelopers,
                            totalDevelopersOnly,
                            totalOtherMembers,
                            groupList.size(),
                            pageNum,
                            pageSize);
                    })
                );
            }
        );
    }


    @Override
    public Mono<ResponseView<GroupMemberAggregateView>> getGroupMembers(@PathVariable String groupId,
            @RequestParam(required = false, defaultValue = "1") int pageNum,
            @RequestParam(required = false, defaultValue = "100") int pageSize) {
        return gidService.convertGroupIdToObjectId(groupId).flatMap(objectId ->
            groupApiService.getGroupMembers(objectId, pageNum, pageSize)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> addGroupMember(@PathVariable String groupId,
            @RequestBody AddMemberRequest addMemberRequest) {
        if (StringUtils.isBlank(groupId)) {
            return ofError(BizError.INVALID_PARAMETER, "INVALID_ORG_ID");
        }
        if (StringUtils.isBlank(addMemberRequest.getUserId())) {
            return ofError(BizError.INVALID_PARAMETER, "INVALID_USER_ID");
        }
        if (StringUtils.isBlank(addMemberRequest.getRole())) {
            return ofError(BizError.INVALID_PARAMETER, "INVALID_USER_ROLE");
        }
        return gidService.convertGroupIdToObjectId(groupId).flatMap(objectId ->
            groupApiService.addGroupMember(objectId, addMemberRequest.getUserId(), addMemberRequest.getRole())
                .delayUntil(result -> businessEventPublisher.publishGroupMemberAddEvent(result, objectId, addMemberRequest))
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> updateRoleForMember(@RequestBody UpdateRoleRequest updateRoleRequest,
            @PathVariable String groupId) {
        return gidService.convertGroupIdToObjectId(groupId).flatMap(objectId ->
            groupMemberService.getGroupMember(objectId, updateRoleRequest.getUserId())
                .zipWhen(tuple -> groupApiService.updateRoleForMember(objectId, updateRoleRequest))
                .delayUntil(
                        tuple -> businessEventPublisher.publishGroupMemberRoleUpdateEvent(tuple.getT2(), objectId, tuple.getT1(), updateRoleRequest))
                .map(Tuple2::getT2)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> leaveGroup(@PathVariable String groupId) {
        return gidService.convertGroupIdToObjectId(groupId).flatMap(objectId ->
            sessionUserService.getVisitorOrgMemberCache()
                .flatMap(orgMember -> groupMemberService.getGroupMember(objectId, orgMember.getUserId()))
                .zipWhen(tuple -> groupApiService.leaveGroup(objectId))
                .delayUntil(tuple -> businessEventPublisher.publishGroupMemberLeaveEvent(tuple.getT2(), tuple.getT1()))
                .map(Tuple2::getT2)
                .map(ResponseView::success));
    }

    @Override
    public Mono<ResponseView<Boolean>> removeUser(@PathVariable String groupId,
            @RequestParam String userId) {
        if (StringUtils.isBlank(userId)) {
            return ofError(BizError.INVALID_PARAMETER, "INVALID_USER_ID");
        }
        return gidService.convertGroupIdToObjectId(groupId).flatMap(objectId ->
            groupMemberService.getGroupMember(objectId, userId)
                .zipWhen(groupMember -> groupApiService.removeUser(objectId, userId))
                .delayUntil(tuple -> businessEventPublisher.publishGroupMemberRemoveEvent(tuple.getT2(), tuple.getT1()))
                .map(Tuple2::getT2)
                .map(ResponseView::success));
    }
}
