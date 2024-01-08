import { all, call, put, takeLatest } from "redux-saga/effects";
import { ReduxAction, ReduxActionTypes } from "constants/reduxActionConstants";
import { AxiosResponse } from "axios";
import { validateResponse } from "api/apiUtils";
import log from "loglevel";
import { messageInstance } from "lowcoder-design";

import CommonSettingApi, {
  CommonSettingResponseData,
  FetchCommonSettingPayload,
  SetCommonSettingPayload,
  SetCommonSettingResponse,
} from "api/commonSettingApi";
import { GenericApiResponse } from "api/apiResponses";

export function* fetchCommonSettingsSaga(action: ReduxAction<FetchCommonSettingPayload>) {
  try {
    const response: AxiosResponse<GenericApiResponse<CommonSettingResponseData>> = yield call(
      CommonSettingApi.fetchCommonSetting,
      action.payload
    );
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      action.payload.onSuccess?.(response.data.data || []);
      yield put({
        type: ReduxActionTypes.FETCH_COMMON_SETTING_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    messageInstance.error(
      error instanceof Error
        ? (error.message) as string
        : error as string
    );
    log.debug("fetch event type error: ", error);
  }
}

export function* setCommonSettingsSaga(action: ReduxAction<SetCommonSettingPayload>) {
  try {
    const response: AxiosResponse<SetCommonSettingResponse> = yield call(
      CommonSettingApi.setCommonSetting,
      action.payload
    );
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      action.payload.onSuccess?.();
      yield put({
        type: ReduxActionTypes.SET_COMMON_SETTING_SUCCESS,
        payload: {
          [action.payload.data.key]: action.payload.data.value,
        },
      });
    }
  } catch (error) {
    messageInstance.error(
      error instanceof Error
        ? (error.message) as string
        : error as string
    );
    log.debug("fetch event type error: ", error);
  }
}

export default function* commonSettingsSagas() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_COMMON_SETTING, fetchCommonSettingsSaga),
    takeLatest(ReduxActionTypes.SET_COMMON_SETTING, setCommonSettingsSaga),
  ]);
}
