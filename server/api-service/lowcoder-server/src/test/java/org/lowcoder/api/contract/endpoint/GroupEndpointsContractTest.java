package org.lowcoder.api.contract.endpoint;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.contract.support.ContractTestClient;
import org.lowcoder.api.contract.support.EndpointContract;
import org.lowcoder.api.contract.support.PayloadAssertions;
import org.lowcoder.api.contract.support.PayloadSamples;
import org.lowcoder.api.contract.support.UserManagementSamples;
import org.lowcoder.api.home.SessionUserService;
import org.lowcoder.api.usermanagement.GroupApiService;
import org.lowcoder.api.usermanagement.GroupController;
import org.lowcoder.api.usermanagement.GroupEndpoints;
import org.lowcoder.api.usermanagement.view.AddMemberRequest;
import org.lowcoder.api.usermanagement.view.CreateGroupRequest;
import org.lowcoder.api.usermanagement.view.GroupMemberAggregateView;
import org.lowcoder.api.usermanagement.view.GroupView;
import org.lowcoder.api.usermanagement.view.OrgMemberListView;
import org.lowcoder.api.usermanagement.view.UpdateGroupRequest;
import org.lowcoder.api.usermanagement.view.UpdateRoleRequest;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.model.MemberRole;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.sdk.exception.BizError;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

/**
 * Codec-level tests of the 10 {@link GroupEndpoints} (docs/API_PAYLOAD_TEST_PLAN.md §5.2, task T4.3), through the
 * production {@link GroupController} in the {@link ContractTestClient} harness, with every collaborator mocked.
 *
 * <p>Request: JSON bodies are the D1 goldens; the argument the service receives is captured and compared with D1's
 * rules ({@link PayloadAssertions#assertBindsTo}), or, where the controller passes on parts of the body, part by part.
 * Response: the service mocks return the samples, so the body must be the envelope golden around their S1 goldens
 * ({@link EndpointContract}). {@code getOrgGroups} answers the {@code GroupListResponseView} envelope
 * ({@link EndpointContract#groupList}). One test per registry response branch, named as the branch.
 *
 * <p>Stubbing groups (registry column {@code group}): {@code assembling} for {@code create}, whose {@link GroupView} the
 * controller builds from the created {@link Group}, and for {@code getOrgGroups}, whose counts and page it computes
 * from members and groups; {@code pass-through} for the others, where the payload is one service result in a
 * {@code ResponseView}, even when other calls (id conversion, the member read before the change, the business events)
 * run beside it. Limits: the business events are mocks that complete empty.
 */
class GroupEndpointsContractTest {

    static final EndpointContract CONTRACT = new EndpointContract(GroupEndpoints.class);
    static final String GROUP_ID = "GroupEndpointsContractTest.groupId";
    static final String ORG_ID = "GroupEndpointsContractTest.orgId";
    static final String DEV_GROUP_ID = "GroupEndpointsContractTest.devGroupId";
    static final String USER_ID = "GroupEndpointsContractTest.userId";
    static final String SEARCH = "GroupEndpointsContractTest.search";
    static final String ROLE = "GroupEndpointsContractTest.role";
    static final String SORT = "GroupEndpointsContractTest.sort";
    static final String ORDER = "GroupEndpointsContractTest.order";
    static final String BLANK = " ";
    static final int PAGE_NUM = 2;
    static final int PAGE_SIZE = 40_200;
    /** {@code getOrgGroups}' page: the second of size two over three groups, so only the last group. */
    static final int GROUP_PAGE_SIZE = 2;
    static final String TRUE = "true";
    static final String EMPTY_ARRAY = "[]";
    /** {@code create}: the role and counts {@code GroupController#create} hands to {@code GroupView#from}. */
    static final String CREATOR_ROLE = MemberRole.ADMIN.getValue();
    static final int CREATED_GROUP_COUNT = 1;
    static final String ALL_USERS_GROUP_PROPERTY = "allUsersGroup";
    static final String VISITOR_ROLE_PROPERTY = "visitorRole";
    static final String STATS_PROPERTY = "stats";
    static final String ADMIN_USER_COUNT_KEY = "adminUserCount";
    static final String USER_COUNT_KEY = "userCount";
    static final String USERS_KEY = "users";
    /**
     * {@code getOrgGroups}' members: one admin, one super admin and two members in the dev group, three other members.
     * The counts {@code GroupController#getOrgGroups} derives: admins 1 (role {@code ADMIN} only), admins and developers
     * 4, developers only 2, other members 3.
     */
    static final int TOTAL_ADMINS = 1;
    static final int TOTAL_ADMINS_AND_DEVELOPERS = 4;
    static final int TOTAL_DEVELOPERS_ONLY = 2;
    static final int TOTAL_OTHER_MEMBERS = 3;

    private ContractTestClient.Builder builder;
    private GroupApiService groupApiService;
    private GroupService groupService;
    private GroupMemberService groupMemberService;

    @BeforeEach
    void mocks() {
        builder = ContractTestClient.builder();
        groupApiService = builder.mock(GroupApiService.class);
        groupService = builder.mock(GroupService.class);
        groupMemberService = builder.mock(GroupMemberService.class);
        GidService gidService = builder.mock(GidService.class);
        Mockito.when(gidService.convertGroupIdToObjectId(anyString())).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        builder.singleton("businessEventPublisher", Mockito.mock(BusinessEventPublisher.class, ApplicationEndpointsContractTest.EMPTY_MONO));
    }

    @AfterAll
    static void everyEndpointAndBranchHasATest() {
        CONTRACT.assertComplete(GroupEndpointsContractTest.class);
    }

    /**
     * The bound request goes to the service; the answer is the {@link GroupView} the controller builds from the created
     * group: the {@code GroupView} S1 with the creator's role, the counts of one admin and one user, no users, and
     * {@code allUsersGroup} false (an all-users group is a system group, whose name would be the localized one).
     */
    @Test
    void create() throws JsonProcessingException {
        Mockito.when(groupApiService.create(any())).thenReturn(Mono.just(UserManagementSamples.groupViewGroup()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "create", Map.of(), EndpointContract.d1(CreateGroupRequest.class));
            ObjectNode view = (ObjectNode) PayloadAssertions.FIXTURE_EDITOR.readTree(EndpointContract.s1(GroupView.class));
            view.put(ALL_USERS_GROUP_PROPERTY, false);
            view.put(VISITOR_ROLE_PROPERTY, CREATOR_ROLE);
            ObjectNode stats = view.putObject(STATS_PROPERTY);
            stats.put(ADMIN_USER_COUNT_KEY, CREATED_GROUP_COUNT);
            stats.put(USER_COUNT_KEY, CREATED_GROUP_COUNT);
            stats.putArray(USERS_KEY);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(PayloadAssertions.FIXTURE_EDITOR.writeValueAsString(view)));
            ArgumentCaptor<CreateGroupRequest> request = ArgumentCaptor.forClass(CreateGroupRequest.class);
            Mockito.verify(groupApiService).create(request.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(CreateGroupRequest.class), request.getValue());
        }
    }

    @Test
    void update() {
        Mockito.when(groupService.getById(GROUP_ID)).thenReturn(Mono.just(UserManagementSamples.groupViewGroup()));
        Mockito.when(groupApiService.update(eq(GROUP_ID), any())).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "update", Map.of(), EndpointContract.d1(UpdateGroupRequest.class), GROUP_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            ArgumentCaptor<UpdateGroupRequest> request = ArgumentCaptor.forClass(UpdateGroupRequest.class);
            Mockito.verify(groupApiService).update(eq(GROUP_ID), request.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(UpdateGroupRequest.class), request.getValue());
        }
    }

    @Test
    void delete() {
        Mockito.when(groupService.getById(GROUP_ID)).thenReturn(Mono.just(UserManagementSamples.groupViewGroup()));
        Mockito.when(groupApiService.deleteGroup(GROUP_ID)).thenReturn(Mono.just(Boolean.TRUE));
        assertSuccessTrue("delete", Map.of(), GROUP_ID);
    }

    /**
     * Three groups, of which the requested page (2, size 2) holds the last, the {@code GroupView} S1; the counts come
     * from the organization's members and the dev group's members ({@link #TOTAL_ADMINS} and the others).
     */
    @Test
    void getOrgGroups() {
        Mockito.when(groupApiService.getGroups()).thenReturn(Mono.just(new ArrayList<>(List.of(otherGroupView(0), otherGroupView(1),
                UserManagementSamples.groupView()))));
        Mockito.when(builder.mock(SessionUserService.class).getVisitorOrgMemberCache()).thenReturn(Mono.just(orgMember(USER_ID, MemberRole.ADMIN)));
        Mockito.when(builder.mock(OrgMemberService.class).getOrganizationMembers(ORG_ID)).thenReturn(Flux.just(
                orgMember(USER_ID, MemberRole.ADMIN), orgMember(USER_ID + "[superAdmin]", MemberRole.SUPER_ADMIN),
                orgMember(USER_ID + "[dev0]", MemberRole.MEMBER), orgMember(USER_ID + "[dev1]", MemberRole.MEMBER),
                orgMember(USER_ID + "[other0]", MemberRole.MEMBER), orgMember(USER_ID + "[other1]", MemberRole.MEMBER),
                orgMember(USER_ID + "[other2]", MemberRole.MEMBER)));
        Mockito.when(groupService.getDevGroup(ORG_ID)).thenReturn(Mono.just(Group.builder().id(DEV_GROUP_ID).build()));
        Mockito.when(groupMemberService.getGroupMembers(DEV_GROUP_ID)).thenReturn(Mono.just(List.of(
                devMember(USER_ID + "[superAdmin]"), devMember(USER_ID + "[dev0]"), devMember(USER_ID + "[dev1]"))));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getOrgGroups", Map.of("pageNum", PAGE_NUM, "pageSize", GROUP_PAGE_SIZE), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.groupList(
                    EndpointContract.array(EndpointContract.s1(GroupView.class)), TOTAL_ADMINS, TOTAL_ADMINS_AND_DEVELOPERS,
                    TOTAL_DEVELOPERS_ONLY, TOTAL_OTHER_MEMBERS, 3, PAGE_NUM, GROUP_PAGE_SIZE));
        }
    }

    /** No groups: the envelope with an empty list, zero counts and the requested paging; nothing else is read. */
    @Test
    void getOrgGroupsEmpty() {
        Mockito.when(groupApiService.getGroups()).thenReturn(Mono.just(List.of()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getOrgGroups", Map.of("pageNum", PAGE_NUM, "pageSize", PAGE_SIZE), null);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.groupList(EMPTY_ARRAY, 0, 0, 0, 0, 0, PAGE_NUM, PAGE_SIZE));
            Mockito.verify(builder.mock(OrgMemberService.class), Mockito.never()).getOrganizationMembers(anyString());
            Mockito.verify(groupService, Mockito.never()).getDevGroup(anyString());
        }
    }

    /** Every query parameter is handed on as sent. */
    @Test
    void getGroupMembers() {
        Mockito.when(groupApiService.getGroupMembersForSearch(GROUP_ID, SEARCH, ROLE, SORT, ORDER, PAGE_NUM, PAGE_SIZE))
                .thenReturn(Mono.just(UserManagementSamples.groupMemberAggregateView()));
        Map<String, Object> query = new LinkedHashMap<>();
        query.put("search", SEARCH);
        query.put("role", ROLE);
        query.put("sort", SORT);
        query.put("order", ORDER);
        query.put("pageNum", PAGE_NUM);
        query.put("pageSize", PAGE_SIZE);
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "getGroupMembers", query, null, GROUP_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(GroupMemberAggregateView.class)));
        }
    }

    /** The controller hands the request's two fields to the service. */
    @Test
    void addGroupMember() {
        AddMemberRequest sample = (AddMemberRequest) PayloadSamples.of(AddMemberRequest.class).value();
        Mockito.when(groupApiService.addGroupMember(GROUP_ID, sample.getUserId(), sample.getRole())).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "addGroupMember", Map.of(), EndpointContract.d1(AddMemberRequest.class), GROUP_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            Mockito.verify(groupApiService).addGroupMember(GROUP_ID, sample.getUserId(), sample.getRole());
        }
    }

    /** A blank group id in the path: {@code INVALID_PARAMETER} with the key {@code INVALID_ORG_ID}. */
    @Test
    void addGroupMemberWithBlankGroupId() {
        assertAddGroupMemberRejected(BLANK, EndpointContract.d1(AddMemberRequest.class), "INVALID_ORG_ID");
    }

    @Test
    void addGroupMemberWithoutUserId() {
        assertAddGroupMemberRejected(GROUP_ID, "{\"role\": \"" + ROLE + "\"}", "INVALID_USER_ID");
    }

    @Test
    void addGroupMemberWithoutRole() {
        assertAddGroupMemberRejected(GROUP_ID, "{\"userId\": \"" + USER_ID + "\"}", "INVALID_USER_ROLE");
    }

    /** The member is read before the change (for the event); the request goes to the service as bound. */
    @Test
    void updateRoleForMember() {
        UpdateRoleRequest sample = (UpdateRoleRequest) PayloadSamples.of(UpdateRoleRequest.class).value();
        Mockito.when(groupMemberService.getGroupMember(GROUP_ID, sample.getUserId())).thenReturn(Mono.just(devMember(sample.getUserId())));
        Mockito.when(groupApiService.updateRoleForMember(eq(GROUP_ID), any())).thenReturn(Mono.just(Boolean.TRUE));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "updateRoleForMember", Map.of(), EndpointContract.d1(UpdateRoleRequest.class), GROUP_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
            ArgumentCaptor<UpdateRoleRequest> request = ArgumentCaptor.forClass(UpdateRoleRequest.class);
            Mockito.verify(groupApiService).updateRoleForMember(eq(GROUP_ID), request.capture());
            PayloadAssertions.assertBindsTo(PayloadSamples.of(UpdateRoleRequest.class), request.getValue());
        }
    }

    @Test
    void leaveGroup() {
        Mockito.when(builder.mock(SessionUserService.class).getVisitorOrgMemberCache()).thenReturn(Mono.just(orgMember(USER_ID, MemberRole.MEMBER)));
        Mockito.when(groupMemberService.getGroupMember(GROUP_ID, USER_ID)).thenReturn(Mono.just(devMember(USER_ID)));
        Mockito.when(groupApiService.leaveGroup(GROUP_ID)).thenReturn(Mono.just(Boolean.TRUE));
        assertSuccessTrue("leaveGroup", Map.of(), GROUP_ID);
    }

    @Test
    void removeUser() {
        Mockito.when(groupMemberService.getGroupMember(GROUP_ID, USER_ID)).thenReturn(Mono.just(devMember(USER_ID)));
        Mockito.when(groupApiService.removeUser(GROUP_ID, USER_ID)).thenReturn(Mono.just(Boolean.TRUE));
        assertSuccessTrue("removeUser", Map.of("userId", USER_ID), GROUP_ID);
    }

    /** A blank {@code userId}: {@code INVALID_PARAMETER} with the key {@code INVALID_USER_ID}, before the service. */
    @Test
    void removeUserWithBlankUserId() {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "removeUser", Map.of("userId", BLANK), null, GROUP_ID);
            EndpointContract.assertBizError(result, BizError.INVALID_PARAMETER, "INVALID_USER_ID");
            Mockito.verifyNoInteractions(groupApiService);
        }
    }

    /** Explicit paging; the controller hands the parameters on and answers the service's page. */
    @Test
    void searchPotentialGroupMembers() {
        Mockito.when(groupApiService.getPotentialGroupMembers(GROUP_ID, SEARCH, PAGE_NUM, PAGE_SIZE))
                .thenReturn(Mono.just(UserManagementSamples.orgMemberListView()));
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "searchPotentialGroupMembers",
                    Map.of("searchName", SEARCH, "pageNum", PAGE_NUM, "pageSize", PAGE_SIZE), null, GROUP_ID);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(EndpointContract.s1(OrgMemberListView.class)));
        }
    }

    private ContractTestClient client() {
        return builder.controllerWithMockedDependencies(GroupController.class).build();
    }

    private void assertSuccessTrue(String method, Map<String, ?> query, Object... uriVariables) {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, method, query, null, uriVariables);
            EndpointContract.assertResponse(result, HttpStatus.OK, EndpointContract.success(TRUE));
        }
    }

    /** {@code addGroupMember} rejects the request with {@code INVALID_PARAMETER} and {@code messageKey}, before the service. */
    private void assertAddGroupMemberRejected(String groupId, String body, String messageKey) {
        try (ContractTestClient client = client()) {
            EntityExchangeResult<byte[]> result = CONTRACT.exchange(client, "addGroupMember", Map.of(), body, groupId);
            EndpointContract.assertBizError(result, BizError.INVALID_PARAMETER, messageKey);
            Mockito.verifyNoInteractions(groupApiService);
        }
    }

    /** A group other than the {@code GroupView} sample, so that a page holding it instead fails. */
    private static GroupView otherGroupView(int index) {
        return GroupView.builder().groupId(GROUP_ID + "[" + index + "]").groupName(GROUP_ID + "[" + index + "].name").build();
    }

    private static OrgMember orgMember(String userId, MemberRole role) {
        return new OrgMember(ORG_ID, userId, role, ORG_ID + ".state", 3_000_000_200L);
    }

    private static GroupMember devMember(String userId) {
        return new GroupMember(DEV_GROUP_ID, userId, MemberRole.MEMBER, ORG_ID, 3_000_000_201L);
    }
}
