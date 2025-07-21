import { ApiResponse } from "api/apiResponses";
import UserApi, { FetchApiKeysResponse, GetCurrentUserResponse, GetUserResponse } from "api/userApi";
import { AxiosResponse } from "axios";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/reduxActionConstants";
import { AUTH_LOGIN_URL, ORG_AUTH_LOGIN_URL } from "constants/routesURL";
import log from "loglevel";
import { all, call, delay, put, takeLatest } from "redux-saga/effects";
import {
  LogoutActionType,
  logoutSuccess,
  MarkUserStatusPayload,
  UpdateUserPayload,
  updateUserSuccess,
} from "redux/reduxActions/userActions";
import { validateResponse } from "api/apiUtils";
import { Org } from "constants/orgConstants";
import { SERVER_ERROR_CODES } from "constants/apiConstants";
import { defaultUser } from "constants/userConstants";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";

import { AuthSearchParams } from "constants/authConstants";
import { saveAuthSearchParams } from "pages/userAuth/authUtils";
import { initTranslator } from "i18n";
import { fetchWorkspacesAction } from "../reduxActions/orgActions";

function validResponseData(response: AxiosResponse<ApiResponse>) {
  return response && response.data && response.data.data;
}

export function* getUserSaga() {
  try {
    const response: AxiosResponse<GetUserResponse> = yield call(UserApi.getUser);
    if (
      validResponseData(response) &&
      response.data.code === SERVER_ERROR_CODES.REDIRECT &&
      (response.data.data as any).redirectUri
    ) {
      // request illegal, redirect to other url
      const redirectUri = (response.data.data as any).redirectUri;
      const currentUrl = new URL(window.location.href);
      const redirectUrl = new URL(redirectUri);
      redirectUrl.pathname = currentUrl.pathname;
      redirectUrl.search = currentUrl.search;
      window.location.replace(redirectUrl);
      return;
    }
    if (validateResponse(response)) {
      if (response.data.data.isAnonymous) {
        // unlogin user, use default value
        yield put({
          type: ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
          payload: defaultUser,
        });
        return;
      }
      const { orgAndRoles, ...restField } = response.data.data;
      const orgs = orgAndRoles
        ? orgAndRoles.map((org): Org => {
            return org.org;
          })
        : [];
      const orgRoleMap = orgAndRoles
        ? new Map(orgAndRoles.map((orgAndRole) => [orgAndRole.org.id, orgAndRole.role]))
        : new Map();

      const user = {
        ...restField,
        orgs: orgs,
        orgRoleMap: orgRoleMap,
      };

      yield put({
        type: ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
        payload: user,
      });
       
    }
  } catch (error: any) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_USER_DETAILS_ERROR,
    });
  }
}

export function* getCurrentUserSaga() {
  try {
    const response: AxiosResponse<GetCurrentUserResponse> = yield call(UserApi.getCurrentUser);
    if (validateResponse(response)) {
      yield put({
        type: ReduxActionTypes.FETCH_CURRENT_USER_SUCCESS,
        payload: response.data.data,
      });
      const { uiLanguage } = response.data.data;
      initTranslator(uiLanguage);
    }
  } catch (error: any) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_CURRENT_USER_ERROR,
    });
    log.error("getCurrentUser error:", error);
  }
}

export function* getRawCurrentUserSaga() {
  try {
    const response: AxiosResponse<GetCurrentUserResponse> = yield call(UserApi.getRawCurrentUser);
    if (validateResponse(response)) {
      yield put({
        type: ReduxActionTypes.FETCH_RAW_CURRENT_USER_SUCCESS,
        payload: response.data.data,
      });
    }
  } catch (error: any) {
    messageInstance.error(
      error instanceof Error
        ? (error.message) as string
        : error as string
    );
    log.error("getRawCurrentUser error:", error);
  }
}

export function* updateUserSaga(action: ReduxAction<UpdateUserPayload>) {
  try {
    const response: AxiosResponse<ApiResponse> = yield call(UserApi.updateUser, action.payload);
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      yield put(updateUserSuccess(action.payload));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_USER_PROFILE_ERROR,
    });
    log.error("update user error:", error);
  }
}

export function* logoutSaga(action: LogoutActionType) {
  try {
    let redirectURL = action.payload.organizationId
      ? ORG_AUTH_LOGIN_URL.replace(':orgId', action.payload.organizationId)
      : AUTH_LOGIN_URL;
    if (action.payload.notAuthorised) {
      const currentUrl = window.location.href
      const urlObj = new URL(currentUrl);
      // Add loginType param for auto login jump
      const loginType = urlObj.searchParams.get(AuthSearchParams.loginType);
      saveAuthSearchParams({
        [AuthSearchParams.redirectUrl]: encodeURIComponent(currentUrl),
        [AuthSearchParams.loginType]: loginType
      });
    }
    let isValidResponse = true;
    if (!action.payload.notAuthorised) {
      const response: AxiosResponse<ApiResponse> = yield call(UserApi.userLogout);
      isValidResponse = validateResponse(response);
    }
    if (isValidResponse) {
      yield put(logoutSuccess());
      localStorage.clear();
      window.location.replace(redirectURL);
    }
  } catch (error) {
    log.error(error);
  }
}

function* markUserStatusSaga(action: ReduxAction<MarkUserStatusPayload>) {
  try {
    // debounce 500ms
    yield delay(500);
    const response: AxiosResponse<ApiResponse> = yield call(UserApi.markUserStatus, action.payload);
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
    }
  } catch (error) {
    log.error(error);
  }
}

export function* fetchApiKeysSaga() {
  try {
    const response: AxiosResponse<FetchApiKeysResponse> = yield call(UserApi.fetchApiKeys);
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      const apiKeys = response.data.data;
      yield put({
        type: ReduxActionTypes.FETCH_API_KEYS_SUCCESS,
        payload: apiKeys,
      });
    }
  } catch(error: any) {
    log.error(error);
  }
}

export default function* userSagas() {
  yield all([
    takeLatest(ReduxActionTypes.LOGOUT_USER_INIT, logoutSaga),
    takeLatest(ReduxActionTypes.FETCH_USER_INIT, getUserSaga),
    takeLatest(ReduxActionTypes.FETCH_USER_INIT, getCurrentUserSaga),
    takeLatest(ReduxActionTypes.FETCH_RAW_CURRENT_USER, getRawCurrentUserSaga),
    takeLatest(ReduxActionTypes.UPDATE_USER_PROFILE, updateUserSaga),
    takeLatest(ReduxActionTypes.MARK_USER_STATUS, markUserStatusSaga),
    takeLatest(ReduxActionTypes.FETCH_API_KEYS, fetchApiKeysSaga),
  ]);
}
