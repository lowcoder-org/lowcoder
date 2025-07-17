import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";

import { ApiResponse, FetchGroupApiResponse, GenericApiResponse } from "api/apiResponses";
import OrgApi, { CreateOrgResponse, GroupUsersResponse, OrgAPIUsageResponse, OrgUsersResponse } from "api/orgApi";
import { AxiosResponse } from "axios";
import { OrgGroup } from "constants/orgConstants";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/reduxActionConstants";
import { BASE_URL } from "constants/routesURL";
import log from "loglevel";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import {
  AddGroupUserPayload,
  DeleteOrgUserPayload,
  fetchGroupsAction,
  FetchUsersActionPayload,
  RemoveGroupUserPayload,
  UpdateGroupActionPayload,
  UpdateOrgPayload,
  updateOrgSuccess,
  fetchAPIUsageActionSuccess,
  fetchLastMonthAPIUsageActionSuccess,
  UpdateUserGroupRolePayload,
  UpdateUserOrgRolePayload,
  fetchWorkspacesAction,
} from "redux/reduxActions/orgActions";
import { getUser } from "redux/selectors/usersSelectors";
import { validateResponse } from "api/apiUtils";
import { User } from "constants/userConstants";
import { getUserSaga } from "redux/sagas/userSagas";
import { GetMyOrgsResponse } from "@lowcoder-ee/api/userApi";
import UserApi from "@lowcoder-ee/api/userApi";

export function* updateGroupSaga(action: ReduxAction<UpdateGroupActionPayload>) {
  try {
    const response: AxiosResponse<ApiResponse> = yield call(
      OrgApi.updateGroup,
      action.payload.groupId,
      action.payload.updates
    );
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      yield put(fetchGroupsAction(action.payload.orgId));
    }
  } catch (error) {
    log.error(error);
  }
}

export function* fetchGroupsSaga(action: ReduxAction<{ orgId: string }>) {
  try {
    const response: AxiosResponse<FetchGroupApiResponse<OrgGroup[]>> = yield call(OrgApi.fetchGroup);
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      const groups = response.data.data;
      yield put({
        type: ReduxActionTypes.FETCH_ORG_GROUPS_SUCCESS,
        payload: {
          orgGroups: groups,
          orgUserStats: {
            totalAdmins: response.data.totalAdmins,
            totalAdminsAndDevelopers: response.data.totalAdminsAndDevelopers,
            totalDevelopersOnly: response.data.totalDevelopersOnly,
            totalOtherMembers: response.data.totalOtherMembers,
          }
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ORG_GROUPS_ERROR,
    });
    log.error(error);
  }
}

export function* updateUserOrgRoleSaga(action: ReduxAction<UpdateUserOrgRolePayload>) {
  try {
    const response: AxiosResponse<ApiResponse> = yield call(
      OrgApi.updateUserOrgRole,
      action.payload
    );
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      log.debug("update user role success", action.payload);
    }
  } catch (error) {
    log.error(error);
  }
}

export function* updateUserGroupRoleSaga(action: ReduxAction<UpdateUserGroupRolePayload>) {
  try {
    const response: AxiosResponse<ApiResponse> = yield call(
      OrgApi.updateUserGroupRole,
      action.payload
    );
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      log.debug("update user role success", action.payload);
    }
  } catch (error) {
    log.error(error);
  }
}

export function* fetchGroupPotentialMembersSaga(action: ReduxAction<{ searchName: string, groupId: string }>) {
  try {
    const response: AxiosResponse<OrgUsersResponse> = yield call(
      OrgApi.fetchGroupPotentialMembers,
      action.payload.searchName,
      action.payload.groupId
    );
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ORG_ALL_USERS_SUCCESS,
        payload: response.data.data,
      });
    }
  } catch (error) {
    log.error(error);
  }
}

export function* fetchOrgUsersSaga(action: ReduxAction<{ orgId: string }>) {
  try {
    const response: AxiosResponse<OrgUsersResponse> = yield call(
      OrgApi.fetchOrgUsers,
      action.payload.orgId,
    );
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ORG_ALL_USERS_SUCCESS,
        payload: response.data.data,
      });
    }
  } catch (error) {
    log.error(error);
  }
}

export function* fetchGroupUsersSaga(action: ReduxAction<FetchUsersActionPayload>) {
  try {
    const response: AxiosResponse<GroupUsersResponse> = yield call(
      OrgApi.fetchGroupUsers,
      action.payload.groupId
    );
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_GROUP_USERS_SUCCESS,
        payload: response.data.data,
      });
    }
  } catch (error) {
    log.error(error);
  }
}

export function* deleteGroupUserSaga(action: ReduxAction<RemoveGroupUserPayload>) {
  try {
    const response: AxiosResponse<ApiResponse> = yield call(OrgApi.deleteGroupUser, action.payload);
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_GROUP_USER_SUCCESS,
        payload: action.payload,
      });
      log.debug("delete success:", action.payload);
    }
  } catch (error) {
    log.error(error);
  }
}

export function* addGroupUserSaga(action: ReduxAction<AddGroupUserPayload>) {
  try {
    const response: AxiosResponse<ApiResponse> = yield call(OrgApi.addGroupUser, action.payload);
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      log.debug("add user success:", action.payload);
    }
  } catch (error) {
    log.error(error);
  }
}

export function* deleteOrgUserSaga(action: ReduxAction<DeleteOrgUserPayload>) {
  try {
    const response: AxiosResponse<ApiResponse> = yield call(OrgApi.deleteOrgUser, action.payload);
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_ORG_USER_SUCCESS,
        payload: action.payload,
      });
      log.debug("delete success:", action.payload);
    }
  } catch (error) {
    log.error(error);
  }
}

export function* quitGroupSaga(action: ReduxAction<RemoveGroupUserPayload>) {
  try {
    const response: AxiosResponse<ApiResponse> = yield call(
      OrgApi.quitGroup,
      action.payload.groupId
    );
    const isValidResponse: boolean = validateResponse(response);
    const user: User = yield select(getUser);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.QUIT_GROUP_SUCCESS,
        payload: {
          ...action.payload,
          currentUser: user,
        },
      });
    }
  } catch (error: any) {
    messageInstance.error(error.message);
    log.error(error);
  }
}

export function* quitOrgSaga(action: ReduxAction<{ orgId: string }>) {
  try {
    const response: AxiosResponse<ApiResponse> = yield call(OrgApi.quitOrg, action.payload.orgId);
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      // redirect
      window.location.href = BASE_URL;
    }
  } catch (error: any) {
    messageInstance.error(error.message);
    log.error(error);
  }
}

export function* switchOrgSaga(action: ReduxAction<{ orgId: string }>) {
  try {
    const response: AxiosResponse<ApiResponse> = yield call(OrgApi.switchOrg, action.payload.orgId);
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      window.location.replace(BASE_URL);
    }
  } catch (error: any) {
    messageInstance.error(error.message);
    log.error(error);
  }
}

export function* createOrgSaga(action: ReduxAction<{ orgName: string }>) {
  try {
    const response: AxiosResponse<CreateOrgResponse> = yield call(
      OrgApi.createOrg,
      action.payload.orgName
    );
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      // update org list
      yield call(getUserSaga);
      yield put({
        type: ReduxActionTypes.CREATE_ORG_SUCCESS,
      });
    }
  } catch (error: any) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_ORG_ERROR,
    });
    messageInstance.error(error.message);
    log.error(error);
  }
}

export function* deleteOrgSaga(action: ReduxAction<{ orgId: string }>) {
  try {
    const response: AxiosResponse<ApiResponse> = yield call(OrgApi.deleteOrg, action.payload.orgId);
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_ORG_SUCCESS,
        payload: {
          orgId: action.payload.orgId,
        },
      });
      // Refetch workspaces to update the profile dropdown
      yield put(fetchWorkspacesAction(1, 10));
    }
  } catch (error: any) {
    messageInstance.error(error.message);
    log.error(error);
  }
}

export function* updateOrgSaga(action: ReduxAction<UpdateOrgPayload>) {
  try {
    const response: AxiosResponse<ApiResponse> = yield call(OrgApi.updateOrg, action.payload);
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      yield put(updateOrgSuccess(action.payload));
      // Refetch workspaces to update the profile dropdown
      yield put(fetchWorkspacesAction(1, 10));
    }
  } catch (error: any) {
    messageInstance.error(error.message);
    log.error(error);
  }
}

export function* fetchAPIUsageSaga(action: ReduxAction<{
  orgId: string,
}>) {
  try {
    const response: AxiosResponse<OrgAPIUsageResponse> = yield call(
      OrgApi.fetchAPIUsage,
      action.payload.orgId,
    );
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      yield put(fetchAPIUsageActionSuccess({apiUsage: response.data.data})
      );
    }
  } catch (error) {
    log.error(error);
  }
}

export function* fetchLastMonthAPIUsageSaga(action: ReduxAction<{
  orgId: string,
}>) {
  try {
    const response: AxiosResponse<OrgAPIUsageResponse> = yield call(
      OrgApi.fetchLastMonthAPIUsage,
      action.payload.orgId,
    );
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      yield put(fetchLastMonthAPIUsageActionSuccess({lastMonthApiUsage: response.data.data})
      );
    }
  } catch (error) {
    log.error(error);
  }
}

// fetch my orgs
// In userSagas.ts
export function* fetchWorkspacesSaga(action: ReduxAction<{page: number, pageSize: number, search?: string, isLoadMore?: boolean}>) {
  try {
    const { page, pageSize, search, isLoadMore } = action.payload;
    
    const response: AxiosResponse<GetMyOrgsResponse> = yield call(
      UserApi.getMyOrgs, 
      page,        // pageNum
      pageSize,           // pageSize (changed to 5 for testing)
      search       // orgName
    );
    
    if (validateResponse(response)) {
      const apiData = response.data.data;
      
      // Transform orgId/orgName to match Org interface
      const transformedItems = apiData.data
        .filter(item => item.orgView && item.orgView.orgId) 
        .map(item => ({
          id: item.orgView.orgId,
          name: item.orgView.orgName,
          createdAt: item.orgView.createdAt,
          updatedAt: item.orgView.updatedAt,
          isCurrentOrg: item.isCurrentOrg,
        }));
        
      yield put({
        type: ReduxActionTypes.FETCH_WORKSPACES_SUCCESS,
        payload: {
          items: transformedItems,
          totalCount: apiData.total,
          isLoadMore: isLoadMore || false
        }
      });
    }
  } catch (error: any) {
    console.error('Error fetching workspaces:', error);
  }
}

export default function* orgSagas() {
  yield all([
    takeLatest(ReduxActionTypes.UPDATE_GROUP_INFO, updateGroupSaga),
    takeLatest(ReduxActionTypes.FETCH_ORG_GROUPS, fetchGroupsSaga),
    takeLatest(ReduxActionTypes.FETCH_GROUP_USERS, fetchGroupUsersSaga),
    takeLatest(ReduxActionTypes.DELETE_GROUP_USER, deleteGroupUserSaga),
    takeLatest(ReduxActionTypes.ADD_GROUP_USER, addGroupUserSaga),
    takeLatest(ReduxActionTypes.UPDATE_USER_ORG_ROLE, updateUserOrgRoleSaga),
    takeLatest(ReduxActionTypes.UPDATE_USER_GROUP_ROLE, updateUserGroupRoleSaga),
    takeLatest(ReduxActionTypes.FETCH_ORG_ALL_USERS, fetchOrgUsersSaga),
    takeLatest(ReduxActionTypes.FETCH_GROUP_POTENTIAL_MEMBERS, fetchGroupPotentialMembersSaga),
    takeLatest(ReduxActionTypes.DELETE_ORG_USER, deleteOrgUserSaga),
    takeLatest(ReduxActionTypes.QUIT_GROUP, quitGroupSaga),
    takeLatest(ReduxActionTypes.QUIT_ORG, quitOrgSaga),
    takeLatest(ReduxActionTypes.SWITCH_ORG, switchOrgSaga),
    takeLatest(ReduxActionTypes.CREATE_ORG, createOrgSaga),
    takeLatest(ReduxActionTypes.DELETE_ORG, deleteOrgSaga),
    takeLatest(ReduxActionTypes.UPDATE_ORG, updateOrgSaga),
    takeLatest(ReduxActionTypes.FETCH_ORG_API_USAGE, fetchAPIUsageSaga),
    takeLatest(ReduxActionTypes.FETCH_ORG_LAST_MONTH_API_USAGE, fetchLastMonthAPIUsageSaga),
    takeLatest(ReduxActionTypes.FETCH_WORKSPACES_INIT, fetchWorkspacesSaga),


  ]);
}
