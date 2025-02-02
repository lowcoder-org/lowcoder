import Api from "api/api";
import { AxiosPromise } from "axios";
import { GroupUser, OrgGroup, OrgUser } from "constants/orgConstants";
import {
  AddGroupUserPayload,
  RemoveGroupUserPayload,
  DeleteOrgUserPayload,
  UpdateOrgPayload,
  UpdateUserGroupRolePayload,
  UpdateUserOrgRolePayload,
} from "redux/reduxActions/orgActions";
import { ApiResponse, GenericApiResponse } from "./apiResponses";
import {
  ApiPaginationResponse,
  fetchGroupUserRequestType,
  fetchOrgsByEmailRequestType,
  fetchOrgUserRequestType,
  GenericApiPaginationResponse,
  GroupUsersPaginationResponse,
  orgGroupRequestType, OrgUsersPaginationResponse
} from "@lowcoder-ee/util/pagination/type";

export interface GroupUsersResponse extends ApiResponse {
  data: {
    members: GroupUser[];
    visitorRole: string;
  };
}

export interface OrgUsersResponse extends ApiResponse {
  data: {
    members: OrgUser[];
    visitorRole: string;
  };
}

export interface CreateOrgResponse extends ApiResponse {
  data: { orgId: string };
}

export interface OrgAPIUsageResponse extends ApiResponse {
  data: number;
}

export class OrgApi extends Api {
  static createGroupURL = "/groups";
  static updateGroupURL = (groupId: string) => `/groups/${groupId}/update`;
  static fetchGroupURL = "/groups/list";
  static fetchGroupUsersURL = (groupId: string) => `/groups/${groupId}/members`;
  static deleteGroupURL = (groupId: string) => `/groups/${groupId}`;
  static fetchOrgUsersURL = (orgId: string) => `/organizations/${orgId}/members`;
  static deleteOrgUsersURL = (orgId: string) => `/organizations/${orgId}/remove`;
  static deleteGroupUserURL = (groupId: string) => `/groups/${groupId}/remove`;
  static addGroupUserURL = (groupId: string) => `/groups/${groupId}/addMember`;
  static updateUserOrgRoleURL = (orgId: string) => `/organizations/${orgId}/role`;
  static updateUserGroupRoleURL = (groupId: string) => `/groups/${groupId}/role`;
  static quitOrgURL = (orgId: string) => `/organizations/${orgId}/leave`;
  static quitGroupURL = (groupId: string) => `/groups/${groupId}/leave`;
  static switchOrgURL = (orgId: string) => `/organizations/switchOrganization/${orgId}`;
  static createOrgURL = "/organizations";
  static deleteOrgURL = (orgId: string) => `/organizations/${orgId}`;
  static updateOrgURL = (orgId: string) => `/organizations/${orgId}/update`;
  static fetchUsage = (orgId: string) => `/organizations/${orgId}/api-usage`;
  static fetchOrgsByEmailURL = (email: string) => `organizations/byuser/${email}`;

  static createGroup(request: { name: string }): AxiosPromise<GenericApiResponse<OrgGroup>> {
    return Api.post(OrgApi.createGroupURL, request);
  }

  static updateGroup(groupId: string, updates: Record<string, string>): AxiosPromise<ApiResponse> {
    return Api.put(OrgApi.updateGroupURL(groupId), updates);
  }

  static fetchGroup(): AxiosPromise<GenericApiResponse<OrgGroup[]>> {
    return Api.get(OrgApi.fetchGroupURL);
  }

  static fetchGroupPagination(request: orgGroupRequestType): AxiosPromise<GenericApiPaginationResponse<OrgGroup[]>> {
    return Api.get(OrgApi.fetchGroupURL, {...request});
  }

  static deleteGroup(groupId: string): AxiosPromise<ApiResponse> {
    return Api.delete(OrgApi.deleteGroupURL(groupId));
  }

  static updateUserOrgRole(request: UpdateUserOrgRolePayload): AxiosPromise<ApiResponse> {
    return Api.put(OrgApi.updateUserOrgRoleURL(request.orgId), {
      userId: request.userId,
      role: request.role,
    });
  }

  static updateUserGroupRole(request: UpdateUserGroupRolePayload): AxiosPromise<ApiResponse> {
    return Api.put(OrgApi.updateUserGroupRoleURL(request.groupId), {
      userId: request.userId,
      role: request.role,
    });
  }

  static fetchOrgUsers(orgId: string): AxiosPromise<OrgUsersResponse> {
    return Api.get(OrgApi.fetchOrgUsersURL(orgId));
  }

  static fetchOrgUsersPagination(request:fetchOrgUserRequestType): AxiosPromise<OrgUsersPaginationResponse> {
    const {orgId, ...res} = request;
    return Api.get(OrgApi.fetchOrgUsersURL(orgId), {...res});
  }

  static fetchGroupUsers(groupId: string): AxiosPromise<GroupUsersResponse> {
    return Api.get(OrgApi.fetchGroupUsersURL(groupId));
  }

  static fetchGroupUsersPagination(request: fetchGroupUserRequestType): AxiosPromise<GroupUsersPaginationResponse> {
    const {groupId, ...res} = request;
    return Api.get(OrgApi.fetchGroupUsersURL(groupId), {...res});
  }

  static deleteGroupUser(request: RemoveGroupUserPayload): AxiosPromise<ApiResponse> {
    return Api.delete(OrgApi.deleteGroupUserURL(request.groupId), {
      userId: request.userId,
    });
  }

  static addGroupUser(request: AddGroupUserPayload): AxiosPromise<ApiResponse> {
    return Api.post(OrgApi.addGroupUserURL(request.groupId), {
      userId: request.userId,
      role: request.role,
    });
  }

  static deleteOrgUser(request: DeleteOrgUserPayload): AxiosPromise<ApiResponse> {
    const { orgId, ...rest } = request;
    return Api.delete(OrgApi.deleteOrgUsersURL(orgId), rest);
  }

  static quitOrg(orgId: string): AxiosPromise<ApiResponse> {
    return Api.delete(OrgApi.quitOrgURL(orgId));
  }

  static switchOrg(orgId: string): AxiosPromise<ApiResponse> {
    return Api.put(OrgApi.switchOrgURL(orgId));
  }

  static quitGroup(groupId: string): AxiosPromise<ApiResponse> {
    return Api.delete(OrgApi.quitGroupURL(groupId));
  }

  static createOrg(orgName: string): AxiosPromise<CreateOrgResponse> {
    return Api.post(OrgApi.createOrgURL, { name: orgName });
  }

  static deleteOrg(orgId: string): AxiosPromise<ApiResponse> {
    return Api.delete(OrgApi.deleteOrgURL(orgId));
  }

  static updateOrg(request: UpdateOrgPayload): AxiosPromise<ApiResponse> {
    return Api.put(OrgApi.updateOrgURL(request.id), request);
  }

  static fetchAPIUsage(orgId: string): AxiosPromise<ApiResponse> {
    return Api.get(OrgApi.fetchUsage(orgId));
  }

  static fetchLastMonthAPIUsage(orgId: string): AxiosPromise<ApiResponse> {
    return Api.get(OrgApi.fetchUsage(orgId), { lastMonthOnly: true });
  }

  static fetchOrgsByEmail(email: string): AxiosPromise<ApiResponse> {
    return Api.get(OrgApi.fetchOrgsByEmailURL(email));
  }

  static fetchOrgsPaginationByEmail(request: fetchOrgsByEmailRequestType): AxiosPromise<ApiPaginationResponse> {
    const { email, ...rest } = request;
    return Api.get(OrgApi.fetchOrgsByEmailURL(email), {...rest});
  }
}

export default OrgApi;
