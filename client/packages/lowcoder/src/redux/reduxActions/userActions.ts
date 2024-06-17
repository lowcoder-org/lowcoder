import { ReduxAction, ReduxActionTypes } from "constants/reduxActionConstants";
import { ApiKey, UserStatusType } from "constants/userConstants";

export const fetchUserAction = () => ({
  type: ReduxActionTypes.FETCH_USER_INIT,
});

export const fetchRawCurrentUserAction = () => ({
  type: ReduxActionTypes.FETCH_RAW_CURRENT_USER,
});

// whether to show the pernal setting modal
export const profileSettingModalVisible = (visible: boolean) => ({
  type: ReduxActionTypes.SET_USER_PROFILE_SETTING_MODAL_VISIBLE,
  payload: { visible },
});

export type UpdateUserPayload = {
  name?: string;
  avatarUrl?: string;
  uiLanguage?: string;
};

export type FetchApiKeysPayload = Array<ApiKey>;

export const updateUserAction = (payload: UpdateUserPayload) => {
  return {
    type: ReduxActionTypes.UPDATE_USER_PROFILE,
    payload: payload,
  };
};

export const updateUserSuccess = (payload: UpdateUserPayload) => {
  return {
    type: ReduxActionTypes.UPDATE_USER_PROFILE_SUCCESS,
    payload: payload,
  };
};

export type MarkUserStatusPayload = {
  type: UserStatusType;
  value: boolean;
};

export const markUserStatus = (type: UserStatusType, value: boolean) => {
  return {
    type: ReduxActionTypes.MARK_USER_STATUS,
    payload: {
      type: type,
      value: value,
    },
  };
};

type LogoutActionPayload = {
  notAuthorised?: boolean,
  organizationId?: string,
};
export type LogoutActionType = ReduxAction<LogoutActionPayload>;
export const logoutAction = (payload: LogoutActionPayload) => ({
  type: ReduxActionTypes.LOGOUT_USER_INIT,
  payload: payload,
});
export const logoutSuccess = () => ({
  type: ReduxActionTypes.LOGOUT_USER_SUCCESS,
});

export const fetchApiKeysAction = () => {
  return {
    type: ReduxActionTypes.FETCH_API_KEYS,
  };
};

export const fetchApiKeysSuccess = (payload: FetchApiKeysPayload) => {
  return {
    type: ReduxActionTypes.FETCH_API_KEYS_SUCCESS,
    payload: payload,
  };
};
