import { all, call, put, takeLatest } from "redux-saga/effects";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxAction,
} from "constants/reduxActionConstants";
import { AxiosResponse } from "axios";
import { validateResponse } from "api/apiUtils";
import log from "loglevel";
import ConfigApi, { ConfigResponse } from "api/configApi";
import { transToSystemConfig } from "@lowcoder-ee/constants/configConstants";
import { FetchConfigActionPayload } from "redux/reduxActions/configActions";

export function* fetchConfigSaga(action: ReduxAction<FetchConfigActionPayload>) {
  try {
    const response: AxiosResponse<ConfigResponse> = yield call(
      ConfigApi.fetchConfig,
      action.payload.orgId,
    );
    const isValidResponse: boolean = validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_SYS_CONFIG_SUCCESS,
        payload: transToSystemConfig(response.data.data),
      });
    }
  } catch (error) {
    log.error("fail to fetch config:", error);
    yield put({
      type: ReduxActionErrorTypes.FETCH_SYS_CONFIG_ERROR,
    });
  }
}

export default function* configSagas() {
  yield all([takeLatest(ReduxActionTypes.FETCH_SYS_CONFIG_INIT, fetchConfigSaga)]);
}
