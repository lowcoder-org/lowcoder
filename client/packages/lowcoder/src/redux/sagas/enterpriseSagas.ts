import { call, put, takeLatest } from 'redux-saga/effects';
import { ReduxAction, ReduxActionTypes } from "constants/reduxActionConstants";
import { setEnterpriseLicense } from "redux/reduxActions/enterpriseActions";
import { BrandingSettingResponse, EnterpriseLicenseResponse, FetchBrandingSettingPayload, getBranding, getEnterpriseLicense } from "api/enterpriseApi";
import { AxiosResponse } from 'axios';

function* fetchEnterpriseLicenseSaga(): Generator<any, void, EnterpriseLicenseResponse> {
  try {
    // Type the result from the API call
    const data: EnterpriseLicenseResponse = yield call(getEnterpriseLicense);
    yield put(setEnterpriseLicense(data));
  } catch (error) {
    console.error('Failed to fetch enterprise license:', error);
  }
}

function* fetchBrandingSettingSaga(action: ReduxAction<FetchBrandingSettingPayload>) {
  try {
    const response: BrandingSettingResponse = yield getBranding(action.payload.orgId);
    if (response && response.id) {
      if (action.payload.orgId) {
        yield put({
          type: ReduxActionTypes.SET_WORKSPACE_BRANDING_SETTING,
          payload: response,
        });
        return;
      }
      yield put({
        type: ReduxActionTypes.SET_GLOBAL_BRANDING_SETTING,
        payload: response,
      });
    }
  } catch (error) {
    console.error('Failed to fetch branding setting:', error);
  }
}

export default function* enterpriseSagas() {
  yield takeLatest(ReduxActionTypes.FETCH_ENTERPRISE_LICENSE, fetchEnterpriseLicenseSaga);
  yield takeLatest(ReduxActionTypes.FETCH_BRANDING_SETTING, fetchBrandingSettingSaga);
}
